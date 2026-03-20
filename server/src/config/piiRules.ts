/**
 * PII Redaction Rules Configuration
 * 
 * File: server/src/config/piiRules.ts
 * Purpose: Centralized PII redaction rules and patterns
 * Task: US_011 TASK_003 - Backend PII Redaction Middleware
 * 
 * Features:
 * - Field-based redaction rules
 * - Pattern-based detection rules
 * - HIPAA-compliant defaults
 * - Configurable via environment variables
 */

import {
  PIIField,
  PIIPattern,
  RedactionMode,
  RedactionRule,
  PIIRegexPattern,
} from '../types/pii.types';

/**
 * Field-Based Redaction Rules
 * Defines how specific fields should be redacted
 */
export const FIELD_REDACTION_RULES: RedactionRule[] = [
  // Names and Personal Identifiers
  {
    identifier: PIIField.EMAIL,
    mode: RedactionMode.MASK,
    maskPattern: '***',
    description: 'Email addresses masked to show first character and domain',
    compliance: true,
  },
  {
    identifier: PIIField.FIRST_NAME,
    mode: RedactionMode.REDACT,
    description: 'First name completely redacted',
    compliance: true,
  },
  {
    identifier: PIIField.LAST_NAME,
    mode: RedactionMode.REDACT,
    description: 'Last name completely redacted',
    compliance: true,
  },
  {
    identifier: PIIField.FULL_NAME,
    mode: RedactionMode.REDACT,
    description: 'Full name completely redacted',
    compliance: true,
  },
  {
    identifier: PIIField.MIDDLE_NAME,
    mode: RedactionMode.REDACT,
    description: 'Middle name completely redacted',
    compliance: true,
  },
  
  // Government IDs
  {
    identifier: PIIField.SSN,
    mode: RedactionMode.REDACT,
    description: 'Social Security Number completely redacted',
    compliance: true,
  },
  {
    identifier: PIIField.SOCIAL_SECURITY_NUMBER,
    mode: RedactionMode.REDACT,
    description: 'Social Security Number completely redacted',
    compliance: true,
  },
  {
    identifier: PIIField.NATIONAL_ID,
    mode: RedactionMode.REDACT,
    description: 'National ID completely redacted',
    compliance: true,
  },
  {
    identifier: PIIField.TAX_ID,
    mode: RedactionMode.REDACT,
    description: 'Tax ID completely redacted',
    compliance: true,
  },
  
  // Contact Information
  {
    identifier: PIIField.PHONE,
    mode: RedactionMode.REDACT,
    description: 'Phone number completely redacted',
    compliance: true,
  },
  {
    identifier: PIIField.PHONE_NUMBER,
    mode: RedactionMode.REDACT,
    description: 'Phone number completely redacted',
    compliance: true,
  },
  {
    identifier: PIIField.MOBILE,
    mode: RedactionMode.REDACT,
    description: 'Mobile number completely redacted',
    compliance: true,
  },
  {
    identifier: PIIField.MOBILE_NUMBER,
    mode: RedactionMode.REDACT,
    description: 'Mobile number completely redacted',
    compliance: true,
  },
  {
    identifier: PIIField.TELEPHONE,
    mode: RedactionMode.REDACT,
    description: 'Telephone number completely redacted',
    compliance: true,
  },
  {
    identifier: PIIField.FAX,
    mode: RedactionMode.REDACT,
    description: 'Fax number completely redacted',
    compliance: true,
  },
  
  // Address Information
  {
    identifier: PIIField.ADDRESS,
    mode: RedactionMode.REDACT,
    description: 'Address completely redacted',
    compliance: true,
  },
  {
    identifier: PIIField.STREET,
    mode: RedactionMode.REDACT,
    description: 'Street address completely redacted',
    compliance: true,
  },
  {
    identifier: PIIField.STREET_ADDRESS,
    mode: RedactionMode.REDACT,
    description: 'Street address completely redacted',
    compliance: true,
  },
  {
    identifier: PIIField.ADDRESS_LINE1,
    mode: RedactionMode.REDACT,
    description: 'Address line 1 completely redacted',
    compliance: true,
  },
  {
    identifier: PIIField.ADDRESS_LINE2,
    mode: RedactionMode.REDACT,
    description: 'Address line 2 completely redacted',
    compliance: true,
  },
  {
    identifier: PIIField.CITY,
    mode: RedactionMode.REDACT,
    description: 'City completely redacted',
    compliance: true,
  },
  {
    identifier: PIIField.STATE,
    mode: RedactionMode.MASK,
    description: 'State partially masked',
    compliance: false,
  },
  {
    identifier: PIIField.ZIP,
    mode: RedactionMode.REDACT,
    description: 'ZIP code completely redacted',
    compliance: true,
  },
  {
    identifier: PIIField.ZIP_CODE,
    mode: RedactionMode.REDACT,
    description: 'ZIP code completely redacted',
    compliance: true,
  },
  {
    identifier: PIIField.POSTAL_CODE,
    mode: RedactionMode.REDACT,
    description: 'Postal code completely redacted',
    compliance: true,
  },
  
  // Dates
  {
    identifier: PIIField.DATE_OF_BIRTH,
    mode: RedactionMode.KEEP_YEAR,
    description: 'Date of birth reduced to year only',
    compliance: true,
  },
  {
    identifier: PIIField.DOB,
    mode: RedactionMode.KEEP_YEAR,
    description: 'Date of birth reduced to year only',
    compliance: true,
  },
  {
    identifier: PIIField.BIRTH_DATE,
    mode: RedactionMode.KEEP_YEAR,
    description: 'Birth date reduced to year only',
    compliance: true,
  },
  {
    identifier: PIIField.BIRTHDATE,
    mode: RedactionMode.KEEP_YEAR,
    description: 'Birth date reduced to year only',
    compliance: true,
  },
  
  // Financial Information
  {
    identifier: PIIField.CREDIT_CARD,
    mode: RedactionMode.KEEP_LAST_4,
    description: 'Credit card number masked, keeping last 4 digits',
    compliance: true,
  },
  {
    identifier: PIIField.CREDIT_CARD_NUMBER,
    mode: RedactionMode.KEEP_LAST_4,
    description: 'Credit card number masked, keeping last 4 digits',
    compliance: true,
  },
  {
    identifier: PIIField.CARD_NUMBER,
    mode: RedactionMode.KEEP_LAST_4,
    description: 'Card number masked, keeping last 4 digits',
    compliance: true,
  },
  {
    identifier: PIIField.CVV,
    mode: RedactionMode.REDACT,
    description: 'CVV completely redacted',
    compliance: true,
  },
  {
    identifier: PIIField.CVC,
    mode: RedactionMode.REDACT,
    description: 'CVC completely redacted',
    compliance: true,
  },
  
  // Healthcare Identifiers
  {
    identifier: PIIField.MEDICAL_RECORD_NUMBER,
    mode: RedactionMode.HASH,
    description: 'Medical record number hashed for matching',
    compliance: true,
  },
  {
    identifier: PIIField.MRN,
    mode: RedactionMode.HASH,
    description: 'MRN hashed for matching',
    compliance: true,
  },
  {
    identifier: PIIField.HEALTH_PLAN_ID,
    mode: RedactionMode.REDACT,
    description: 'Health plan ID completely redacted',
    compliance: true,
  },
  {
    identifier: PIIField.INSURANCE_NUMBER,
    mode: RedactionMode.KEEP_LAST_4,
    description: 'Insurance number masked, keeping last 4 digits',
    compliance: true,
  },
  {
    identifier: PIIField.POLICY_NUMBER,
    mode: RedactionMode.KEEP_LAST_4,
    description: 'Policy number masked, keeping last 4 digits',
    compliance: true,
  },
  
  // Other Identifiers
  {
    identifier: PIIField.PASSPORT,
    mode: RedactionMode.REDACT,
    description: 'Passport number completely redacted',
    compliance: true,
  },
  {
    identifier: PIIField.PASSPORT_NUMBER,
    mode: RedactionMode.REDACT,
    description: 'Passport number completely redacted',
    compliance: true,
  },
  {
    identifier: PIIField.DRIVERS_LICENSE,
    mode: RedactionMode.REDACT,
    description: 'Drivers license completely redacted',
    compliance: true,
  },
  {
    identifier: PIIField.LICENSE_NUMBER,
    mode: RedactionMode.REDACT,
    description: 'License number completely redacted',
    compliance: true,
  },
  
  // Tech Identifiers
  {
    identifier: PIIField.IP_ADDRESS,
    mode: RedactionMode.MASK,
    description: 'IP address partially masked',
    compliance: false,
  },
  {
    identifier: PIIField.MAC_ADDRESS,
    mode: RedactionMode.REDACT,
    description: 'MAC address completely redacted',
    compliance: false,
  },
  
  // Secrets
  {
    identifier: PIIField.PASSWORD,
    mode: RedactionMode.REDACT,
    description: 'Password completely redacted',
    compliance: true,
  },
  {
    identifier: PIIField.PASSWORD_HASH,
    mode: RedactionMode.REDACT,
    description: 'Password hash completely redacted',
    compliance: true,
  },
  {
    identifier: PIIField.SECRET,
    mode: RedactionMode.REDACT,
    description: 'Secret completely redacted',
    compliance: true,
  },
  {
    identifier: PIIField.TOKEN,
    mode: RedactionMode.REDACT,
    description: 'Token completely redacted',
    compliance: true,
  },
  {
    identifier: PIIField.API_KEY,
    mode: RedactionMode.REDACT,
    description: 'API key completely redacted',
    compliance: true,
  },
];

/**
 * Pattern-Based Detection Rules
 * Regex patterns for detecting PII in free text
 */
export const PATTERN_DETECTION_RULES: PIIRegexPattern[] = [
  {
    type: PIIPattern.SSN,
    regex: /\b\d{3}-\d{2}-\d{4}\b|\b\d{9}\b/g,
    description: 'Social Security Number (XXX-XX-XXXX or XXXXXXXXX)',
    defaultMode: RedactionMode.REDACT,
  },
  {
    type: PIIPattern.EMAIL,
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    description: 'Email address (user@example.com)',
    defaultMode: RedactionMode.MASK,
  },
  {
    type: PIIPattern.PHONE_US,
    regex: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    description: 'US Phone number ((XXX) XXX-XXXX, XXX-XXX-XXXX, etc.)',
    defaultMode: RedactionMode.REDACT,
  },
  {
    type: PIIPattern.CREDIT_CARD,
    regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    description: 'Credit card number (XXXX-XXXX-XXXX-XXXX)',
    validate: (match: string) => {
      // Luhn algorithm validation for credit cards
      const digits = match.replace(/\D/g, '');
      if (digits.length < 13 || digits.length > 19) return false;
      
      let sum = 0;
      let isEven = false;
      
      for (let i = digits.length - 1; i >= 0; i--) {
        let digit = parseInt(digits[i], 10);
        
        if (isEven) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        
        sum += digit;
        isEven = !isEven;
      }
      
      return sum % 10 === 0;
    },
    defaultMode: RedactionMode.KEEP_LAST_4,
  },
  {
    type: PIIPattern.IP_ADDRESS_V4,
    regex: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    description: 'IPv4 address (XXX.XXX.XXX.XXX)',
    defaultMode: RedactionMode.MASK,
  },
  {
    type: PIIPattern.IP_ADDRESS_V6,
    regex: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,
    description: 'IPv6 address',
    defaultMode: RedactionMode.MASK,
  },
  {
    type: PIIPattern.ZIP_CODE,
    regex: /\b\d{5}(?:-\d{4})?\b/g,
    description: 'US ZIP code (XXXXX or XXXXX-XXXX)',
    defaultMode: RedactionMode.REDACT,
  },
  {
    type: PIIPattern.DATE,
    regex: /\b\d{4}-\d{2}-\d{2}\b/g,
    description: 'Date in YYYY-MM-DD format',
    defaultMode: RedactionMode.KEEP_YEAR,
  },
  {
    type: PIIPattern.URL,
    regex: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
    description: 'URL (may contain sensitive paths/params)',
    defaultMode: RedactionMode.MASK,
  },
];

/**
 * Get redaction rule for a field
 * @param fieldName - Name of field to check
 * @returns Redaction rule or null if not found
 */
export function getFieldRedactionRule(fieldName: string): RedactionRule | null {
  const normalizedField = fieldName.toLowerCase();
  
  // Try exact match
  let rule = FIELD_REDACTION_RULES.find(
    r => r.identifier.toLowerCase() === normalizedField
  );
  
  if (rule) return rule;
  
  // Try contains match (for fields like emergency_contact_phone matching phone)
  rule = FIELD_REDACTION_RULES.find(
    r => normalizedField.includes(r.identifier.toString().toLowerCase())
  );
  
  return rule || null;
}

/**
 * Get pattern detection rule
 * @param patternType - Type of pattern
 * @returns Pattern detection rule or null if not found
 */
export function getPatternDetectionRule(patternType: PIIPattern): PIIRegexPattern | null {
  return PATTERN_DETECTION_RULES.find(r => r.type === patternType) || null;
}

/**
 * Check if field is whitelisted (should not be redacted)
 * @param fieldName - Name of field to check
 * @param customWhitelist - Additional whitelist fields
 * @returns True if field should not be redacted
 */
export function isWhitelistedField(fieldName: string, customWhitelist: string[] = []): boolean {
  const normalizedField = fieldName.toLowerCase();
  
  const defaultWhitelist = [
    'id',
    'user_id',
    'patient_id',
    'appointment_id',
    'department_id',
    'resource_id',
    'record_id',
    'action',
    'action_type',
    'status',
    'status_code',
    'method',
    'path',
    'created_at',
    'updated_at',
    'timestamp',
    'resource_type',
    'table_name',
    'role',
    'roles',
  ];
  
  return (
    defaultWhitelist.includes(normalizedField) ||
    customWhitelist.some(w => w.toLowerCase() === normalizedField) ||
    normalizedField.endsWith('_id') ||
    normalizedField.startsWith('is_') ||
    normalizedField.startsWith('has_')
  );
}

/**
 * Environment-based configuration overrides
 */
export const PII_CONFIG = {
  /**
   * Enable pattern-based detection
   * Set PII_PATTERN_DETECTION=false to disable
   */
  enablePatternDetection: process.env.PII_PATTERN_DETECTION !== 'false',
  
  /**
   * Enable field-based detection
   * Set PII_FIELD_DETECTION=false to disable
   */
  enableFieldDetection: process.env.PII_FIELD_DETECTION !== 'false',
  
  /**
   * Maximum recursion depth for nested objects
   * Set PII_MAX_DEPTH to customize (default: 10)
   */
  maxDepth: parseInt(process.env.PII_MAX_DEPTH || '10', 10),
  
  /**
   * Preserve entity IDs (user_id, patient_id, etc.)
   * Set PII_PRESERVE_IDS=false to redact all IDs
   */
  preserveIds: process.env.PII_PRESERVE_IDS !== 'false',
  
  /**
   * Environment (development allows more verbose logging)
   */
  isDevelopment: process.env.NODE_ENV === 'development',
};

export default {
  FIELD_REDACTION_RULES,
  PATTERN_DETECTION_RULES,
  getFieldRedactionRule,
  getPatternDetectionRule,
  isWhitelistedField,
  PII_CONFIG,
};
