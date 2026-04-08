/**
 * Conflict Progress Component
 * @module components/clinical-review/ConflictProgress
 * @description Displays conflict resolution progress bar and stats
 * @epic EP-006
 * @story US-034
 */

import React from 'react';
import type { ProfileConflict } from '../../types/clinicalProfile.types';

interface ConflictProgressProps {
  conflicts: ProfileConflict[];
}

export const ConflictProgress: React.FC<ConflictProgressProps> = ({ conflicts }) => {
  const total = conflicts.length;
  if (total === 0) return null;

  const resolved = conflicts.filter(c => c.resolution_status === 'Resolved').length;
  const pending = total - resolved;
  const percentage = total > 0 ? Math.round((resolved / total) * 100) : 0;

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Conflict Resolution Progress</span>
        <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
          {resolved}/{total} resolved ({percentage}%)
        </span>
      </div>
      <div style={{ width: '100%', height: '0.5rem', backgroundColor: '#E5E7EB', borderRadius: '9999px', overflow: 'hidden' }}>
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: percentage === 100 ? '#10B981' : '#2563EB',
            borderRadius: '9999px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      {pending > 0 && (
        <div style={{ fontSize: '0.75rem', color: '#92400E', marginTop: '0.25rem' }}>
          {pending} conflict{pending > 1 ? 's' : ''} pending review
        </div>
      )}
    </div>
  );
};
