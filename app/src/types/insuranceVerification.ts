/**
 * Insurance Verification Types
 *
 * @module insuranceVerification.types
 * @task US_037 TASK_003
 */

export type VerificationStatus =
  | 'active'
  | 'inactive'
  | 'requires_auth'
  | 'pending'
  | 'failed'
  | 'incomplete';

export interface InsuranceVerification {
  id: number;
  patient_id: number;
  appointment_id: number | null;
  verification_date: string;
  status: VerificationStatus;
  copay_amount: number | null;
  deductible_remaining: number | null;
  coverage_start_date: string | null;
  coverage_end_date: string | null;
  authorization_notes: string | null;
  insurance_plan: string | null;
  member_id: string | null;
  last_verified_at: string | null;
  verification_source: string | null;
  is_primary_insurance: boolean;
  created_at: string;
  updated_at: string;
  attempts?: VerificationAttempt[];
}

export interface VerificationAttempt {
  id: number;
  attempt_number: number;
  api_provider: string;
  response_code: string;
  status: string;
  error_message: string | null;
  attempted_at: string;
}
