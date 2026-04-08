/**
 * Clinical Profile Types (Frontend)
 * @module types/clinicalProfile
 * @description TypeScript interfaces for unified clinical profile
 * @epic EP-006
 * @stories US-031, US-032, US-033, US-034
 */

export interface UnifiedProfile {
  patient_id: string;
  demographics: ProfileDemographics;
  chief_complaint: string;
  medical_history: MedicalHistoryData;
  current_medications: ProfileMedication[];
  allergies: ProfileAllergy[];
  lab_results: ProfileLabResult[];
  previous_visits: ProfileVisit[];
  icd10_codes: ProfileCode[];
  medication_conflicts: MedicationConflictItem[];
  conflicts: ProfileConflict[];
  processing_status: ProcessingStatus;
  source_documents: SourceDocument[];
  last_updated: string;
  profile_confidence_score?: number;
}

export interface ProfileDemographics {
  first_name: string;
  last_name: string;
  mrn: string;
  date_of_birth: string;
  gender: string;
  address?: string;
  phone?: string;
  email?: string;
  emergency_contact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface MedicalHistoryData {
  conditions: MedicalCondition[];
  surgeries: SurgeryRecord[];
  procedures: ProcedureRecord[];
}

export interface MedicalCondition {
  name: string;
  icd10_code?: string;
  diagnosed_date?: string;
  status: string;
  source_document_id?: string;
  confidence?: number;
}

export interface SurgeryRecord {
  procedure: string;
  date?: string;
  surgeon?: string;
  notes?: string;
}

export interface ProcedureRecord {
  name: string;
  date?: string;
  provider?: string;
  outcome?: string;
}

export interface ProfileMedication {
  name: string;
  dosage: string;
  frequency: string;
  prescriber?: string;
  start_date?: string;
  status: string;
  source_document_id?: string;
  generic_name?: string;
  confidence?: number;
}

export interface ProfileAllergy {
  allergen: string;
  reaction: string;
  severity: string;
  onset_date?: string;
  source_document_id?: string;
  confidence?: number;
}

export interface ProfileLabResult {
  date: string;
  test_name: string;
  value: string;
  reference_range: string;
  abnormal_flag?: string;
  source_document_id?: string;
  confidence?: number;
}

export interface ProfileVisit {
  date: string;
  chief_complaint: string;
  provider_name: string;
  icd10_codes?: string[];
  notes_preview?: string;
  appointment_id?: string;
}

export interface ProfileCode {
  code: string;
  description: string;
  confidence: number;
  status: string;
  code_type: string;
}

export interface MedicationConflictItem {
  conflict_id: string;
  conflict_type: string;
  medications_involved: string[];
  severity_level: number;
  interaction_mechanism: string;
  clinical_guidance: string;
  conflict_status: string;
}

export interface ProfileConflict {
  field_name: string;
  conflicting_values: ConflictingValue[];
  resolution_status: string;
  resolved_value?: string;
  resolution_notes?: string;
}

export interface ConflictingValue {
  value: string;
  source_document_id: string;
  source_document_name?: string;
  confidence: number;
  extracted_date: string;
}

export interface ProcessingStatus {
  total_documents: number;
  processed_documents: number;
  pending_documents: number;
  estimated_completion_time?: string;
}

export interface SourceDocument {
  document_id: string;
  document_name: string;
  upload_date: string;
  extraction_status: string;
  extraction_confidence?: number;
}

// Medical Coding Types
export interface MedicalCodeSuggestion {
  suggestion_id: string;
  appointment_id: string;
  patient_id: string;
  code_type: 'ICD-10' | 'CPT';
  code: string;
  description: string;
  confidence_score: number;
  coding_status: string;
  suggested_by: string;
  reviewed_by_staff_id?: string;
  reviewed_at?: string;
  original_code?: string;
  modification_reason?: string;
  source_text?: string;
  ai_reasoning?: string;
}

export interface CodeSearchResult {
  code: string;
  description: string;
  code_type: string;
  category?: string;
}

// Conflict Check Types
export interface ConflictCheckResult {
  conflicts: ConflictResultItem[];
  overall_safety_status: 'Safe' | 'Warning' | 'Critical';
  no_allergy_data_warning: boolean;
  patient_id: string;
  checked_at: string;
  action_required: boolean;
  critical_conflicts_count: number;
  warning_conflicts_count: number;
  unrecognized_medications?: Array<{
    input_name: string;
    suggestions: Array<{ name: string; confidence: number }>;
  }>;
}

export interface ConflictResultItem {
  conflict_type: string;
  medications_involved: string[];
  severity_level: number;
  interaction_mechanism: string;
  clinical_guidance: string;
  dosage_dependent: boolean;
  dosage_threshold?: string;
  action_required: boolean;
}

export interface ValidateMedicationResult {
  valid: boolean;
  normalized_name?: string;
  drug_class?: string;
  suggestions?: Array<{ name: string; confidence: number }>;
}
