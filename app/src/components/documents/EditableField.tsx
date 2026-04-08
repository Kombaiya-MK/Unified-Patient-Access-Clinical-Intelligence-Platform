/**
 * Editable Field Component
 * Inline-editable text field for low-confidence extracted values.
 * @module components/documents/EditableField
 * @task US_029 TASK_004
 */

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface EditableFieldProps {
  label: string;
  value: string | null;
  confidence?: number;
  onChange: (newValue: string) => void;
  lowConfidenceThreshold?: number;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  confidence,
  onChange,
  lowConfidenceThreshold = 80,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const inputRef = useRef<HTMLInputElement>(null);
  const isLowConfidence = confidence !== undefined && confidence < lowConfidenceThreshold;

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const handleSave = () => {
    setEditing(false);
    if (draft !== (value ?? '')) {
      onChange(draft);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setDraft(value ?? '');
      setEditing(false);
    }
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 2 }}>
        {label}
        {isLowConfidence && (
          <span style={{ color: '#f59e0b', marginLeft: 6, fontSize: 11 }}>
            ⚠ Low confidence
          </span>
        )}
      </label>
      {editing ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: 14,
              border: '1px solid #3b82f6',
              borderRadius: 4,
              outline: 'none',
            }}
          />
        </div>
      ) : (
        <div
          onClick={() => setEditing(true)}
          onKeyDown={(e) => { if (e.key === 'Enter') setEditing(true); }}
          role="button"
          tabIndex={0}
          aria-label={`Edit ${label}`}
          style={{
            padding: '6px 10px',
            fontSize: 14,
            borderRadius: 4,
            cursor: 'pointer',
            backgroundColor: isLowConfidence ? '#fef9c340' : '#f9fafb',
            border: isLowConfidence ? '1px dashed #f59e0b' : '1px solid transparent',
            color: value ? '#111827' : '#9ca3af',
            minHeight: 32,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {value || 'Click to edit'}
        </div>
      )}
    </div>
  );
};
