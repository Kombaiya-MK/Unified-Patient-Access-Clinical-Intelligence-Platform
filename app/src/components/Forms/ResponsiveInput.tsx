/**
 * ResponsiveInput Component
 *
 * Touch-optimized text input that wraps the base Input component
 * with additional responsive features: min-height 48px on mobile,
 * font-size 16px to prevent iOS auto-zoom, 12px vertical padding.
 *
 * Integrates with both Formik and React Hook Form via forwardRef.
 *
 * @module Forms/ResponsiveInput
 * @task US_044 TASK_003
 */

import React, { forwardRef } from 'react';
import { Input } from './Input';

interface ResponsiveInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Error state styling */
  hasError?: boolean;
  /** Associated label text (renders visually hidden label if provided) */
  label?: string;
  /** Error message to display below input */
  errorMessage?: string;
  /** Helper text below input */
  helperText?: string;
}

function getInputIds(id?: string, label?: string) {
  return id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
}

export const ResponsiveInput = forwardRef<HTMLInputElement, ResponsiveInputProps>(
  ({ hasError, label, errorMessage, helperText, id, className = '', ...props }, ref) => {
    const inputId = getInputIds(id, label);
    const errorId = errorMessage ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="form-group">
        {label && (
          <label htmlFor={inputId} className="form-group__label">
            {label}
          </label>
        )}
        <Input
          ref={ref}
          id={inputId}
          hasError={hasError || !!errorMessage}
          className={`responsive-input ${className}`}
          aria-describedby={describedBy}
          {...props}
        />
        {errorMessage && (
          <span id={errorId} className="form-group__error" role="alert">
            {errorMessage}
          </span>
        )}
        {helperText && !errorMessage && (
          <span id={helperId} className="form-group__helper">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

ResponsiveInput.displayName = 'ResponsiveInput';
