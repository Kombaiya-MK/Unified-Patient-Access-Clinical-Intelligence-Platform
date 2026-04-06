/**
 * Patient Types
 * 
 * Type definitions for patient search used in staff booking flow.
 * 
 * @module patient.types
 * @created 2026-04-01
 * @task US_023 TASK_003
 */

/**
 * Patient search result from the API
 */
export interface PatientSearchResult {
  /** Patient profile ID */
  id: string;
  /** Patient's first name */
  firstName: string;
  /** Patient's last name */
  lastName: string;
  /** Patient's full name */
  fullName: string;
  /** Patient's email */
  email: string;
  /** Patient's phone number */
  phoneNumber: string | null;
  /** Patient's date of birth (YYYY-MM-DD) */
  dateOfBirth: string;
  /** Medical record number */
  medicalRecordNumber: string;
}

/**
 * API response for patient search
 */
export interface PatientSearchResponse {
  /** Boolean success indicator */
  success: boolean;
  /** Number of results */
  count: number;
  /** Array of matching patients */
  patients: PatientSearchResult[];
}
