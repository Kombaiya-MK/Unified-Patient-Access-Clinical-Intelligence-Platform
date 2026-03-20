/**
 * Appointment Card Component
 * 
 * Reusable card component for displaying appointment details on dashboard.
 * Shows date, time, provider, department, status badge, and action buttons.
 * Integrates RescheduleModal for appointment rescheduling with validation.
 * 
 * Features:
 * - Responsive card layout
 * - Status badge with color coding
 * - Hover effect with shadow
 * - Action buttons (Reschedule, Cancel) with validation
 * - Integrated reschedule modal
 * - Toast notifications for success/error feedback
 * - 2-hour minimum notice enforcement
 * - Max 3 reschedules enforcement
 * - Icon support for visual clarity
 * - Accessible with ARIA labels
 * 
 * @module AppointmentCard
 * @created 2026-03-19
 * @updated 2026-03-19 - Added reschedule modal integration (US_014 TASK_001)
 * @task US_013 TASK_006, US_014 TASK_001
 */

import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import type { Appointment } from '../../types/appointment.types';
import { RescheduleModal } from '../RescheduleModal';
import { Toast } from '../common/Toast';
import type { ToastType } from '../common/Toast';
import { useReschedule } from '../../hooks/useReschedule';
import { useAppointments } from '../../context/AppointmentContext';
import { canReschedule } from '../../utils/dateValidation';
import './AppointmentCard.css';

/**
 * AppointmentCard Props
 */
export interface AppointmentCardProps {
  /** Appointment data to display */
  appointment: Appointment;
  /** Optional callback for cancel action */
  onCancel?: (appointmentId: string) => void;
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
 * Format date to short format
 * @example "Wed, Mar 19"
 */
const formatDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, 'EEE, MMM d');
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
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

/**
 * User Icon Component
 */
const UserIcon: React.FC = () => (
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
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/**
 * Building Icon Component
 */
const BuildingIcon: React.FC = () => (
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
 * Location Icon Component
 */
const LocationIcon: React.FC = () => (
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
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

/**
 * Check Icon Component (for calendar sync indicator)
 */
const CheckIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#10b981"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/**
 * Status badge display mapping
 */
const getStatusConfig = (status: string): { label: string; className: string } => {
  switch (status.toLowerCase()) {
    case 'scheduled':
    case 'confirmed':
      return { label: 'Scheduled', className: 'status-scheduled' };
    case 'completed':
      return { label: 'Completed', className: 'status-completed' };
    case 'cancelled':
      return { label: 'Cancelled', className: 'status-cancelled' };
    case 'no-show':
      return { label: 'No Show', className: 'status-no-show' };
    default:
      return { label: status, className: 'status-default' };
  }
};

/**
 * Appointment Card Component
 * 
 * Displays appointment details with integrated reschedule modal.
 * Validates 2-hour restriction and max reschedules before allowing reschedule.
 * 
 * @example
 * ```tsx
 * <AppointmentCard
 *   appointment={appointment}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onCancel,
}) => {
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  
  const { updateAppointment } = useAppointments();
  const statusConfig = getStatusConfig(appointment.status);
  
  // Validate if appointment can be rescheduled
  const rescheduleValidation = canReschedule(appointment);
  
  // Reschedule mutation with callbacks
  const { mutate: reschedule, isPending: isRescheduling } = useReschedule({
    onSuccess: (data) => {
      // Update appointment in context
      updateAppointment(data.appointment);
      
      // Show success toast
      const newDateTime = formatFullDate(data.appointment.appointmentDate);
      setToast({
        message: `Appointment rescheduled successfully for ${newDateTime}`,
        type: 'success',
      });
      
      // Close modal
      setIsRescheduleModalOpen(false);
    },
    onError: (error) => {
      // Show error toast
      setToast({
        message: error.message,
        type: 'error',
      });
    },
  });
  
  /**
   * Handle reschedule button click
   * Shows error toast if validation fails, opens modal otherwise
   */
  const handleRescheduleClick = () => {
    if (!rescheduleValidation.allowed) {
      setToast({
        message: rescheduleValidation.reason || 'Cannot reschedule this appointment',
        type: 'error',
      });
      return;
    }
    
    setIsRescheduleModalOpen(true);
  };
  
  /**
   * Handle reschedule confirmation from modal
   */
  const handleRescheduleConfirm = (newSlotId: string) => {
    reschedule({
      appointmentId: appointment.id,
      newSlotId,
    });
  };
  
  // Extract appointment details
  const {
    id,
    appointmentDate,
    providerId,
    departmentId,
    status,
  } = appointment as any;

  const startTime = appointmentDate;
  const endTime = (appointment as any).endTime || '';
  const location = (appointment as any).location;
  const rescheduleCount = (appointment as any).rescheduleCount || 0;
  const calendarEventId = (appointment as any).calendarEventId;
  const calendarProvider = (appointment as any).calendarProvider;
  const isSyncedToCalendar = Boolean(calendarEventId && calendarProvider);

  return (
    <>
      <article className="appointment-card" aria-label={`Appointment on ${formatDate(appointmentDate)}`}>
        {/* Card Header */}
        <div className="appointment-card-header">
          <span className="appointment-date">{formatDate(appointmentDate)}</span>
          <span className={`status-badge ${statusConfig.className}`}>
            {statusConfig.label}
          </span>
        </div>

        {/* Card Body */}
        <div className="appointment-card-body">
          {/* Time */}
          <div className="appointment-info-row">
            <ClockIcon />
            <span className="info-text">
              {formatTime(startTime)}
              {endTime && ` - ${formatTime(endTime)}`}
            </span>
          </div>

          {/* Provider */}
          <div className="appointment-info-row">
            <UserIcon />
            <span className="info-text">{providerId || 'Provider Name'}</span>
          </div>

          {/* Department */}
          <div className="appointment-info-row">
            <BuildingIcon />
            <span className="info-text">{departmentId || 'Department'}</span>
          </div>

          {/* Location (if available) */}
          {location && (
            <div className="appointment-info-row">
              <LocationIcon />
              <span className="info-text">{location}</span>
            </div>
          )}
          
          {/* Calendar Sync Indicator */}
          {isSyncedToCalendar && (
            <div className="appointment-info-row calendar-sync-indicator" aria-label={`Synced to ${calendarProvider === 'google' ? 'Google Calendar' : 'Microsoft Outlook'}`}>
              <CheckIcon />
              <span className="info-text sync-status">
                Synced to {calendarProvider === 'google' ? 'Google Calendar' : 'Outlook'}
              </span>
            </div>
          )}
          
          {/* Reschedule count indicator */}
          {rescheduleCount > 0 && (
            <div className="reschedule-count" aria-label={`Rescheduled ${rescheduleCount} time${rescheduleCount > 1 ? 's' : ''}`}>
              <small>Rescheduled: {rescheduleCount}/3</small>
            </div>
          )}
        </div>

        {/* Card Footer */}
        {status.toLowerCase() !== 'cancelled' && status.toLowerCase() !== 'completed' && (
          <div className="appointment-card-footer">
            <button
              onClick={handleRescheduleClick}
              className="btn-secondary btn-card-action"
              type="button"
              aria-label={rescheduleValidation.allowed ? 'Reschedule appointment' : rescheduleValidation.reason}
              disabled={!rescheduleValidation.allowed}
              title={!rescheduleValidation.allowed ? rescheduleValidation.reason : undefined}
            >
              {rescheduleCount >= 3 ? 'Max Reschedules' : 'Reschedule'}
            </button>
            {onCancel && (
              <button
                onClick={() => onCancel(id)}
                className="btn-secondary btn-card-action btn-cancel"
                type="button"
                aria-label="Cancel appointment"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </article>
      
      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        appointment={appointment}
        onConfirm={handleRescheduleConfirm}
        isRescheduling={isRescheduling}
      />
      
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={5000}
        />
      )}
    </>
  );
};

export default AppointmentCard;
