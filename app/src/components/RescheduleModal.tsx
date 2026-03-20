/**
 * RescheduleModal Component
 * 
 * Modal component for rescheduling appointments with calendar picker,
 * time slot selection, and business rule validation.
 * 
 * Features:
 * - Current appointment details display
 * - Calendar picker with available dates highlighting
 * - Time slot grid for new slot selection
 * - 2-hour minimum notice validation
 * - Max 3 reschedules enforcement
 * - Same slot prevention
 * - Optimistic UI updates
 * - Error handling with user-friendly messages
 * 
 * @module RescheduleModal
 * @created 2026-03-19
 * @task US_014 TASK_001
 */

import React, { useState, useEffect, useMemo } from 'react';
import Modal from 'react-modal';
import { format, parseISO, isAfter, addHours } from 'date-fns';
import { AppointmentCalendar } from './AppointmentCalendar';
import { TimeSlotsGrid } from './TimeSlotsGrid';
import { getSlots, getAvailableDates } from '../services/appointmentService';
import type { Appointment, Slot, SlotFilters } from '../types/appointment.types';
import './RescheduleModal.css';

// Set app element for accessibility
if (process.env.NODE_ENV !== 'test') {
  Modal.setAppElement('#root');
}

interface RescheduleModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Appointment to reschedule */
  appointment: Appointment | null;
  /** Callback when reschedule is confirmed */
  onConfirm: (newSlotId: string) => void;
  /** Loading state during reschedule  */
  isRescheduling?: boolean;
}

/**
 * Format date to readable format
 * @example "Wednesday, March 19, 2026"
 */
const formatFullDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, 'EEEE, MMMM d, yyyy');
  } catch {
    return dateString;
  }
};

/**
 * Format time to readable format
 * @example "2:30 PM"
 */
const formatTime = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, 'h:mm a');
  } catch {
    return dateString;
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
 * Info Icon Component
 */
const InfoIcon: React.FC = () => (
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
);

/**
 * Reschedule Modal Component
 * 
 * @example
 * ```tsx
 * <RescheduleModal
 *   isOpen={isModalOpen}
 *   onClose={handleClose}
 *   appointment={selectedAppointment}
 *   onConfirm={handleReschedule}
 *   isRescheduling={isLoading}
 * />
 * ```
 */
export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onConfirm,
  isRescheduling = false,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Get current appointment slot for comparison
  const currentSlotId = appointment?.slotId;

  /**
   * Check if appointment can be rescheduled (2-hour minimum notice)
   */
  const canReschedule = useMemo(() => {
    if (!appointment) return false;

    const appointmentTime = parseISO(appointment.appointmentDate);
    const twoHoursFromNow = addHours(new Date(), 2);
    
    return isAfter(appointmentTime, twoHoursFromNow);
  }, [appointment]);

  /**
   * Check reschedule count (max 3 reschedules)
   */
  const rescheduleCount = useMemo(() => {
    // In a real implementation, this would come from the appointment record
    // For now, we'll assume it's stored in appointment metadata
    return (appointment as any)?.rescheduleCount || 0;
  }, [appointment]);

  const hasReachedMaxReschedules = rescheduleCount >= 3;

  /**
   * Load available dates on modal open
   */
  useEffect(() => {
    if (isOpen && appointment) {
      loadAvailableDates();
      
      // Pre-select current appointment date
      if (appointment.appointmentDate) {
        const currentDate = parseISO(appointment.appointmentDate);
        setSelectedDate(currentDate);
      }
    }
  }, [isOpen, appointment]);

  /**
   * Load slots when date is selected
   */
  useEffect(() => {
    if (selectedDate && appointment) {
      loadSlotsForDate(selectedDate);
    }
  }, [selectedDate, appointment]);

  /**
   * Reset state when modal closes
   */
  useEffect(() => {
    if (!isOpen) {
      setSelectedDate(null);
      setSelectedSlot(null);
      setAvailableSlots([]);
      setAvailableDates([]);
      setError(null);
      setValidationError(null);
    }
  }, [isOpen]);

  /**
   * Load available dates for calendar highlighting
   */
  const loadAvailableDates = async () => {
    if (!appointment) return;

    setIsLoadingDates(true);
    setError(null);

    try {
      const filters: SlotFilters = {
        departmentId: appointment.departmentId,
        providerId: appointment.providerId,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(addHours(new Date(), 90 * 24), 'yyyy-MM-dd'), // 3 months
      };

      const dates = await getAvailableDates(filters);
      setAvailableDates(dates);
    } catch (err) {
      setError('Failed to load available dates. Please try again.');
      console.error('Error loading available dates:', err);
    } finally {
      setIsLoadingDates(false);
    }
  };

  /**
   * Load slots for selected date
   */
  const loadSlotsForDate = async (date: Date) => {
    if (!appointment) return;

    setIsLoadingSlots(true);
    setError(null);
    setSelectedSlot(null);

    try {
      const filters: SlotFilters = {
        departmentId: appointment.departmentId,
        providerId: appointment.providerId,
        date: format(date, 'yyyy-MM-dd'),
      };

      const slots = await getSlots(filters);
      setAvailableSlots(slots);
    } catch (err) {
      setError('Failed to load available slots. Please try again.');
      console.error('Error loading slots:', err);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  /**
   * Handle slot selection with validation
   */
  const handleSlotSelect = (slot: Slot) => {
    setValidationError(null);

    // Prevent selecting the same slot as current appointment
    if (slot.id === currentSlotId) {
      setValidationError('This appointment is already scheduled at this time. Please select a different slot.');
      return;
    }

    // Check if slot is in the past or within 2 hours
    const slotTime = parseISO(slot.startTime);
    const twoHoursFromNow = addHours(new Date(), 2);
    
    if (!isAfter(slotTime, twoHoursFromNow)) {
      setValidationError('Cannot reschedule to a slot within 2 hours. Please select a later time.');
      return;
    }

    setSelectedSlot(slot);
  };

  /**
   * Handle reschedule confirmation
   */
  const handleConfirm = () => {
    if (!selectedSlot) {
      setValidationError('Please select a new time slot.');
      return;
    }

    if (!canReschedule) {
      setValidationError('Cannot reschedule within 2 hours of appointment start time. Please call the office.');
      return;
    }

    if (hasReachedMaxReschedules) {
      setValidationError('You have reached the maximum number of reschedules (3) for this appointment. Please call the office.');
      return;
    }

    onConfirm(selectedSlot.id);
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    setValidationError(null);
    onClose();
  };

  // Don't render if no appointment
  if (!appointment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleCancel}
      className="reschedule-modal"
      overlayClassName="reschedule-modal-overlay"
      contentLabel="Reschedule Appointment"
      closeTimeoutMS={200}
    >
      <div className="modal-content">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Reschedule Appointment</h2>
          <button
            onClick={handleCancel}
            className="modal-close-btn"
            type="button"
            aria-label="Close modal"
            disabled={isRescheduling}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Validation Errors */}
        {!canReschedule && (
          <div className="alert alert-error" role="alert">
            <InfoIcon />
            <p>
              <strong>Cannot Reschedule:</strong> You cannot reschedule an appointment within 2 hours of the start time. 
              Please call the office at (555) 123-4567.
            </p>
          </div>
        )}

        {hasReachedMaxReschedules && (
          <div className="alert alert-error" role="alert">
            <InfoIcon />
            <p>
              <strong>Maximum Reschedules Reached:</strong> You have already rescheduled this appointment 3 times. 
              Please call the office at (555) 123-4567.
            </p>
          </div>
        )}

        {validationError && !hasReachedMaxReschedules && !(!canReschedule) && (
          <div className="alert alert-warning" role="alert">
            <InfoIcon />
            <p>{validationError}</p>
          </div>
        )}

        {error && (
          <div className="alert alert-error" role="alert">
            <InfoIcon />
            <p>{error}</p>
            <button
              onClick={() => {
                loadAvailableDates();
                if (selectedDate) loadSlotsForDate(selectedDate);
              }}
              className="btn-link"
              type="button"
            >
              Retry
            </button>
          </div>
        )}

        {/* Current Appointment Details */}
        <div className="current-appointment">
          <h3 className="section-title">Current Appointment</h3>
          <div className="appointment-details">
            <ClockIcon />
            <div>
              <p className="appointment-date">{formatFullDate(appointment.appointmentDate)}</p>
              <p className="appointment-time">{formatTime(appointment.appointmentDate)}</p>
            </div>
          </div>
          {rescheduleCount > 0 && (
            <p className="reschedule-count">
              Rescheduled {rescheduleCount} {rescheduleCount === 1 ? 'time' : 'times'} (max 3)
            </p>
          )}
        </div>

        {/* New Appointment Selection */}
        {canReschedule && !hasReachedMaxReschedules && (
          <>
            <div className="new-appointment-section">
              <h3 className="section-title">Select New Date</h3>
              
              {isLoadingDates ? (
                <div className="loading-container">
                  <div className="spinner" role="status">
                    <span className="sr-only">Loading available dates...</span>
                  </div>
                </div>
              ) : (
                <AppointmentCalendar
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  availableDates={availableDates}
                  minDate={new Date()}
                />
              )}
            </div>

            {selectedDate && (
              <div className="time-slots-section">
                <h3 className="section-title">
                  Select Time on {format(selectedDate, 'MMMM d, yyyy')}
                </h3>
                
                {isLoadingSlots ? (
                  <div className="loading-container">
                    <div className="spinner" role="status">
                      <span className="sr-only">Loading time slots...</span>
                    </div>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="no-slots-message">
                    <p>No available slots for this date. Please select another date.</p>
                  </div>
                ) : (
                  <TimeSlotsGrid
                    slots={availableSlots}
                    selectedSlotId={selectedSlot?.id || null}
                    onSlotSelect={handleSlotSelect}
                    selectedDate={selectedDate}
                  />
                )}
              </div>
            )}
          </>
        )}

        {/* Footer Actions */}
        <div className="modal-footer">
          <button
            onClick={handleCancel}
            className="btn-secondary"
            type="button"
            disabled={isRescheduling}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="btn-primary"
            type="button"
            disabled={
              !selectedSlot ||
              isRescheduling ||
              !canReschedule ||
              hasReachedMaxReschedules
            }
            aria-label="Confirm reschedule"
          >
            {isRescheduling ? (
              <>
                <span className="spinner spinner-small" role="status">
                  <span className="sr-only">Rescheduling...</span>
                </span>
                Rescheduling...
              </>
            ) : (
              'Confirm Reschedule'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default RescheduleModal;
