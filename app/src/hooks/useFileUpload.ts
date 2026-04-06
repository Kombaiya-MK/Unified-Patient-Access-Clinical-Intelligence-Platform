/**
 * File Upload Hook
 * Manages file selection, validation, upload progress, and document management.
 * @module hooks/useFileUpload
 * @task US_028 TASK_002, TASK_003
 */

import { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import type { AxiosProgressEvent } from 'axios';
import type {
  FileWithMetadata,
  UploadProgressInfo,
  DocumentUploadResponse,
  UploadedDocument,
  DocumentType,
} from '../types/document.types';
import { UPLOAD_CONFIG } from '../types/document.types';
import { getToken } from '../utils/storage/tokenStorage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function useFileUpload() {
  const [selectedFiles, setSelectedFiles] = useState<FileWithMetadata[]>([]);
  const [documentType, setDocumentType] = useState<DocumentType>('Lab Results');
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgressInfo>>({});
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const validateFile = useCallback((file: File): string | undefined => {
    if (!UPLOAD_CONFIG.allowedTypes.includes(file.type)) {
      return `File type ${file.type || 'unknown'} not supported. Accepted: PDF, PNG, JPG, DOCX`;
    }
    if (file.size > UPLOAD_CONFIG.maxFileSize) {
      return `File "${file.name}" exceeds 10MB limit. Please compress or split the file.`;
    }
    return undefined;
  }, []);

  const addFiles = useCallback((files: File[]) => {
    const newFiles: FileWithMetadata[] = files.map((file) => ({
      file,
      documentType,
      uploadId: crypto.randomUUID(),
      validationError: validateFile(file),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));

    setSelectedFiles((prev) => {
      const combined = [...prev, ...newFiles];
      const totalSize = combined.reduce((sum, f) => sum + f.file.size, 0);
      if (totalSize > UPLOAD_CONFIG.maxTotalSize) {
        setError('Total upload size exceeds 50MB limit.');
      } else {
        setError(null);
      }
      return combined;
    });
  }, [documentType, validateFile]);

  const removeFile = useCallback((uploadId: string) => {
    setSelectedFiles((prev) => {
      const file = prev.find((f) => f.uploadId === uploadId);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      const remaining = prev.filter((f) => f.uploadId !== uploadId);
      const totalSize = remaining.reduce((s, f) => s + f.file.size, 0);
      if (totalSize <= UPLOAD_CONFIG.maxTotalSize) setError(null);
      return remaining;
    });
  }, []);

  const uploadFiles = useCallback(async (patientId: string): Promise<DocumentUploadResponse[]> => {
    const validFiles = selectedFiles.filter((f) => !f.validationError);
    if (validFiles.length === 0) {
      setError('No valid files to upload');
      return [];
    }

    setIsUploading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    const formData = new FormData();
    formData.append('patientId', patientId);
    formData.append('documentType', documentType);
    for (const f of validFiles) {
      formData.append('files', f.file);
    }

    // Set initial progress
    const initialProgress: Record<string, UploadProgressInfo> = {};
    for (const f of validFiles) {
      initialProgress[f.uploadId] = {
        uploadId: f.uploadId,
        loaded: 0,
        total: f.file.size,
        percentage: 0,
        speed: 0,
        eta: 0,
        status: 'uploading',
      };
    }
    setUploadProgress(initialProgress);

    const startTime = Date.now();

    try {
      const token = getToken();
      const response = await axios.post<{ success: boolean; data: DocumentUploadResponse[] }>(
        `${API_URL}/documents/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
          signal: abortControllerRef.current.signal,
          onUploadProgress: (event: AxiosProgressEvent) => {
            if (!event.total) return;
            const percentage = Math.round((event.loaded * 100) / event.total);
            const elapsedSeconds = (Date.now() - startTime) / 1000;
            const speed = elapsedSeconds > 0 ? event.loaded / elapsedSeconds : 0;
            const eta = speed > 0 ? (event.total - event.loaded) / speed : 0;

            setUploadProgress((prev) => {
              const updated = { ...prev };
              for (const f of validFiles) {
                updated[f.uploadId] = {
                  ...updated[f.uploadId],
                  loaded: event.loaded,
                  total: event.total!,
                  percentage,
                  speed,
                  eta,
                  status: percentage >= 100 ? 'completed' : 'uploading',
                };
              }
              return updated;
            });
          },
        },
      );

      // Mark all as completed
      setUploadProgress((prev) => {
        const updated = { ...prev };
        for (const f of validFiles) {
          updated[f.uploadId] = { ...updated[f.uploadId], status: 'completed', percentage: 100 };
        }
        return updated;
      });

      setSelectedFiles([]);
      setIsUploading(false);
      return response.data.data;
    } catch (err) {
      if (axios.isCancel(err)) {
        setUploadProgress((prev) => {
          const updated = { ...prev };
          for (const f of validFiles) {
            updated[f.uploadId] = { ...updated[f.uploadId], status: 'canceled' };
          }
          return updated;
        });
      } else {
        const message = axios.isAxiosError(err)
          ? err.response?.data?.error || err.message
          : 'Upload failed';
        setError(message);
        setUploadProgress((prev) => {
          const updated = { ...prev };
          for (const f of validFiles) {
            updated[f.uploadId] = { ...updated[f.uploadId], status: 'failed', error: message };
          }
          return updated;
        });
      }
      setIsUploading(false);
      return [];
    }
  }, [selectedFiles, documentType]);

  const cancelUpload = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const fetchDocuments = useCallback(async (patientId: string) => {
    try {
      const token = getToken();
      const response = await axios.get<{ success: boolean; data: UploadedDocument[] }>(
        `${API_URL}/documents/patient/${patientId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setUploadedDocuments(response.data.data || []);
    } catch {
      // Silently fail - user can retry
    }
  }, []);

  const hasErrors = selectedFiles.some((f) => f.validationError) || !!error;
  const totalSize = selectedFiles.reduce((sum, f) => sum + f.file.size, 0);

  return {
    selectedFiles,
    documentType,
    setDocumentType,
    addFiles,
    removeFile,
    uploadFiles,
    cancelUpload,
    uploadProgress,
    uploadedDocuments,
    fetchDocuments,
    isUploading,
    error,
    hasErrors,
    totalSize,
    isDragActive,
    setIsDragActive,
  };
}
