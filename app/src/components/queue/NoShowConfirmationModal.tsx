/**
 * No-Show Confirmation Modal
 *
 * Modal dialog for marking an appointment as no-show.
 * Includes optional notes textarea (500 char max) and excused checkbox.
 *
 * @module NoShowConfirmationModal
 * @created 2026-04-01
 * @task US_024 TASK_003
 */

import React, { useState, useEffect } from 'react';

interface NoShowConfirmationModalProps {
  isOpen: boolean;
  patientName: string;
  onConfirm: (notes: string, excused: boolean) => void;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
}

export const NoShowConfirmationModal: React.FC<NoShowConfirmationModalProps> = ({
  isOpen,
  patientName,
  onConfirm,
  onClose,
  isLoading,
  error,
}) => {
  const [notes, setNotes] = useState('');
  const [excused, setExcused] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setNotes('');
      setExcused(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(notes, excused);
  };

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
      aria-labelledby="noshow-modal-title"
    >
      <div className="noshow-modal">
        <h3 id="noshow-modal-title" className="noshow-modal__title">
          Mark as No-Show?
        </h3>
        <p className="noshow-modal__description">
          This action will update <strong>{patientName}</strong>&apos;s record.
        </p>

        {error && (
          <div className="noshow-modal__error" role="alert">
            {error}
          </div>
        )}

        <div className="noshow-modal__field">
          <label htmlFor="noshow-notes" className="noshow-modal__label">
            Reason (optional)
          </label>
          <textarea
            id="noshow-notes"
            className="noshow-modal__textarea"
            placeholder="e.g., Patient called to say they couldn't make it"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            rows={3}
            disabled={isLoading}
          />
          <span className="noshow-modal__char-count">{notes.length}/500</span>
        </div>

        <div className="noshow-modal__field">
          <label className="noshow-modal__checkbox-label">
            <input
              type="checkbox"
              checked={excused}
              onChange={(e) => setExcused(e.target.checked)}
              disabled={isLoading}
            />
            <span>Excused No-Show</span>
            <span
              className="noshow-modal__tooltip-icon"
              title="Excused no-shows won't affect the patient's risk score"
              aria-label="Excused no-shows won't affect the patient's risk score"
            >
              ?
            </span>
          </label>
        </div>

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
            className="noshow-modal__btn noshow-modal__btn--confirm"
            onClick={handleConfirm}
            disabled={isLoading}
            type="button"
          >
            {isLoading ? 'Marking...' : 'Confirm No-Show'}
          </button>
        </div>
      </div>
    </div>
  );
};
