/**
 * Form Validators
 * 
 * Yup validation schemas for form inputs with detailed error messages
 * and regex patterns for email, password, and other field validations.
 * 
 * @module validators
 * @created 2026-03-18
 * @task US_012 TASK_001
 */

import * as Yup from 'yup';

/**
 * Email regex pattern (RFC 5322 simplified)
 * Validates: user@domain.com, user.name@sub.domain.co.uk
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Password strength regex (requires uppercase, lowercase, number, special char)
 */
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+={}[\]|\\:;"'<>,.?/~`])/;

/**
 * Password strength levels
 */
export type PasswordStrength = 'Weak' | 'Medium' | 'Strong';

/**
 * Calculate password strength based on length and character diversity
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password || password.length < 8) return 'Weak';
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const classes = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
  if (password.length >= 16 && classes === 4) return 'Strong';
  if (password.length >= 12 && classes >= 3) return 'Medium';
  if (classes >= 4) return 'Medium';
  return 'Weak';
}

/**
 * Login form validation schema
 * 
 * Requirements:
 * - Email: required, valid email format
 * - Password: required, minimum 8 characters
 * - RememberMe: optional boolean
 */
export const loginSchema = Yup.object().shape({
  email: Yup.string()
    .required('Email is required')
    .matches(EMAIL_REGEX, 'Email must include @ and domain (e.g., user@example.com)')
    .max(255, 'Email must be less than 255 characters'),
  
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),
  
  rememberMe: Yup.boolean()
    .default(false),
});

/**
 * Forgot password form validation schema
 * 
 * Requirements:
 * - Email: required, valid email format
 */
export const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .required('Email is required')
    .matches(EMAIL_REGEX, 'Email must include @ and domain (e.g., user@example.com)')
    .max(255, 'Email must be less than 255 characters'),
});

/**
 * Reset password form validation schema
 * 
 * Requirements:
 * - Password: required, minimum 8 characters, must match confirmation
 * - PasswordConfirm: required, must match password
 */
export const resetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .matches(
      STRONG_PASSWORD_REGEX,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  
  passwordConfirm: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords must match'),
});

/**
 * Enhanced email schema (standalone, reusable)
 */
export const emailSchema = Yup.string()
  .required('Email is required')
  .matches(EMAIL_REGEX, 'Email must include @ and domain (e.g., user@example.com)')
  .max(255, 'Email must be less than 255 characters');

/**
 * Enhanced password schema (standalone, reusable)
 * Requires: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
 */
export const strongPasswordSchema = Yup.string()
  .required('Password is required')
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .matches(
    STRONG_PASSWORD_REGEX,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

/**
 * Required field schema (trims whitespace)
 */
export const requiredStringSchema = (fieldName: string) =>
  Yup.string()
    .trim()
    .required(`${fieldName} is required`)
    .min(1, `${fieldName} is required`);

/**
 * Character-limited text schema
 */
export const characterLimitSchema = (fieldName: string, maxLength: number) =>
  Yup.string()
    .max(maxLength, `${fieldName} must be ${maxLength} characters or fewer`);

/**
 * Re-export sub-module validators for single import
 */
export { phoneSchema, usPhoneSchema, internationalPhoneSchema, formatPhoneNumber } from './validators/phoneValidator';
export { dobSchema, appointmentDateSchema, isPastDate, isFutureDate, isAgeAbove18, calculateAge } from './validators/dateValidator';
export { insuranceMemberIDSchema, createInsuranceMemberIDSchema, validateInsuranceMemberID, getSupportedProviders } from './validators/customValidators';
export type { InsuranceProvider } from './validators/customValidators';

/**
 * Type definitions for validated form values
 */
export type LoginFormValues = Yup.InferType<typeof loginSchema>;
export type ForgotPasswordFormValues = Yup.InferType<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = Yup.InferType<typeof resetPasswordSchema>;
