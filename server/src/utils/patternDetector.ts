/**
 * Pattern Detector for PII Detection
 * 
 * File: server/src/utils/patternDetector.ts
 * Purpose: Detect PII patterns in strings using regex
 * Task: US_011 TASK_003 - Backend PII Redaction Middleware
 * 
 * Features:
 * - Regex-based detection (SSN, email, phone, credit card)
 * - Pattern validation (Luhn algorithm for credit cards)
 * - String scanning and replacement
 * - HIPAA-compliant pattern matching
 */

import { PIIPattern, RedactionMode } from '../types/pii.types';
import { PATTERN_DETECTION_RULES } from '../config/piiRules';
import logger from './logger';

/**
 * Mask email address
 * Example: john.doe@example.com → j***@example.com
 * 
 * @param email - Email address to mask
 * @returns Masked email address
 */
export function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return '[REDACTED]';
  
  const [localPart, domain] = parts;
  const maskedLocal = localPart[0] + '***';
  
  return `${maskedLocal}@${domain}`;
}

/**
 * Keep last N characters
 * Example: 1234567890 → ******7890 (last 4)
 * 
 * @param value - Value to mask
 * @param keepLast - Number of characters to keep
 * @returns Masked value
 */
export function keepLastN(value: string, keepLast: number = 4): string {
  if (value.length <= keepLast) {
    return '*'.repeat(value.length);
  }
  
  const masked = '*'.repeat(value.length - keepLast);
  const visible = value.slice(-keepLast);
  
  return masked + visible;
}

/**
 * Keep only year from date
 * Example: 1990-03-15 → 1990
 * 
 * @param date - Date string
 * @returns Year only
 */
export function keepYearOnly(date: string): string {
  const match = date.match(/\d{4}/);
  return match ? match[0] : '[REDACTED]';
}

/**
 * Hash string using SHA-256
 * 
 * @param value - Value to hash
 * @returns SHA-256 hash
 */
export function hashValue(value: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Apply redaction mode to a value
 * 
 * @param value - Value to redact
 * @param mode - Redaction mode to apply
 * @param pattern - Pattern type (for special handling)
 * @returns Redacted value
 */
export function applyRedactionMode(
  value: string,
  mode: RedactionMode,
  pattern?: PIIPattern
): string {
  switch (mode) {
    case RedactionMode.MASK:
      // Special handling for emails
      if (pattern === PIIPattern.EMAIL || value.includes('@')) {
        return maskEmail(value);
      }
      // For IP addresses, mask last octet
      if (pattern === PIIPattern.IP_ADDRESS_V4) {
        const parts = value.split('.');
        if (parts.length === 4) {
          return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
        }
      }
      // Default: mask middle characters
      if (value.length <= 3) return '***';
      return value[0] + '***' + value[value.length - 1];
      
    case RedactionMode.REDACT:
      return '[REDACTED]';
      
    case RedactionMode.HASH:
      return hashValue(value);
      
    case RedactionMode.KEEP_LAST_4:
      return keepLastN(value, 4);
      
    case RedactionMode.KEEP_YEAR:
      return keepYearOnly(value);
      
    case RedactionMode.SKIP:
      return value;
      
    default:
      return '[REDACTED]';
  }
}

/**
 * Detect and redact PII patterns in a string
 * 
 * @param text - Text to scan for PII patterns
 * @param enabledPatterns - Array of pattern types to detect (default: all)
 * @returns Text with PII patterns redacted
 */
export function detectAndRedactPatterns(
  text: string,
  enabledPatterns?: PIIPattern[]
): string {
  if (typeof text !== 'string') return text;
  if (!text) return text;
  
  let redactedText = text;
  let detectionCount = 0;
  
  // Get patterns to scan
  const patternsToScan = enabledPatterns
    ? PATTERN_DETECTION_RULES.filter(rule => enabledPatterns.includes(rule.type))
    : PATTERN_DETECTION_RULES;
  
  // Apply each pattern
  for (const rule of patternsToScan) {
    const matches = redactedText.match(rule.regex);
    
    if (matches && matches.length > 0) {
      // Process each match
      for (const match of matches) {
        // Validate match if validator exists
        if (rule.validate && !rule.validate(match)) {
          continue; // Skip invalid matches (e.g., credit card failing Luhn)
        }
        
        // Apply redaction
        const redactedValue = applyRedactionMode(match, rule.defaultMode, rule.type);
        redactedText = redactedText.replace(match, redactedValue);
        detectionCount++;
      }
      
      logger.debug(`Pattern detection: ${rule.type}`, {
        pattern: rule.type,
        matches: matches.length,
        description: rule.description,
      });
    }
  }
  
  if (detectionCount > 0) {
    logger.info(`Detected and redacted ${detectionCount} PII pattern(s) in text`);
  }
  
  return redactedText;
}

/**
 * Validate SSN format
 * 
 * @param ssn - SSN to validate
 * @returns True if valid SSN format
 */
export function validateSSN(ssn: string): boolean {
  // Remove hyphens
  const cleanSSN = ssn.replace(/-/g, '');
  
  // Must be 9 digits
  if (!/^\d{9}$/.test(cleanSSN)) return false;
  
  // Area number (first 3 digits) cannot be 000, 666, or 900-999
  const area = parseInt(cleanSSN.substring(0, 3), 10);
  if (area === 0 || area === 666 || area >= 900) return false;
  
  // Group number (middle 2 digits) cannot be 00
  const group = parseInt(cleanSSN.substring(3, 5), 10);
  if (group === 0) return false;
  
  // Serial number (last 4 digits) cannot be 0000
  const serial = parseInt(cleanSSN.substring(5, 9), 10);
  if (serial === 0) return false;
  
  return true;
}

/**
 * Validate email format (basic)
 * 
 * @param email - Email to validate
 * @returns True if valid email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate US phone number format
 * 
 * @param phone - Phone to validate
 * @returns True if valid US phone format
 */
export function validateUSPhone(phone: string): boolean {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // US phone must be 10 or 11 digits (11 if starts with 1)
  if (cleanPhone.length === 10) return true;
  if (cleanPhone.length === 11 && cleanPhone[0] === '1') return true;
  
  return false;
}

/**
 * Validate credit card using Luhn algorithm
 * 
 * @param cardNumber - Credit card number to validate
 * @returns True if valid credit card number
 */
export function validateCreditCard(cardNumber: string): boolean {
  // Remove all non-digit characters
  const digits = cardNumber.replace(/\D/g, '');
  
  // Credit card must be between 13-19 digits
  if (digits.length < 13 || digits.length > 19) return false;
  
  // Luhn algorithm
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
}

/**
 * Detect specific pattern in text
 * 
 * @param text - Text to scan
 * @param patternType - Type of pattern to detect
 * @returns Array of matches
 */
export function detectPattern(text: string, patternType: PIIPattern): string[] {
  if (typeof text !== 'string') return [];
  
  const rule = PATTERN_DETECTION_RULES.find(r => r.type === patternType);
  if (!rule) return [];
  
  const matches = text.match(rule.regex);
  if (!matches) return [];
  
  // Filter by validator if exists
  if (rule.validate) {
    return matches.filter(match => rule.validate!(match));
  }
  
  return matches;
}

/**
 * Check if text contains any PII patterns
 * 
 * @param text - Text to check
 * @param patterns - Patterns to check for (default: all)
 * @returns True if PII patterns detected
 */
export function containsPIIPatterns(text: string, patterns?: PIIPattern[]): boolean {
  if (typeof text !== 'string') return false;
  if (!text) return false;
  
  const patternsToCheck = patterns || Object.values(PIIPattern);
  
  for (const pattern of patternsToCheck) {
    const matches = detectPattern(text, pattern);
    if (matches.length > 0) return true;
  }
  
  return false;
}

/**
 * Get statistics about detected patterns in text
 * 
 * @param text - Text to analyze
 * @returns Statistics object
 */
export function getPatternStatistics(text: string): Record<PIIPattern, number> {
  const stats: Record<PIIPattern, number> = {} as any;
  
  for (const pattern of Object.values(PIIPattern)) {
    const matches = detectPattern(text, pattern);
    stats[pattern] = matches.length;
  }
  
  return stats;
}

export default {
  detectAndRedactPatterns,
  applyRedactionMode,
  maskEmail,
  keepLastN,
  keepYearOnly,
  hashValue,
  validateSSN,
  validateEmail,
  validateUSPhone,
  validateCreditCard,
  detectPattern,
  containsPIIPatterns,
  getPatternStatistics,
};
