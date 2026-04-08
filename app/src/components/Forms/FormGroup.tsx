/**
 * FormGroup Component
 *
 * Responsive form field wrapper: label above input on mobile,
 * error message below input. Handles required indicator and helper text.
 *
 * @module Forms/FormGroup
 * @task US_044 TASK_003
 */

import React from 'react';
import '../../styles/form-responsive.css';

interface FormGroupProps {
  /** Field label */
  label: string;
  /** HTML for attribute - links label to input */
  htmlFor?: string;
  /** Mark as required */
  required?: boolean;
  /** Error message */
  error?: string;
  /** Helper text shown below input */
  helperText?: string;
  /** Additional CSS classes */
  className?: string;
  /** Child input element */
  children: React.ReactNode;
}

export const FormGroup: React.FC<FormGroupProps> = ({
  label,
  htmlFor,
  required,
  error,
  helperText,
  className = '',
  children,
}) => {
  return (
    <div className={`form-group ${className}`}>
      <label
        htmlFor={htmlFor}
        className={`form-group__label${required ? ' form-group__label--required' : ''}`}
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="form-group__error" role="alert">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      )}
      {!error && helperText && (
        <p className="form-group__helper">{helperText}</p>
      )}
    </div>
  );
};
