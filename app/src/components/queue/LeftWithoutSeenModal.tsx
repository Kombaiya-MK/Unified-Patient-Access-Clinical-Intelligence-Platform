/**
 * Left Without Being Seen Modal
 *
 * Confirmation modal that allows staff to record when a patient
 * leaves before treatment. Includes a required reason dropdown
 * and optional notes field.
 *
 * @module LeftWithoutSeenModal
 * @created 2026-03-31
 * @task US_022 TASK_003
 */

import React, { useState, useEffect, useRef } from 'react';
import type { LeftWithoutSeenReason } from '../../types/queue.types';

/** Maximum notes length */
const MAX_NOTES_LENGTH = 200;

/** Reason option labels */
const REASON_OPTIONS: { value: LeftWithoutSeenReason; label: string }[] = [
  { value: 'long_wait', label: 'Long wait time' },
  { value: 'felt_better', label: 'Felt better' },
  { value: 'emergency_elsewhere', label: 'Emergency elsewhere' },
  { value: 'no_explanation', label: 'No explanation' },
  { value: 'other', label: 'Other' },
];

interface LeftWithoutSeenModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Patient name for display */
  patientName: string;
  /** Close the modal */
  onClose: () => void;
  /** Confirm with reason and notes */
  onConfirm: (reason: LeftWithoutSeenReason, notes: string) => void;
  /** Whether the confirm action is loading */
  isLoading: boolean;
}

/**
 * Confirmation modal for marking patient as left without being seen
 */
export const LeftWithoutSeenModal: React.FC<LeftWithoutSeenModalProps> = ({
  isOpen,
  patientName,
  onClose,
  onConfirm,
  isLoading,
}) => {
  const [reason, setReason] = useState<LeftWithoutSeenReason | ''>('');
  const [notes, setNotes] = useState('');
  const [reasonError, setReasonError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setNotes('');
      setReasonError('');
    }
  }, [isOpen]);

  // Focus trap: close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    if (!reason) {
      setReasonError('Please select a reason');
      return;
    }
    setReasonError('');
    onConfirm(reason, notes.trim());
  };

  const handleNotesChange = (value: string) => {
    if (value.length <= MAX_NOTES_LENGTH) {
      setNotes(value);
    }
  };

  return (
    <div
      className="lwbs-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lwbs-modal-title"
    >
      <div className="lwbs-modal" ref={modalRef}>
        <h2 id="lwbs-modal-title" className="lwbs-modal__title">
          Confirm Patient Left
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: '#6B7280' }}>
          Mark <strong>{patientName}</strong> as left without being seen?
        </p>

        <div className="lwbs-modal__field">
          <label htmlFor="lwbs-reason" className="lwbs-modal__label">
            Reason <span aria-hidden="true" style={{ color: '#DC2626' }}>*</span>
          </label>
          <select
            id="lwbs-reason"
            className="lwbs-modal__select"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value as LeftWithoutSeenReason);
              setReasonError('');
            }}
            aria-required="true"
            aria-invalid={!!reasonError}
          >
            <option value="">Select a reason...</option>
            {REASON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {reasonError && (
            <p className="lwbs-modal__error" role="alert">{reasonError}</p>
          )}
        </div>

        <div className="lwbs-modal__field">
          <label htmlFor="lwbs-notes" className="lwbs-modal__label">
            Notes (optional)
          </label>
          <textarea
            id="lwbs-notes"
            className="lwbs-modal__textarea"
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            maxLength={MAX_NOTES_LENGTH}
            placeholder="Additional details..."
            rows={3}
          />
          <p className="lwbs-modal__char-count">
            {notes.length}/{MAX_NOTES_LENGTH}
          </p>
        </div>

        <div className="lwbs-modal__actions">
          <button
            className="lwbs-modal__btn lwbs-modal__btn--cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="lwbs-modal__btn lwbs-modal__btn--confirm"
            onClick={handleConfirm}
            disabled={isLoading || !reason}
          >
            {isLoading ? 'Confirming...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};
