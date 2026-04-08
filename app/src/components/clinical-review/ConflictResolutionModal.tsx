/**
 * Conflict Resolution Modal Component
 * @module components/clinical-review/ConflictResolutionModal
 * @description Modal for resolving field-level data conflicts with diff view
 * @epic EP-006
 * @story US-034
 * @task task_002_fe_conflict_resolution_workflow
 */

import React, { useState } from 'react';
import type { ProfileConflict } from '../../types/clinicalProfile.types';

interface ConflictResolutionModalProps {
  conflict: ProfileConflict;
  onResolve: (fieldName: string, selectedValue: string, notes: string) => void;
  onClose: () => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({ conflict, onResolve, onClose }) => {
  const [selectedValue, setSelectedValue] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedValue) {
      onResolve(conflict.field_name, selectedValue, notes);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="resolve-conflict-title"
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
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '0.5rem', padding: '1.5rem', width: '100%', maxWidth: '600px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <h3 id="resolve-conflict-title" style={{ margin: '0 0 1rem', fontSize: '1.125rem', fontWeight: 600 }}>
          Resolve Conflict: {conflict.field_name}
        </h3>

        {/* Diff View */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#6B7280' }}>Conflicting Values</h4>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {conflict.conflicting_values.map((val, index) => (
              <label
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  border: selectedValue === val.value ? '2px solid #2563EB' : '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  backgroundColor: selectedValue === val.value ? '#EFF6FF' : '#FFFFFF',
                }}
              >
                <input
                  type="radio"
                  name="conflict-value"
                  value={val.value}
                  checked={selectedValue === val.value}
                  onChange={() => setSelectedValue(val.value)}
                  style={{ marginTop: '0.125rem' }}
                />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{val.value}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.125rem' }}>Source: {val.source}</div>
                  {val.confidence !== undefined && (
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Confidence: {(val.confidence * 100).toFixed(0)}%</div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="resolution-notes" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Resolution Notes (optional)
            </label>
            <textarea
              id="resolution-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Add notes about why this value was selected..."
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
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.5rem 1rem', border: '1px solid #D1D5DB', borderRadius: '0.375rem', background: 'none', cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedValue}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: selectedValue ? '#2563EB' : '#D1D5DB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '0.375rem',
                fontWeight: 500,
                cursor: selectedValue ? 'pointer' : 'not-allowed',
              }}
            >
              Resolve Conflict
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
