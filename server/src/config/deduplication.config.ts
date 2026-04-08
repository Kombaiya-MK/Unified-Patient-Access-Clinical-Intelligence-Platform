/**
 * Deduplication Configuration
 * @module config/deduplication.config
 * @task US_030 TASK_002
 */

import { DeduplicationConfig } from '../types/deduplication.types';

export const DEDUPLICATION_CONFIG: DeduplicationConfig = {
  fuzzyMatchThreshold: 0.85,
  exactMatchThreshold: 1.0,
  labDateOverlapDays: 7,
  medicationTimelineThresholdDays: 30,
  conflictSimilarityThreshold: 0.85,
  duplicateConfidenceThreshold: 0.95,
  fieldWeights: {
    patient_name: 0.30,
    medications: 0.25,
    labs: 0.20,
    allergies: 0.15,
    conditions: 0.10,
  },
};

export default DEDUPLICATION_CONFIG;
