/**
 * Patient Search Types
 * 
 * Type definitions for the staff patient search API.
 * 
 * @module patientSearch.types
 * @created 2026-04-01
 * @task US_023 TASK_001
 */

/**
 * Query parameters for patient search
 */
export interface PatientSearchQuery {
  /** Search by patient name (first or last, fuzzy ILIKE) */
  name?: string;
  /** Search by phone number (normalized, digits only) */
  phone?: string;
  /** Search by email address (exact match, case-insensitive) */
  email?: string;
}

/**
 * Patient search result returned from the API
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
  /** Patient's date of birth */
  dateOfBirth: string;
  /** Medical record number */
  medicalRecordNumber: string;
}
