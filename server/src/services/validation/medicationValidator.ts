/**
 * Medication Validator
 * 
 * File: server/src/services/validation/medicationValidator.ts
 * Task: US_027 TASK_002 - Backend Real-Time Validation Service
 * 
 * Validates medication names using fuzzy matching against a known list.
 */
import type { ValidationResult } from '../../types/aiIntake.types';

/** Common medications list for validation (subset for offline validation) */
const COMMON_MEDICATIONS: string[] = [
  'acetaminophen', 'ibuprofen', 'aspirin', 'naproxen', 'amoxicillin',
  'azithromycin', 'ciprofloxacin', 'metformin', 'lisinopril', 'amlodipine',
  'atorvastatin', 'simvastatin', 'omeprazole', 'pantoprazole', 'losartan',
  'metoprolol', 'hydrochlorothiazide', 'levothyroxine', 'gabapentin',
  'sertraline', 'fluoxetine', 'escitalopram', 'duloxetine', 'venlafaxine',
  'alprazolam', 'lorazepam', 'clonazepam', 'prednisone', 'albuterol',
  'montelukast', 'cetirizine', 'loratadine', 'diphenhydramine', 'warfarin',
  'apixaban', 'rivaroxaban', 'clopidogrel', 'insulin', 'glipizide',
  'pioglitazone', 'sitagliptin', 'empagliflozin', 'rosuvastatin',
  'pravastatin', 'ranitidine', 'famotidine', 'tramadol', 'oxycodone',
  'hydrocodone', 'morphine', 'cyclobenzaprine', 'meloxicam', 'celecoxib',
  'methotrexate', 'hydroxychloroquine', 'adalimumab', 'etanercept',
  'furosemide', 'spironolactone', 'tamsulosin', 'finasteride',
];

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Find closest medication matches
 */
function findClosestMatches(input: string, limit: number = 3): Array<{ name: string; distance: number }> {
  const normalized = input.toLowerCase().trim();
  const matches = COMMON_MEDICATIONS
    .map((med) => ({
      name: med,
      distance: levenshteinDistance(normalized, med),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);

  return matches;
}

/**
 * Validate a medication name
 */
export function validateMedication(input: string, field: string = 'medication'): ValidationResult {
  const normalized = input.toLowerCase().trim();

  // Exact match
  if (COMMON_MEDICATIONS.includes(normalized)) {
    return {
      isValid: true,
      field,
      originalValue: input,
      confidence: 1.0,
    };
  }

  // Fuzzy match
  const matches = findClosestMatches(normalized);
  const bestMatch = matches[0];

  // Good fuzzy match (distance <= 2)
  if (bestMatch && bestMatch.distance <= 2) {
    return {
      isValid: true,
      field,
      originalValue: input,
      suggestedValue: bestMatch.name,
      confidence: 1 - (bestMatch.distance / Math.max(normalized.length, bestMatch.name.length)),
    };
  }

  // Partial match (starts with)
  const partial = COMMON_MEDICATIONS.filter((med) =>
    med.startsWith(normalized) || normalized.startsWith(med),
  );
  if (partial.length > 0) {
    return {
      isValid: true,
      field,
      originalValue: input,
      suggestedValue: partial[0],
      confidence: 0.7,
    };
  }

  // No match - could be a valid but uncommon medication
  const suggestions = matches.map((m) => m.name).join(', ');
  return {
    isValid: false,
    field,
    originalValue: input,
    confidence: 0.3,
    clarificationQuestion:
      `I'm not familiar with "${input}". Did you mean one of these: ${suggestions}? ` +
      'Or please verify the spelling of your medication.',
  };
}
