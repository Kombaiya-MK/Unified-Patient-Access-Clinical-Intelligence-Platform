/**
 * Conflict Details Modal Component
 * @module components/medications/ConflictDetailsModal
 * @description Modal showing detailed medication conflict information
 * @epic EP-006
 * @story US-033
 */

import React from 'react';
import type { ConflictResultItem } from '../../types/clinicalProfile.types';
import { SeverityIndicator } from './SeverityIndicator';

interface ConflictDetailsModalProps {
  conflicts: ConflictResultItem[];
  onClose: () => void;
  onOverride?: (conflict: ConflictResultItem) => void;
}

export const ConflictDetailsModal: React.FC<ConflictDetailsModalProps> = ({ conflicts, onClose, onOverride }) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-detail-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
    >
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.5rem',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '80vh',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 id="conflict-detail-title" style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
            Medication Conflicts ({conflicts.length})
          </h2>
          <button onClick={onClose} aria-label="Close" style={{ border: 'none', background: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#6B7280' }}>×</button>
        </div>

        <div style={{ overflowY: 'auto', padding: '1.5rem', flex: 1 }}>
          {conflicts.map((conflict, index) => (
            <div
              key={index}
              style={{
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: index < conflicts.length - 1 ? '1rem' : 0,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{conflict.conflict_type}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.125rem' }}>
                    Medications: {conflict.medications_involved.join(' + ')}
                  </div>
                </div>
                <SeverityIndicator level={conflict.severity_level} />
              </div>

              {conflict.interaction_mechanism && (
                <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <strong>Mechanism:</strong> {conflict.interaction_mechanism}
                </div>
              )}

              {conflict.clinical_guidance && (
                <div style={{ fontSize: '0.875rem', padding: '0.5rem', backgroundColor: '#F3F4F6', borderRadius: '0.375rem', marginBottom: '0.75rem' }}>
                  <strong>Clinical Guidance:</strong> {conflict.clinical_guidance}
                </div>
              )}

              {onOverride && conflict.severity_level < 4 && (
                <button
                  onClick={() => onOverride(conflict)}
                  style={{
                    padding: '0.375rem 0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.375rem',
                    background: 'none',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  Override with Justification
                </button>
              )}

              {conflict.severity_level >= 4 && (
                <div style={{ fontSize: '0.75rem', color: '#991B1B', fontWeight: 500, marginTop: '0.5rem' }}>
                  ⛔ Critical severity — override requires clinical review and documented justification
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
