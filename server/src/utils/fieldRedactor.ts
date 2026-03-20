/**
 * Field Redactor for PII Redaction
 * 
 * File: server/src/utils/fieldRedactor.ts
 * Purpose: Field-based PII redaction logic
 * Task: US_011 TASK_003 - Backend PII Redaction Middleware
 * 
 * Features:
 * - Field name matching (exact and contains)
 * - Apply redaction rules to field values
 * - Handle different data types (string, number, date, object, array)
 * - Preserve entity IDs for audit traceability
 */

import { RedactionMode, PIIDetectionResult } from '../types/pii.types';
import { getFieldRedactionRule, isWhitelistedField } from '../config/piiRules';
import { applyRedactionMode } from './patternDetector';
import logger from './logger';

/**
 * Redact field value based on redaction rule
 * 
 * @param fieldName - Name of the field
 * @param value - Value to redact
 * @param whitelist - Additional whitelisted fields
 * @returns Redacted value or original if no redaction needed
 */
export function redactFieldValue(
  fieldName: string,
  value: any,
  whitelist: string[] = []
): PIIDetectionResult {
  // Check if field is whitelisted
  if (isWhitelistedField(fieldName, whitelist)) {
    return {
      detected: false,
      identifier: fieldName,
      type: 'field',
      redactedValue: value,
      mode: RedactionMode.SKIP,
    };
  }
  
  // Get redaction rule for this field
  const rule = getFieldRedactionRule(fieldName);
  
  if (!rule) {
    // No specific rule - return original value
    return {
      detected: false,
      identifier: fieldName,
      type: 'field',
      redactedValue: value,
      mode: RedactionMode.SKIP,
    };
  }
  
  // Apply redaction based on rule mode
  const redactedValue = applyFieldRedaction(value, rule.mode, fieldName);
  
  logger.debug(`Field redaction applied: ${fieldName}`, {
    field: fieldName,
    mode: rule.mode,
    ruleDescription: rule.description,
  });
  
  return {
    detected: true,
    identifier: fieldName,
    type: 'field',
    originalValue: value,
    redactedValue,
    mode: rule.mode,
  };
}

/**
 * Apply redaction mode to field value
 * Handles different data types appropriately
 * 
 * @param value - Value to redact
 * @param mode - Redaction mode
 * @param _fieldName - Field name (for context, currently unused)
 * @returns Redacted value
 */
export function applyFieldRedaction(
  value: any,
  mode: RedactionMode,
  _fieldName: string
): any {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return value;
  }
  
  // Handle different data types
  if (typeof value === 'string') {
    return applyRedactionMode(value, mode);
  }
  
  if (typeof value === 'number') {
    // Convert to string, redact, but return as [REDACTED] for numbers
    if (mode === RedactionMode.REDACT) {
      return '[REDACTED]';
    }
    if (mode === RedactionMode.KEEP_LAST_4) {
      return applyRedactionMode(value.toString(), mode);
    }
    return '[REDACTED]';
  }
  
  if (typeof value === 'boolean') {
    // Booleans usually not PII, but if flagged, just keep them
    return value;
  }
  
  if (value instanceof Date) {
    // Handle dates
    if (mode === RedactionMode.KEEP_YEAR) {
      return value.getFullYear().toString();
    }
    return '[REDACTED]';
  }
  
  if (typeof value === 'object') {
    // Objects and arrays should not be directly redacted
    // They'll be handled recursively by the main redaction function
    return value;
  }
  
  // Default: redact
  return '[REDACTED]';
}

/**
 * Check if field name indicates PII
 * Uses pattern matching to detect PII field names
 * 
 * @param fieldName - Field name to check
 * @returns True if field name suggests PII content
 */
export function isPIIFieldName(fieldName: string): boolean {
  const normalized = fieldName.toLowerCase();
  
  const piiKeywords = [
    'email',
    'name',
    'ssn',
    'phone',
    'address',
    'birth',
    'dob',
    'credit',
    'card',
    'passport',
    'license',
    'medical',
    'mrn',
    'insurance',
    'policy',
    'password',
    'secret',
    'token',
    'key',
  ];
  
  return piiKeywords.some(keyword => normalized.includes(keyword));
}

/**
 * Extract entity references from object
 * Finds ID fields like user_id, patient_id for preservation
 * 
 * @param obj - Object to extract references from
 * @returns Object with entity references
 */
export function extractEntityReferences(obj: any): Record<string, any> {
  if (!obj || typeof obj !== 'object') return {};
  
  const references: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Check if key is an ID field
    if (key.endsWith('_id') || key === 'id') {
      references[key] = value;
    }
  }
  
  return references;
}

/**
 * Determine redaction mode for field
 * Based on field name pattern matching
 * 
 * @param fieldName - Field name
 * @returns Suggested redaction mode
 */
export function suggestRedactionMode(fieldName: string): RedactionMode {
  const normalized = fieldName.toLowerCase();
  
  // Email fields
  if (normalized.includes('email')) {
    return RedactionMode.MASK;
  }
  
  // Name fields
  if (normalized.includes('name') && !normalized.includes('user') && !normalized.includes('file')) {
    return RedactionMode.REDACT;
  }
  
  // SSN/Tax ID
  if (normalized.includes('ssn') || normalized.includes('tax_id') || normalized.includes('national_id')) {
    return RedactionMode.REDACT;
  }
  
  // Phone numbers
  if (normalized.includes('phone') || normalized.includes('mobile') || normalized.includes('tel')) {
    return RedactionMode.REDACT;
  }
  
  // Addresses
  if (normalized.includes('address') || normalized.includes('street') || normalized.includes('city')) {
    return RedactionMode.REDACT;
  }
  
  // Dates of birth
  if (normalized.includes('birth') || normalized.includes('dob')) {
    return RedactionMode.KEEP_YEAR;
  }
  
  // Credit cards
  if (normalized.includes('card') || normalized.includes('credit')) {
    return RedactionMode.KEEP_LAST_4;
  }
  
  // Medical record numbers
  if (normalized.includes('mrn') || normalized.includes('medical_record')) {
    return RedactionMode.HASH;
  }
  
  // Secrets
  if (normalized.includes('password') || normalized.includes('secret') || normalized.includes('token') || normalized.includes('key')) {
    return RedactionMode.REDACT;
  }
  
  // Default: redact
  return RedactionMode.REDACT;
}

/**
 * Bulk redact multiple fields
 * 
 * @param data - Object containing fields to redact
 * @param fieldNames - Array of field names to redact
 * @param whitelist - Fields to skip
 * @returns Object with redacted fields
 */
export function redactFields(
  data: Record<string, any>,
  fieldNames: string[],
  whitelist: string[] = []
): Record<string, any> {
  if (!data || typeof data !== 'object') return data;
  
  const redacted = { ...data };
  
  for (const fieldName of fieldNames) {
    if (fieldName in redacted) {
      const result = redactFieldValue(fieldName, redacted[fieldName], whitelist);
      redacted[fieldName] = result.redactedValue;
    }
  }
  
  return redacted;
}

/**
 * Find all PII fields in an object
 * 
 * @param obj - Object to scan
 * @param maxDepth - Maximum recursion depth
 * @param currentDepth - Current recursion depth
 * @returns Array of field names that may contain PII
 */
export function findPIIFields(
  obj: any,
  maxDepth: number = 10,
  currentDepth: number = 0
): string[] {
  if (!obj || typeof obj !== 'object' || currentDepth >= maxDepth) return [];
  
  const piiFields: string[] = [];
  
  for (const [key, value] of Object.entries(obj)) {
    // Check if field name suggests PII
    if (isPIIFieldName(key)) {
      piiFields.push(key);
    }
    
    // Recurse into nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nestedFields = findPIIFields(value, maxDepth, currentDepth + 1);
      piiFields.push(...nestedFields.map(f => `${key}.${f}`));
    }
    
    // Recurse into arrays
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item && typeof item === 'object') {
          const nestedFields = findPIIFields(item, maxDepth, currentDepth + 1);
          piiFields.push(...nestedFields.map(f => `${key}[${index}].${f}`));
        }
      });
    }
  }
  
  return piiFields;
}

/**
 * Validate redaction result
 * Checks if redaction was successful and complete
 * 
 * @param original - Original data
 * @param redacted - Redacted data
 * @returns Validation result
 */
export function validateRedaction(original: any, redacted: any): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check if redacted is defined
  if (redacted === undefined) {
    issues.push('Redacted data is undefined');
  }
  
  // Check if original data leaked into redacted
  if (typeof original === 'string' && typeof redacted === 'string') {
    if (original.length > 10 && redacted === original) {
      issues.push('Original value may not have been redacted');
    }
  }
  
  // Check for common PII patterns in redacted data
  if (typeof redacted === 'string') {
    // Check for email pattern
    if (/@\w+\.\w+/.test(redacted) && !redacted.includes('***')) {
      issues.push('Possible unredacted email address');
    }
    
    // Check for SSN pattern
    if (/\d{3}-\d{2}-\d{4}/.test(redacted)) {
      issues.push('Possible unredacted SSN');
    }
    
    // Check for phone pattern
    if (/\(\d{3}\)\s*\d{3}-\d{4}/.test(redacted)) {
      issues.push('Possible unredacted phone number');
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

export default {
  redactFieldValue,
  applyFieldRedaction,
  isPIIFieldName,
  extractEntityReferences,
  suggestRedactionMode,
  redactFields,
  findPIIFields,
  validateRedaction,
};
