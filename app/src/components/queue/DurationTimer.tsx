/**
 * Duration Timer Component
 *
 * Live timer that counts elapsed time since consultation started.
 * Updates every second. Displays in "Xm Ys" format.
 *
 * @module DurationTimer
 * @created 2026-03-31
 * @task US_020 TASK_002
 */

import React, { useState, useEffect } from 'react';

interface DurationTimerProps {
  /** ISO 8601 start time of consultation */
  startTime: string;
}

/**
 * Format elapsed seconds to "Xm Ys" display
 */
const formatDuration = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
};

/**
 * Live duration timer for in-progress consultations
 */
export const DurationTimer: React.FC<DurationTimerProps> = ({ startTime }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startTime).getTime();

    const updateElapsed = () => {
      const now = Date.now();
      setElapsed(Math.max(0, Math.floor((now - start) / 1000)));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const isLong = elapsed >= 1800; // 30+ minutes

  return (
    <span
      className={`duration-timer ${isLong ? 'duration-timer--long' : ''}`}
      aria-label={`Consultation duration: ${formatDuration(elapsed)}`}
      role="timer"
    >
      ⏱ {formatDuration(elapsed)}
    </span>
  );
};
