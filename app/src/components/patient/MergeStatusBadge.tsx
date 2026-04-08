/**
 * Merge Status Badge
 * Visual indicator for patient profile merge status.
 * @module components/patient/MergeStatusBadge
 * @task US_030 TASK_004
 */

import React from 'react';
import type { MergeStatus } from '../../types/document.types';

interface MergeStatusBadgeProps {
  status: MergeStatus;
}

const STATUS_CONFIG: Record<MergeStatus, { bg: string; color: string; icon: string }> = {
  'Single Source': { bg: '#e5e7eb', color: '#374151', icon: '📄' },
  Merged: { bg: '#dcfce7', color: '#15803d', icon: '✅' },
  'Has Conflicts': { bg: '#fee2e2', color: '#dc2626', icon: '⚠️' },
};

export const MergeStatusBadge: React.FC<MergeStatusBadgeProps> = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['Single Source'];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 12,
        fontWeight: 500,
        padding: '3px 10px',
        borderRadius: 12,
        backgroundColor: config.bg,
        color: config.color,
      }}
    >
      <span>{config.icon}</span>
      {status}
    </span>
  );
};
