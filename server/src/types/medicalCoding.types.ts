/**
 * Medical Coding Types
 * @module types/medicalCoding
 * @description TypeScript interfaces for ICD-10/CPT medical coding system
 * @epic EP-006
 * @story US-032
 */

export interface MedicalCodeSuggestion {
  suggestion_id: string;
  appointment_id: string;
  patient_id: string;
  code_type: 'ICD-10' | 'CPT';
  code: string;
  description: string;
  confidence_score: number;
  coding_status: CodingStatus;
  suggested_by: 'ai' | 'staff' | 'system';
  reviewed_by_staff_id?: string;
  reviewed_at?: string;
  original_code?: string;
  modification_reason?: string;
  source_text?: string;
  ai_reasoning?: string;
  created_at: string;
  updated_at: string;
}

export type CodingStatus = 'ai_suggested' | 'approved' | 'rejected' | 'modified' | 'manual';

export interface GenerateCodesRequest {
  appointment_id: string;
  patient_id: string;
  clinical_notes: string;
  chief_complaint?: string;
  diagnoses?: string[];
  procedures?: string[];
}

export interface GenerateCodesResponse {
  suggestions: MedicalCodeSuggestion[];
  appointment_id: string;
  generated_at: string;
  model_version: string;
}

export interface CodeReviewAction {
  suggestion_id: string;
  action: 'approve' | 'reject' | 'modify';
  modified_code?: string;
  modified_description?: string;
  modification_reason?: string;
  staff_id: string;
}

export interface BulkApproveRequest {
  suggestion_ids: string[];
  staff_id: string;
}

export interface CodeSearchResult {
  code: string;
  description: string;
  code_type: 'ICD-10' | 'CPT';
  category?: string;
}

export interface CodingAuditEntry {
  audit_id: string;
  suggestion_id?: string;
  appointment_id: string;
  patient_id: string;
  action_taken: 'generated' | 'approved' | 'rejected' | 'modified' | 'bulk_approved';
  code_type: 'ICD-10' | 'CPT';
  code: string;
  previous_status?: string;
  new_status?: string;
  staff_id?: string;
  modification_details?: Record<string, unknown>;
  performed_at: string;
}

export interface ICD10Reference {
  code: string;
  description: string;
  category: string;
  chapter: string;
  is_billable: boolean;
}

export interface CPTReference {
  code: string;
  description: string;
  category: string;
  rvu?: number;
}

export interface AICodeGenerationResult {
  icd10_codes: AIGeneratedCode[];
  cpt_codes: AIGeneratedCode[];
  reasoning: string;
  confidence_overall: number;
}

export interface AIGeneratedCode {
  code: string;
  description: string;
  confidence: number;
  source_text: string;
  reasoning: string;
}
