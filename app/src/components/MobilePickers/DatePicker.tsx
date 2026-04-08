/**
 * Mobile DatePicker Component
 *
 * Renders a native <input type="date"> on mobile for iOS/Android
 * native picker integration. Falls through to the same native input
 * on desktop (browsers provide their own calendar UI).
 *
 * @module MobilePickers/DatePicker
 * @task US_044 TASK_007
 */

import React, { forwardRef } from 'react';
import '../../styles/touch-interactions.css';

interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Field label */
  label?: string;
  /** Error state */
  hasError?: boolean;
  /** Minimum selectable date (ISO yyyy-mm-dd) */
  min?: string;
  /** Maximum selectable date (ISO yyyy-mm-dd) */
  max?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, hasError, className = '', id, ...props }, ref) => {
    const inputId = id ?? `datepicker-${label?.toLowerCase().replace(/\s+/g, '-') ?? 'date'}`;
    const classes = [
      'mobile-picker__input',
      hasError ? 'mobile-picker__input--error' : '',
      className,
    ].filter(Boolean).join(' ');

    return (
      <div className="mobile-picker">
        {label && (
          <label className="mobile-picker__label" htmlFor={inputId}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type="date"
          className={classes}
          aria-invalid={hasError || undefined}
          {...props}
        />
      </div>
    );
  },
);

DatePicker.displayName = 'DatePicker';
