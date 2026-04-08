/**
 * Document Extraction Configuration
 * @module config/extraction.config
 * @task US_029 TASK_002
 */

import { ExtractionConfig } from '../types/extraction.types';

export const EXTRACTION_CONFIG: ExtractionConfig = {
  confidenceThreshold: 0.90,
  minFieldConfidence: 0.80,
  maxRetryAttempts: 3,
  circuitBreakerThreshold: 3,
  backoffDelays: [5 * 60 * 1000, 15 * 60 * 1000, 60 * 60 * 1000], // 5m, 15m, 1h
};

export const EXTRACTION_FIELDS = [
  'patient_name',
  'date_of_birth',
  'document_date',
  'diagnosed_conditions',
  'prescribed_medications',
  'lab_test_results',
  'allergies',
  'provider_name',
  'facility_name',
] as const;

export const TOTAL_EXTRACTION_FIELDS = EXTRACTION_FIELDS.length;

export default EXTRACTION_CONFIG;
