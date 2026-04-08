/**
 * Coding Table Component
 * @module components/medical-coding/CodingTable
 * @description Table of ICD-10/CPT code suggestions with approve/reject/modify actions
 * @epic EP-006
 * @story US-032
 */

import React from 'react';
import type { MedicalCodeSuggestion } from '../../types/clinicalProfile.types';

interface CodingTableProps {
  suggestions: MedicalCodeSuggestion[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onApprove: (suggestion: MedicalCodeSuggestion) => void;
  onReject: (suggestion: MedicalCodeSuggestion) => void;
  onModify: (suggestion: MedicalCodeSuggestion) => void;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  Suggested: { bg: '#DBEAFE', text: '#1E40AF' },
  Approved: { bg: '#D1FAE5', text: '#065F46' },
  Rejected: { bg: '#FEE2E2', text: '#991B1B' },
  Modified: { bg: '#FEF3C7', text: '#92400E' },
};

export const CodingTable: React.FC<CodingTableProps> = ({
  suggestions,
  selectedIds,
  onSelectionChange,
  onApprove,
  onReject,
  onModify,
}) => {
  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(s => s !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    const suggestedIds = suggestions.filter(s => s.coding_status === 'Suggested').map(s => s.suggestion_id);
    if (suggestedIds.every(id => selectedIds.includes(id))) {
      onSelectionChange([]);
    } else {
      onSelectionChange(suggestedIds);
    }
  };

  if (suggestions.length === 0) return null;

  const suggestedSuggestions = suggestions.filter(s => s.coding_status === 'Suggested');
  const allSelected = suggestedSuggestions.length > 0 && suggestedSuggestions.every(s => selectedIds.includes(s.suggestion_id));

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #E5E7EB', textAlign: 'left' }}>
            <th style={{ padding: '0.5rem', width: '40px' }}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                aria-label="Select all suggested codes"
              />
            </th>
            <th style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>Type</th>
            <th style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>Code</th>
            <th style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>Description</th>
            <th style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>Confidence</th>
            <th style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>Status</th>
            <th style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {suggestions.map(suggestion => {
            const colors = statusColors[suggestion.coding_status] || statusColors.Suggested;
            const isSuggested = suggestion.coding_status === 'Suggested';

            return (
              <tr key={suggestion.suggestion_id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '0.5rem' }}>
                  {isSuggested && (
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(suggestion.suggestion_id)}
                      onChange={() => toggleSelect(suggestion.suggestion_id)}
                      aria-label={`Select ${suggestion.code}`}
                    />
                  )}
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <span style={{
                    padding: '0.125rem 0.375rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    backgroundColor: suggestion.code_type === 'ICD-10' ? '#EDE9FE' : '#FEF3C7',
                    color: suggestion.code_type === 'ICD-10' ? '#5B21B6' : '#92400E',
                  }}>
                    {suggestion.code_type}
                  </span>
                </td>
                <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontWeight: 500, fontSize: '0.875rem' }}>{suggestion.code}</td>
                <td style={{ padding: '0.5rem', fontSize: '0.875rem' }}>{suggestion.description}</td>
                <td style={{ padding: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: '3rem', height: '0.375rem', backgroundColor: '#E5E7EB', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${(suggestion.confidence_score || 0) * 100}%`,
                        height: '100%',
                        backgroundColor: (suggestion.confidence_score || 0) >= 0.8 ? '#10B981' : '#F59E0B',
                        borderRadius: '9999px',
                      }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                      {((suggestion.confidence_score || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <span style={{ padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', backgroundColor: colors.bg, color: colors.text }}>
                    {suggestion.coding_status}
                  </span>
                </td>
                <td style={{ padding: '0.5rem' }}>
                  {isSuggested && (
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button onClick={() => onApprove(suggestion)} title="Approve" style={{ padding: '0.25rem 0.5rem', border: '1px solid #10B981', borderRadius: '0.25rem', background: 'none', color: '#10B981', cursor: 'pointer', fontSize: '0.75rem' }}>✓</button>
                      <button onClick={() => onReject(suggestion)} title="Reject" style={{ padding: '0.25rem 0.5rem', border: '1px solid #EF4444', borderRadius: '0.25rem', background: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.75rem' }}>✗</button>
                      <button onClick={() => onModify(suggestion)} title="Edit" style={{ padding: '0.25rem 0.5rem', border: '1px solid #6B7280', borderRadius: '0.25rem', background: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '0.75rem' }}>✎</button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
