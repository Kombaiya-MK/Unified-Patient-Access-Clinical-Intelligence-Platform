/**
 * Late Arrival Badge Component
 *
 * Orange badge indicating a patient arrived more than 15 minutes
 * past their scheduled appointment time.
 *
 * @module LateArrivalBadge
 * @created 2026-03-31
 * @task US_022 TASK_002
 */

import React from 'react';

/**
 * Late arrival indicator badge
 */
export const LateArrivalBadge: React.FC = () => {
  return (
    <span
      className="badge--late"
      role="status"
      aria-label="Patient arrived late"
    >
      Late
    </span>
  );
};
