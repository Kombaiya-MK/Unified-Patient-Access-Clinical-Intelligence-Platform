/**
 * Responsive Textarea Component
 *
 * Multi-line text input: min-height 96px (~3 lines) on mobile,
 * font-size 16px to prevent iOS auto-zoom. Supports auto-resize.
 *
 * @module Forms/Textarea
 * @task US_044 TASK_003
 */

import React, { forwardRef, useCallback, useRef } from 'react';
import '../../styles/form-responsive.css';

interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onInput'> {
  /** Error state */
  hasError?: boolean;
  /** Auto-resize to content */
  autoResize?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ hasError, autoResize, className = '', ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    const classes = [
      'textarea',
      hasError ? 'textarea--error' : '',
      className,
    ].filter(Boolean).join(' ');

    const setRef = useCallback(
      (node: HTMLTextAreaElement | null) => {
        internalRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        }
      },
      [ref]
    );

    const handleInput = useCallback(() => {
      if (autoResize && internalRef.current) {
        internalRef.current.style.height = 'auto';
        internalRef.current.style.height = `${internalRef.current.scrollHeight}px`;
      }
    }, [autoResize]);

    return (
      <textarea
        ref={setRef}
        className={classes}
        aria-invalid={hasError || undefined}
        onInput={handleInput}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
