/**
 * Responsive Select Component
 *
 * Touch-optimized dropdown: native select on all viewports with
 * custom chevron icon. Min-height 48px mobile, 40px desktop.
 *
 * @module Forms/Select
 * @task US_044 TASK_003
 */

import React, { forwardRef } from 'react';
import '../../styles/form-responsive.css';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Error state */
  hasError?: boolean;
  /** Options list */
  options: SelectOption[];
  /** Placeholder text */
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ hasError, options, placeholder, className = '', ...props }, ref) => {
    const classes = [
      'select',
      hasError ? 'select--error' : '',
      className,
    ].filter(Boolean).join(' ');

    return (
      <select
        ref={ref}
        className={classes}
        aria-invalid={hasError || undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
);

Select.displayName = 'Select';
