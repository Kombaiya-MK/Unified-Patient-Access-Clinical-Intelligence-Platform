/**
 * File List Component
 * Displays selected files before upload with metadata and remove buttons.
 * @module components/documents/FileList
 * @task US_028 TASK_002
 */

import React from 'react';
import type { FileWithMetadata } from '../../types/document.types';
import { formatFileSize } from '../../utils/formatFileSize';

interface FileListProps {
  files: FileWithMetadata[];
  onRemove: (uploadId: string) => void;
}

const FILE_ICONS: Record<string, string> = {
  'application/pdf': '📄',
  'image/png': '🖼️',
  'image/jpeg': '🖼️',
  'image/jpg': '🖼️',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
};

export const FileList: React.FC<FileListProps> = ({ files, onRemove }) => {
  if (files.length === 0) return null;

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
        Selected Files ({files.length})
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {files.map((f) => (
          <div
            key={f.uploadId}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              border: `1px solid ${f.validationError ? '#fecaca' : '#e5e7eb'}`,
              borderRadius: 8,
              backgroundColor: f.validationError ? '#fef2f2' : '#fff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 20 }}>{FILE_ICONS[f.file.type] || '📎'}</span>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                  {f.file.name}
                </p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>{formatFileSize(f.file.size)}</span>
                  <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, backgroundColor: '#eff6ff', color: '#3b82f6' }}>
                    {f.documentType}
                  </span>
                </div>
                {f.validationError && (
                  <p style={{ fontSize: 12, color: '#ef4444', margin: '4px 0 0' }}>
                    ⚠️ {f.validationError}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => onRemove(f.uploadId)}
              aria-label={`Remove ${f.file.name}`}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 18,
                color: '#9ca3af',
                padding: '4px 8px',
                borderRadius: 4,
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
