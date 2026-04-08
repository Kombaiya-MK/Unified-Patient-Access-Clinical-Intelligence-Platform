/**
 * DeactivateUserDialog Component
 * 
 * Confirmation dialog for deactivating a user account.
 * Uses alertdialog role for accessibility.
 * 
 * @module DeactivateUserDialog
 * @task US_035 TASK_002
 */

import React from 'react';
import type { User } from '../../types/user.types';

interface DeactivateUserDialogProps {
  isOpen: boolean;
  user: User | null;
  onConfirm: () => void;
  onCancel: () => void;
  submitting: boolean;
}

export const DeactivateUserDialog: React.FC<DeactivateUserDialogProps> = ({
  isOpen,
  user,
  onConfirm,
  onCancel,
  submitting,
}) => {
  const overlayRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      overlayRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  return (
    <div
      ref={overlayRef}
      tabIndex={-1}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="Deactivate User"
        aria-describedby="deactivate-dialog-desc"
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '24px',
          width: '100%',
          maxWidth: '400px',
          margin: '16px',
        }}
      >
        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', color: '#111827' }}>
          Deactivate User
        </h3>
        <p id="deactivate-dialog-desc" style={{ fontSize: '0.875rem', color: '#4b5563', margin: '0 0 20px 0' }}>
          Are you sure you want to deactivate <strong>{user.email}</strong>? They will no longer be able to log in.
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              fontSize: '0.875rem',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            style={{
              padding: '8px 16px',
              fontSize: '0.875rem',
              backgroundColor: submitting ? '#fca5a5' : '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Deactivating...' : 'Deactivate'}
          </button>
        </div>
      </div>
    </div>
  );
};
