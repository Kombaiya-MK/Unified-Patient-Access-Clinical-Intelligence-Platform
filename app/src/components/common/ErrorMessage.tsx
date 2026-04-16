/**
 * ErrorMessage Component
 * 
 * Reusable component for displaying error messages with consistent styling.
 * Supports inline field errors and global form errors with different variants.
 * 
 * Features:
 * - Error icon with customizable size
 * - Accessible with role="alert" and aria-live
 * - Multiple variants (inline, global)
 * - Support for custom className
 * 
 * @module ErrorMessage
 * @created 2026-03-18
 * @task US_012 TASK_002
 */

import './ErrorMessage.css';

/**
 * Error message variants
 * - inline: Small error below form fields
 * - global: Larger error at form level
 */
export type ErrorVariant = 'inline' | 'global';

/**
 * Error severity level
 * - error: Critical validation failure (red)
 * - warning: Non-blocking advisory (amber)
 */
export type ErrorSeverity = 'error' | 'warning';

/**
 * ErrorMessage props
 */
export interface ErrorMessageProps {
  /** Error message text to display */
  message: string;
  /** Visual variant (inline for field errors, global for form errors) */
  variant?: ErrorVariant;
  /** Severity level controlling color scheme (default: 'error') */
  severity?: ErrorSeverity;
  /** Optional custom CSS class */
  className?: string;
  /** Whether to show error icon (default: true) */
  showIcon?: boolean;
  /** Optional custom icon element (overrides default) */
  icon?: React.ReactNode;
  /** Icon size in pixels (default: 16) */
  iconSize?: number;
  /** ARIA live region politeness (default: 'polite') */
  ariaLive?: 'polite' | 'assertive';
  /** Optional test ID for testing */
  testId?: string;
  /** Optional HTML id (enables aria-describedby linkage) */
  id?: string;
}

/**
 * ErrorMessage Component
 * 
 * Displays error messages with consistent styling and accessibility.
 * Used for form validation errors and API error messages.
 * 
 * @example
 * // Inline field error
 * <ErrorMessage message="Email is required" variant="inline" />
 * 
 * @example
 * // Global form error
 * <ErrorMessage 
 *   message="Invalid credentials"
 *   variant="global"
 *   ariaLive="assertive"
 * />
 */
export function ErrorMessage({
  message,
  variant = 'inline',
  severity = 'error',
  className = '',
  showIcon = true,
  icon,
  iconSize = 16,
  ariaLive = 'polite',
  testId,
  id,
}: ErrorMessageProps) {
  if (!message) return null;

  const errorClass = `error-message error-message--${variant} error-message--${severity} ${className}`.trim();

  const defaultIcon = severity === 'warning' ? (
    <svg
      className="error-message__icon"
      width={iconSize}
      height={iconSize}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8.982 1.566a1.13 1.13 0 0 0-1.964 0L.165 13.233c-.457.778.09 1.767.982 1.767h13.706c.892 0 1.44-.99.982-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
    </svg>
  ) : (
    <svg
      className="error-message__icon"
      width={iconSize}
      height={iconSize}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13H7v-2h2v2zm0-3H7V4h2v6z" />
    </svg>
  );

  return (
    <div
      id={id}
      className={errorClass}
      role={severity === 'error' ? 'alert' : 'status'}
      aria-live={ariaLive}
      data-testid={testId}
    >
      {showIcon && (icon ?? defaultIcon)}
      <span className="error-message__text">{message}</span>
    </div>
  );
}

/**
 * ErrorList Component
 * 
 * Displays multiple error messages in a list format.
 * Useful for showing validation errors for multiple fields.
 * 
 * @example
 * <ErrorList 
 *   errors={['Email is required', 'Password is too short']}
 * />
 */
export interface ErrorListProps {
  /** Array of error messages */
  errors: string[];
  /** Visual variant */
  variant?: ErrorVariant;
  /** Optional custom CSS class */
  className?: string;
  /** Optional test ID for testing */
  testId?: string;
}

export function ErrorList({ errors, variant = 'global', className = '', testId }: ErrorListProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <div
      className={`error-list error-list--${variant} ${className}`.trim()}
      role="alert"
      aria-live="polite"
      data-testid={testId}
    >
      <ul className="error-list__items">
        {errors.map((error, index) => (
          <li key={index} className="error-list__item">
            <ErrorMessage
              message={error}
              variant={variant}
              showIcon={true}
              iconSize={variant === 'global' ? 16 : 14}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
