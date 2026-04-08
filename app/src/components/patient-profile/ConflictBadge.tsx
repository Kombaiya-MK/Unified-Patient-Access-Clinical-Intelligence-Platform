/**
 * Conflict Badge Component
 * @module components/patient-profile/ConflictBadge
 * @description Badge showing count of unresolved profile conflicts
 * @epic EP-006
 * @story US-031
 */

import React from 'react';

interface ConflictBadgeProps {
  count: number;
  label?: string;
}

export const ConflictBadge: React.FC<ConflictBadgeProps> = ({ count, label }) => {
  if (count === 0) return null;

  return (
    <span
      aria-label={`${count} conflict${count > 1 ? 's' : ''} ${label ? `in ${label}` : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.125rem 0.5rem',
        borderRadius: '9999px',
        backgroundColor: '#FEF3C7',
        color: '#92400E',
        fontSize: '0.75rem',
        fontWeight: 600,
      }}
    >
      ⚠ {count}
    </span>
  );
};
