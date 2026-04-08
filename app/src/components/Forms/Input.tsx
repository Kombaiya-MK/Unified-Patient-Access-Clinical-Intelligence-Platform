/**
 * Responsive Input Component
 *
 * Touch-optimized text input: min-height 48px mobile, 40px desktop.
 * Uses font-size 16px on mobile to prevent iOS auto-zoom on focus.
 *
 * @module Forms/Input
 * @task US_044 TASK_003
 */

import React, { forwardRef } from 'react';
import '../../styles/form-responsive.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Error state */
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ hasError, className = '', ...props }, ref) => {
    const classes = [
      'input',
      hasError ? 'input--error' : '',
      className,
    ].filter(Boolean).join(' ');

    return (
      <input
        ref={ref}
        className={classes}
        aria-invalid={hasError || undefined}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
