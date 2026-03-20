/**
 * Waitlist Card Component
 * 
 * Reusable card component for displaying waitlist entry details on dashboard.
 * Shows date, time, provider, department, status badge, and cancel button.
 * 
 * Features:
 * - Responsive card layout
 * - Status badge with color coding (waiting, contacted, expired)
 * - Hover effect with shadow
 * - Cancel button with confirmation prompt
 * - Toast notifications for success/error feedback
 * - Icon support for visual clarity
 * - Accessible with ARIA labels
 * - WCAG 2.2 AA compliant
 * 
 * @module WaitlistCard
 * @created 2026-03-19
 * @task US_015 TASK_003
 */

import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import type { WaitlistEntry } from '../../context/WaitlistContext';
import { useWaitlist } from '../../hooks/useWaitlist';
import { Toast } from '../common/Toast';
import type { ToastType } from '../common/Toast';
import './WaitlistCard.css';

/**
 * WaitlistCard Props
 */
export interface WaitlistCardProps {
  /** Waitlist entry data to display */
  entry: WaitlistEntry;
  /** Optional callback after successful cancel */
  onCancelSuccess?: () => void;
}

/**
 * Format date to readable format
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
 * Format full date to readable format
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
const formatTime = (timeString: string | null | undefined): string => {
  if (!timeString) return 'Any time';
  
  try {
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
 * Get status badge class
 */
const getStatusClass = (status: WaitlistEntry['status']): string => {
  const baseClass = 'waitlist-card-status';
  switch (status) {
    case 'waiting':
      return `${baseClass} ${baseClass}--waiting`;
    case 'contacted':
      return `${baseClass} ${baseClass}--contacted`;
    case 'scheduled':
      return `${baseClass} ${baseClass}--scheduled`;
    case 'cancelled':
      return `${baseClass} ${baseClass}--cancelled`;
    case 'expired':
      return `${baseClass} ${baseClass}--expired`;
    default:
      return baseClass;
  }
};

/**
 * Get status label
 */
const getStatusLabel = (status: WaitlistEntry['status']): string => {
  switch (status) {
    case 'waiting':
      return 'On Waitlist';
    case 'contacted':
      return 'Contacted';
    case 'scheduled':
      return 'Scheduled';
    case 'cancelled':
      return 'Cancelled';
    case 'expired':
      return 'Expired';
    default:
      return status;
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
  </svg>
);

/**
 * Waitlist Card Component
 * 
 * @example
 * ```tsx
 * <WaitlistCard
 *   entry={waitlistEntry}
 *   onCancelSuccess={handleRefresh}
 * />
 * ```
 */
export const WaitlistCard: React.FC<WaitlistCardProps> = ({
  entry,
  onCancelSuccess,
}) => {
  const { cancel, loading } = useWaitlist();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  /**
   * Handle cancel button click
   */
  const handleCancelClick = () => {
    setShowConfirmDialog(true);
  };

  /**
   * Confirm waitlist cancellation
   */
  const handleConfirmCancel = async () => {
    setShowConfirmDialog(false);

    const result = await cancel(entry.id);

    if (result.success) {
      setToast({
        message: 'Waitlist entry cancelled successfully',
        type: 'success',
      });
      onCancelSuccess?.();
    } else {
      setToast({
        message: result.error || 'Failed to cancel waitlist entry',
        type: 'error',
      });
    }
  };

  /**
   * Close confirmation dialog
   */
  const handleCancelDialog = () => {
    setShowConfirmDialog(false);
  };

  /**
   * Close toast notification
   */
  const handleCloseToast = () => {
    setToast(null);
  };

  const formattedDate = formatFullDate(entry.requestedDate);
  const timeRange = entry.preferredTimeStart && entry.preferredTimeEnd
    ? `${formatTime(entry.preferredTimeStart)} - ${formatTime(entry.preferredTimeEnd)}`
    : 'Any time';

  const canCancel = entry.status === 'waiting' || entry.status === 'contacted';

  return (
    <>
      <div className="waitlist-card" role="article" aria-label={`Waitlist entry for ${formattedDate}`}>
        <div className="waitlist-card-header">
          <div className="waitlist-card-date">
            <span className="waitlist-card-date-short" aria-hidden="true">
              {formatDate(entry.requestedDate)}
            </span>
            <span className="waitlist-card-date-full" aria-label={`Date: ${formattedDate}`}>
              {formattedDate}
            </span>
          </div>
          <span className={getStatusClass(entry.status)} aria-label={`Status: ${getStatusLabel(entry.status)}`}>
            {getStatusLabel(entry.status)}
          </span>
        </div>

        <div className="waitlist-card-details">
          <div className="waitlist-card-detail">
            <ClockIcon />
            <span>{timeRange}</span>
          </div>

          {entry.providerName && (
            <div className="waitlist-card-detail">
              <UserIcon />
              <span>{entry.providerName}</span>
            </div>
          )}

          <div className="waitlist-card-detail">
            <BuildingIcon />
            <span>{entry.departmentName || 'N/A'}</span>
          </div>

          {entry.priority > 1 && (
            <div className="waitlist-card-priority">
              <span>Priority: {entry.priority}/10</span>
            </div>
          )}
        </div>

        {canCancel && (
          <div className="waitlist-card-actions">
            <button
              className="waitlist-card-button waitlist-card-button-cancel"
              onClick={handleCancelClick}
              disabled={loading}
              aria-label="Cancel waitlist entry"
            >
              Cancel Waitlist
            </button>
          </div>
        )}

        {entry.status === 'contacted' && (
          <div className="waitlist-card-notice">
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
            <span>A slot is available! Check your email for booking details.</span>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="waitlist-card-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="cancel-confirm-title">
          <div className="waitlist-card-dialog">
            <h3 id="cancel-confirm-title">Cancel Waitlist Entry?</h3>
            <p>Are you sure you want to remove yourself from the waitlist for {formattedDate}?</p>
            <div className="waitlist-card-dialog-actions">
              <button
                className="waitlist-card-dialog-button waitlist-card-dialog-button-secondary"
                onClick={handleCancelDialog}
              >
                No, Keep It
              </button>
              <button
                className="waitlist-card-dialog-button waitlist-card-dialog-button-danger"
                onClick={handleConfirmCancel}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={handleCloseToast}
          duration={3000}
        />
      )}
    </>
  );
};

export default WaitlistCard;
