/**
 * Extracted Data Panel
 * Side-panel showing all extracted fields from a clinical document
 * with inline editing, confidence indicators, and Approve/Save button.
 * @module components/documents/ExtractedDataPanel
 * @task US_029 TASK_004
 */

import React, { useState, useCallback, useEffect } from 'react';
import type {
  ExtractedData,
  ExtractedDataResponse,
  ExtractedMedication,
  ExtractedLabResult,
} from '../../types/document.types';
import { ExtractionStatusBadge } from './ExtractionStatusBadge';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { EditableField } from './EditableField';
import { MedicationsTable } from './MedicationsTable';
import { LabResultsTable } from './LabResultsTable';

interface ExtractedDataPanelProps {
  data: ExtractedDataResponse | null;
  isLoading: boolean;
  error: string | null;
  onApprove: (reviewedData: ExtractedData) => void;
  onRetry: () => void;
  onClose: () => void;
}

export const ExtractedDataPanel: React.FC<ExtractedDataPanelProps> = ({
  data,
  isLoading,
  error,
  onApprove,
  onRetry,
  onClose,
}) => {
  const [editedData, setEditedData] = useState<ExtractedData | null>(null);

  useEffect(() => {
    if (data?.extractedData) {
      setEditedData(structuredClone(data.extractedData));
    }
  }, [data?.extractedData]);

  const updateField = useCallback(<K extends keyof ExtractedData>(key: K, value: ExtractedData[K]) => {
    setEditedData((prev) => prev ? { ...prev, [key]: value } : prev);
  }, []);

  const updateMedication = useCallback((idx: number, field: keyof ExtractedMedication, value: string) => {
    setEditedData((prev) => {
      if (!prev) return prev;
      const meds = [...prev.prescribed_medications];
      meds[idx] = { ...meds[idx], [field]: value };
      return { ...prev, prescribed_medications: meds };
    });
  }, []);

  const updateLabResult = useCallback((idx: number, field: keyof ExtractedLabResult, value: string) => {
    setEditedData((prev) => {
      if (!prev) return prev;
      const labs = [...prev.lab_test_results];
      labs[idx] = { ...labs[idx], [field]: value };
      return { ...prev, lab_test_results: labs };
    });
  }, []);

  if (isLoading) {
    return (
      <PanelContainer onClose={onClose}>
        <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
          Loading extracted data...
        </div>
      </PanelContainer>
    );
  }

  if (error) {
    return (
      <PanelContainer onClose={onClose}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: '#ef4444', marginBottom: 12 }}>{error}</p>
          <button onClick={onRetry} style={retryBtnStyle}>Retry Extraction</button>
        </div>
      </PanelContainer>
    );
  }

  if (!data || !editedData) {
    return (
      <PanelContainer onClose={onClose}>
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
          No extracted data available
        </div>
      </PanelContainer>
    );
  }

  return (
    <PanelContainer onClose={onClose}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <ExtractionStatusBadge status={data.extractionStatus} size="md" />
        <ConfidenceIndicator confidence={data.extractionConfidence} />
      </div>

      {data.extractionError && (
        <div style={{ padding: 10, backgroundColor: '#fef2f2', borderRadius: 6, marginBottom: 16, fontSize: 13, color: '#dc2626' }}>
          {data.extractionError}
        </div>
      )}

      {/* Patient Info */}
      <Section title="Patient Information">
        <EditableField label="Patient Name" value={editedData.patient_name} onChange={(v) => updateField('patient_name', v)} />
        <EditableField label="Date of Birth" value={editedData.date_of_birth} onChange={(v) => updateField('date_of_birth', v)} />
        <EditableField label="Document Date" value={editedData.document_date} onChange={(v) => updateField('document_date', v)} />
      </Section>

      {/* Provider Info */}
      <Section title="Provider Information">
        <EditableField label="Provider Name" value={editedData.provider_name} onChange={(v) => updateField('provider_name', v)} />
        <EditableField label="Facility Name" value={editedData.facility_name} onChange={(v) => updateField('facility_name', v)} />
      </Section>

      {/* Medications */}
      <Section title={`Medications (${editedData.prescribed_medications.length})`}>
        <MedicationsTable
          medications={editedData.prescribed_medications}
          onEdit={updateMedication}
        />
      </Section>

      {/* Lab Results */}
      <Section title={`Lab Results (${editedData.lab_test_results.length})`}>
        <LabResultsTable
          results={editedData.lab_test_results}
          onEdit={updateLabResult}
        />
      </Section>

      {/* Allergies */}
      <Section title="Allergies">
        <TagList
          items={editedData.allergies}
          onChange={(items) => updateField('allergies', items)}
        />
      </Section>

      {/* Conditions */}
      <Section title="Diagnosed Conditions">
        <TagList
          items={editedData.diagnosed_conditions}
          onChange={(items) => updateField('diagnosed_conditions', items)}
        />
      </Section>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 20, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
        <button
          onClick={() => onApprove(editedData)}
          style={{
            flex: 1,
            padding: '10px 0',
            fontSize: 14,
            fontWeight: 600,
            backgroundColor: '#22c55e',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Approve & Save
        </button>
        <button onClick={onRetry} style={retryBtnStyle}>
          Re-extract
        </button>
      </div>
    </PanelContainer>
  );
};

function PanelContainer({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 480,
        height: '100vh',
        backgroundColor: '#fff',
        borderLeft: '1px solid #e5e7eb',
        boxShadow: '-4px 0 12px rgba(0,0,0,0.08)',
        overflowY: 'auto',
        zIndex: 50,
        padding: 24,
      }}
    >
      <button
        onClick={onClose}
        aria-label="Close panel"
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          background: 'none',
          border: 'none',
          fontSize: 20,
          cursor: 'pointer',
          color: '#6b7280',
        }}
      >
        ✕
      </button>
      <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 20px', color: '#111827' }}>
        Extracted Data Review
      </h2>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid #f3f4f6' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function TagList({ items, onChange }: { items: string[]; onChange: (items: string[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  if (items.length === 0 && !adding) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <p style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>None extracted</p>
        <button onClick={() => setAdding(true)} style={addBtnStyle}>+ Add</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {items.map((item, idx) => (
        <span key={idx} style={tagStyle}>
          {item}
          <button
            onClick={() => onChange(items.filter((_, i) => i !== idx))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 4, color: '#6b7280', fontSize: 12 }}
            aria-label={`Remove ${item}`}
          >
            ×
          </button>
        </span>
      ))}
      {adding ? (
        <input
          type="text"
          autoFocus
          value={draft}
          placeholder="Type & press Enter"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && draft.trim()) {
              onChange([...items, draft.trim()]);
              setDraft('');
              setAdding(false);
            }
            if (e.key === 'Escape') { setDraft(''); setAdding(false); }
          }}
          onBlur={() => { setDraft(''); setAdding(false); }}
          style={{ fontSize: 12, padding: '4px 8px', border: '1px solid #93c5fd', borderRadius: 4, outline: 'none', width: 120 }}
        />
      ) : (
        <button onClick={() => setAdding(true)} style={addBtnStyle}>+ Add</button>
      )}
    </div>
  );
}

const tagStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 10px',
  fontSize: 12,
  backgroundColor: '#f3f4f6',
  borderRadius: 12,
  color: '#374151',
};

const addBtnStyle: React.CSSProperties = {
  fontSize: 12,
  padding: '3px 10px',
  border: '1px dashed #d1d5db',
  borderRadius: 12,
  backgroundColor: '#fff',
  cursor: 'pointer',
  color: '#6b7280',
};

const retryBtnStyle: React.CSSProperties = {
  padding: '10px 20px',
  fontSize: 14,
  border: '1px solid #d1d5db',
  borderRadius: 6,
  backgroundColor: '#fff',
  cursor: 'pointer',
  color: '#374151',
};
