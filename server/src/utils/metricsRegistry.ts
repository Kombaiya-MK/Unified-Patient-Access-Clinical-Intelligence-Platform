import { Registry, Histogram, Counter, Gauge, collectDefaultMetrics } from 'prom-client';
import { metricsConfig, HISTOGRAM_BUCKETS, ALLOWED_LABELS } from '../config/metrics';
import logger from './logger';

/**
 * Prometheus Metrics Registry
 * 
 * Central registry for all application metrics:
 * - HTTP request duration histogram
 * - HTTP request counter
 * - Active connections gauge
 * - Node.js default metrics (memory, CPU, event loop)
 */

/**
 * Create a new Prometheus registry
 */
export const register = new Registry();

/**
 * Enable Node.js default metrics
 * Includes:
 * - nodejs_heap_size_total_bytes
 * - nodejs_heap_size_used_bytes
 * - nodejs_external_memory_bytes
 * - nodejs_heap_space_size_*
 * - nodejs_version_info
 * - nodejs_gc_duration_seconds
 * - nodejs_eventloop_lag_seconds
 * - process_cpu_seconds_total
 * - process_resident_memory_bytes
 * - process_start_time_seconds
 */
collectDefaultMetrics({
  register,
  prefix: 'nodejs_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5], // GC duration buckets
});

/**
 * HTTP Request Duration Histogram
 * 
 * Measures the duration of HTTP requests in seconds
 * Allows calculation of percentiles (p50, p95, p99) and average response time
 * 
 * Labels:
 * - method: HTTP method (GET, POST, etc.)
 * - route: Normalized route path (/api/users/{id})
 * - status_code: HTTP status code (200, 404, 500)
 * - user_role: User role (patient, doctor, admin, anonymous)
 */
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ALLOWED_LABELS,
  buckets: HISTOGRAM_BUCKETS,
  registers: [register],
});

/**
 * HTTP Requests Total Counter
 * 
 * Counts total number of HTTP requests
 * Useful for calculating request rate and error rate
 * 
 * Labels:
 * - method: HTTP method (GET, POST, etc.)
 * - route: Normalized route path (/api/users/{id})
 * - status_code: HTTP status code (200, 404, 500)
 * - user_role: User role (patient, doctor, admin, anonymous)
 */
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ALLOWED_LABELS,
  registers: [register],
});

/**
 * Active Connections Gauge
 * 
 * Tracks the current number of active/concurrent HTTP connections
 * Useful for monitoring server load and capacity
 * 
 * No labels (global metric)
 */
export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active HTTP connections',
  registers: [register],
});

/**
 * Database Query Duration Histogram (optional, for future use)
 * 
 * Measures database query execution time
 * Useful for identifying slow queries
 */
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type', 'table', 'operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2],
  registers: [register],
});

/**
 * Redis Cache Hit Rate Counter (optional, for future use)
 * 
 * Tracks cache hits and misses
 */
export const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_key_type'],
  registers: [register],
});

export const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_key_type'],
  registers: [register],
});

/**
 * Active Database Connections Gauge
 * Tracks pool utilisation reported by pg Pool.
 */
export const activeDatabaseConnectionsGauge = new Gauge({
  name: 'active_database_connections',
  help: 'Number of active database connections in the pool',
  registers: [register],
});

/**
 * Circuit Breaker State Gauge
 * 0 = closed (healthy), 1 = half-open (probing), 2 = open (failing).
 */
export const circuitBreakerStateGauge = new Gauge({
  name: 'circuit_breaker_state',
  help: 'Circuit breaker state (0=closed, 1=half-open, 2=open)',
  labelNames: ['service', 'model'],
  registers: [register],
});

/**
 * API Failure Rate Histogram
 * Tracks AI API failure rate percentages per rolling window.
 */
export const apiFailureRateHistogram = new Histogram({
  name: 'ai_api_failure_rate',
  help: 'AI API failure rate percentage',
  labelNames: ['service', 'model'],
  buckets: [0, 10, 25, 50, 75, 90, 100],
  registers: [register],
});

/**
 * Fallback Activation Counter
 * Counts how many times each fallback path was triggered.
 */
export const fallbackActivationCounter = new Counter({
  name: 'fallback_activation_count',
  help: 'Number of times fallback logic activated',
  labelNames: ['service', 'fallback_type'],
  registers: [register],
});

/**
 * AI API Batch Size Histogram
 * Tracks the number of items processed per AI batch request.
 */
export const aiApiBatchSizeHistogram = new Histogram({
  name: 'ai_api_batch_size',
  help: 'Number of items in AI API batch requests',
  buckets: [1, 5, 10, 20, 50],
  registers: [register],
});

/**
 * Initialize metrics registry
 * Validates configuration and logs initialization status
 */
export function initializeMetrics(): void {
  if (!metricsConfig.enabled) {
    logger.warn('Metrics collection is disabled');
    return;
  }
  
  logger.info('Prometheus metrics initialized successfully');
  logger.info(`Metrics endpoint: ${metricsConfig.auth.enabled ? 'Protected with basic auth' : 'Protected with IP whitelist'}`);
  logger.info(`Allowed IPs: ${metricsConfig.ipWhitelist.join(', ')}`);
  logger.info(`Histogram buckets: ${HISTOGRAM_BUCKETS.join(', ')} seconds`);
}

/**
 * Get current metrics in Prometheus format
 * @returns Metrics string in Prometheus exposition format
 */
export async function getMetrics(): Promise<string> {
  return await register.metrics();
}

/**
 * Get registry content type
 * @returns Content type for Prometheus metrics
 */
export function getContentType(): string {
  return register.contentType;
}

/**
 * Reset all metrics (useful for testing)
 */
export function resetMetrics(): void {
  register.resetMetrics();
  logger.debug('All metrics reset');
}

export default {
  register,
  httpRequestDuration,
  httpRequestsTotal,
  activeConnections,
  dbQueryDuration,
  cacheHits,
  cacheMisses,
  activeDatabaseConnectionsGauge,
  circuitBreakerStateGauge,
  aiApiBatchSizeHistogram,
  initializeMetrics,
  getMetrics,
  getContentType,
  resetMetrics,
};
