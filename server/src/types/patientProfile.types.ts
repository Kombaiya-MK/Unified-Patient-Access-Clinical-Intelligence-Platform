/**
 * Unified Patient Profile Types
 * @module types/patientProfile
 * @description TypeScript interfaces for the unified patient profile system
 * @epic EP-006
 * @story US-031
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
  medication_conflicts: MedicationConflictSummary[];
  conflicts: ProfileConflict[];
  processing_status: ProcessingStatus;
  source_documents: SourceDocumentRef[];
  last_updated: string;
  profile_confidence_score: number;
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
  status: 'Active' | 'Resolved' | 'Chronic';
  source_document_id?: string;
  confidence?: number;
}

export interface SurgeryRecord {
  procedure: string;
  date?: string;
  surgeon?: string;
  notes?: string;
  source_document_id?: string;
}

export interface ProcedureRecord {
  name: string;
  date?: string;
  provider?: string;
  outcome?: string;
  source_document_id?: string;
}

export interface ProfileMedication {
  name: string;
  dosage: string;
  frequency: string;
  prescriber?: string;
  start_date?: string;
  status: 'Active' | 'Discontinued' | 'On Hold';
  source_document_id?: string;
  generic_name?: string;
  confidence?: number;
}

export interface ProfileAllergy {
  allergen: string;
  reaction: string;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Life-Threatening';
  onset_date?: string;
  source_document_id?: string;
  confidence?: number;
}

export interface ProfileLabResult {
  date: string;
  test_name: string;
  value: string;
  reference_range: string;
  abnormal_flag?: 'High' | 'Low' | 'Critical' | 'Normal';
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
  status: 'ai_suggested' | 'approved' | 'rejected' | 'modified' | 'manual';
  code_type: 'ICD-10' | 'CPT';
}

export interface MedicationConflictSummary {
  conflict_id: string;
  conflict_type: 'Drug-Drug' | 'Drug-Allergy' | 'Drug-Condition' | 'Drug-Condition-Dosage';
  medications_involved: string[];
  severity_level: number;
  interaction_mechanism: string;
  clinical_guidance: string;
  conflict_status: 'Active' | 'Overridden' | 'Resolved' | 'Acknowledged';
}

export interface ProfileConflict {
  field_name: string;
  conflicting_values: ConflictingValue[];
  resolution_status: 'Pending' | 'Resolved' | 'Deferred';
  resolved_value?: string;
  resolution_notes?: string;
  resolved_by_staff_id?: string;
  resolved_at?: string;
  confidence_score?: number;
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

export interface SourceDocumentRef {
  document_id: string;
  document_name: string;
  upload_date: string;
  extraction_status: 'processing' | 'processed' | 'needs_review' | 'failed';
  extraction_confidence?: number;
}

export interface ProfileGenerationRequest {
  patient_id: string;
  force_refresh?: boolean;
}

export interface ProfileVersion {
  version_id: string;
  version_number: number;
  profile_snapshot: Record<string, unknown>;
  change_type: 'extraction' | 'merge' | 'manual_edit' | 'conflict_resolution' | 'system_update';
  changed_by_staff_id?: string;
  change_description?: string;
  created_at: string;
}
