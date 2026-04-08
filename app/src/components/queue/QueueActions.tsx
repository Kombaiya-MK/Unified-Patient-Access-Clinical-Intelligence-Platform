/**
 * Queue Actions Component
 *
 * Contextual action buttons for queue status transitions.
 * Shows the primary action based on current status, with a
 * secondary "No Show" option available via dropdown.
 * Supports no-show marking with confirmation dialog and
 * undo functionality within a 2-hour window.
 *
 * @module QueueActions
 * @created 2026-03-31
 * @modified 2026-04-01
 * @task US_020 TASK_002, US_024 TASK_003, US_024 TASK_004
 */

import React, { useState } from 'react';
import type { QueueStatus, LeftWithoutSeenReason } from '../../types/queue.types';
import { LeftWithoutSeenModal } from './LeftWithoutSeenModal';
import { NoShowConfirmationModal } from './NoShowConfirmationModal';
import { UndoNoShowModal } from './UndoNoShowModal';
import { useMarkNoShow } from '../../hooks/useMarkNoShow';
import { useUndoNoShow } from '../../hooks/useUndoNoShow';
import { isPastThirtyMinutes, isWithinUndoWindow, getUndoTimeRemaining } from '../../utils/dateUtils';
import './QueueActions.css';

/** Action button configuration per status */
const PRIMARY_ACTIONS: Record<string, { label: string; targetStatus: QueueStatus; variant: string }> = {
  scheduled: { label: 'Mark Arrived', targetStatus: 'arrived', variant: 'queue-action--primary' },
  arrived: { label: 'Start Consultation', targetStatus: 'in_progress', variant: 'queue-action--start' },
  in_progress: { label: 'Mark Completed', targetStatus: 'completed', variant: 'queue-action--complete' },
};

interface QueueActionsProps {
  /** Current appointment status */
  status: QueueStatus;
  /** Appointment ID */
  appointmentId: string;
  /** Current optimistic locking version */
  version: number;
  /** Patient name for aria labels */
  patientName: string;
  /** Whether an update is in progress for this row */
  isUpdating: boolean;
  /** Appointment time (ISO 8601) for no-show eligibility check */
  appointmentTime: string;
  /** Timestamp when no-show was marked (ISO 8601), if applicable */
  noShowMarkedAt?: string | null;
  /** Callback to execute status update */
  onStatusUpdate: (appointmentId: string, newStatus: QueueStatus, version: number) => void;
}

/**
 * Queue action buttons with contextual primary action, no-show dialog, and undo support
 */
export const QueueActions: React.FC<QueueActionsProps> = ({
  status,
  appointmentId,
  version,
  patientName,
  isUpdating,
  appointmentTime,
  noShowMarkedAt,
  onStatusUpdate,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLwbsModal, setShowLwbsModal] = useState(false);
  const [showNoShowModal, setShowNoShowModal] = useState(false);
  const [showUndoModal, setShowUndoModal] = useState(false);

  const {
    markNoShow,
    loading: noShowLoading,
    error: noShowError,
    clearError: clearNoShowError,
  } = useMarkNoShow(appointmentId);

  const {
    undoNoShow,
    loading: undoLoading,
    error: undoError,
    clearError: clearUndoError,
  } = useUndoNoShow(appointmentId);

  const primaryAction = PRIMARY_ACTIONS[status];

  // No-show status: show undo button if within 2-hour window
  if (status === 'no_show') {
    const canUndo = noShowMarkedAt && isWithinUndoWindow(noShowMarkedAt);
    if (!canUndo) {
      return <span className="queue-actions__terminal">—</span>;
    }

    const timeRemaining = noShowMarkedAt ? getUndoTimeRemaining(noShowMarkedAt) : null;

    const handleUndoConfirm = async () => {
      const result = await undoNoShow();
      if (result) {
        setShowUndoModal(false);
        onStatusUpdate(appointmentId, 'arrived', version);
      }
    };

    return (
      <div className="queue-actions" role="group" aria-label={`Actions for ${patientName}`}>
        <button
          className="queue-action-btn queue-action--undo"
          onClick={() => setShowUndoModal(true)}
          disabled={undoLoading}
          title={`Undo no-show (${timeRemaining || 'available for 2 hours'})`}
          aria-label={`Undo no-show for ${patientName}`}
        >
          ↩ Undo {timeRemaining ? `(${timeRemaining})` : ''}
        </button>

        <UndoNoShowModal
          isOpen={showUndoModal}
          onConfirm={handleUndoConfirm}
          onClose={() => { setShowUndoModal(false); clearUndoError(); }}
          isLoading={undoLoading}
          error={undoError}
        />
      </div>
    );
  }

  // Completed status has no actions
  if (status === 'completed') {
    return <span className="queue-actions__terminal">—</span>;
  }

  const isNoShowEligible = isPastThirtyMinutes(appointmentTime);

  const handlePrimary = () => {
    if (primaryAction && !isUpdating) {
      onStatusUpdate(appointmentId, primaryAction.targetStatus, version);
    }
  };

  const handleMarkNoShow = () => {
    setShowDropdown(false);
    clearNoShowError();
    setShowNoShowModal(true);
  };

  const handleNoShowConfirm = async (notes: string, excused: boolean) => {
    const result = await markNoShow(notes || undefined, excused);
    if (result) {
      setShowNoShowModal(false);
      onStatusUpdate(appointmentId, 'no_show', version);
    }
  };

  const handleLeftWithoutSeen = () => {
    setShowDropdown(false);
    setShowLwbsModal(true);
  };

  const handleLwbsConfirm = (_reason: LeftWithoutSeenReason, _notes: string) => {
    onStatusUpdate(appointmentId, 'no_show', version);
    setShowLwbsModal(false);
  };

  return (
    <div className="queue-actions" role="group" aria-label={`Actions for ${patientName}`}>
      {primaryAction && (
        <button
          className={`queue-action-btn ${primaryAction.variant}`}
          onClick={handlePrimary}
          disabled={isUpdating}
          aria-label={`${primaryAction.label} for ${patientName}`}
        >
          {isUpdating ? 'Updating...' : primaryAction.label}
        </button>
      )}

      <div className="queue-actions__more">
        <button
          className="queue-action-btn queue-action--more"
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={isUpdating}
          aria-label={`More actions for ${patientName}`}
          aria-expanded={showDropdown}
          aria-haspopup="true"
        >
          ⋮
        </button>
        {showDropdown && (
          <div className="queue-actions__dropdown" role="menu">
            <button
              className="queue-actions__dropdown-item queue-actions__dropdown-item--danger"
              onClick={handleMarkNoShow}
              disabled={!isNoShowEligible}
              title={isNoShowEligible ? 'Mark as no-show' : 'Available 30 minutes after appointment time'}
              role="menuitem"
            >
              ✕ Mark No-Show
            </button>
            {(status === 'scheduled' || status === 'arrived') && (
              <button
                className="queue-actions__dropdown-item queue-actions__dropdown-item--danger"
                onClick={handleLeftWithoutSeen}
                role="menuitem"
              >
                Left Without Being Seen
              </button>
            )}
          </div>
        )}
      </div>

      <NoShowConfirmationModal
        isOpen={showNoShowModal}
        patientName={patientName}
        onConfirm={handleNoShowConfirm}
        onClose={() => { setShowNoShowModal(false); clearNoShowError(); }}
        isLoading={noShowLoading}
        error={noShowError}
      />

      <LeftWithoutSeenModal
        isOpen={showLwbsModal}
        patientName={patientName}
        onClose={() => setShowLwbsModal(false)}
        onConfirm={handleLwbsConfirm}
        isLoading={isUpdating}
      />
    </div>
  );
};
