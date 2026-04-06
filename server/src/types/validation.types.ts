/**
 * Validation Types
 * 
 * File: server/src/types/validation.types.ts
 * Task: US_027 TASK_002 - Backend Real-Time Validation Service
 */

export { ValidationResult, ValidationRule, ValidationState } from './aiIntake.types';

/** Ambiguous medical term mapping */
export interface AmbiguousTermMapping {
  colloquial: string;
  medicalTerms: string[];
  clarificationTemplate: string;
}

/** Medication match result */
export interface MedicationMatch {
  name: string;
  genericName?: string;
  distance: number;
  confidence: number;
}

/** Date validation result */
export interface DateValidationResult {
  isValid: boolean;
  parsedDate?: Date;
  originalInput: string;
  confidence: number;
  clarification?: string;
}

/** Inconsistency detection result */
export interface InconsistencyResult {
  field1: string;
  field2: string;
  description: string;
  severity: 'warning' | 'error';
  clarificationQuestion: string;
}
