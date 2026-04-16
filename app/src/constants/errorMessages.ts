/**
 * Error Message Constants
 * 
 * Centralized error messages for consistent user feedback across the application.
 * Organized by category for easy maintenance and i18n preparation.
 * 
 * @module errorMessages
 * @created 2026-03-18
 * @task US_012 TASK_002
 */

/**
 * Validation error messages
 * Field-level validation errors displayed inline
 */
export const VALIDATION_ERRORS = {
  // Email validation
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Email must include @ and domain (e.g., user@example.com)',
  EMAIL_TOO_LONG: 'Email must be less than 255 characters',
  
  // Password validation
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
  PASSWORD_TOO_LONG: 'Password must be less than 128 characters',
  PASSWORD_WEAK: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  PASSWORD_MISMATCH: 'Passwords must match',
  
  // Name validation
  NAME_REQUIRED: 'Name is required',
  FIRST_NAME_REQUIRED: 'First name is required',
  LAST_NAME_REQUIRED: 'Last name is required',
  
  // Phone validation
  PHONE_REQUIRED: 'Phone number is required',
  PHONE_INVALID: 'Phone must be 10 digits',
  PHONE_INTERNATIONAL_INVALID: 'Please enter a valid international phone number',
  
  // Date validation
  DATE_REQUIRED: 'Date is required',
  DATE_INVALID: 'Please enter a valid date',
  DATE_PAST: 'Date cannot be in the future',
  DATE_FUTURE: 'Appointment date must be in the future',
  DATE_AGE_18: 'Patient must be 18 or older',
  DOB_REQUIRED: 'Date of birth is required',
  
  // Insurance validation
  INSURANCE_ID_REQUIRED: 'Insurance member ID is required',
  INSURANCE_ID_INVALID: 'Invalid member ID format',
  INSURANCE_ID_TOO_SHORT: 'Member ID must be at least 6 characters',
  INSURANCE_ID_TOO_LONG: 'Member ID must be less than 15 characters',

  // Async validation
  ASYNC_VALIDATION_FAILED: 'Unable to validate - check connection',
  USERNAME_TAKEN: 'Username is already taken',

  // General validation
  REQUIRED_FIELD: 'This field is required',
  INVALID_INPUT: 'Please check your input and try again',
} as const;

/**
 * Authentication error messages
 * API-level authentication errors
 */
export const AUTH_ERRORS = {
  // Login errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_LOCKED: 'Your account has been locked due to too many failed login attempts. Please try again later.',
  ACCOUNT_DISABLED: 'Your account has been disabled. Please contact support.',
  ACCOUNT_NOT_VERIFIED: 'Please verify your email address before logging in.',
  
  // Session errors
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  UNAUTHORIZED: 'You are not authorized to access this resource.',
  TOKEN_INVALID: 'Your authentication token is invalid. Please log in again.',
  
  // Password reset errors
  RESET_TOKEN_INVALID: 'This password reset link is invalid or has expired.',
  RESET_TOKEN_EXPIRED: 'This password reset link has expired. Please request a new one.',
} as const;

/**
 * Network error messages
 * Connection and timeout errors
 */
export const NETWORK_ERRORS = {
  // Connection errors
  NO_CONNECTION: 'No internet connection. Please check your network and try again.',
  CONNECTION_FAILED: 'Could not connect to the server. Please try again.',
  REQUEST_TIMEOUT: 'Request timed out. Please check your connection and try again.',
  
  // Server errors
  SERVER_ERROR: 'An error occurred on the server. Please try again later.',
  SERVER_UNAVAILABLE: 'Service temporarily unavailable. Please try again.',
  MAINTENANCE: 'The system is currently undergoing maintenance. Please try again later.',
  
  // Rate limiting
  TOO_MANY_REQUESTS: 'Too many requests. Please wait a moment and try again.',
} as const;

/**
 * Generic error messages
 * Fallback and unexpected errors
 */
export const GENERIC_ERRORS = {
  UNEXPECTED: 'An unexpected error occurred. Please try again.',
  SOMETHING_WRONG: 'Something went wrong. Please try again.',
  PLEASE_TRY_AGAIN: 'Please try again',
  CONTACT_SUPPORT: 'If the problem persists, please contact support.',
} as const;

/**
 * Success messages
 * Positive feedback messages
 */
export const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: 'Successfully logged in',
  LOGOUT_SUCCESS: 'Successfully logged out',
  PASSWORD_RESET_SENT: 'Password reset instructions have been sent to your email',
  PASSWORD_RESET_SUCCESS: 'Your password has been successfully reset',
  
  // Account
  ACCOUNT_CREATED: 'Your account has been created successfully',
  EMAIL_VERIFIED: 'Your email has been verified successfully',
  PROFILE_UPDATED: 'Your profile has been updated successfully',
} as const;

/**
 * Action prompts
 * Call-to-action messages for error recovery
 */
export const ACTION_PROMPTS = {
  RETRY: 'Retry',
  TRY_AGAIN: 'Try Again',
  GO_BACK: 'Go Back',
  GO_HOME: 'Go to Home',
  CONTACT_SUPPORT: 'Contact Support',
  REFRESH_PAGE: 'Refresh Page',
} as const;

/**
 * Get error message by type
 * Helper function to retrieve error messages with fallback
 * 
 * @param category - Error category (validation, auth, network, generic)
 * @param key - Error key within category
 * @returns Error message string
 */
export function getErrorMessage(
  category: 'validation' | 'auth' | 'network' | 'generic',
  key: string
): string {
  const errorMaps = {
    validation: VALIDATION_ERRORS,
    auth: AUTH_ERRORS,
    network: NETWORK_ERRORS,
    generic: GENERIC_ERRORS,
  };
  
  const errorMap = errorMaps[category];
  const errorKey = key.toUpperCase().replace(/\s+/g, '_') as keyof typeof errorMap;
  
  return (errorMap[errorKey] as string) || GENERIC_ERRORS.UNEXPECTED;
}

/**
 * Map HTTP status codes to error messages
 * 
 * @param statusCode - HTTP status code
 * @param customMessage - Optional custom message from API response
 * @returns User-friendly error message
 */
export function getErrorMessageByStatus(statusCode: number, customMessage?: string): string {
  if (customMessage) return customMessage;
  
  switch (statusCode) {
    case 400:
      return GENERIC_ERRORS.SOMETHING_WRONG;
    case 401:
      return AUTH_ERRORS.INVALID_CREDENTIALS;
    case 403:
      return AUTH_ERRORS.UNAUTHORIZED;
    case 404:
      return GENERIC_ERRORS.SOMETHING_WRONG;
    case 408:
      return NETWORK_ERRORS.REQUEST_TIMEOUT;
    case 429:
      return NETWORK_ERRORS.TOO_MANY_REQUESTS;
    case 500:
    case 502:
    case 503:
      return NETWORK_ERRORS.SERVER_UNAVAILABLE;
    case 504:
      return NETWORK_ERRORS.REQUEST_TIMEOUT;
    default:
      return GENERIC_ERRORS.UNEXPECTED;
  }
}
