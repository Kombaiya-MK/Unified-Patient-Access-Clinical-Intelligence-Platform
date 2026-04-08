/**
 * Source Documents Panel
 * Lists source documents that contributed to a merged patient profile.
 * @module components/patient/SourceDocumentsPanel
 * @task US_030 TASK_004
 */

import React from 'react';

interface SourceDocument {
  documentId: number;
  title: string;
  uploadedAt: string;
  documentType: string;
}

interface SourceDocumentsPanelProps {
  mergedFromDocuments: number[];
  documents: SourceDocument[];
  onViewDocument?: (docId: number) => void;
}

export const SourceDocumentsPanel: React.FC<SourceDocumentsPanelProps> = ({
  mergedFromDocuments,
  documents,
  onViewDocument,
}) => {
  const sourceDocuments = documents.filter((d) => mergedFromDocuments.includes(d.documentId));

  if (sourceDocuments.length === 0) {
    return (
      <div style={{ padding: 12, color: '#9ca3af', fontSize: 13, fontStyle: 'italic' }}>
        No source documents linked
      </div>
    );
  }

  return (
    <div>
      <h4 style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
        Source Documents ({sourceDocuments.length})
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sourceDocuments.map((doc) => (
          <div
            key={doc.documentId}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              backgroundColor: '#f9fafb',
              borderRadius: 6,
              border: '1px solid #f3f4f6',
            }}
          >
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: '#111827' }}>{doc.title}</p>
              <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>
                {doc.documentType} &middot; {new Date(doc.uploadedAt).toLocaleDateString()}
              </p>
            </div>
            {onViewDocument && (
              <button
                onClick={() => onViewDocument(doc.documentId)}
                style={{
                  fontSize: 12,
                  padding: '4px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 4,
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  color: '#374151',
                }}
              >
                View
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
