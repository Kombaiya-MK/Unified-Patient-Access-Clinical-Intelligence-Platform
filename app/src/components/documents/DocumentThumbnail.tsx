/**
 * Document Thumbnail Component
 * Single document card with preview, metadata, and action buttons.
 * @module components/documents/DocumentThumbnail
 * @task US_028 TASK_003
 */

import React from 'react';
import type { UploadedDocument } from '../../types/document.types';
import { formatFileSize } from '../../utils/formatFileSize';
import { ExtractionStatusBadge } from './ExtractionStatusBadge';

interface DocumentThumbnailProps {
  document: UploadedDocument;
  onView: (doc: UploadedDocument) => void;
  onDelete: (docId: number) => void;
  onViewExtracted?: (docId: number) => void;
}

const TYPE_COLORS: Record<string, string> = {
  lab_results: '#3b82f6',
  imaging: '#8b5cf6',
  prescription: '#22c55e',
  insurance_card: '#f59e0b',
  other: '#6b7280',
};

const TYPE_ICONS: Record<string, string> = {
  'application/pdf': '📄',
  'image/png': '🖼️',
  'image/jpeg': '🖼️',
  default: '📎',
};

export const DocumentThumbnail: React.FC<DocumentThumbnailProps> = ({
  document,
  onView,
  onDelete,
  onViewExtracted,
}) => {
  const typeColor = TYPE_COLORS[document.documentType] || '#6b7280';
  const icon = TYPE_ICONS[document.mimeType] || TYPE_ICONS.default;

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#fff',
        position: 'relative',
      }}
    >
      {/* Extraction Status Badge */}
      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
        <ExtractionStatusBadge status={document.extractionStatus} />
      </div>

      {/* Thumbnail */}
      <div
        style={{
          height: 120,
          backgroundColor: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40,
        }}
      >
        {icon}
      </div>

      {/* Metadata */}
      <div style={{ padding: 12 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            margin: '0 0 4px',
          }}
          title={document.originalFilename}
        >
          {document.originalFilename}
        </p>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: '#6b7280' }}>
            {formatFileSize(document.fileSizeBytes)}
          </span>
          <span
            style={{
              fontSize: 10,
              padding: '1px 6px',
              borderRadius: 4,
              backgroundColor: `${typeColor}15`,
              color: typeColor,
              fontWeight: 500,
            }}
          >
            {document.documentType.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => onView(document)}
            style={{
              flex: 1,
              padding: '6px 0',
              fontSize: 12,
              border: '1px solid #d1d5db',
              borderRadius: 4,
              backgroundColor: '#fff',
              cursor: 'pointer',
            }}
          >
            View
          </button>
          <button
            onClick={() => onDelete(document.id)}
            style={{
              flex: 1,
              padding: '6px 0',
              fontSize: 12,
              border: '1px solid #fecaca',
              borderRadius: 4,
              backgroundColor: '#fff',
              color: '#ef4444',
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
        </div>
        {onViewExtracted && document.extractionStatus !== 'Uploaded' && (
          <button
            onClick={() => onViewExtracted(document.id)}
            style={{
              width: '100%',
              marginTop: 6,
              padding: '6px 0',
              fontSize: 12,
              border: '1px solid #93c5fd',
              borderRadius: 4,
              backgroundColor: '#eff6ff',
              color: '#3b82f6',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            View Extracted Data
          </button>
        )}
      </div>
    </div>
  );
};
