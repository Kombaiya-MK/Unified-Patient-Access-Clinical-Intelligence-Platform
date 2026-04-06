/**
 * Queue Table Row Component
 * 
 * Individual row for the queue management table displaying patient info,
 * appointment time, status badge, provider, department, and action buttons.
 * 
 * @module QueueTableRow
 * @created 2026-03-31
 * @task US_020 TASK_001
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { QueueStatusBadge } from './QueueStatusBadge';
import { QueueActions } from './QueueActions';
import { DurationTimer } from './DurationTimer';
import { RiskIndicator } from './RiskIndicator';
import { LateArrivalBadge } from './LateArrivalBadge';
import type { QueueAppointment, IntakeStatus, QueueStatus } from '../../types/queue.types';

/** Intake status label mapping */
const INTAKE_LABELS: Record<IntakeStatus, string> = {
  completed: 'Completed',
  pending: 'Pending',
  not_applicable: 'N/A',
};

/** Intake status CSS class mapping */
const INTAKE_CSS_CLASS: Record<IntakeStatus, string> = {
  completed: 'queue-intake--completed',
  pending: 'queue-intake--pending',
  not_applicable: 'queue-intake--na',
};

interface QueueTableRowProps {
  /** Queue appointment data */
  appointment: QueueAppointment;
  /** Row index for display number */
  index: number;
  /** Whether this row's action is updating */
  isUpdating: boolean;
  /** Callback for status update */
  onStatusUpdate: (appointmentId: string, newStatus: QueueStatus, version: number) => void;
}

/**
 * Format ISO time string to display time (e.g., "8:00 AM")
 */
const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format wait time in minutes to display string
 */
const formatWaitTime = (minutes: number | null): string => {
  if (minutes === null || minutes <= 0) {
    return '—';
  }
  return `${minutes} min`;
};

/**
 * Queue Table Row
 * 
 * Renders a single row in the queue table with patient details and status.
 * Action buttons are a slot for TASK_002 implementation.
 */
export const QueueTableRow: React.FC<QueueTableRowProps> = ({ appointment, index, isUpdating, onStatusUpdate }) => {
  return (
    <tr className="queue-table__row">
      <td className="queue-table__cell">{index + 1}</td>
      <td className="queue-table__cell queue-table__cell--id">{appointment.patientId}</td>
      <td className="queue-table__cell">
        <Link
          to={`/patient/${appointment.patientId}`}
          className="queue-table__patient-link"
          aria-label={`View details for ${appointment.patientName}`}
        >
          {appointment.patientName}
        </Link>
        {appointment.isLateArrival && <LateArrivalBadge />}
      </td>
      <td className="queue-table__cell">{formatTime(appointment.appointmentTime)}</td>
      <td className="queue-table__cell">
        {appointment.type === 'walk_in' ? 'Walk-in' : 'Scheduled'}
      </td>
      <td className="queue-table__cell">{appointment.department}</td>
      <td className="queue-table__cell">
        <QueueStatusBadge status={appointment.status} />
      </td>
      <td className="queue-table__cell">
        <span
          className={`queue-intake-badge ${INTAKE_CSS_CLASS[appointment.intakeStatus]}`}
        >
          {INTAKE_LABELS[appointment.intakeStatus]}
        </span>
      </td>
      <td className="queue-table__cell">
        {formatWaitTime(appointment.waitTimeMinutes)}
        <RiskIndicator waitTimeMinutes={appointment.waitTimeMinutes} />
        {appointment.status === 'in_progress' && appointment.startedAt && (
          <DurationTimer startTime={appointment.startedAt} />
        )}
      </td>
      <td className="queue-table__cell queue-table__cell--actions">
        <QueueActions
          status={appointment.status}
          appointmentId={appointment.id}
          version={appointment.version}
          patientName={appointment.patientName}
          isUpdating={isUpdating}
          appointmentTime={appointment.appointmentTime}
          noShowMarkedAt={appointment.noShowMarkedAt}
          onStatusUpdate={onStatusUpdate}
        />
      </td>
    </tr>
  );
};
