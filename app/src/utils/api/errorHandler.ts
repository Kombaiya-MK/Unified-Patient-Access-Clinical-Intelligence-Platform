/**
 * API Error Handler Utility
 * 
 * Centralized error handling for API requests with user-friendly message mapping.
 * Handles network errors, timeouts, HTTP status codes, and validation errors.
 * 
 * Features:
 * - Maps API errors to user-friendly messages
 * - Handles network timeouts and connection errors
 * - Extracts validation errors from API responses
 * - Provides retry logic for transient errors
 * - Logs errors for debugging
 * 
 * @module errorHandler
 * @created 2026-03-18
 * @task US_012 TASK_002
 */

import axios, { AxiosError } from 'axios';
import {
  NETWORK_ERRORS,
  GENERIC_ERRORS,
  getErrorMessageByStatus,
} from '../../constants/errorMessages';

/**
 * Structured API error response
 */
export interface ApiError {
  /** User-friendly error message */
  message: string;
  /** HTTP status code (if available) */
  statusCode?: number;
  /** Error code from API (if available) */
  errorCode?: string;
  /** Field-specific validation errors */
  validationErrors?: Record<string, string[]>;
  /** Whether error is retryable */
  retryable: boolean;
  /** Original error object for debugging */
  originalError?: any;
}

/**
 * API error response structure from backend
 */
interface ApiErrorResponse {
  success: false;
  message: string;
  statusCode?: number;
  errorCode?: string;
  errors?: Record<string, string[]>;
}

/**
 * Handle Axios errors and convert to ApiError
 * 
 * @param error - Error from Axios request
 * @returns Structured ApiError object
 */
export function handleApiError(error: unknown): ApiError {
  // Handle Axios errors
  if (axios.isAxiosError(error)) {
    return handleAxiosError(error);
  }

  // Handle generic JavaScript errors
  if (error instanceof Error) {
    return {
      message: error.message || GENERIC_ERRORS.UNEXPECTED,
      retryable: false,
      originalError: error,
    };
  }

  // Handle unknown error types
  return {
    message: GENERIC_ERRORS.UNEXPECTED,
    retryable: false,
    originalError: error,
  };
}

/**
 * Handle Axios-specific errors
 * 
 * @param error - AxiosError object
 * @returns Structured ApiError object
 */
function handleAxiosError(error: AxiosError<ApiErrorResponse>): ApiError {
  // Network timeout (ECONNABORTED)
  if (error.code === 'ECONNABORTED') {
    return {
      message: NETWORK_ERRORS.REQUEST_TIMEOUT,
      statusCode: 408,
      retryable: true,
      originalError: error,
    };
  }

  // Network error (ETIMEDOUT, ENOTFOUND, ECONNREFUSED)
  if (error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return {
      message: NETWORK_ERRORS.NO_CONNECTION,
      retryable: true,
      originalError: error,
    };
  }

  // Server responded with error status
  if (error.response) {
    return handleErrorResponse(error.response.status, error.response.data, error);
  }

  // Request made but no response received (backend unavailable)
  if (error.request) {
    return {
      message: NETWORK_ERRORS.SERVER_UNAVAILABLE,
      statusCode: 503,
      retryable: true,
      originalError: error,
    };
  }

  // Error in request configuration
  return {
    message: GENERIC_ERRORS.UNEXPECTED,
    retryable: false,
    originalError: error,
  };
}

/**
 * Handle HTTP error responses from API
 * 
 * @param statusCode - HTTP status code
 * @param data - Response data from API
 * @param originalError - Original Axios error
 * @returns Structured ApiError object
 */
function handleErrorResponse(
  statusCode: number,
  data: ApiErrorResponse | any,
  originalError: AxiosError
): ApiError {
  // Extract message from API response
  const apiMessage = data?.message || data?.error;

  // Map status code to user-friendly message
  const message = getErrorMessageByStatus(statusCode, apiMessage);

  // Determine if error is retryable
  const retryable = isRetryableStatusCode(statusCode);

  // Extract validation errors if present
  const validationErrors = data?.errors;

  // Extract error code if present
  const errorCode = data?.errorCode || data?.code;

  return {
    message,
    statusCode,
    errorCode,
    validationErrors,
    retryable,
    originalError,
  };
}

/**
 * Check if HTTP status code indicates a retryable error
 * 
 * @param statusCode - HTTP status code
 * @returns True if error is retryable
 */
function isRetryableStatusCode(statusCode: number): boolean {
  // Retryable status codes:
  // - 408: Request Timeout
  // - 429: Too Many Requests
  // - 500: Internal Server Error (transient)
  // - 502: Bad Gateway (transient)
  // - 503: Service Unavailable (transient)
  // - 504: Gateway Timeout
  return [408, 429, 500, 502, 503, 504].includes(statusCode);
}

/**
 * Extract validation errors from API error
 * 
 * @param error - ApiError object
 * @returns Key-value map of field names to error messages
 */
export function extractValidationErrors(error: ApiError): Record<string, string> | null {
  if (!error.validationErrors) return null;

  const errors: Record<string, string> = {};

  // Convert array of errors per field to single string
  for (const [field, messages] of Object.entries(error.validationErrors)) {
    errors[field] = messages[0]; // Take first error message
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * Log error to console (and optionally to external service)
 * 
 * @param error - ApiError object
 * @param context - Additional context for debugging
 */
export function logError(error: ApiError, context?: Record<string, any>): void {
  if (import.meta.env.DEV) {
    console.error('[API Error]', {
      message: error.message,
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      retryable: error.retryable,
      validationErrors: error.validationErrors,
      context,
      originalError: error.originalError,
    });
  }

  // TODO: Send to external error tracking service (Sentry, LogRocket, etc.)
  // if (import.meta.env.PROD) {
  //   Sentry.captureException(error.originalError, { extra: context });
  // }
}

/**
 * Retry API request with exponential backoff
 * 
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param delay - Initial delay in milliseconds (default: 1000)
 * @returns Promise that resolves with function result or rejects with final error
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = handleApiError(error);

      // Don't retry if error is not retryable
      if (!lastError.retryable) {
        throw lastError;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Wait with exponential backoff
      const backoffDelay = delay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));

      logError(lastError, { attempt: attempt + 1, nextRetryIn: backoffDelay });
    }
  }

  throw lastError;
}

/**
 * Create AbortController with timeout
 * Useful for implementing request timeouts with axios
 * 
 * @param timeoutMs - Timeout in milliseconds
 * @returns AbortController and timeout ID
 * 
 * @example
 * const { controller, timeoutId } = createAbortController(30000);
 * try {
 *   await axios.get('/api/data', { signal: controller.signal });
 * } finally {
 *   clearTimeout(timeoutId);
 * }
 */
export function createAbortController(timeoutMs: number): {
  controller: AbortController;
  timeoutId: number;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs) as unknown as number;

  return { controller, timeoutId };
}
