/**
 * Circuit Breaker Types
 *
 * TypeScript interfaces for circuit breaker status and log data
 * used across the admin dashboard and user-facing fallback UI.
 *
 * @module types/circuit-breaker.types
 * @task US_041 TASK_002
 */

export type CircuitBreakerState = 'closed' | 'half-open' | 'open';

export type CircuitBreakerServiceId =
  | 'ai-intake'
  | 'document-extraction'
  | 'medical-coding'
  | 'medication-conflicts';

export interface CircuitBreakerStatus {
  service: CircuitBreakerServiceId;
  model: string;
  state: CircuitBreakerState;
  failureRate: number;
  lastStateChange: string;
  errorCount: number;
  successCount: number;
}

export type CircuitBreakerLogEvent =
  | 'opened'
  | 'closed'
  | 'half-opened'
  | 'fallback-activated';

export interface CircuitBreakerLog {
  id: string;
  service: CircuitBreakerServiceId;
  event: CircuitBreakerLogEvent;
  timestamp: string;
  details: string;
}
