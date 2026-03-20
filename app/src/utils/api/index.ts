/**
 * API Utilities Barrel Export
 * 
 * Re-exports all API utility functions for easy imports.
 * 
 * @module api
 * @created 2026-03-18
 * @task US_012 TASK_002
 */

export {
  handleApiError,
  extractValidationErrors,
  logError,
  retryWithBackoff,
  createAbortController,
  type ApiError,
} from './errorHandler';
