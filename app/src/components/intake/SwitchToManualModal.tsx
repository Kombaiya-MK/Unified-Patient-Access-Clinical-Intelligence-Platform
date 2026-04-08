/**
 * SwitchToManualModal Component
 * 
 * File: app/src/components/intake/SwitchToManualModal.tsx
 * Task: US_025 TASK_004 - Frontend Manual Form Switch
 * 
 * Confirmation modal when switching from AI chat to manual form.
 * Transfers currently extracted data to the manual form.
 */
import React from 'react';

interface SwitchToManualModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  fieldsCollected: number;
}

export const SwitchToManualModal: React.FC<SwitchToManualModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  fieldsCollected,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="switch-manual-title"
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '440px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
        }}
      >
        <h2
          id="switch-manual-title"
          style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 600, color: '#1f2937' }}
        >
          Switch to Manual Form?
        </h2>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#4b5563', lineHeight: 1.5 }}>
          Your conversation progress will be transferred to the manual form.
          {fieldsCollected > 0 && (
            <> <strong>{fieldsCollected} field(s)</strong> already collected will be pre-filled.</>
          )}
        </p>
        <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#6b7280' }}>
          You can switch back to AI mode at any time.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              color: '#374151',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Continue with AI
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Switch to Manual
          </button>
        </div>
      </div>
    </div>
  );
};
