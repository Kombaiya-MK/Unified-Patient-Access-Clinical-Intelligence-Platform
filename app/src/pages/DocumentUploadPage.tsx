/**
 * Document Upload Page
 * Full page for uploading clinical documents with drag-drop,
 * progress tracking, duplicate detection, and extraction review.
 * @module pages/DocumentUploadPage
 * @task US_028 TASK_002, TASK_003; US_029 TASK_004
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFileUpload } from '../hooks/useFileUpload';
import { useExtractedData } from '../hooks/useExtractedData';
import { FileTypeSelector } from '../components/documents/FileTypeSelector';
import { DropZone } from '../components/documents/DropZone';
import { FileList } from '../components/documents/FileList';
import { UploadProgress } from '../components/documents/UploadProgress';
import { UploadedFileGallery } from '../components/documents/UploadedFileGallery';
import { DuplicateConfirmModal } from '../components/documents/DuplicateConfirmModal';
import { ExtractedDataPanel } from '../components/documents/ExtractedDataPanel';
import type { UploadedDocument, ExtractedData } from '../types/document.types';
import { LimitedFunctionalityBanner } from '../components/circuit-breaker/LimitedFunctionalityBanner';
import { ExtractionStatus } from '../components/document-extraction/ExtractionStatus';

export const DocumentUploadPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const {
    selectedFiles,
    documentType,
    setDocumentType,
    uploadProgress,
    uploadedDocuments,
    isUploading,
    error,
    isDragActive,
    addFiles,
    removeFile,
    uploadFiles,
    cancelUpload,
    fetchDocuments,
    setIsDragActive,
  } = useFileUpload();

  const [showDuplicate, setShowDuplicate] = useState(false);
  const [duplicateFilename, setDuplicateFilename] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);

  const extractedDataHook = useExtractedData(selectedDocId);

  useEffect(() => {
    if (patientId) {
      fetchDocuments(patientId);
    }
  }, [patientId, fetchDocuments]);

  const handleUpload = useCallback(async () => {
    if (!patientId) return;
    const results = await uploadFiles(patientId);
    if (results.length > 0) {
      fetchDocuments(patientId);
    }
  }, [patientId, uploadFiles, fetchDocuments]);

  const handleView = useCallback((_doc: UploadedDocument) => {
    // Open document in new tab or viewer
  }, []);

  const handleDelete = useCallback((_docId: number) => {
    // Delete document, then refetch
  }, []);

  const handleViewExtracted = useCallback((docId: number) => {
    setSelectedDocId(docId);
  }, []);

  const handleApprove = useCallback(async (reviewedData: ExtractedData) => {
    await extractedDataHook.approveData(reviewedData);
    setSelectedDocId(null);
  }, [extractedDataHook]);

  const handleRetry = useCallback(async () => {
    await extractedDataHook.retryExtraction();
  }, [extractedDataHook]);

  const hasFiles = selectedFiles.length > 0;
  const hasProgress = Object.keys(uploadProgress).length > 0;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
      {/* Circuit Breaker Banner – US_041 TASK_002 */}
      <LimitedFunctionalityBanner />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#111827' }}>
            Upload Clinical Documents
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0 0' }}>
            Patient ID: {patientId}
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '8px 16px',
            fontSize: 13,
            border: '1px solid #d1d5db',
            borderRadius: 6,
            backgroundColor: '#fff',
            cursor: 'pointer',
            color: '#374151',
          }}
        >
          Back
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: 12,
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 13,
          color: '#dc2626',
        }}>
          {error}
        </div>
      )}

      {/* Document Type Selector */}
      <FileTypeSelector value={documentType} onChange={setDocumentType} />

      {/* Drop Zone */}
      <DropZone
        onFiles={addFiles}
        isDragActive={isDragActive}
        setIsDragActive={setIsDragActive}
      />

      {/* Selected Files */}
      {hasFiles && (
        <div style={{ marginTop: 16 }}>
          <FileList
            files={selectedFiles}
            onRemove={removeFile}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <button
              onClick={handleUpload}
              disabled={isUploading || selectedFiles.every((f) => !!f.validationError)}
              style={{
                padding: '10px 28px',
                fontSize: 14,
                fontWeight: 600,
                border: 'none',
                borderRadius: 6,
                backgroundColor: isUploading ? '#93c5fd' : '#3b82f6',
                color: '#fff',
                cursor: isUploading ? 'not-allowed' : 'pointer',
              }}
            >
              {isUploading ? 'Uploading...' : `Upload ${selectedFiles.filter((f) => !f.validationError).length} File(s)`}
            </button>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {hasProgress && (
        <div style={{ marginTop: 16 }}>
          <UploadProgress
            progressItems={uploadProgress}
            onCancel={cancelUpload}
          />
        </div>
      )}

      {/* Uploaded File Gallery */}
      <UploadedFileGallery
        documents={uploadedDocuments}
        onView={handleView}
        onDelete={handleDelete}
        onViewExtracted={handleViewExtracted}
      />

      {/* Duplicate Confirmation Modal */}
      <DuplicateConfirmModal
        isOpen={showDuplicate}
        filename={duplicateFilename}
        onConfirm={() => setShowDuplicate(false)}
        onCancel={() => { setShowDuplicate(false); setDuplicateFilename(''); }}
      />

      {/* Extracted Data Side Panel */}
      {selectedDocId && (
        <>
          <ExtractionStatus />
          <ExtractedDataPanel
          data={extractedDataHook.data}
          isLoading={extractedDataHook.loading}
          error={extractedDataHook.error}
          onApprove={handleApprove}
          onRetry={handleRetry}
          onClose={() => setSelectedDocId(null)}
        />
        </>
      )}
    </div>
  );
};
