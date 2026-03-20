/**
 * Form Validation Custom Hook
 * 
 * Encapsulates form validation logic for reuse across multiple forms.
 * Provides helpers for field-level and form-level validation with Yup schemas.
 * 
 * Features:
 * - Field-level validation on blur
 * - Form-level validation on submit
 * - Async validation support
 * - Error state management
 * - Touch tracking
 * - Reset functionality
 * 
 * @module useFormValidation
 * @created 2026-03-18
 * @task US_012 TASK_002
 */

import { useState, useCallback } from 'react';
import * as Yup from 'yup';
import { VALIDATION_ERRORS } from '../constants/errorMessages';

/**
 * Validation error map (field name -> error message)
 */
export type ValidationErrors = Record<string, string>;

/**
 * Touch state map (field name -> touched boolean)
 */
export type TouchedFields = Record<string, boolean>;

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  /** Validation errors (if any) */
  errors: ValidationErrors;
}

/**
 * Hook return value
 */
export interface UseFormValidationReturn {
  /** Current validation errors */
  errors: ValidationErrors;
  /** Touched fields */
  touched: TouchedFields;
  /** Whether form is currently validating */
  isValidating: boolean;
  /** Validate a single field */
  validateField: (name: string, value: any) => Promise<string | null>;
  /** Validate entire form */
  validateForm: (values: Record<string, any>) => Promise<ValidationResult>;
  /** Mark field as touched */
  setFieldTouched: (name: string, touched?: boolean) => void;
  /** Set error for specific field */
  setFieldError: (name: string, error: string | null) => void;
  /** Set multiple errors at once */
  setErrors: (errors: ValidationErrors) => void;
  /** Clear all errors */
  clearErrors: () => void;
  /** Reset validation state */
  reset: () => void;
  /** Get error for field (only if touched) */
  getFieldError: (name: string) => string | null;
  /** Check if field has error */
  hasFieldError: (name: string) => boolean;
}

/**
 * Custom hook for form validation with Yup schemas
 * 
 * @param schema - Yup validation schema
 * @returns Validation helpers and state
 * 
 * @example
 * const {
 *   errors,
 *   touched,
 *   validateField,
 *   validateForm,
 *   setFieldTouched,
 *   getFieldError,
 * } = useFormValidation(loginSchema);
 * 
 * // Validate on blur
 * const handleBlur = async (e) => {
 *   setFieldTouched(e.target.name, true);
 *   await validateField(e.target.name, e.target.value);
 * };
 * 
 * // Validate on submit
 * const handleSubmit = async (values) => {
 *   const result = await validateForm(values);
 *   if (result.isValid) {
 *     // Submit form
 *   }
 * };
 */
export function useFormValidation(
  schema: Yup.ObjectSchema<any>
): UseFormValidationReturn {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [isValidating, setIsValidating] = useState(false);

  /**
   * Validate a single field against schema
   */
  const validateField = useCallback(
    async (name: string, value: any): Promise<string | null> => {
      setIsValidating(true);

      try {
        // Extract field schema from object schema
        await schema.validateAt(name, { [name]: value });

        // Validation passed - clear error
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });

        setIsValidating(false);
        return null;
      } catch (error) {
        if (error instanceof Yup.ValidationError) {
          const errorMessage = error.message;

          // Set error
          setErrors((prev) => ({
            ...prev,
            [name]: errorMessage,
          }));

          setIsValidating(false);
          return errorMessage;
        }

        // Unknown error
        setErrors((prev) => ({
          ...prev,
          [name]: VALIDATION_ERRORS.INVALID_INPUT,
        }));

        setIsValidating(false);
        return VALIDATION_ERRORS.INVALID_INPUT;
      }
    },
    [schema]
  );

  /**
   * Validate entire form against schema
   */
  const validateForm = useCallback(
    async (values: Record<string, any>): Promise<ValidationResult> => {
      setIsValidating(true);

      try {
        // Validate all fields
        await schema.validate(values, { abortEarly: false });

        // Validation passed
        setErrors({});
        setIsValidating(false);

        return {
          isValid: true,
          errors: {},
        };
      } catch (error) {
        if (error instanceof Yup.ValidationError) {
          // Collect all validation errors
          const validationErrors: ValidationErrors = {};

          error.inner.forEach((err) => {
            if (err.path) {
              validationErrors[err.path] = err.message;
            }
          });

          // If no inner errors, use main error
          if (Object.keys(validationErrors).length === 0 && error.path) {
            validationErrors[error.path] = error.message;
          }

          setErrors(validationErrors);
          setIsValidating(false);

          return {
            isValid: false,
            errors: validationErrors,
          };
        }

        // Unknown error
        setIsValidating(false);

        return {
          isValid: false,
          errors: { _form: VALIDATION_ERRORS.INVALID_INPUT },
        };
      }
    },
    [schema]
  );

  /**
   * Mark field as touched
   */
  const setFieldTouched = useCallback((name: string, isTouched = true) => {
    setTouched((prev) => ({
      ...prev,
      [name]: isTouched,
    }));
  }, []);

  /**
   * Set error for specific field
   */
  const setFieldError = useCallback((name: string, error: string | null) => {
    setErrors((prev) => {
      if (error === null) {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      }

      return {
        ...prev,
        [name]: error,
      };
    });
  }, []);

  /**
   * Set multiple errors at once
   */
  const setErrorsCallback = useCallback((newErrors: ValidationErrors) => {
    setErrors(newErrors);
  }, []);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Reset validation state
   */
  const reset = useCallback(() => {
    setErrors({});
    setTouched({});
    setIsValidating(false);
  }, []);

  /**
   * Get error for field (only if touched)
   */
  const getFieldError = useCallback(
    (name: string): string | null => {
      return touched[name] ? errors[name] || null : null;
    },
    [errors, touched]
  );

  /**
   * Check if field has error
   */
  const hasFieldError = useCallback(
    (name: string): boolean => {
      return touched[name] && !!errors[name];
    },
    [errors, touched]
  );

  return {
    errors,
    touched,
    isValidating,
    validateField,
    validateForm,
    setFieldTouched,
    setFieldError,
    setErrors: setErrorsCallback,
    clearErrors,
    reset,
    getFieldError,
    hasFieldError,
  };
}

/**
 * Debounce validation for performance
 * Useful for real-time validation on input change
 * 
 * @param validateFn - Validation function to debounce
 * @param delay - Delay in milliseconds (default: 300)
 * @returns Debounced validation function
 */
export function useDebouncedValidation(
  validateFn: (name: string, value: any) => Promise<string | null>,
  delay = 300
): (name: string, value: any) => void {
  const [timeoutId, setTimeoutId] = useState<number | null>(null);

  return useCallback(
    (name: string, value: any) => {
      // Clear previous timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Set new timeout
      const newTimeoutId = setTimeout(() => {
        validateFn(name, value);
      }, delay) as unknown as number;

      setTimeoutId(newTimeoutId);
    },
    [validateFn, delay, timeoutId]
  );
}
