/**
 * Medications Table
 * Displays extracted medication data with confidence indicators.
 * @module components/documents/MedicationsTable
 * @task US_029 TASK_004
 */

import React from 'react';
import type { ExtractedMedication } from '../../types/document.types';

interface MedicationsTableProps {
  medications: ExtractedMedication[];
  onEdit?: (index: number, field: keyof ExtractedMedication, value: string) => void;
}

export const MedicationsTable: React.FC<MedicationsTableProps> = ({
  medications,
  onEdit,
}) => {
  if (medications.length === 0) {
    return <p style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>No medications extracted</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 13,
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#f9fafb' }}>
            <th style={thStyle}>Medication</th>
            <th style={thStyle}>Dosage</th>
            <th style={thStyle}>Frequency</th>
          </tr>
        </thead>
        <tbody>
          {medications.map((med, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={tdStyle}>
                {onEdit ? (
                  <EditableCell
                    value={med.name}
                    onChange={(v) => onEdit(idx, 'name', v)}
                  />
                ) : (
                  med.name
                )}
              </td>
              <td style={tdStyle}>
                {onEdit ? (
                  <EditableCell
                    value={med.dosage}
                    onChange={(v) => onEdit(idx, 'dosage', v)}
                  />
                ) : (
                  med.dosage
                )}
              </td>
              <td style={tdStyle}>
                {onEdit ? (
                  <EditableCell
                    value={med.frequency}
                    onChange={(v) => onEdit(idx, 'frequency', v)}
                  />
                ) : (
                  med.frequency
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  fontWeight: 600,
  color: '#374151',
  fontSize: 12,
  borderBottom: '2px solid #e5e7eb',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  color: '#111827',
};

function EditableCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);

  if (editing) {
    return (
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { setEditing(false); onChange(draft); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { setEditing(false); onChange(draft); }
          if (e.key === 'Escape') { setDraft(value); setEditing(false); }
        }}
        autoFocus
        style={{
          width: '100%',
          padding: '4px 6px',
          fontSize: 13,
          border: '1px solid #93c5fd',
          borderRadius: 3,
          outline: 'none',
        }}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      onKeyDown={(e) => { if (e.key === 'Enter') setEditing(true); }}
      role="button"
      tabIndex={0}
      style={{ cursor: 'pointer' }}
    >
      {value || '—'}
    </span>
  );
}
