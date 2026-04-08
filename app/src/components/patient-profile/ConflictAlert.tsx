/**
 * Conflict Alert Component
 * @module components/patient-profile/ConflictAlert
 * @description Alert component for field-level data conflicts
 * @epic EP-006
 * @story US-031
 */

import React from 'react';
import type { ProfileConflict } from '../../types/clinicalProfile.types';

interface ConflictAlertProps {
  conflicts: ProfileConflict[];
  onResolve?: (fieldName: string) => void;
}

export const ConflictAlert: React.FC<ConflictAlertProps> = ({ conflicts, onResolve }) => {
  const pendingConflicts = conflicts.filter(c => c.resolution_status === 'Pending');

  if (pendingConflicts.length === 0) return null;

  return (
    <div
      role="alert"
      style={{
        border: '1px solid #F59E0B',
        borderRadius: '0.5rem',
        padding: '1rem',
        marginBottom: '1rem',
        backgroundColor: '#FFFBEB',
      }}
    >
      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#92400E', marginTop: 0, marginBottom: '0.75rem' }}>
        Data Conflicts ({pendingConflicts.length})
      </h3>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {pendingConflicts.map((conflict, index) => (
          <li
            key={`${conflict.field_name}-${index}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.5rem 0',
              borderBottom: index < pendingConflicts.length - 1 ? '1px solid #FDE68A' : 'none',
            }}
          >
            <div>
              <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{conflict.field_name}</span>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                {conflict.conflicting_values.map((val, vi) => (
                  <span
                    key={vi}
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.125rem 0.375rem',
                      borderRadius: '0.25rem',
                      backgroundColor: '#FEF3C7',
                      color: '#78350F',
                    }}
                  >
                    {val.source}: {val.value}
                  </span>
                ))}
              </div>
            </div>
            {onResolve && (
              <button
                onClick={() => onResolve(conflict.field_name)}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #D97706',
                  backgroundColor: 'transparent',
                  color: '#D97706',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Resolve
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
