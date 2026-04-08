/**
 * Merge History Log
 * Tabular log of all deduplication merge events for a patient.
 * @module components/patient/MergeHistoryLog
 * @task US_030 TASK_004
 */

import React from 'react';
import type { MergeLogEntry } from '../../types/document.types';

interface MergeHistoryLogProps {
  mergeHistory: MergeLogEntry[];
  onViewDetails?: (entry: MergeLogEntry) => void;
}

export const MergeHistoryLog: React.FC<MergeHistoryLogProps> = ({
  mergeHistory,
  onViewDetails,
}) => {
  if (mergeHistory.length === 0) {
    return (
      <p style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>
        No merge history available
      </p>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ backgroundColor: '#f9fafb' }}>
            <th style={thStyle}>Timestamp</th>
            <th style={thStyle}>Source Docs</th>
            <th style={thStyle}>Decisions</th>
            <th style={thStyle}>Conflicts</th>
            <th style={thStyle}>By</th>
            {onViewDetails && <th style={thStyle}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {mergeHistory.map((entry) => (
            <tr key={entry.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={tdStyle}>
                {new Date(entry.merge_timestamp).toLocaleString()}
              </td>
              <td style={tdStyle}>
                {entry.source_documents.length} document{entry.source_documents.length !== 1 ? 's' : ''}
              </td>
              <td style={tdStyle}>{entry.merge_decisions.length}</td>
              <td style={tdStyle}>
                {entry.conflicts_detected.length > 0 ? (
                  <span style={{ color: '#f59e0b', fontWeight: 500 }}>
                    {entry.conflicts_detected.length}
                  </span>
                ) : (
                  <span style={{ color: '#22c55e' }}>None</span>
                )}
              </td>
              <td style={tdStyle}>
                <span
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 10,
                    backgroundColor: entry.performed_by === 'system' ? '#dbeafe' : '#fce7f3',
                    color: entry.performed_by === 'system' ? '#1d4ed8' : '#be185d',
                  }}
                >
                  {entry.performed_by}
                </span>
              </td>
              {onViewDetails && (
                <td style={tdStyle}>
                  <button
                    onClick={() => onViewDetails(entry)}
                    style={{
                      fontSize: 12,
                      padding: '4px 10px',
                      border: '1px solid #d1d5db',
                      borderRadius: 4,
                      backgroundColor: '#fff',
                      cursor: 'pointer',
                      color: '#374151',
                    }}
                  >
                    Details
                  </button>
                </td>
              )}
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
