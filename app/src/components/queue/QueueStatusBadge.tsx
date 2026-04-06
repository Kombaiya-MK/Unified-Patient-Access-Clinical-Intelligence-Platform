/**
 * Queue Status Badge Component
 * 
 * Color-coded badge for displaying queue appointment status.
 * Maps status values to semantic colors per wireframe specification.
 * 
 * Color Mapping:
 * - Scheduled = neutral (gray)
 * - Arrived = success (green)
 * - In Progress = info (blue)
 * - Completed = neutral (gray)
 * - No Show = error (red)
 * 
 * @module QueueStatusBadge
 * @created 2026-03-31
 * @task US_020 TASK_001
 */

import React from 'react';
import type { QueueStatus } from '../../types/queue.types';

/** Status display labels */
const STATUS_LABELS: Record<QueueStatus, string> = {
  scheduled: 'Scheduled',
  arrived: 'Arrived',
  in_progress: 'In Progress',
  completed: 'Completed',
  no_show: 'No Show',
};

/** CSS class modifiers for each status */
const STATUS_CSS_CLASS: Record<QueueStatus, string> = {
  scheduled: 'queue-badge--scheduled',
  arrived: 'queue-badge--arrived',
  in_progress: 'queue-badge--in-progress',
  completed: 'queue-badge--completed',
  no_show: 'queue-badge--no-show',
};

interface QueueStatusBadgeProps {
  /** Queue appointment status */
  status: QueueStatus;
}

/**
 * Queue Status Badge
 * 
 * Renders a color-coded pill badge with the status label.
 * Uses CSS classes for colors (no inline styles).
 */
export const QueueStatusBadge: React.FC<QueueStatusBadgeProps> = ({ status }) => {
  return (
    <span
      className={`queue-badge ${STATUS_CSS_CLASS[status]}`}
      role="status"
      aria-label={`Status: ${STATUS_LABELS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
};
