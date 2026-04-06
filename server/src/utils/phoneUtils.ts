/**
 * Phone Number Utilities
 * 
 * Utility functions for normalizing and formatting phone numbers
 * for consistent search and comparison.
 * 
 * @module phoneUtils
 * @created 2026-04-01
 * @task US_023 TASK_001
 */

/**
 * Normalize a phone number by stripping all non-digit characters.
 * 
 * @param phone - Raw phone number input
 * @returns Digits-only phone string
 * 
 * @example
 * normalizePhone('+1 (555) 123-4567') // '15551234567'
 * normalizePhone('555.123.4567')       // '5551234567'
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}
