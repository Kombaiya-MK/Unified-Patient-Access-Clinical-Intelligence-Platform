/**
 * No-Show Types (Server)
 * 
 * Type definitions for no-show marking and undo operations.
 * 
 * @module noShow.types
 * @created 2026-04-01
 * @task US_024 TASK_002
 */

/**
 * Request body for marking an appointment as no-show
 */
export interface NoShowRequest {
  /** Optional notes about the no-show */
  notes?: string;
  /** Whether the no-show is excused (doesn't affect count/risk) */
  excusedNoShow?: boolean;
}

/**
 * Response from marking no-show
 */
export interface NoShowResponse {
  success: boolean;
  appointmentId: string;
  patientRiskScore: number;
  excused: boolean;
  message: string;
}

/**
 * Response from undoing no-show
 */
export interface UndoNoShowResponse {
  success: boolean;
  appointmentId: string;
  patientRiskScore: number;
  message: string;
}
