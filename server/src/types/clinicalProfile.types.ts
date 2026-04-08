/**
 * Clinical Profile Types
 * @module types/clinicalProfile
 * @description TypeScript interfaces for unified clinical profile API
 * @epic EP-006
 * @story US-034
 */

export interface ClinicalProfileResponse {
  patient_id: string;
  demographics: ClinicalDemographics;
  chief_complaint: string;
  medical_history: ClinicalMedicalHistory;
  current_medications: ClinicalMedication[];
  allergies: ClinicalAllergy[];
  lab_results: ClinicalLabResult[];
  previous_visits: ClinicalVisit[];
  icd10_codes: ClinicalCode[];
  medication_conflicts: ClinicalMedicationConflict[];
  conflicts: ClinicalFieldConflict[];
  processing_status: ClinicalProcessingStatus;
  source_documents: ClinicalDocument[];
  last_updated: string;
}

export interface ClinicalDemographics {
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

export interface ClinicalMedicalHistory {
  conditions: Array<{
    name: string;
    icd10_code?: string;
    diagnosed_date?: string;
    status: string;
    source_document_id?: string;
  }>;
  surgeries: Array<{
    procedure: string;
    date?: string;
    surgeon?: string;
    notes?: string;
  }>;
  procedures: Array<{
    name: string;
    date?: string;
    provider?: string;
    outcome?: string;
  }>;
}

export interface ClinicalMedication {
  name: string;
  dosage: string;
  frequency: string;
  prescriber?: string;
  start_date?: string;
  status: string;
  source_document_id?: string;
}

export interface ClinicalAllergy {
  allergen: string;
  reaction: string;
  severity: string;
  onset_date?: string;
  source_document_id?: string;
}

export interface ClinicalLabResult {
  date: string;
  test_name: string;
  value: string;
  reference_range: string;
  abnormal_flag?: string;
  source_document_id?: string;
}

export interface ClinicalVisit {
  date: string;
  chief_complaint: string;
  provider_name: string;
  icd10_codes?: string[];
  notes_preview?: string;
  appointment_id?: string;
}

export interface ClinicalCode {
  code: string;
  description: string;
  confidence: number;
  status: string;
  code_type: string;
}

export interface ClinicalMedicationConflict {
  conflict_id: string;
  conflict_type: string;
  medications_involved: string[];
  severity_level: number;
  interaction_mechanism: string;
  clinical_guidance: string;
  conflict_status: string;
}

export interface ClinicalFieldConflict {
  field_name: string;
  conflicting_values: Array<{
    value: string;
    source_document_id: string;
    source_document_name?: string;
    confidence: number;
    extracted_date: string;
  }>;
  resolution_status: string;
  resolved_value?: string;
  resolution_notes?: string;
}

export interface ClinicalProcessingStatus {
  total_documents: number;
  processed_documents: number;
  pending_documents: number;
  estimated_completion_time?: string;
}

export interface ClinicalDocument {
  document_id: string;
  document_name: string;
  upload_date: string;
  extraction_status: string;
  extraction_confidence?: number;
}

export interface ResolveConflictRequest {
  selected_value: string;
  resolution_notes: string;
}

export interface ProfileHistoryEntry {
  id: string;
  field_name?: string;
  action: string;
  previous_value?: string;
  new_value?: string;
  staff_name?: string;
  timestamp: string;
  details?: Record<string, unknown>;
}
