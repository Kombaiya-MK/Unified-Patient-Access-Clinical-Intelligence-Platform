/**
 * Deduplication and Merge Types
 * @module types/deduplication.types
 * @task US_030 TASK_002, TASK_003
 */

export type MatchType = 'fuzzy' | 'exact' | 'date_overlap';
export type MergeStatus = 'Single Source' | 'Merged' | 'Has Conflicts';
export type ResolutionStatus = 'Pending' | 'Resolved' | 'Dismissed';
export type PerformedBy = 'System' | 'Staff Manual';

export interface FieldMatch {
  fieldName: string;
  similarityScore: number;
  valuesCompared: unknown[];
  matchType: MatchType;
}

export interface SimilarityResult {
  isDuplicate: boolean;
  confidenceScore: number;
  matchDetails: FieldMatch[];
  conflictDetected: boolean;
  conflictReason: string | null;
}

export interface DocumentData {
  documentId: number;
  patientId: number;
  documentDate: string | null;
  extractedData: {
    patient_name?: string | null;
    date_of_birth?: string | null;
    diagnosed_conditions?: string[];
    prescribed_medications?: MedicationData[];
    lab_test_results?: LabData[];
    allergies?: string[];
    provider_name?: string | null;
    facility_name?: string | null;
  };
  confidence: number;
}

export interface MedicationData {
  name: string;
  dosage: string;
  frequency: string;
  date?: string;
}

export interface LabData {
  test_name: string;
  value: string;
  unit: string;
  reference_range?: string;
  date?: string;
}

export interface MergeDecision {
  fieldName: string;
  mergedValue: unknown;
  sourceDocumentIds: number[];
  confidenceScore: number;
  mergeRationale: string;
}

export interface ConflictValue {
  value: unknown;
  sourceDocumentId: number;
  confidence: number;
  extractedDate: string | null;
}

export interface FieldConflict {
  id: number;
  patientId: number;
  fieldName: string;
  conflictingValues: ConflictValue[];
  resolutionStatus: ResolutionStatus;
  resolvedByStaffId: number | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  createdAt: string;
}

export interface MergeLogEntry {
  id: number;
  patientId: number;
  mergeTimestamp: string;
  algorithmVersion: string;
  sourceDocuments: number[];
  mergeDecisions: MergeDecision[];
  conflictsDetected: FieldConflict[];
  performedBy: PerformedBy;
  staffId: number | null;
}

export interface DeduplicationConfig {
  fuzzyMatchThreshold: number;
  exactMatchThreshold: number;
  labDateOverlapDays: number;
  medicationTimelineThresholdDays: number;
  conflictSimilarityThreshold: number;
  duplicateConfidenceThreshold: number;
  fieldWeights: Record<string, number>;
}

export interface ResolveConflictRequest {
  resolvedValue: unknown;
  resolutionNotes?: string;
}
