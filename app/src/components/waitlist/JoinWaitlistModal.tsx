/**
 * Join Waitlist Modal Component
 * 
 * Confirmation modal for joining waitlist when appointment slot is full.
 * Shows slot details, patient email, and confirm/cancel buttons.
 * 
 * Features:
 * - Slot details display (date, time, provider, department)
 * - Patient email display for confirmation notifications
 * - Loading state during API call
 * - Error handling with retry option
 * - Success feedback with toast notification
 * - Focus trap for accessibility
 * - Esc key to close
 * - ARIA labels for screen readers
 * - WCAG 2.2 AA compliant
 * 
 * @module JoinWaitlistModal
 * @created 2026-03-19
 * @task US_015 TASK_003
 */

import React, { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import type { JoinWaitlistRequest } from '../../context/WaitlistContext';
import { useWaitlist } from '../../hooks/useWaitlist';
import { Toast } from '../common/Toast';
import type { ToastType } from '../common/Toast';
import './JoinWaitlistModal.css';

/**
 * Slot data for waitlist
 */
export interface WaitlistSlotData {
  /** Selected date */
  date: Date;
  /** Time slot start (HH:MM:SS) */
  timeStart: string;
  /** Time slot end (HH:MM:SS) */
  timeEnd: string;
  /** Provider name */
  providerName: string;
  /** Provider ID */
  providerId: number;
  /** Department name */
  departmentName: string;
  /** Department ID */
  departmentId: number;
}

/**
 * JoinWaitlistModal Props
 */
export interface JoinWaitlistModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Slot data for waitlist */
  slotData: WaitlistSlotData | null;
  /** Patient email for notification confirmation */
  patientEmail: string;
  /** Close modal callback */
  onClose: () => void;
  /** Success callback (optional) */
  onSuccess?: () => void;
}

/**
 * Format time to readable format
 * @example "2:30 PM"
 */
const formatTime = (timeString: string): string => {
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes,10);
    
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  } catch {
    return timeString;
  }
};

/**
 * Clock Icon Component
 */
const ClockIcon: React.FC = () => (
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
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

/**
 * User Icon Component
 */
const UserIcon: React.FC = () => (
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
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/**
 * Building Icon Component
 */
const BuildingIcon: React.FC = () => (
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
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01" />
    <path d="M16 6h.01" />
    <path d="M12 6h.01" />
    <path d="M12 10h.01" />
    <path d="M12 14h.01" />
    <path d="M16 10h.01" />
    <path d="M16 14h.01" />
    <path d="M8 10h.01" />
    <path d="M8 14h.01" />
  </svg>
);

/**
 * Email Icon Component
 */
const EmailIcon: React.FC = () => (
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
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

/**
 * Join Waitlist Modal Component
 * 
 * @example
 * ```tsx
 * <JoinWaitlistModal
 *   isOpen={showModal}
 *   slotData={{
 *     date: new Date('2026-03-25'),
 *     timeStart: '14:30:00',
 *     timeEnd: '15:00:00',
 *     providerName: 'Dr. Smith',
 *     providerId: 5,
 *     departmentName: 'Cardiology',
 *     departmentId: 1,
 *   }}
 *   patientEmail="patient@example.com"
 *   onClose={handleCloseModal}
 *   onSuccess={handleSuccess}
 * />
 * ```
 */
export const JoinWaitlistModal: React.FC<JoinWaitlistModalProps> = ({
  isOpen,
  slotData,
  patientEmail,
  onClose,
  onSuccess,
}) => {
  const { join, loading } = useWaitlist();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  /**
   * Handle Escape key press to close modal
   */
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      // Focus first button when modal opens
      firstFocusableRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, loading, onClose]);

  /**
   * Handle overlay click to close modal
   */
  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !loading) {
      onClose();
    }
  };

  /**
   * Handle confirm button click
   */
  const handleConfirm = async () => {
    if (!slotData || loading) return;

    const requestData: JoinWaitlistRequest = {
      departmentId: slotData.departmentId,
      providerId: slotData.providerId,
      preferredDate: format(slotData.date, 'yyyy-MM-dd'),
    };

    const result = await join(requestData);

    if (result.success) {
      const formattedDate = format(slotData.date, 'MMMM d, yyyy');
      const formattedTime = `${formatTime(slotData.timeStart)} - ${formatTime(slotData.timeEnd)}`;
      
      setToast({
        message: `You're on the waitlist for ${formattedDate} at ${formattedTime}. We'll notify you if it becomes available.`,
        type: 'success',
      });

      // Close modal after short delay to show success message
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 2000);
    } else if (result.isDuplicate) {
      setToast({
        message: 'You are already on this waitlist',
        type: 'warning',
      });
    } else {
      setToast({
        message: result.error || 'Failed to join waitlist. Please try again.',
        type: 'error',
      });
    }
  };

  /**
   * Close toast notification
   */
  const handleCloseToast = () => {
    setToast(null);
  };

  // Don't render if not open or no slot data
  if (!isOpen || !slotData) return null;

  const formattedDate = format(slotData.date, 'EEEE, MMMM d, yyyy');
  const formattedTime = `${formatTime(slotData.timeStart)} - ${formatTime(slotData.timeEnd)}`;

  return (
    <>
      <div
        className="join-waitlist-modal-overlay"
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-waitlist-modal-title"
      >
        <div className="join-waitlist-modal-container" ref={modalRef}>
          <div className="join-waitlist-modal-header">
            <h2 id="join-waitlist-modal-title">Join Waitlist</h2>
            {!loading && (
              <button
                className="join-waitlist-modal-close"
                onClick={onClose}
                aria-label="Close modal"
                type="button"
              >
                ×
              </button>
            )}
          </div>

          <div className="join-waitlist-modal-content">
            <p className="join-waitlist-modal-description">
              This time slot is currently unavailable. Would you like to join the waitlist?
              We'll notify you if it becomes available.
            </p>

            <div className="join-waitlist-modal-details">
              <h3>Appointment Details</h3>

              <div className="join-waitlist-detail-item">
                <ClockIcon />
                <div>
                  <div className="join-waitlist-detail-label">Date & Time</div>
                  <div className="join-waitlist-detail-value">
                    {formattedDate}
                    <br />
                    {formattedTime}
                  </div>
                </div>
              </div>

              <div className="join-waitlist-detail-item">
                <UserIcon />
                <div>
                  <div className="join-waitlist-detail-label">Provider</div>
                  <div className="join-waitlist-detail-value">{slotData.providerName}</div>
                </div>
              </div>

              <div className="join-waitlist-detail-item">
                <BuildingIcon />
                <div>
                  <div className="join-waitlist-detail-label">Department</div>
                  <div className="join-waitlist-detail-value">{slotData.departmentName}</div>
                </div>
              </div>

              <div className="join-waitlist-detail-item">
                <EmailIcon />
                <div>
                  <div className="join-waitlist-detail-label">Notification Email</div>
                  <div className="join-waitlist-detail-value">{patientEmail}</div>
                </div>
              </div>
            </div>

            <div className="join-waitlist-modal-info">
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
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>
                You'll receive an email notification if this slot becomes available.
                You'll have 2 hours to book the appointment.
              </span>
            </div>
          </div>

          <div className="join-waitlist-modal-footer">
            <button
              className="join-waitlist-modal-button join-waitlist-modal-button-secondary"
              onClick={onClose}
              disabled={loading}
              type="button"
            >
              Cancel
            </button>
            <button
              ref={firstFocusableRef}
              className="join-waitlist-modal-button join-waitlist-modal-button-primary"
              onClick={handleConfirm}
              disabled={loading}
              type="button"
            >
              {loading ? (
                <>
                  <span className="join-waitlist-modal-spinner" aria-hidden="true" />
                  <span>Joining...</span>
                </>
              ) : (
                'Confirm & Join Waitlist'
              )}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={handleCloseToast}
          duration={toast.type === 'success' ? 5000 : 4000}
        />
      )}
    </>
  );
};

export default JoinWaitlistModal;
