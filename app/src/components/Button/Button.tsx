/**
 * Responsive Button Component
 *
 * Touch-optimized button: min-height 44px, full-width on mobile option.
 * Variants: primary, secondary, tertiary, ghost, destructive.
 * Sizes: sm (32px), md (40px default), lg (48px).
 *
 * @module Button/Button
 * @task US_044 TASK_003
 */

import React, { forwardRef } from 'react';
import '../../styles/form-responsive.css';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size */
  size?: ButtonSize;
  /** Full width on mobile, auto on desktop */
  fullWidthMobile?: boolean;
  /** Show loading spinner */
  loading?: boolean;
  /** Icon element (left of text) */
  icon?: React.ReactNode;
}

function buildButtonClasses(
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidthMobile: boolean,
  loading: boolean,
  className: string
): string {
  return [
    'btn-responsive',
    `btn-responsive--${variant}`,
    size !== 'md' ? `btn-responsive--${size}` : '',
    fullWidthMobile ? 'btn-responsive--full-width-mobile' : '',
    loading ? 'btn-responsive--loading' : '',
    className,
  ].filter(Boolean).join(' ');
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidthMobile = false,
      loading = false,
      icon,
      className = '',
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const classes = buildButtonClasses(variant, size, fullWidthMobile, loading, className);

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {icon && <span aria-hidden="true">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
