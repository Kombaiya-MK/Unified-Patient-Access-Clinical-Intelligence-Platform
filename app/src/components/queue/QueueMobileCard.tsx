/**
 * Queue Mobile Card Component
 * 
 * Mobile-optimized card view for individual queue appointments.
 * Shown on screens < 768px when the table is hidden.
 * 
 * @module QueueMobileCard
 * @created 2026-03-31
 * @task US_020 TASK_001
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { QueueStatusBadge } from './QueueStatusBadge';
import { QueueActions } from './QueueActions';
import type { QueueAppointment, QueueStatus } from '../../types/queue.types';

interface QueueMobileCardProps {
  /** Queue appointment data */
  appointment: QueueAppointment;
  /** Whether this card's action is updating */
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
 * Queue Mobile Card
 * 
 * Stacked card layout for mobile views with patient name header,
 * time + status row, provider + department row, and actions section.
 */
export const QueueMobileCard: React.FC<QueueMobileCardProps> = ({ appointment, isUpdating, onStatusUpdate }) => {
  return (
    <article
      className="queue-mobile-card"
      aria-label={`Queue entry for ${appointment.patientName}`}
    >
      <div className="queue-mobile-card__header">
        <Link
          to={`/patient/${appointment.patientId}`}
          className="queue-mobile-card__patient-name"
        >
          {appointment.patientName}
        </Link>
        <QueueStatusBadge status={appointment.status} />
      </div>

      <div className="queue-mobile-card__details">
        <div className="queue-mobile-card__row">
          <span className="queue-mobile-card__label">Time</span>
          <span className="queue-mobile-card__value">{formatTime(appointment.appointmentTime)}</span>
        </div>
        <div className="queue-mobile-card__row">
          <span className="queue-mobile-card__label">Type</span>
          <span className="queue-mobile-card__value">
            {appointment.type === 'walk_in' ? 'Walk-in' : 'Scheduled'}
          </span>
        </div>
        <div className="queue-mobile-card__row">
          <span className="queue-mobile-card__label">Provider</span>
          <span className="queue-mobile-card__value">{appointment.providerName}</span>
        </div>
        <div className="queue-mobile-card__row">
          <span className="queue-mobile-card__label">Department</span>
          <span className="queue-mobile-card__value">{appointment.department}</span>
        </div>
        {appointment.waitTimeMinutes !== null && appointment.waitTimeMinutes > 0 && (
          <div className="queue-mobile-card__row">
            <span className="queue-mobile-card__label">Wait Time</span>
            <span className="queue-mobile-card__value">{appointment.waitTimeMinutes} min</span>
          </div>
        )}
      </div>

      <div className="queue-mobile-card__actions">
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
      </div>
    </article>
  );
};
