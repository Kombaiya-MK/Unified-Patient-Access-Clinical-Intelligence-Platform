/**
 * Realtime Notification Component
 *
 * Slide-in notification banner that displays real-time queue update events.
 * Auto-dismisses after 5 seconds with manual dismiss option.
 *
 * @module RealtimeNotification
 * @created 2026-03-31
 * @task US_020 TASK_002
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { QueueUpdateEvent } from '../../types/queue.types';

/** Auto-dismiss delay in ms */
const AUTO_DISMISS_MS = 5000;

interface RealtimeNotificationProps {
  /** Latest queue update event */
  lastUpdate: QueueUpdateEvent | null;
}

/**
 * Format status string for display
 */
const formatStatus = (status: string): string => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Real-time notification banner for queue updates
 */
export const RealtimeNotification: React.FC<RealtimeNotificationProps> = ({ lastUpdate }) => {
  const [visible, setVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<QueueUpdateEvent | null>(null);

  const dismiss = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    if (lastUpdate) {
      setCurrentEvent(lastUpdate);
      setVisible(true);

      const timer = setTimeout(dismiss, AUTO_DISMISS_MS);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate, dismiss]);

  if (!visible || !currentEvent) {
    return null;
  }

  return (
    <div
      className="realtime-notification"
      role="alert"
      aria-live="polite"
    >
      <div className="realtime-notification__content">
        <span className="realtime-notification__icon" aria-hidden="true">🔔</span>
        <span className="realtime-notification__text">
          Appointment #{currentEvent.appointmentId} updated to{' '}
          <strong>{formatStatus(currentEvent.newStatus)}</strong>
          {currentEvent.staffName && ` by ${currentEvent.staffName}`}
        </span>
      </div>
      <button
        className="realtime-notification__dismiss"
        onClick={dismiss}
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
};
