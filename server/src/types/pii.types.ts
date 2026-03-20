/**
 * PII Redaction Types and Interfaces
 * 
 * File: server/src/types/pii.types.ts
 * Purpose: Type definitions for PII redaction system
 * Task: US_011 TASK_003 - Backend PII Redaction Middleware
 * 
 * Features:
 * - Pattern-based detection (SSN, email, phone, credit card)
 * - Field-based detection (known PII fields)
 * - Multiple redaction modes (MASK, REDACT, REFERENCE, HASH)
 * - Configurable redaction rules
 * - HIPAA-compliant PII/PHI protection
 */

/**
 * PII Field Types
 * Known fields that contain personally identifiable information
 */
export enum PIIField {
  EMAIL = 'email',
  FIRST_NAME = 'first_name',
  LAST_NAME = 'last_name',
  FULL_NAME = 'full_name',
  MIDDLE_NAME = 'middle_name',
  
  SSN = 'ssn',
  SOCIAL_SECURITY_NUMBER = 'social_security_number',
  NATIONAL_ID = 'national_id',
  TAX_ID = 'tax_id',
  
  PHONE = 'phone',
  PHONE_NUMBER = 'phone_number',
  MOBILE = 'mobile',
  MOBILE_NUMBER = 'mobile_number',
  TELEPHONE = 'telephone',
  FAX = 'fax',
  
  ADDRESS = 'address',
  STREET = 'street',
  STREET_ADDRESS = 'street_address',
  ADDRESS_LINE1 = 'address_line1',
  ADDRESS_LINE2 = 'address_line2',
  CITY = 'city',
  STATE = 'state',
  ZIP = 'zip',
  ZIP_CODE = 'zip_code',
  POSTAL_CODE = 'postal_code',
  COUNTRY = 'country',
  
  DATE_OF_BIRTH = 'date_of_birth',
  DOB = 'dob',
  BIRTH_DATE = 'birth_date',
  BIRTHDATE = 'birthdate',
  
  CREDIT_CARD = 'credit_card',
  CREDIT_CARD_NUMBER = 'credit_card_number',
  CARD_NUMBER = 'card_number',
  CVV = 'cvv',
  CVC = 'cvc',
  
  MEDICAL_RECORD_NUMBER = 'medical_record_number',
  MRN = 'mrn',
  HEALTH_PLAN_ID = 'health_plan_id',
  INSURANCE_NUMBER = 'insurance_number',
  POLICY_NUMBER = 'policy_number',
  
  PASSPORT = 'passport',
  PASSPORT_NUMBER = 'passport_number',
  DRIVERS_LICENSE = 'drivers_license',
  LICENSE_NUMBER = 'license_number',
  
  IP_ADDRESS = 'ip_address',
  MAC_ADDRESS = 'mac_address',
  
  PASSWORD = 'password',
  PASSWORD_HASH = 'password_hash',
  SECRET = 'secret',
  TOKEN = 'token',
  API_KEY = 'api_key',
}

/**
 * Pattern Types
 * Types of PII patterns that can be detected via regex
 */
export enum PIIPattern {
  SSN = 'SSN',             // XXX-XX-XXXX or XXXXXXXXX
  EMAIL = 'EMAIL',         // user@example.com
  PHONE_US = 'PHONE_US',   // (XXX) XXX-XXXX or XXX-XXX-XXXX
  CREDIT_CARD = 'CREDIT_CARD', // XXXX-XXXX-XXXX-XXXX
  IP_ADDRESS_V4 = 'IP_ADDRESS_V4', // XXX.XXX.XXX.XXX
  IP_ADDRESS_V6 = 'IP_ADDRESS_V6', // XXXX:XXXX:XXXX:XXXX:XXXX:XXXX:XXXX:XXXX
  ZIP_CODE = 'ZIP_CODE',   // XXXXX or XXXXX-XXXX
  DATE = 'DATE',           // YYYY-MM-DD
  URL = 'URL',             // https://example.com
}

/**
 * Redaction Mode
 * How PII should be redacted
 */
export enum RedactionMode {
  /**
   * MASK: Partially mask value (e.g., j***@example.com)
   * Shows first character and domain for emails, last 4 digits for credit cards
   */
  MASK = 'MASK',
  
  /**
   * REDACT: Completely replace with [REDACTED]
   * No part of original value visible
   */
  REDACT = 'REDACT',
  
  /**
   * REFERENCE: Replace with entity reference (e.g., user_id: 123)
   * Keeps audit trail useful by referencing IDs instead of names
   */
  REFERENCE = 'REFERENCE',
  
  /**
   * HASH: One-way cryptographic hash (SHA-256)
   * Allows matching without revealing original value
   */
  HASH = 'HASH',
  
  /**
   * KEEP_YEAR: For dates, keep only year (e.g., 1990-03-15 → 1990)
   * Useful for date of birth where year may be necessary
   */
  KEEP_YEAR = 'KEEP_YEAR',
  
  /**
   * KEEP_LAST_4: Keep last 4 characters (e.g., credit card)
   * Common for payment card display
   */
  KEEP_LAST_4 = 'KEEP_LAST_4',
  
  /**
   * SKIP: Do not redact (whitelist)
   * For fields that should pass through unchanged
   */
  SKIP = 'SKIP',
}

/**
 * Redaction Rule
 * Defines how a specific field or pattern should be redacted
 */
export interface RedactionRule {
  /**
   * Field name or pattern type
   */
  identifier: PIIField | PIIPattern | string;
  
  /**
   * Redaction mode to apply
   */
  mode: RedactionMode;
  
  /**
   * Optional custom mask pattern
   * For mode = MASK, defines how to mask (e.g., "***")
   */
  maskPattern?: string;
  
  /**
   * Optional reference field
   * For mode = REFERENCE, which field to use (e.g., "user_id")
   */
  referenceField?: string;
  
  /**
   * Description of why this rule exists
   */
  description?: string;
  
  /**
   * Whether this rule is required by HIPAA/compliance
   */
  compliance?: boolean;
}

/**
 * PII Detection Result
 * Result of detecting PII in data
 */
export interface PIIDetectionResult {
  /**
   * Whether PII was detected
   */
  detected: boolean;
  
  /**
   * Field name or pattern that matched
   */
  identifier: string;
  
  /**
   * Type of PII detected (field or pattern)
   */
  type: 'field' | 'pattern';
  
  /**
   * Original value (for internal use, not logged)
   */
  originalValue?: any;
  
  /**
   * Redacted value
   */
  redactedValue: any;
  
  /**
   * Redaction mode applied
   */
  mode: RedactionMode;
}

/**
 * PII Regex Pattern
 * Regular expression for pattern-based detection
 */
export interface PIIRegexPattern {
  /**
   * Pattern type identifier
   */
  type: PIIPattern;
  
  /**
   * Regular expression
   */
  regex: RegExp;
  
  /**
   * Description of pattern
   */
  description: string;
  
  /**
   * Optional validation function
   * For patterns that need additional validation beyond regex (e.g., Luhn algorithm for credit cards)
   */
  validate?: (match: string) => boolean;
  
  /**
   * Default redaction mode for this pattern
   */
  defaultMode: RedactionMode;
}

/**
 * PII Redaction Context
 * Context information for redaction operation
 */
export interface PIIRedactionContext {
  /**
   * Whether to apply pattern-based detection
   * Set to false to skip regex scanning (performance optimization)
   */
  enablePatternDetection?: boolean;
  
  /**
   * Whether to apply field-based detection
   * Set to false to skip field name matching
   */
  enableFieldDetection?: boolean;
  
  /**
   * Custom rules to apply (overrides defaults)
   */
  customRules?: RedactionRule[];
  
  /**
   * Fields to whitelist (never redact)
   */
  whitelist?: string[];
  
  /**
   * Maximum depth for nested object scanning
   * Default: 10 (prevents infinite recursion)
   */
  maxDepth?: number;
  
  /**
   * Whether to preserve entity IDs (user_id, patient_id, etc.)
   * Default: true (keep IDs for audit traceability)
   */
  preserveIds?: boolean;
}

/**
 * PII Redaction Statistics
 * Statistics about redaction operation
 */
export interface PIIRedactionStats {
  /**
   * Total fields processed
   */
  totalFields: number;
  
  /**
   * Fields redacted
   */
  redactedFields: number;
  
  /**
   * Patterns detected and redacted
   */
  patternsDetected: number;
  
  /**
   * Time taken (ms)
   */
  duration?: number;
  
  /**
   * Breakdown by redaction mode
   */
  modeBreakdown: Record<RedactionMode, number>;
}

/**
 * Whitelist Fields
 * Fields that should never be redacted (safe for logging)
 */
export const WHITELIST_FIELDS = [
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
  'date_created',
  'date_updated',
  
  'resource_type',
  'table_name',
  
  'duration',
  'count',
  'total',
  'limit',
  'offset',
  'page',
  'per_page',
  
  'success',
  'error_code',
  
  'role',
  'roles',
  'permissions',
] as const;

/**
 * Default Redaction Configuration
 */
export const DEFAULT_PII_REDACTION_CONFIG: PIIRedactionContext = {
  enablePatternDetection: true,
  enableFieldDetection: true,
  customRules: [],
  whitelist: [...WHITELIST_FIELDS],
  maxDepth: 10,
  preserveIds: true,
};
