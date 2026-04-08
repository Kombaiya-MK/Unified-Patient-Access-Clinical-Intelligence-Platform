/**
 * Override Form Component
 * @module components/medications/OverrideForm
 * @description Form for clinical staff to override medication conflicts with justification
 * @epic EP-006
 * @story US-033
 */

import React, { useState } from 'react';
import type { ConflictResultItem } from '../../types/clinicalProfile.types';
import { SeverityIndicator } from './SeverityIndicator';

interface OverrideFormProps {
  conflict: ConflictResultItem;
  onSubmit: (conflictId: string, reason: string) => void;
  onCancel: () => void;
}

export const OverrideForm: React.FC<OverrideFormProps> = ({ conflict, onSubmit, onCancel }) => {
  const [reason, setReason] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  const isValid = reason.trim().length >= 10 && acknowledged;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onSubmit(conflict.conflict_id || '', reason.trim());
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="override-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
    >
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '0.5rem', padding: '1.5rem', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <h3 id="override-title" style={{ margin: '0 0 1rem', fontSize: '1.125rem', fontWeight: 600 }}>
          Override Medication Conflict
        </h3>

        <div style={{ padding: '0.75rem', backgroundColor: '#FEF3C7', borderRadius: '0.375rem', marginBottom: '1rem' }}>
          <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{conflict.conflict_type}</div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
            {conflict.medications_involved.join(' + ')}
          </div>
          <div style={{ marginTop: '0.25rem' }}>
            <SeverityIndicator level={conflict.severity_level} />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="override-reason" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Clinical Justification <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <textarea
              id="override-reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={4}
              placeholder="Provide clinical rationale for overriding this conflict (minimum 10 characters)..."
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #D1D5DB',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            {reason.length > 0 && reason.length < 10 && (
              <div style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '0.25rem' }}>
                Minimum 10 characters required ({reason.length}/10)
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={e => setAcknowledged(e.target.checked)}
                style={{ marginTop: '0.25rem' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                I acknowledge this medication conflict and accept clinical responsibility for proceeding with this medication combination.
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{ padding: '0.5rem 1rem', border: '1px solid #D1D5DB', borderRadius: '0.375rem', background: 'none', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: isValid ? '#D97706' : '#D1D5DB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '0.375rem',
                fontWeight: 500,
                cursor: isValid ? 'pointer' : 'not-allowed',
              }}
            >
              Confirm Override
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
