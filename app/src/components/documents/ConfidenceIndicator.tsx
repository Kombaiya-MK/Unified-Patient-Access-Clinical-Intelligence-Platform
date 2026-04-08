/**
 * Confidence Indicator
 * Color-coded chip showing extraction confidence score.
 * @module components/documents/ConfidenceIndicator
 * @task US_029 TASK_004
 */

import React from 'react';

interface ConfidenceIndicatorProps {
  confidence: number | null;
}

function getColor(c: number): { bg: string; color: string } {
  if (c >= 90) return { bg: '#dcfce7', color: '#15803d' };
  if (c >= 80) return { bg: '#fef9c3', color: '#a16207' };
  return { bg: '#fee2e2', color: '#dc2626' };
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({ confidence }) => {
  if (confidence === null || confidence === undefined) {
    return (
      <span style={{ fontSize: 12, color: '#9ca3af' }}>N/A</span>
    );
  }

  const { bg, color } = getColor(confidence);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 12,
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 12,
        backgroundColor: bg,
        color,
      }}
    >
      {confidence.toFixed(1)}%
    </span>
  );
};
