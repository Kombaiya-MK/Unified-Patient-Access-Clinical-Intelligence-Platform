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
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

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
    .matches(EMAIL_REGEX, 'Please enter a valid email address')
    .email('Please enter a valid email address')
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
    .matches(EMAIL_REGEX, 'Please enter a valid email address')
    .email('Please enter a valid email address')
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
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  
  passwordConfirm: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords must match'),
});

/**
 * Type definitions for validated form values
 */
export type LoginFormValues = Yup.InferType<typeof loginSchema>;
export type ForgotPasswordFormValues = Yup.InferType<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = Yup.InferType<typeof resetPasswordSchema>;
