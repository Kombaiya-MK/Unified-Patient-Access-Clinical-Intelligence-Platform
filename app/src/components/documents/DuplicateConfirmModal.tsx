/**
 * Duplicate Confirmation Modal
 * Alerts user when a duplicate file hash is detected and allows skip or proceed.
 * @module components/documents/DuplicateConfirmModal
 * @task US_028 TASK_003
 */

import React from 'react';

interface DuplicateConfirmModalProps {
  isOpen: boolean;
  filename: string;
  existingDate?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DuplicateConfirmModal: React.FC<DuplicateConfirmModalProps> = ({
  isOpen,
  filename,
  existingDate,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Duplicate file detected"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 24,
          maxWidth: 420,
          width: '90%',
          boxShadow: '0 20px 25px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 28 }}>⚠️</span>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: '#111827' }}>
            Duplicate File Detected
          </h2>
        </div>

        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: '0 0 8px' }}>
          A file with the same content as <strong>{filename}</strong> has already been uploaded.
        </p>
        {existingDate && (
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 20px' }}>
            Previously uploaded on: {new Date(existingDate).toLocaleDateString()}
          </p>
        )}
        {!existingDate && <div style={{ marginBottom: 20 }} />}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 20px',
              fontSize: 14,
              border: '1px solid #d1d5db',
              borderRadius: 6,
              backgroundColor: '#fff',
              cursor: 'pointer',
              color: '#374151',
            }}
          >
            Skip File
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 20px',
              fontSize: 14,
              border: 'none',
              borderRadius: 6,
              backgroundColor: '#f59e0b',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Upload Anyway
          </button>
        </div>
      </div>
    </div>
  );
};
