/**
 * LoadingSpinner Component
 * 
 * Reusable loading spinner component with multiple size variants.
 * Accessible with proper ARIA labels for screen readers.
 * 
 * Features:
 * - Multiple size variants (small, medium, large)
 * - Customizable color
 * - Accessible with aria-label
 * - Smooth animation
 * - Overlay mode for full-page loading
 * 
 * @module LoadingSpinner
 * @created 2026-03-18
 * @task US_012 TASK_002
 */

import './LoadingSpinner.css';

/**
 * Spinner size variants
 */
export type SpinnerSize = 'small' | 'medium' | 'large';

/**
 * LoadingSpinner props
 */
export interface LoadingSpinnerProps {
  /** Size variant (default: 'medium') */
  size?: SpinnerSize;
  /** Optional custom CSS class */
  className?: string;
  /** Accessible label for screen readers */
  label?: string;
  /** Whether to show as full-page overlay (default: false) */
  overlay?: boolean;
  /** Optional loading message text */
  message?: string;
  /** Optional test ID for testing */
  testId?: string;
}

/**
 * LoadingSpinner Component
 * 
 * Displays an animated loading spinner with accessibility support.
 * Can be used inline or as a full-page overlay.
 * 
 * @example
 * // Inline spinner
 * <LoadingSpinner size="small" label="Loading data" />
 * 
 * @example
 * // Full-page overlay
 * <LoadingSpinner 
 *   size="large"
 *   overlay={true}
 *   message="Please wait..."
 * />
 */
export function LoadingSpinner({
  size = 'medium',
  className = '',
  label = 'Loading...',
  overlay = false,
  message,
  testId,
}: LoadingSpinnerProps) {
  const spinnerClass = `loading-spinner loading-spinner--${size} ${className}`.trim();

  const spinner = (
    <div
      className={spinnerClass}
      role="status"
      aria-label={label}
      aria-live="polite"
      data-testid={testId}
    >
      <svg
        className="loading-spinner__svg"
        viewBox="0 0 50 50"
        aria-hidden="true"
      >
        <circle
          className="loading-spinner__circle"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
        />
      </svg>
      <span className="loading-spinner__sr-only">{label}</span>
    </div>
  );

  if (overlay) {
    return (
      <div className="loading-overlay" data-testid={testId && `${testId}-overlay`}>
        <div className="loading-overlay__content">
          {spinner}
          {message && <p className="loading-overlay__message">{message}</p>}
        </div>
      </div>
    );
  }

  return spinner;
}

/**
 * ButtonSpinner Component
 * 
 * Small spinner variant designed for use inside buttons.
 * Replaces button text during loading state.
 * 
 * @example
 * <button disabled={loading}>
 *   {loading ? <ButtonSpinner /> : 'Submit'}
 * </button>
 */
export interface ButtonSpinnerProps {
  /** Optional custom CSS class */
  className?: string;
  /** Accessible label (default: 'Loading') */
  label?: string;
  /** Optional test ID */
  testId?: string;
}

export function ButtonSpinner({ className = '', label = 'Loading', testId }: ButtonSpinnerProps) {
  return (
    <span
      className={`button-spinner ${className}`.trim()}
      role="status"
      aria-label={label}
      aria-live="polite"
      data-testid={testId}
    >
      <svg
        className="button-spinner__svg"
        width="20"
        height="20"
        viewBox="0 0 50 50"
        aria-hidden="true"
      >
        <circle
          className="button-spinner__circle"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="5"
        />
      </svg>
      <span className="button-spinner__sr-only">{label}</span>
    </span>
  );
}
