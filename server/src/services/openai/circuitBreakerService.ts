/**
 * Circuit Breaker Service
 * 
 * File: server/src/services/openai/circuitBreakerService.ts
 * Task: US_025 TASK_001 - Backend OpenAI Integration
 * 
 * Implements circuit breaker pattern for OpenAI API resilience.
 * States: closed (normal) → open (failing) → half-open (testing recovery)
 */
import logger from '../../utils/logger';
import type { CircuitState, CircuitBreakerConfig } from '../../types/aiIntake.types';

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 30_000, // 30 seconds
  halfOpenMaxAttempts: 2,
};

class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  private halfOpenAttempts = 0;
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** Get current circuit state */
  getState(): CircuitState {
    if (this.state === 'open') {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.config.resetTimeoutMs) {
        this.state = 'half-open';
        this.halfOpenAttempts = 0;
        logger.info('Circuit breaker transitioning to half-open');
      }
    }
    return this.state;
  }

  /** Check if requests are allowed */
  isAllowed(): boolean {
    const currentState = this.getState();
    if (currentState === 'closed') return true;
    if (currentState === 'half-open') {
      return this.halfOpenAttempts < this.config.halfOpenMaxAttempts;
    }
    return false;
  }

  /** Record a successful request */
  recordSuccess(): void {
    if (this.state === 'half-open') {
      logger.info('Circuit breaker closing after successful half-open attempt');
    }
    this.state = 'closed';
    this.failureCount = 0;
    this.halfOpenAttempts = 0;
  }

  /** Record a failed request */
  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'half-open') {
      this.halfOpenAttempts++;
      if (this.halfOpenAttempts >= this.config.halfOpenMaxAttempts) {
        this.state = 'open';
        logger.warn('Circuit breaker re-opened after half-open failures');
      }
      return;
    }

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'open';
      logger.warn(
        `Circuit breaker opened after ${this.failureCount} failures. ` +
        `Will reset in ${this.config.resetTimeoutMs}ms`
      );
    }
  }

  /** Reset the circuit breaker */
  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.halfOpenAttempts = 0;
    this.lastFailureTime = 0;
    logger.info('Circuit breaker manually reset');
  }
}

/** Singleton circuit breaker for OpenAI API */
export const openAICircuitBreaker = new CircuitBreaker();

export default CircuitBreaker;
