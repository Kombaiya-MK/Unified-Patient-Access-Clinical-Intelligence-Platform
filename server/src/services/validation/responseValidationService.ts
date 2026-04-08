/**
 * Response Validation Service (Orchestrator)
 * 
 * File: server/src/services/validation/responseValidationService.ts
 * Task: US_027 TASK_002 - Backend Real-Time Validation Service
 * 
 * Orchestrates all validators for real-time patient response validation.
 */
import { validateDate } from './dateValidator';
import { validateMedication } from './medicationValidator';
import { detectInconsistencies } from './inconsistencyDetector';
import { detectAmbiguousTerms } from './medicalTermsService';
import type { ValidationResult, ExtractedIntakeData } from '../../types/aiIntake.types';

/** Confidence threshold below which clarification is triggered */
const CONFIDENCE_THRESHOLD = 0.7;

/**
 * Validate a user message and extracted data
 */
export function validateResponse(
  userMessage: string,
  extractedData: ExtractedIntakeData,
): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Check for ambiguous medical terms in raw message
  results.push(...detectAmbiguousTerms(userMessage));

  // Validate date fields
  if (extractedData.symptomOnset) {
    results.push(validateDate(extractedData.symptomOnset, 'symptomOnset'));
  }

  // Validate medications
  if (extractedData.medications) {
    for (const med of extractedData.medications) {
      results.push(validateMedication(med.name, 'medication'));
    }
  }

  // Validate pain level (numeric range)
  if (extractedData.painLevel !== undefined) {
    if (extractedData.painLevel < 1 || extractedData.painLevel > 10) {
      results.push({
        isValid: false,
        field: 'painLevel',
        originalValue: String(extractedData.painLevel),
        confidence: 0.9,
        clarificationQuestion:
          'Could you rate your pain on a scale of 1 to 10?',
      });
    } else {
      results.push({
        isValid: true,
        field: 'painLevel',
        originalValue: String(extractedData.painLevel),
        confidence: 1.0,
      });
    }
  }

  // Cross-field inconsistency detection
  results.push(...detectInconsistencies(extractedData));

  // Filter out valid results with high confidence (only return issues + validated fields)
  return results;
}

/**
 * Check if any validation results need clarification
 */
export function needsClarification(results: ValidationResult[]): boolean {
  return results.some(
    (r) => !r.isValid || r.confidence < CONFIDENCE_THRESHOLD,
  );
}

/**
 * Get combined clarification questions from validation results
 */
export function getClarificationQuestions(results: ValidationResult[]): string[] {
  return results
    .filter((r) => r.clarificationQuestion && (!r.isValid || r.confidence < CONFIDENCE_THRESHOLD))
    .map((r) => r.clarificationQuestion!);
}
