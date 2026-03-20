/**
 * Toast Notification Component
 * 
 * Accessible toast notification for success, error, warning, and info messages.
 * Auto-dismisses after configurable duration with manual dismiss option.
 * 
 * Features:
 * - 4 types: success, error, warning, info
 * - Auto-dismiss with configurable duration (default 5000ms)
 * - Manual dismiss button
 * - Slide-in animation
 * - ARIA live region for screen readers
 * - Keyboard accessible (Esc to dismiss)
 * - Icon indicators for each type
 * 
 * @module Toast
 * @created 2026-03-19
 * @task US_014 TASK_001
 */

import React, { useEffect, useRef } from 'react';
import './Toast.css';

/**
 * Toast notification type
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast component props
 */
export interface ToastProps {
  /** Message to display */
  message: string;
  /** Toast type for color and icon */
  type: ToastType;
  /** Auto-dismiss duration in milliseconds (default: 5000ms, 0 = no auto-dismiss) */
  duration?: number;
  /** Callback when toast is closed */
  onClose: () => void;
  /** Optional test ID */
  'data-testid'?: string;
}

/**
 * Success Icon (Checkmark Circle)
 */
const CheckIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

/**
 * Error Icon (X Circle)
 */
const ErrorIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

/**
 * Warning Icon (Alert Triangle)
 */
const WarningIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

/**
 * Info Icon (Info Circle)
 */
const InfoIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

/**
 * Get icon component for toast type
 */
const getIcon = (type: ToastType): React.ReactElement => {
  switch (type) {
    case 'success':
      return <CheckIcon />;
    case 'error':
      return <ErrorIcon />;
    case 'warning':
      return <WarningIcon />;
    case 'info':
      return <InfoIcon />;
    default:
      return <InfoIcon />;
  }
};

/**
 * Get ARIA role for toast type
 */
const getAriaRole = (type: ToastType): 'status' | 'alert' => {
  return type === 'error' || type === 'warning' ? 'alert' : 'status';
};

/**
 * Toast Component
 * 
 * Displays a notification message with auto-dismiss functionality.
 * Announces to screen readers based on type (alert for errors/warnings, status for success/info).
 * 
 * @example
 * ```tsx
 * const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
 * 
 * // Show toast
 * setToast({ message: 'Appointment rescheduled successfully!', type: 'success' });
 * 
 * // Render toast
 * {toast && (
 *   <Toast
 *     message={toast.message}
 *     type={toast.type}
 *     onClose={() => setToast(null)}
 *     duration={5000}
 *   />
 * )}
 * ```
 */
export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  duration = 5000,
  onClose,
  'data-testid': testId,
}) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Auto-dismiss after duration
   */
  useEffect(() => {
    if (duration > 0) {
      timeoutRef.current = setTimeout(() => {
        onClose();
      }, duration);
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [duration, onClose]);

  /**
   * Handle keyboard events (Esc to dismiss)
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className={`toast toast-${type}`}
      role={getAriaRole(type)}
      aria-live={type === 'error' || type === 'warning' ? 'assertive' : 'polite'}
      aria-atomic="true"
      data-testid={testId || `toast-${type}`}
    >
      <div className="toast-icon">
        {getIcon(type)}
      </div>
      
      <div className="toast-content">
        <span className="toast-message">{message}</span>
      </div>
      
      <button
        onClick={onClose}
        className="toast-close-btn"
        type="button"
        aria-label="Close notification"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
};
