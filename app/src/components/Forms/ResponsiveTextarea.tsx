/**
 * ResponsiveTextarea Component
 *
 * Touch-optimized textarea wrapping the base Textarea component.
 * Min-height 96px on mobile, font-size 16px to prevent iOS auto-zoom.
 * Supports auto-resize to content height.
 *
 * @module Forms/ResponsiveTextarea
 * @task US_044 TASK_003
 */

import React, { forwardRef } from 'react';
import { Textarea } from './Textarea';

interface ResponsiveTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onInput'> {
  /** Error state styling */
  hasError?: boolean;
  /** Auto-resize to content */
  autoResize?: boolean;
  /** Associated label text */
  label?: string;
  /** Error message to display below textarea */
  errorMessage?: string;
  /** Helper text below textarea */
  helperText?: string;
}

function getTextareaId(id?: string, label?: string) {
  return id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
}

export const ResponsiveTextarea = forwardRef<HTMLTextAreaElement, ResponsiveTextareaProps>(
  ({ hasError, autoResize, label, errorMessage, helperText, id, className = '', ...props }, ref) => {
    const textareaId = getTextareaId(id, label);
    const errorId = errorMessage ? `${textareaId}-error` : undefined;
    const helperId = helperText ? `${textareaId}-helper` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="form-group">
        {label && (
          <label htmlFor={textareaId} className="form-group__label">
            {label}
          </label>
        )}
        <Textarea
          ref={ref}
          id={textareaId}
          hasError={hasError || !!errorMessage}
          autoResize={autoResize}
          className={`responsive-textarea ${className}`}
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

ResponsiveTextarea.displayName = 'ResponsiveTextarea';
