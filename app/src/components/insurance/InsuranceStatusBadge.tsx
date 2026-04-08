/**
 * Insurance Status Badge Component
 *
 * Displays a color-coded badge representing insurance verification status.
 * Supports click interaction to show details popover.
 *
 * @module InsuranceStatusBadge
 * @task US_037 TASK_003
 */

import React from 'react';
import type { VerificationStatus } from '../../types/insuranceVerification';

interface InsuranceStatusBadgeProps {
  status: VerificationStatus | null | undefined;
  onClick?: () => void;
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: '#10b981', text: '#fff', label: 'Verified ✓' },
  inactive: { bg: '#ef4444', text: '#fff', label: 'Issue ✗' },
  requires_auth: { bg: '#f59e0b', text: '#fff', label: 'Auth Required ⚠️' },
  pending: { bg: '#f59e0b', text: '#fff', label: 'Pending ⏳' },
  failed: { bg: '#ef4444', text: '#fff', label: 'Failed' },
  incomplete: { bg: '#6b7280', text: '#fff', label: 'Incomplete' },
};

const defaultConfig = { bg: '#6b7280', text: '#fff', label: 'Not Verified' };

export const InsuranceStatusBadge: React.FC<InsuranceStatusBadgeProps> = ({ status, onClick }) => {
  const config = status ? statusConfig[status] || defaultConfig : defaultConfig;

  return (
    <span
      onClick={onClick}
      onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(); } }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Insurance status: ${config.label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: config.bg,
        color: config.text,
        cursor: onClick ? 'pointer' : 'default',
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </span>
  );
};
