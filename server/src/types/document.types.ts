/**
 * Document Upload and Storage Types
 * @module types/document.types
 * @task US_028 TASK_001
 */

export type DocumentType = 'Lab Results' | 'Imaging' | 'Prescription' | 'Insurance Card' | 'Other';

export type StorageType = 'local';

export interface StorageConfig {
  storageType: StorageType;
  localPath: string;
  maxFileSize: number;
  maxTotalSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
}

export interface FileMetadata {
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  fileHash: string;
  extension: string;
}

export interface DocumentUploadRequest {
  patientId: string;
  documentType: DocumentType;
}

export interface DocumentUploadResponse {
  documentId: number;
  filePath: string;
  fileHash: string;
  isDuplicate: boolean;
  uploadedAt: string;
  originalFilename: string;
  fileSize: number;
  documentType: DocumentType;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingDocumentId?: number;
  existingFilename?: string;
  uploadedAt?: string;
}

export interface UploadedFileInfo {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}
