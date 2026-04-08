/**
 * Conflict Resolution Dialog
 * Modal for staff to review and resolve data conflicts between source documents.
 * @module components/patient/ConflictResolutionDialog
 * @task US_030 TASK_004
 */

import React, { useState } from 'react';
import type { FieldConflict, ConflictValue } from '../../types/document.types';

interface ConflictResolutionDialogProps {
  conflict: FieldConflict | null;
  isOpen: boolean;
  onResolve: (conflictId: number, selectedValue: unknown, notes: string) => void;
  onDismiss: (conflictId: number) => void;
  onClose: () => void;
}

export const ConflictResolutionDialog: React.FC<ConflictResolutionDialogProps> = ({
  conflict,
  isOpen,
  onResolve,
  onDismiss,
  onClose,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  if (!isOpen || !conflict) return null;

  const handleResolve = () => {
    if (selectedIdx === null) return;
    const selected = conflict.conflicting_values[selectedIdx];
    onResolve(conflict.id, selected.value, notes);
    setSelectedIdx(null);
    setNotes('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Resolve field conflict"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 24,
          maxWidth: 520,
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 4px', color: '#111827' }}>
          Resolve Conflict
        </h2>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px' }}>
          Field: <strong>{conflict.field_name.replace(/_/g, ' ')}</strong>
        </p>

        {/* Conflicting Values */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {conflict.conflicting_values.map((cv: ConflictValue, idx: number) => (
            <label
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: 12,
                borderRadius: 8,
                border: selectedIdx === idx ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                backgroundColor: selectedIdx === idx ? '#eff6ff' : '#fff',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="conflict-value"
                checked={selectedIdx === idx}
                onChange={() => setSelectedIdx(idx)}
                style={{ marginTop: 2 }}
              />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: '#111827' }}>
                  {String(cv.value)}
                </p>
                <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>
                  Source doc #{cv.sourceDocumentId} &middot;
                  Confidence: {(cv.confidence * 100).toFixed(1)}%
                  {cv.extractedDate && ` · ${new Date(cv.extractedDate).toLocaleDateString()}`}
                </p>
              </div>
            </label>
          ))}
        </div>

        {/* Resolution Notes */}
        <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>
          Resolution Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Reason for selecting this value..."
          rows={2}
          style={{
            width: '100%',
            padding: '8px 10px',
            fontSize: 13,
            border: '1px solid #d1d5db',
            borderRadius: 6,
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button
            onClick={() => { onDismiss(conflict.id); setSelectedIdx(null); setNotes(''); }}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              border: '1px solid #d1d5db',
              borderRadius: 6,
              backgroundColor: '#fff',
              cursor: 'pointer',
              color: '#6b7280',
            }}
          >
            Dismiss
          </button>
          <button onClick={onClose} style={{
            padding: '8px 16px',
            fontSize: 13,
            border: '1px solid #d1d5db',
            borderRadius: 6,
            backgroundColor: '#fff',
            cursor: 'pointer',
            color: '#374151',
          }}>
            Cancel
          </button>
          <button
            onClick={handleResolve}
            disabled={selectedIdx === null}
            style={{
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              borderRadius: 6,
              backgroundColor: selectedIdx !== null ? '#3b82f6' : '#d1d5db',
              color: '#fff',
              cursor: selectedIdx !== null ? 'pointer' : 'not-allowed',
            }}
          >
            Resolve
          </button>
        </div>
      </div>
    </div>
  );
};
