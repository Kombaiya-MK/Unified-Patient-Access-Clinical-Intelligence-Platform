/**
 * AI Circuit Breaker Configuration
 *
 * Separate opossum circuit breakers per OpenAI model endpoint with
 * exponential backoff (60 s → 120 s → 300 s).
 *
 * @module config/circuit-breaker.config
 * @task US_041 TASK_001
 */
import CircuitBreaker from 'opossum';
import { randomUUID } from 'crypto';
import logger from '../utils/logger';
import {
  circuitBreakerStateGauge,
  apiFailureRateHistogram,
  fallbackActivationCounter,
} from '../utils/metricsRegistry';
import { sendCircuitBreakerAlert } from '../services/circuit-breaker-alerts.service';
import { broadcastCircuitBreakerEvent } from '../services/websocketService';

/** Maps backend breaker keys to frontend service IDs */
const FRONTEND_SERVICE_MAP: Record<string, string> = {
  'gpt4-intake': 'ai-intake',
  'gpt4v-extraction': 'document-extraction',
  'gpt4-coding': 'medical-coding',
  'gpt4-conflicts': 'medication-conflicts',
};

/** Track actual last state-change timestamps per breaker */
const lastStateChangeMap = new Map<string, string>();

export function getLastStateChange(name: string): string {
  return lastStateChangeMap.get(name) || new Date().toISOString();
}

// ── In-memory event log (ring buffer, max 200) ─────────────
interface CircuitBreakerLogEntry {
  id: string;
  service: string;
  event: 'opened' | 'closed' | 'half-opened' | 'fallback-activated';
  timestamp: string;
  details: string;
}

const MAX_LOG_ENTRIES = 200;
const circuitBreakerEventLog: CircuitBreakerLogEntry[] = [];

function pushLogEntry(service: string, event: CircuitBreakerLogEntry['event'], details: string): void {
  if (circuitBreakerEventLog.length >= MAX_LOG_ENTRIES) {
    circuitBreakerEventLog.shift();
  }
  circuitBreakerEventLog.push({ id: randomUUID(), service, event, timestamp: new Date().toISOString(), details });
}

export function getLogsForService(service: string): CircuitBreakerLogEntry[] {
  return circuitBreakerEventLog.filter((e) => e.service === service);
}

// ── Shared options ──────────────────────────────────────────
const BASE_OPTIONS: CircuitBreaker.Options = {
  timeout: 30_000,               // 30 s per request
  errorThresholdPercentage: 50,  // Open after 50 % failure rate
  volumeThreshold: 10,           // Min 10 requests before opening
  resetTimeout: 60_000,          // 60 s cooldown before half-open
  rollingCountTimeout: 60_000,   // 1-minute rolling window
  rollingCountBuckets: 60,       // 1-second buckets
};

const BACKOFF_STEPS = [60_000, 120_000, 300_000]; // 60 s, 120 s, 300 s

// ── Backoff tracker ─────────────────────────────────────────
const backoffCounts = new Map<string, number>();

function applyExponentialBackoff(breaker: CircuitBreaker, name: string): void {
  const count = backoffCounts.get(name) || 0;
  backoffCounts.set(name, count + 1);
  const backoff = BACKOFF_STEPS[Math.min(count, BACKOFF_STEPS.length - 1)];
  (breaker as any).options.resetTimeout = backoff;
  logger.warn(`Circuit breaker ${name} backoff set to ${backoff} ms (attempt ${count + 1})`);
}

function resetBackoff(breaker: CircuitBreaker, name: string): void {
  backoffCounts.set(name, 0);
  (breaker as any).options.resetTimeout = BASE_OPTIONS.resetTimeout;
}

// ── Factory ─────────────────────────────────────────────────
function createAIBreaker(
  name: string,
  model: string,
  timeoutOverride?: number,
): CircuitBreaker {
  const breaker = new CircuitBreaker(
    async (fn: () => Promise<unknown>) => fn(),
    { ...BASE_OPTIONS, name, timeout: timeoutOverride ?? BASE_OPTIONS.timeout },
  );

  breaker.on('open', () => {
    applyExponentialBackoff(breaker, name);
    circuitBreakerStateGauge.set({ service: name, model }, 2);
    logger.error(`AI circuit breaker [${name}] OPENED`);
    sendCircuitBreakerAlert(name, 'open').catch(() => {});
    pushLogEntry(name, 'opened', `Circuit opened – failure threshold exceeded for ${model}`);
    lastStateChangeMap.set(name, new Date().toISOString());
    broadcastCircuitBreakerEvent(buildBreakerStatus(breaker, name, model, 'open'));
  });

  breaker.on('halfOpen', () => {
    circuitBreakerStateGauge.set({ service: name, model }, 1);
    logger.info(`AI circuit breaker [${name}] HALF-OPEN – testing recovery`);
    pushLogEntry(name, 'half-opened', `Circuit half-open – testing recovery for ${model}`);
    lastStateChangeMap.set(name, new Date().toISOString());
    broadcastCircuitBreakerEvent(buildBreakerStatus(breaker, name, model, 'half-open'));
  });

  breaker.on('close', () => {
    resetBackoff(breaker, name);
    circuitBreakerStateGauge.set({ service: name, model }, 0);
    logger.info(`AI circuit breaker [${name}] CLOSED – service recovered`);
    sendCircuitBreakerAlert(name, 'recovered').catch(() => {});
    pushLogEntry(name, 'closed', `Circuit closed – ${model} service recovered`);
    lastStateChangeMap.set(name, new Date().toISOString());
    broadcastCircuitBreakerEvent(buildBreakerStatus(breaker, name, model, 'closed'));
  });

  return breaker;
}

// ── Per-service breakers ────────────────────────────────────
export const gpt4IntakeBreaker = createAIBreaker('gpt4-intake', 'gpt-4-turbo');
export const gpt4VisionExtractionBreaker = createAIBreaker('gpt4v-extraction', 'gpt-4o', 45_000);
export const gpt4CodingBreaker = createAIBreaker('gpt4-coding', 'gpt-4-turbo');
export const gpt4ConflictsBreaker = createAIBreaker('gpt4-conflicts', 'gpt-4-turbo');

/** All breakers for bulk operations (e.g. health checks). */
export const allAIBreakers = [
  gpt4IntakeBreaker,
  gpt4VisionExtractionBreaker,
  gpt4CodingBreaker,
  gpt4ConflictsBreaker,
] as const;

/** Build full CircuitBreakerStatus payload using frontend service IDs */
function buildBreakerStatus(
  breaker: CircuitBreaker,
  name: string,
  model: string,
  state: 'open' | 'half-open' | 'closed',
): { service: string; model: string; state: string; [key: string]: unknown } {
  const stats = (breaker as any).stats ?? {};
  const failures = stats.failures ?? 0;
  const successes = stats.successes ?? 0;
  const total = failures + successes;
  const failureRate = total > 0 ? Math.round(((failures / total) * 100) * 10) / 10 : 0;
  return {
    service: FRONTEND_SERVICE_MAP[name] || name,
    model,
    state,
    failureRate,
    lastStateChange: lastStateChangeMap.get(name) || new Date().toISOString(),
    errorCount: failures,
    successCount: successes,
  };
}

export { apiFailureRateHistogram, fallbackActivationCounter };
