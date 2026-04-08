/**
 * Medical Coding Fallback Service
 *
 * Returns a manual-coding message when the GPT-4 coding circuit breaker
 * is open.
 *
 * @module services/fallback/coding-fallback.service
 * @task US_041 TASK_001
 */
import { fallbackActivationCounter } from '../../config/circuit-breaker.config';
import logger from '../../utils/logger';

export interface CodingFallbackResponse {
  fallback: boolean;
  message: string;
  action: 'manual_coding';
}

export function getCodingFallbackMessage(): CodingFallbackResponse {
  fallbackActivationCounter.inc({ service: 'coding', fallback_type: 'manual' });
  logger.warn('Medical coding fallback activated – manual coding required');

  return {
    fallback: true,
    message: 'AI suggestion unavailable – please use manual coding interface.',
    action: 'manual_coding',
  };
}
