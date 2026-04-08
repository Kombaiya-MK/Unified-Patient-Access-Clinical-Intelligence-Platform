/**
 * Lab Results Table
 * Displays extracted lab test results with values and reference ranges.
 * @module components/documents/LabResultsTable
 * @task US_029 TASK_004
 */

import React from 'react';
import type { ExtractedLabResult } from '../../types/document.types';

interface LabResultsTableProps {
  results: ExtractedLabResult[];
  onEdit?: (index: number, field: keyof ExtractedLabResult, value: string) => void;
}

export const LabResultsTable: React.FC<LabResultsTableProps> = ({
  results,
  onEdit,
}) => {
  if (results.length === 0) {
    return <p style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>No lab results extracted</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ backgroundColor: '#f9fafb' }}>
            <th style={thStyle}>Test Name</th>
            <th style={thStyle}>Value</th>
            <th style={thStyle}>Unit</th>
            <th style={thStyle}>Reference Range</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={tdStyle}>
                {onEdit ? (
                  <EditableCell value={r.test_name} onChange={(v) => onEdit(idx, 'test_name', v)} />
                ) : (
                  r.test_name
                )}
              </td>
              <td style={tdStyle}>
                {onEdit ? (
                  <EditableCell value={r.value} onChange={(v) => onEdit(idx, 'value', v)} />
                ) : (
                  r.value
                )}
              </td>
              <td style={tdStyle}>
                {onEdit ? (
                  <EditableCell value={r.unit} onChange={(v) => onEdit(idx, 'unit', v)} />
                ) : (
                  r.unit
                )}
              </td>
              <td style={tdStyle}>
                {onEdit ? (
                  <EditableCell value={r.reference_range ?? ''} onChange={(v) => onEdit(idx, 'reference_range', v)} />
                ) : (
                  r.reference_range || '—'
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
