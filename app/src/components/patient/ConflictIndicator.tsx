/**
 * Conflict Indicator
 * Shows conflict count with visual urgency cue on a patient profile.
 * @module components/patient/ConflictIndicator
 * @task US_030 TASK_004
 */

import React from 'react';

interface ConflictIndicatorProps {
  pendingCount: number;
  totalCount: number;
  onClick?: () => void;
}

export const ConflictIndicator: React.FC<ConflictIndicatorProps> = ({
  pendingCount,
  totalCount,
  onClick,
}) => {
  if (totalCount === 0) return null;

  const isUrgent = pendingCount > 0;
  const Tag = onClick ? 'button' : 'span';

  return (
    <Tag
      onClick={onClick}
      aria-label={pendingCount > 0 ? `${pendingCount} conflicts pending` : `${totalCount} conflicts resolved`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 12px',
        fontSize: 13,
        fontWeight: 500,
        border: isUrgent ? '1px solid #fecaca' : '1px solid #d1d5db',
        borderRadius: 6,
        backgroundColor: isUrgent ? '#fef2f2' : '#f9fafb',
        color: isUrgent ? '#dc2626' : '#374151',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <span>{isUrgent ? '⚠️' : '✅'}</span>
      {pendingCount > 0
        ? `${pendingCount} conflict${pendingCount > 1 ? 's' : ''} pending`
        : `${totalCount} conflict${totalCount > 1 ? 's' : ''} resolved`}
    </Tag>
  );
};
