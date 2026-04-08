/**
 * Code Editor Modal Component
 * @module components/medical-coding/CodeEditorModal
 * @description Modal for modifying medical code suggestions
 * @epic EP-006
 * @story US-032
 */

import React, { useState } from 'react';
import type { MedicalCodeSuggestion } from '../../types/clinicalProfile.types';

interface CodeEditorModalProps {
  suggestion: MedicalCodeSuggestion;
  onSave: (suggestionId: string, newCode: string, newDescription: string) => void;
  onClose: () => void;
}

export const CodeEditorModal: React.FC<CodeEditorModalProps> = ({ suggestion, onSave, onClose }) => {
  const [code, setCode] = useState(suggestion.code);
  const [description, setDescription] = useState(suggestion.description);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() && description.trim()) {
      onSave(suggestion.suggestion_id, code.trim(), description.trim());
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="code-editor-title"
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
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '0.5rem', padding: '1.5rem', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <h3 id="code-editor-title" style={{ margin: '0 0 1rem', fontSize: '1.125rem', fontWeight: 600 }}>
          Modify Code Suggestion
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="code-input" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Code ({suggestion.code_type})
            </label>
            <input
              id="code-input"
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #D1D5DB',
                borderRadius: '0.375rem',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="desc-input" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Description
            </label>
            <textarea
              id="desc-input"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
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
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '0.5rem 1rem', border: '1px solid #D1D5DB', borderRadius: '0.375rem', background: 'none', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!code.trim() || !description.trim()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '0.375rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
