/**
 * Uploaded File Gallery Component
 * Grid display of uploaded document thumbnail cards.
 * @module components/documents/UploadedFileGallery
 * @task US_028 TASK_003
 */

import React from 'react';
import type { UploadedDocument } from '../../types/document.types';
import { DocumentThumbnail } from './DocumentThumbnail';

interface UploadedFileGalleryProps {
  documents: UploadedDocument[];
  onView: (doc: UploadedDocument) => void;
  onDelete: (docId: number) => void;
  onViewExtracted?: (docId: number) => void;
}

export const UploadedFileGallery: React.FC<UploadedFileGalleryProps> = ({
  documents,
  onView,
  onDelete,
  onViewExtracted,
}) => {
  if (documents.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#111827' }}>
        Uploaded Documents ({documents.length})
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
        {documents.map((doc) => (
          <DocumentThumbnail
            key={doc.id}
            document={doc}
            onView={onView}
            onDelete={onDelete}
            onViewExtracted={onViewExtracted}
          />
        ))}
      </div>
    </div>
  );
};
