/**
 * Medical Coding Tab Component
 * @module components/medical-coding/MedicalCodingTab
 * @description Main tab for ICD-10/CPT code management with AI suggestions
 * @epic EP-006
 * @story US-032
 * @task task_001_fe_medical_coding_interface
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useMedicalCoding } from '../../hooks/useMedicalCoding';
import { CodingTable } from './CodingTable';
import { CodeSearchBox } from './CodeSearchBox';
import { BulkActionsBar } from './BulkActionsBar';
import { CodeEditorModal } from './CodeEditorModal';
import type { MedicalCodeSuggestion } from '../../types/clinicalProfile.types';

interface MedicalCodingTabProps {
  appointmentId: string;
}

export const MedicalCodingTab: React.FC<MedicalCodingTabProps> = ({ appointmentId }) => {
  const { suggestions, loading, error, fetchSuggestions, generateCodes, reviewCode, bulkApprove } = useMedicalCoding();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingCode, setEditingCode] = useState<MedicalCodeSuggestion | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchSuggestions(appointmentId);
  }, [appointmentId, fetchSuggestions]);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      await generateCodes(appointmentId);
      await fetchSuggestions(appointmentId);
    } finally {
      setGenerating(false);
    }
  }, [appointmentId, generateCodes, fetchSuggestions]);

  const handleApprove = useCallback(async (suggestion: MedicalCodeSuggestion) => {
    await reviewCode(suggestion.suggestion_id, 'approve');
    await fetchSuggestions(appointmentId);
  }, [reviewCode, fetchSuggestions, appointmentId]);

  const handleReject = useCallback(async (suggestion: MedicalCodeSuggestion) => {
    await reviewCode(suggestion.suggestion_id, 'reject');
    await fetchSuggestions(appointmentId);
  }, [reviewCode, fetchSuggestions, appointmentId]);

  const handleModify = useCallback((suggestion: MedicalCodeSuggestion) => {
    setEditingCode(suggestion);
  }, []);

  const handleSaveModification = useCallback(async (suggestionId: string, newCode: string, newDescription: string) => {
    await reviewCode(suggestionId, 'modify', newCode, newDescription);
    setEditingCode(null);
    await fetchSuggestions(appointmentId);
  }, [reviewCode, fetchSuggestions, appointmentId]);

  const handleBulkApprove = useCallback(async () => {
    if (selectedIds.length === 0) return;
    await bulkApprove(selectedIds);
    setSelectedIds([]);
    await fetchSuggestions(appointmentId);
  }, [selectedIds, bulkApprove, fetchSuggestions, appointmentId]);

  const pendingSuggestions = suggestions.filter(s => s.coding_status === 'Suggested');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Medical Coding</h2>
        <button
          onClick={handleGenerate}
          disabled={generating || loading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#2563EB',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '0.375rem',
            fontWeight: 500,
            cursor: generating ? 'not-allowed' : 'pointer',
            opacity: generating ? 0.7 : 1,
          }}
        >
          {generating ? 'Generating...' : '🤖 Generate AI Codes'}
        </button>
      </div>

      <CodeSearchBox appointmentId={appointmentId} />

      {error && (
        <div role="alert" style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {selectedIds.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.length}
          onBulkApprove={handleBulkApprove}
          onClearSelection={() => setSelectedIds([])}
        />
      )}

      {loading && suggestions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>Loading coding suggestions...</div>
      ) : (
        <CodingTable
          suggestions={suggestions}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onApprove={handleApprove}
          onReject={handleReject}
          onModify={handleModify}
        />
      )}

      {pendingSuggestions.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280', border: '1px dashed #E5E7EB', borderRadius: '0.5rem', marginTop: '1rem' }}>
          No pending suggestions. Click "Generate AI Codes" to create suggestions from clinical notes.
        </div>
      )}

      {editingCode && (
        <CodeEditorModal
          suggestion={editingCode}
          onSave={handleSaveModification}
          onClose={() => setEditingCode(null)}
        />
      )}
    </div>
  );
};
