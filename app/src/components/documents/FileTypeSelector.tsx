/**
 * File Type Selector Component
 * Dropdown for selecting document type before upload.
 * @module components/documents/FileTypeSelector
 * @task US_028 TASK_002
 */

import React from 'react';
import type { DocumentType } from '../../types/document.types';
import { DOCUMENT_TYPES } from '../../types/document.types';

interface FileTypeSelectorProps {
  value: DocumentType;
  onChange: (type: DocumentType) => void;
}

export const FileTypeSelector: React.FC<FileTypeSelectorProps> = ({ value, onChange }) => {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        htmlFor="documentType"
        style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 14 }}
      >
        Document Type <span style={{ color: '#ef4444' }}>*</span>
      </label>
      <select
        id="documentType"
        value={value}
        onChange={(e) => onChange(e.target.value as DocumentType)}
        style={{
          width: '100%',
          maxWidth: 320,
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: 6,
          fontSize: 14,
          backgroundColor: '#fff',
        }}
      >
        {DOCUMENT_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    </div>
  );
};
