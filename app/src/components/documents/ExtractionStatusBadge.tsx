/**
 * Extraction Status Badge
 * Visual indicator for document extraction status.
 * @module components/documents/ExtractionStatusBadge
 * @task US_029 TASK_004
 */

import React from 'react';
import type { ExtractionStatus } from '../../types/document.types';

interface ExtractionStatusBadgeProps {
  status: ExtractionStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<ExtractionStatus, { bg: string; color: string; icon: string; label: string }> = {
  Uploaded: { bg: '#e5e7eb', color: '#374151', icon: '📤', label: 'Uploaded' },
  Processing: { bg: '#dbeafe', color: '#1d4ed8', icon: '⏳', label: 'Processing' },
  Processed: { bg: '#dcfce7', color: '#15803d', icon: '✅', label: 'Processed' },
  'Needs Review': { bg: '#fef9c3', color: '#a16207', icon: '⚠️', label: 'Needs Review' },
  'Extraction Failed': { bg: '#fee2e2', color: '#dc2626', icon: '❌', label: 'Failed' },
};

export const ExtractionStatusBadge: React.FC<ExtractionStatusBadgeProps> = ({
  status,
  size = 'sm',
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Uploaded;
  const fontSize = size === 'sm' ? 11 : 13;
  const padding = size === 'sm' ? '2px 8px' : '4px 12px';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize,
        fontWeight: 500,
        padding,
        borderRadius: 12,
        backgroundColor: config.bg,
        color: config.color,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: fontSize - 1 }}>{config.icon}</span>
      {config.label}
    </span>
  );
};
