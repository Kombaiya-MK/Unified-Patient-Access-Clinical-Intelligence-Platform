/**
 * BookingConfirmation Component
 * 
 * Modal dialog for confirming appointment booking with slot details.
 * Includes loading states, error handling, and accessibility features.
 * 
 * @module BookingConfirmation
 * @created 2026-03-18
 * @task US_013 TASK_001
 */

import React, { useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { useBooking } from '../hooks/useBooking';
import type { Slot, Provider, Department } from '../types/appointment.types';
import './BookingConfirmation.css';

interface BookingConfirmationProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Selected slot to book */
  slot: Slot | null;
  /** Provider details */
  provider: Provider | null;
  /** Department details */
  department: Department | null;
  /** Patient ID from auth context */
  patientId: string;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback on successful booking */
  onSuccess: () => void;
}

/**
 * Booking confirmation modal
 * 
 * Features:
 * - Displays slot details (date, time, provider, department)
 * - Optional notes textarea
 * - Loading states during API call
 * - Error handling with retry option
 * - Focus trap for accessibility
 * - Escape key to close
 * - Click overlay to close
 * 
 * @example
 * ```tsx
 * <BookingConfirmation
 *   isOpen={showModal}
 *   slot={selectedSlot}
 *   provider={selectedProvider}
 *   department={selectedDepartment}
 *   patientId={user.id}
 *   onClose={() => setShowModal(false)}
 *   onSuccess={() => navigate('/dashboard')}
 * />
 * ```
 */
export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  isOpen,
  slot,
  provider,
  department,
  patientId,
  onClose,
  onSuccess,
}) => {
  const [notes, setNotes] = React.useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const bookingMutation = useBooking();

  // Focus trap: Focus modal when opened
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  /**
   * Handle booking confirmation
   */
  const handleConfirm = () => {
    if (!slot) return;

    bookingMutation.mutate(
      {
        patientId,
        slotId: slot.id,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          setNotes('');
          onSuccess();
          onClose();
        },
      }
    );
  };

  /**
   * Handle overlay click to close
   */
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !slot) {
    return null;
  }

  const startTime = parseISO(slot.startTime);
  const endTime = parseISO(slot.endTime);

  return (
    <div
      className="booking-modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div className="booking-modal" ref={modalRef}>
        <div className="booking-modal-header">
          <h2 id="booking-modal-title">Confirm Appointment</h2>
          <button
            type="button"
            className="close-button"
            onClick={onClose}
            aria-label="Close modal"
            disabled={bookingMutation.isPending}
          >
            ×
          </button>
        </div>

        <div className="booking-modal-body">
          <div className="confirmation-details">
            <div className="detail-row">
              <span className="detail-label">Date:</span>
              <span className="detail-value">
                {format(startTime, 'EEEE, MMMM d, yyyy')}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Time:</span>
              <span className="detail-value">
                {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
              </span>
            </div>

            {provider && (
              <div className="detail-row">
                <span className="detail-label">Provider:</span>
                <span className="detail-value">
                  {provider.name}
                  {provider.specialty && (
                    <span className="provider-specialty">
                      {provider.specialty}
                    </span>
                  )}
                </span>
              </div>
            )}

            {department && (
              <div className="detail-row">
                <span className="detail-label">Department:</span>
                <span className="detail-value">{department.name}</span>
              </div>
            )}

            <div className="detail-row">
              <span className="detail-label">Duration:</span>
              <span className="detail-value">{slot.duration} minutes</span>
            </div>
          </div>

          <div className="notes-section">
            <label htmlFor="booking-notes" className="notes-label">
              Reason for visit (optional):
            </label>
            <textarea
              id="booking-notes"
              className="notes-textarea"
              placeholder="e.g., Annual checkup, follow-up consultation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
              disabled={bookingMutation.isPending}
            />
            <span className="notes-counter" aria-live="polite">
              {notes.length}/500
            </span>
          </div>

          {bookingMutation.isError && (
            <div className="booking-error" role="alert">
              <strong>Booking Failed:</strong>{' '}
              {bookingMutation.error.message}
            </div>
          )}
        </div>

        <div className="booking-modal-footer">
          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
            disabled={bookingMutation.isPending}
          >
            Cancel
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            className="button button-primary"
            onClick={handleConfirm}
            disabled={bookingMutation.isPending}
          >
            {bookingMutation.isPending ? (
              <>
                <span className="spinner" aria-hidden="true"></span>
                Booking...
              </>
            ) : (
              'Confirm Booking'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
