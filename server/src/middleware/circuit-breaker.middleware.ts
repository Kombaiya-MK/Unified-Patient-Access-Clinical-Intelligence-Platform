import CircuitBreaker from 'opossum';
import { pool } from '../config/database';
import cacheService from '../services/cache.service';
import logger from '../utils/logger';
import { circuitBreakerStateGauge } from '../utils/metricsRegistry';

/**
 * Circuit Breaker Middleware
 *
 * Protects the database and external AI API from cascading failures.
 *
 * States:
 *   0 = closed  (normal)
 *   1 = open    (requests short-circuited)
 *   2 = half-open (probing)
 *
 * @see https://nodeshift.dev/opossum/
 */

// ── Database Circuit Breaker ────────────────────────────────
export const dbCircuitBreaker = new CircuitBreaker(
  async (query: string, params: unknown[]) => {
    return pool.query(query, params);
  },
  {
    timeout: 5000,
    errorThresholdPercentage: 50,
    resetTimeout: 10_000,
    rollingCountTimeout: 10_000,
    rollingCountBuckets: 10,
    name: 'database',
    volumeThreshold: 5,
  },
);

dbCircuitBreaker.on('open', () => {
  logger.error('Database circuit breaker OPENED');
  circuitBreakerStateGauge.set({ service: 'database', model: 'postgres' }, 1);
});
dbCircuitBreaker.on('halfOpen', () => {
  logger.warn('Database circuit breaker HALF-OPEN');
  circuitBreakerStateGauge.set({ service: 'database', model: 'postgres' }, 2);
});
dbCircuitBreaker.on('close', () => {
  logger.info('Database circuit breaker CLOSED');
  circuitBreakerStateGauge.set({ service: 'database', model: 'postgres' }, 0);
});

dbCircuitBreaker.fallback(async (query: string) => {
  logger.warn('DB circuit breaker fallback triggered', { query: query.substring(0, 80) });
  const cacheKey = `cb:fallback:${Buffer.from(query).toString('base64').substring(0, 40)}`;
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;
  throw new Error('Database unavailable and no cached fallback');
});

// ── AI API Circuit Breaker ──────────────────────────────────
export const aiCircuitBreaker = new CircuitBreaker(
  async (fn: () => Promise<unknown>) => {
    return fn();
  },
  {
    timeout: 15_000,
    errorThresholdPercentage: 30,
    resetTimeout: 30_000,
    rollingCountTimeout: 30_000,
    rollingCountBuckets: 10,
    name: 'openai',
    volumeThreshold: 3,
  },
);

aiCircuitBreaker.on('open', () => {
  logger.error('AI API circuit breaker OPENED');
  circuitBreakerStateGauge.set({ service: 'openai', model: 'gpt-4' }, 1);
});
aiCircuitBreaker.on('halfOpen', () => {
  logger.warn('AI API circuit breaker HALF-OPEN');
  circuitBreakerStateGauge.set({ service: 'openai', model: 'gpt-4' }, 2);
});
aiCircuitBreaker.on('close', () => {
  logger.info('AI API circuit breaker CLOSED');
  circuitBreakerStateGauge.set({ service: 'openai', model: 'gpt-4' }, 0);
});

aiCircuitBreaker.fallback(() => {
  return { error: 'AI service temporarily unavailable', fallback: true };
});
