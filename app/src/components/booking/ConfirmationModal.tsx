/**
 * Confirmation Modal Component
 * 
 * Success modal displayed after booking an appointment.
 * Shows appointment details, calendar sync status, and confirmation message.
 * 
 * Features:
 * - Success animation with checkmark
 * - Appointment details display
 * - Calendar sync status (success/warning/failed)
 * - Retry button for failed calendar sync
 * - Focus trap for accessibility
 * - Esc key to close
 * - ARIA labels for screen readers
 * 
 * @module ConfirmationModal
 * @created 2026-03-19
 * @task US_013 TASK_006
 */

import React, { useEffect, useRef } from 'react';
import { useFocusTrap } from '../../utils/focus-management';
import type { Appointment } from '../../types/appointment.types';
import type { CalendarSyncStatus } from '../../hooks/useBookingConfirmation';
import './ConfirmationModal.css';

/**
 * ConfirmationModal Props
 */
export interface ConfirmationModalProps {
  /** Appointment data to display */
  appointment: Appointment | null;
  /** Calendar sync status */
  calendarSyncStatus?: CalendarSyncStatus;
  /** Close modal callback */
  onClose: () => void;
  /** Retry calendar sync callback (optional) */
  onRetrySync?: () => void;
}

/**
 * Format date to readable format
 * @example "March 19, 2026"
 */
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

/**
 * Format time to readable format
 * @example "2:30 PM"
 */
const formatTime = (timeString: string): string => {
  try {
    // timeString format: "14:30:00"
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);
    
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  } catch {
    return timeString;
  }
};

/**
 * Success Icon Component
 */
const SuccessIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

/**
 * Check Icon Component (small)
 */
const CheckIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/**
 * Warning Icon Component
 */
const WarningIcon: React.FC = () => (
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
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

/**
 * Confirmation Modal Component
 * 
 * @example
 * ```tsx
 * <ConfirmationModal
 *   appointment={confirmedAppointment}
 *   calendarSyncStatus={{ attempted: true, success: true }}
 *   onClose={handleCloseModal}
 *   onRetrySync={handleRetrySync}
 * />
 * ```
 */
export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  appointment,
  calendarSyncStatus = { attempted: false, success: false },
  onClose,
  onRetrySync,
}) => {
  const modalRef = useFocusTrap<HTMLDivElement>(!!appointment);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Handle Esc key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!appointment) return null;

  // Extract appointment details
  const {
    id,
    appointmentDate,
    startTime,
    endTime,
  } = appointment;

  const providerName = appointment.providerName || `Provider #${appointment.providerId}`;
  const departmentName = appointment.departmentName || `Department #${appointment.departmentId}`;

  return (
    <div
      className="confirmation-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div
        ref={modalRef}
        className="confirmation-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="confirmation-modal-header">
          <SuccessIcon className="success-icon" />
          <h2 id="modal-title">Appointment Booked Successfully!</h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="close-btn"
            aria-label="Close modal"
            type="button"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="confirmation-modal-body">
          {/* Appointment Details */}
          <div id="modal-description" className="appointment-details">
            <div className="detail-row">
              <strong>Date:</strong>
              <span>{formatDate(appointmentDate)}</span>
            </div>
            <div className="detail-row">
              <strong>Time:</strong>
              <span>{startTime ? formatTime(startTime) : '-'}{endTime ? ` - ${formatTime(endTime)}` : ''}</span>
            </div>
            <div className="detail-row">
              <strong>Provider:</strong>
              <span>{providerName}</span>
            </div>
            <div className="detail-row">
              <strong>Department:</strong>
              <span>{departmentName}</span>
            </div>
            <div className="detail-row">
              <strong>Appointment ID:</strong>
              <span className="appointment-id">{id}</span>
            </div>
          </div>

          {/* Calendar Sync Status */}
          {calendarSyncStatus.attempted && (
            <div
              className={`sync-status ${
                calendarSyncStatus.success ? 'sync-success' : 'sync-warning'
              }`}
              role="status"
              aria-live="polite"
            >
              {calendarSyncStatus.success ? (
                <>
                  <CheckIcon />
                  <span>Calendar synced successfully</span>
                </>
              ) : (
                <>
                  <WarningIcon />
                  <span>
                    {calendarSyncStatus.error || 'Calendar sync failed - add manually'}
                  </span>
                  {onRetrySync && (
                    <button
                      onClick={onRetrySync}
                      className="retry-btn"
                      type="button"
                      aria-label="Retry calendar sync"
                    >
                      Retry
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Confirmation Note */}
          <p className="confirmation-note">
            A confirmation email with PDF has been sent to your registered email address.
          </p>
        </div>

        {/* Footer */}
        <div className="confirmation-modal-footer">
          <button
            onClick={onClose}
            className="btn-primary"
            type="button"
          >
            View Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
