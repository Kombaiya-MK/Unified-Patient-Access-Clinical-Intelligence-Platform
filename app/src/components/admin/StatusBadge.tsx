/**
 * StatusBadge Component
 * 
 * Displays Active/Inactive status with color-coded badge.
 * WCAG AA contrast compliant.
 * 
 * @module StatusBadge
 * @task US_035 TASK_002
 */

import React from 'react';

interface StatusBadgeProps {
  isActive: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ isActive }) => {
  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 600,
    backgroundColor: isActive ? '#dcfce7' : '#f3f4f6',
    color: isActive ? '#166534' : '#4b5563',
  };

  return (
    <span style={style} role="status" aria-label={isActive ? 'Active' : 'Inactive'}>
      <span aria-hidden="true">{isActive ? '●' : '○'}</span>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
};
