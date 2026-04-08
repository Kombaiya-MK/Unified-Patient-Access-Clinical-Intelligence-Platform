/**
 * Status Badge Component
 * @module components/clinical-review/StatusBadge
 * @description Displays color-coded status badges
 * @epic EP-006
 * @story US-034
 */

import React from 'react';

interface StatusBadgeProps {
  status: string;
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  Active: { bg: '#D1FAE5', color: '#065F46' },
  Inactive: { bg: '#F3F4F6', color: '#6B7280' },
  Pending: { bg: '#FEF3C7', color: '#92400E' },
  Resolved: { bg: '#DBEAFE', color: '#1E40AF' },
  Suggested: { bg: '#EDE9FE', color: '#5B21B6' },
  Approved: { bg: '#D1FAE5', color: '#065F46' },
  Rejected: { bg: '#FEE2E2', color: '#991B1B' },
  Critical: { bg: '#FEE2E2', color: '#991B1B' },
  Overridden: { bg: '#FEF3C7', color: '#92400E' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const style = STATUS_STYLES[status] || { bg: '#F3F4F6', color: '#6B7280' };

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.125rem 0.5rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 500,
        backgroundColor: style.bg,
        color: style.color,
      }}
    >
      {status}
    </span>
  );
};
