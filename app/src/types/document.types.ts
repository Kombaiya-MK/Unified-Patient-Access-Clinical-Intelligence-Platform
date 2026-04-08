/**
 * Frontend Document Upload and Extraction Types
 * @module types/document.types
 * @task US_028, US_029, US_030
 */

export type DocumentType = 'Lab Results' | 'Imaging' | 'Prescription' | 'Insurance Card' | 'Other';
export type ExtractionStatus = 'Uploaded' | 'Processing' | 'Processed' | 'Needs Review' | 'Extraction Failed';
export type MergeStatus = 'Single Source' | 'Merged' | 'Has Conflicts';
export type ResolutionStatus = 'Pending' | 'Resolved' | 'Dismissed';

export interface FileWithMetadata {
  file: File;
  documentType: DocumentType;
  uploadId: string;
  validationError?: string;
  preview?: string;
}

export interface UploadProgressInfo {
  uploadId: string;
  loaded: number;
  total: number;
  percentage: number;
  speed: number;
  eta: number;
  status: 'uploading' | 'completed' | 'failed' | 'canceled';
  error?: string;
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

export interface UploadedDocument {
  id: number;
  patientId: number;
  documentType: string;
  title: string;
  fileUrl: string;
  fileSizeBytes: number;
  mimeType: string;
  originalFilename: string;
  extractionStatus: ExtractionStatus;
  extractionConfidence: number | null;
  needsManualReview: boolean;
  createdAt: string;
}

export interface ExtractedMedication {
  name: string;
  dosage: string;
  frequency: string;
}

export interface ExtractedLabResult {
  test_name: string;
  value: string;
  unit: string;
  reference_range?: string;
}

export interface ExtractedData {
  patient_name: string | null;
  date_of_birth: string | null;
  document_date: string | null;
  diagnosed_conditions: string[];
  prescribed_medications: ExtractedMedication[];
  lab_test_results: ExtractedLabResult[];
  allergies: string[];
  provider_name: string | null;
  facility_name: string | null;
}

export interface ExtractedDataResponse {
  documentId: number;
  patientId: number;
  extractionStatus: ExtractionStatus;
  extractionConfidence: number | null;
  needsManualReview: boolean;
  extractedData: ExtractedData | null;
  extractionCompletedAt: string | null;
  extractionError: string | null;
}

export interface ExtractionLogEntry {
  id: number;
  document_id: number;
  extraction_attempt: number;
  attempted_at: string;
  status: string;
  confidence_scores: Record<string, number> | null;
  error_message: string | null;
  processing_duration_ms: number | null;
}

export interface ConflictValue {
  value: unknown;
  sourceDocumentId: number;
  confidence: number;
  extractedDate: string | null;
}

export interface FieldConflict {
  id: number;
  patient_id: number;
  field_name: string;
  conflicting_values: ConflictValue[];
  resolution_status: ResolutionStatus;
  resolved_by_staff_id: number | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

export interface MergeDecision {
  fieldName: string;
  mergedValue: unknown;
  sourceDocumentIds: number[];
  confidenceScore: number;
  mergeRationale: string;
}

export interface MergeLogEntry {
  id: number;
  patient_id: number;
  merge_timestamp: string;
  algorithm_version: string;
  source_documents: number[];
  merge_decisions: MergeDecision[];
  conflicts_detected: unknown[];
  performed_by: string;
  staff_id: number | null;
}

export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024,   // 10 MB
  maxTotalSize: 50 * 1024 * 1024,  // 50 MB
  allowedTypes: [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  allowedExtensions: ['.pdf', '.png', '.jpg', '.jpeg', '.docx'],
};

export const DOCUMENT_TYPES: DocumentType[] = [
  'Lab Results',
  'Imaging',
  'Prescription',
  'Insurance Card',
  'Other',
];
