/**
 * Undo No-Show Modal
 *
 * Simple confirmation dialog for undoing a no-show marking.
 * Shows explanation text, Confirm and Cancel buttons.
 *
 * @module UndoNoShowModal
 * @created 2026-04-01
 * @task US_024 TASK_004
 */

import React from 'react';

interface UndoNoShowModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
}

export const UndoNoShowModal: React.FC<UndoNoShowModalProps> = ({
  isOpen,
  onConfirm,
  onClose,
  isLoading,
  error,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      onClose();
    }
  };

  return (
    <div
      className="noshow-modal-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="undo-noshow-modal-title"
    >
      <div className="noshow-modal">
        <h3 id="undo-noshow-modal-title" className="noshow-modal__title">
          Undo No-Show?
        </h3>
        <p className="noshow-modal__description">
          This will change the appointment status back to <strong>Arrived</strong> and
          update the patient&apos;s record accordingly.
        </p>

        {error && (
          <div className="noshow-modal__error" role="alert">
            {error}
          </div>
        )}

        <div className="noshow-modal__actions">
          <button
            className="noshow-modal__btn noshow-modal__btn--cancel"
            onClick={onClose}
            disabled={isLoading}
            type="button"
          >
            Cancel
          </button>
          <button
            className="noshow-modal__btn noshow-modal__btn--undo"
            onClick={onConfirm}
            disabled={isLoading}
            type="button"
          >
            {isLoading ? 'Undoing...' : 'Confirm Undo'}
          </button>
        </div>
      </div>
    </div>
  );
};
