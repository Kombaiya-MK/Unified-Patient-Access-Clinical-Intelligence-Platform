/**
 * Mobile TimePicker Component
 *
 * Renders a native <input type="time"> for iOS/Android native
 * time picker integration. Ensures 16px font-size to prevent
 * iOS auto-zoom on focus.
 *
 * @module MobilePickers/TimePicker
 * @task US_044 TASK_007
 */

import React, { forwardRef } from 'react';
import '../../styles/touch-interactions.css';

interface TimePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Field label */
  label?: string;
  /** Error state */
  hasError?: boolean;
  /** Step interval in seconds (default: 900 = 15min) */
  step?: number;
}

export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(
  ({ label, hasError, step = 900, className = '', id, ...props }, ref) => {
    const inputId = id ?? `timepicker-${label?.toLowerCase().replace(/\s+/g, '-') ?? 'time'}`;
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
          type="time"
          step={step}
          className={classes}
          aria-invalid={hasError || undefined}
          {...props}
        />
      </div>
    );
  },
);

TimePicker.displayName = 'TimePicker';
