/**
 * AI Intake Fallback Service
 *
 * Returns a manual-form fallback when the GPT-4 intake circuit breaker
 * is open.
 *
 * @module services/fallback/ai-intake-fallback.service
 * @task US_041 TASK_001
 */
import { fallbackActivationCounter } from '../../config/circuit-breaker.config';
import logger from '../../utils/logger';

export interface IntakeFallbackResponse {
  fallbackMode: boolean;
  message: string;
  action: 'manual_form';
}

export function getIntakeFallbackResponse(): IntakeFallbackResponse {
  fallbackActivationCounter.inc({ service: 'ai-intake', fallback_type: 'manual' });
  logger.warn('AI intake fallback activated – directing user to manual form');

  return {
    fallbackMode: true,
    message:
      'AI chat is temporarily unavailable. Please complete the appointment form manually.',
    action: 'manual_form',
  };
}
