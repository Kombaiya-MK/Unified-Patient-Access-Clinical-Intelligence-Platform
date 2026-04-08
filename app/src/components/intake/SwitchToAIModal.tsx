/**
 * SwitchToAIModal Component
 * 
 * File: app/src/components/intake/SwitchToAIModal.tsx
 * Task: US_026 TASK_003 - Frontend Switch to AI Mode
 * 
 * Confirmation modal when switching from manual form to AI chat.
 * Saves current draft before switching.
 */
import React from 'react';

interface SwitchToAIModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

export const SwitchToAIModal: React.FC<SwitchToAIModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  isSaving,
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
      aria-labelledby="switch-ai-title"
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
          id="switch-ai-title"
          style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 600, color: '#1f2937' }}
        >
          Switch to AI Assistant?
        </h2>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#4b5563', lineHeight: 1.5 }}>
          Your current form data will be saved as a draft and transferred to the AI assistant.
          The AI will only ask about sections you haven't completed yet.
        </p>
        <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#6b7280' }}>
          {isSaving ? 'Saving your draft...' : 'You can switch back to the form at any time.'}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={isSaving}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              color: '#374151',
              fontSize: '14px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            Continue Manually
          </button>
          <button
            onClick={onConfirm}
            disabled={isSaving}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#8b5cf6',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            {isSaving ? 'Saving...' : 'Switch to AI'}
          </button>
        </div>
      </div>
    </div>
  );
};
