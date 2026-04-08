/**
 * Conflict Detection Types
 * @module types/conflictDetection
 * @description TypeScript interfaces for medication conflict detection system
 * @epic EP-006
 * @story US-033
 */

export interface MedicationInput {
  name: string;
  dosage: string;
  frequency: string;
  generic_name?: string;
  source?: string;
}

export interface AllergyInput {
  allergen_name: string;
  severity: string;
  reaction_type?: string;
}

export interface ConditionInput {
  condition_name: string;
  icd10_code?: string;
}

export interface ConflictResult {
  conflict_type: 'Drug-Drug' | 'Drug-Allergy' | 'Drug-Condition' | 'Drug-Condition-Dosage';
  medications_involved: string[];
  severity_level: number;
  interaction_mechanism: string;
  clinical_guidance: string;
  dosage_dependent: boolean;
  dosage_threshold?: string;
  action_required: boolean;
}

export interface ConflictCheckResponse {
  conflicts: ConflictResult[];
  overall_safety_status: 'Safe' | 'Warning' | 'Critical';
  no_allergy_data_warning: boolean;
  patient_id: string;
  checked_at: string;
  unrecognized_medications?: UnrecognizedMedication[];
}

export interface UnrecognizedMedication {
  input_name: string;
  suggestions: DrugSuggestion[];
}

export interface DrugSuggestion {
  name: string;
  confidence: number;
}

export interface CheckConflictsRequest {
  medications: MedicationInput[];
  allergies?: AllergyInput[];
  conditions?: ConditionInput[];
}

export interface CheckConflictsApiResponse extends ConflictCheckResponse {
  action_required: boolean;
  critical_conflicts_count: number;
  warning_conflicts_count: number;
}

export interface OverrideConflictRequest {
  override_reason: string;
  acknowledged: boolean;
}

export interface ValidateMedicationRequest {
  medication_name: string;
}

export interface ValidateMedicationResponse {
  valid: boolean;
  normalized_name?: string;
  drug_class?: string;
  suggestions?: DrugSuggestion[];
}

export interface ConflictCheckAuditEntry {
  audit_id: string;
  patient_id: string;
  medications_checked: MedicationInput[];
  allergies_checked: AllergyInput[];
  conditions_checked: ConditionInput[];
  conflicts_detected_count: number;
  highest_severity: number | null;
  no_allergy_warning: boolean;
  check_performed_at: string;
  checked_by: 'System' | 'Staff Manual';
  staff_id?: string;
}

export interface DrugReference {
  name: string;
  generic_name: string;
  drug_class: string;
  common_interactions: string[];
  contraindicated_conditions: string[];
  cross_sensitivities: string[];
  dosage_thresholds?: Record<string, string>;
}
