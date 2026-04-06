/**
 * Risk Indicator Component
 *
 * Displays a warning badge when a patient's wait time exceeds threshold.
 * Shown when wait time is 30+ minutes.
 *
 * @module RiskIndicator
 * @created 2026-03-31
 * @task US_020 TASK_002
 */

import React from 'react';

/** Wait time threshold in minutes for risk warning */
const WAIT_THRESHOLD_MINUTES = 30;

interface RiskIndicatorProps {
  /** Wait time in minutes */
  waitTimeMinutes: number | null;
}

/**
 * Risk indicator badge for long-waiting patients
 */
export const RiskIndicator: React.FC<RiskIndicatorProps> = ({ waitTimeMinutes }) => {
  if (waitTimeMinutes === null || waitTimeMinutes < WAIT_THRESHOLD_MINUTES) {
    return null;
  }

  return (
    <span
      className="risk-indicator"
      role="status"
      aria-label={`High wait time: ${waitTimeMinutes} minutes`}
    >
      ⚠ Long Wait
    </span>
  );
};
