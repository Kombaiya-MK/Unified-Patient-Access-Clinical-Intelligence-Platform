/**
 * Bulk Actions Bar Component
 * @module components/medical-coding/BulkActionsBar
 * @description Toolbar for bulk approve/reject operations on coding suggestions
 * @epic EP-006
 * @story US-032
 */

import React from 'react';

interface BulkActionsBarProps {
  selectedCount: number;
  onBulkApprove: () => void;
  onClearSelection: () => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({ selectedCount, onBulkApprove, onClearSelection }) => {
  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        backgroundColor: '#EFF6FF',
        borderRadius: '0.5rem',
        marginBottom: '1rem',
      }}
    >
      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1E40AF' }}>
        {selectedCount} code{selectedCount > 1 ? 's' : ''} selected
      </span>
      <button
        onClick={onBulkApprove}
        style={{
          padding: '0.375rem 0.75rem',
          backgroundColor: '#10B981',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '0.375rem',
          fontSize: '0.75rem',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        ✓ Approve All
      </button>
      <button
        onClick={onClearSelection}
        style={{
          padding: '0.375rem 0.75rem',
          border: '1px solid #D1D5DB',
          borderRadius: '0.375rem',
          background: 'none',
          fontSize: '0.75rem',
          cursor: 'pointer',
        }}
      >
        Clear Selection
      </button>
    </div>
  );
};
