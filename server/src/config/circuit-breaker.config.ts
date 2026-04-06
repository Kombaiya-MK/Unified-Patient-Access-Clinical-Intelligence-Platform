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
import logger from '../utils/logger';
import {
  circuitBreakerStateGauge,
  apiFailureRateHistogram,
  fallbackActivationCounter,
} from '../utils/metricsRegistry';
import { sendCircuitBreakerAlert } from '../services/circuit-breaker-alerts.service';

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
  });

  breaker.on('halfOpen', () => {
    circuitBreakerStateGauge.set({ service: name, model }, 1);
    logger.info(`AI circuit breaker [${name}] HALF-OPEN – testing recovery`);
  });

  breaker.on('close', () => {
    resetBackoff(breaker, name);
    circuitBreakerStateGauge.set({ service: name, model }, 0);
    logger.info(`AI circuit breaker [${name}] CLOSED – service recovered`);
    sendCircuitBreakerAlert(name, 'recovered').catch(() => {});
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

export { apiFailureRateHistogram, fallbackActivationCounter };
