/**
 * Document Extraction Types
 * @module types/extraction.types
 * @task US_029 TASK_002, TASK_003
 */

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

export interface ExtractionResult {
  extractedData: ExtractedData;
  confidence: number;
  fieldConfidences: Record<string, number>;
  needsReview: boolean;
}

export interface ExtractionLogEntry {
  id: number;
  documentId: number;
  extractionAttempt: number;
  attemptedAt: string;
  status: string;
  confidenceScores: Record<string, number> | null;
  errorMessage: string | null;
  processingDurationMs: number | null;
}

export interface ExtractedDataResponse {
  documentId: number;
  patientId: number;
  extractionStatus: string;
  extractionConfidence: number | null;
  needsManualReview: boolean;
  extractedData: ExtractedData | null;
  extractionCompletedAt: string | null;
  extractionError: string | null;
}

export interface ReviewRequest {
  correctedData: ExtractedData;
  reviewNotes?: string;
}

export interface ExtractionConfig {
  confidenceThreshold: number;
  minFieldConfidence: number;
  maxRetryAttempts: number;
  circuitBreakerThreshold: number;
  backoffDelays: number[];
}
