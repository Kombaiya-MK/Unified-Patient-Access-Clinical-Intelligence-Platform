/**
 * ResponsiveSelect Component
 *
 * Touch-optimized select dropdown wrapping the base Select component.
 * Uses native select on all viewports for optimal mobile UX.
 * Min-height 48px on mobile, font-size 16px to prevent iOS auto-zoom.
 *
 * @module Forms/ResponsiveSelect
 * @task US_044 TASK_003
 */

import React, { forwardRef } from 'react';
import { Select } from './Select';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface ResponsiveSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Error state styling */
  hasError?: boolean;
  /** Options list */
  options: SelectOption[];
  /** Placeholder text */
  placeholder?: string;
  /** Associated label text */
  label?: string;
  /** Error message to display below select */
  errorMessage?: string;
  /** Helper text below select */
  helperText?: string;
}

function getSelectId(id?: string, label?: string) {
  return id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
}

export const ResponsiveSelect = forwardRef<HTMLSelectElement, ResponsiveSelectProps>(
  ({ hasError, options, placeholder, label, errorMessage, helperText, id, className = '', ...props }, ref) => {
    const selectId = getSelectId(id, label);
    const errorId = errorMessage ? `${selectId}-error` : undefined;
    const helperId = helperText ? `${selectId}-helper` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="form-group">
        {label && (
          <label htmlFor={selectId} className="form-group__label">
            {label}
          </label>
        )}
        <Select
          ref={ref}
          id={selectId}
          hasError={hasError || !!errorMessage}
          options={options}
          placeholder={placeholder}
          className={`responsive-select ${className}`}
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

ResponsiveSelect.displayName = 'ResponsiveSelect';
