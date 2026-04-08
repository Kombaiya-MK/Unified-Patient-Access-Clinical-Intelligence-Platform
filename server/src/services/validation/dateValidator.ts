/**
 * Date Validator
 * 
 * File: server/src/services/validation/dateValidator.ts
 * Task: US_027 TASK_002 - Backend Real-Time Validation Service
 * 
 * Validates date formats and relative date references.
 */
import { parse, isValid, isFuture, subDays, subWeeks, subMonths } from 'date-fns';
import type { ValidationResult } from '../../types/aiIntake.types';

/** Supported date formats */
const DATE_FORMATS = ['MM/dd/yyyy', 'yyyy-MM-dd', 'MM-dd-yyyy', 'M/d/yyyy'];

/** Relative date patterns */
const RELATIVE_PATTERNS: Array<{ regex: RegExp; resolver: (match: RegExpMatchArray) => Date }> = [
  {
    regex: /(\d+)\s*days?\s*ago/i,
    resolver: (m) => subDays(new Date(), parseInt(m[1], 10)),
  },
  {
    regex: /(\d+)\s*weeks?\s*ago/i,
    resolver: (m) => subWeeks(new Date(), parseInt(m[1], 10)),
  },
  {
    regex: /(\d+)\s*months?\s*ago/i,
    resolver: (m) => subMonths(new Date(), parseInt(m[1], 10)),
  },
  {
    regex: /last\s*week/i,
    resolver: () => subWeeks(new Date(), 1),
  },
  {
    regex: /yesterday/i,
    resolver: () => subDays(new Date(), 1),
  },
  {
    regex: /today/i,
    resolver: () => new Date(),
  },
];

/**
 * Validate a date input string
 */
export function validateDate(input: string, field: string = 'date'): ValidationResult {
  const trimmed = input.trim();

  // Try relative date patterns first
  for (const pattern of RELATIVE_PATTERNS) {
    const match = trimmed.match(pattern.regex);
    if (match) {
      const resolved = pattern.resolver(match);
      return {
        isValid: true,
        field,
        originalValue: trimmed,
        suggestedValue: resolved.toISOString().split('T')[0],
        confidence: 0.9,
      };
    }
  }

  // Try standard date formats
  for (const fmt of DATE_FORMATS) {
    const parsed = parse(trimmed, fmt, new Date());
    if (isValid(parsed)) {
      // Check if symptom onset is not in the future
      if (field === 'symptomOnset' && isFuture(parsed)) {
        return {
          isValid: false,
          field,
          originalValue: trimmed,
          confidence: 0.8,
          clarificationQuestion:
            `The date "${trimmed}" appears to be in the future. ` +
            'Could you confirm when your symptoms started?',
        };
      }

      return {
        isValid: true,
        field,
        originalValue: trimmed,
        suggestedValue: parsed.toISOString().split('T')[0],
        confidence: 0.95,
      };
    }
  }

  // Unable to parse
  return {
    isValid: false,
    field,
    originalValue: trimmed,
    confidence: 0.3,
    clarificationQuestion:
      `I couldn't understand the date "${trimmed}". ` +
      'Could you provide it in MM/DD/YYYY format or describe it (e.g., "3 days ago")?',
  };
}
