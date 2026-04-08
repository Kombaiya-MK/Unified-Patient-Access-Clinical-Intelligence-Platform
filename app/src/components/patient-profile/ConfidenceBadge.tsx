/**
 * Confidence Badge Component
 * @module components/patient-profile/ConfidenceBadge
 * @description Displays confidence score indicator (green/yellow/gray)
 * @epic EP-006
 * @story US-031
 */

import React from 'react';

interface ConfidenceBadgeProps {
  confidence?: number;
  manual?: boolean;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence, manual }) => {
  if (manual) {
    return (
      <span
        title="Manual entry"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', borderRadius: '9999px', backgroundColor: '#F3F4F6', color: '#6B7280', fontSize: '0.75rem' }}
      >
        ○ Manual
      </span>
    );
  }

  if (confidence === undefined) return null;

  const isHigh = confidence >= 90;
  const bgColor = isHigh ? '#D1FAE5' : '#FEF3C7';
  const textColor = isHigh ? '#065F46' : '#92400E';
  const label = isHigh ? '✓ Verified' : '⚠ Needs Review';

  return (
    <span
      title={`AI confidence: ${confidence.toFixed(0)}%`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', borderRadius: '9999px', backgroundColor: bgColor, color: textColor, fontSize: '0.75rem' }}
    >
      {label} ({confidence.toFixed(0)}%)
    </span>
  );
};
