/**
 * Inconsistency Detector
 * 
 * File: server/src/services/validation/inconsistencyDetector.ts
 * Task: US_027 TASK_002 - Backend Real-Time Validation Service
 * 
 * Detects logical inconsistencies across extracted intake data fields.
 */
import type { ExtractedIntakeData, ValidationResult } from '../../types/aiIntake.types';

/**
 * Detect inconsistencies in collected intake data
 */
export function detectInconsistencies(
  extractedData: ExtractedIntakeData,
): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Check pain level range (1-10)
  if (extractedData.painLevel !== undefined) {
    if (extractedData.painLevel < 0 || extractedData.painLevel > 10) {
      results.push({
        isValid: false,
        field: 'painLevel',
        originalValue: String(extractedData.painLevel),
        confidence: 0.9,
        clarificationQuestion:
          `You mentioned a pain level of ${extractedData.painLevel}. ` +
          'Could you rate your pain on a scale of 1 to 10, where 1 is minimal and 10 is the worst?',
      });
    }
  }

  // Check for duplicate medications
  if (extractedData.medications && extractedData.medications.length > 1) {
    const medNames = extractedData.medications.map((m) => m.name.toLowerCase());
    const duplicates = medNames.filter((name, i) => medNames.indexOf(name) !== i);
    if (duplicates.length > 0) {
      results.push({
        isValid: false,
        field: 'medications',
        originalValue: duplicates.join(', '),
        confidence: 0.8,
        clarificationQuestion:
          `It looks like "${duplicates[0]}" was mentioned more than once. ` +
          'Could you confirm your medication list?',
      });
    }
  }

  // Check for duplicate allergies
  if (extractedData.allergies && extractedData.allergies.length > 1) {
    const allergenNames = extractedData.allergies.map((a) => a.allergen.toLowerCase());
    const duplicates = allergenNames.filter((name, i) => allergenNames.indexOf(name) !== i);
    if (duplicates.length > 0) {
      results.push({
        isValid: false,
        field: 'allergies',
        originalValue: duplicates.join(', '),
        confidence: 0.8,
        clarificationQuestion:
          `It seems "${duplicates[0]}" was listed more than once in your allergies. ` +
          'Could you confirm your allergy list?',
      });
    }
  }

  // Check medication-allergy conflict
  if (extractedData.medications && extractedData.allergies) {
    for (const med of extractedData.medications) {
      const matchingAllergy = extractedData.allergies.find(
        (a) => a.allergen.toLowerCase() === med.name.toLowerCase(),
      );
      if (matchingAllergy) {
        results.push({
          isValid: false,
          field: 'medications',
          originalValue: med.name,
          confidence: 0.95,
          clarificationQuestion:
            `You mentioned taking "${med.name}" but also listed it as an allergy. ` +
            'Could you clarify whether you are currently taking this medication?',
        });
      }
    }
  }

  return results;
}
