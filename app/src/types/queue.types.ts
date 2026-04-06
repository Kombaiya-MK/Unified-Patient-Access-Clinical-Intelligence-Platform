/**
 * Queue Management Types
 * 
 * Type definitions for staff queue management including appointment queue,
 * filtering, sorting, and status tracking.
 * 
 * @module queue.types
 * @created 2026-03-31
 * @task US_020 TASK_001
 */

/**
 * Queue appointment status values
 * Maps to color-coded badges in the UI
 */
export type QueueStatus = 'scheduled' | 'arrived' | 'in_progress' | 'completed' | 'no_show';

/**
 * Appointment type in the queue
 */
export type QueueAppointmentType = 'scheduled' | 'walk_in';

/**
 * Intake status for a queue appointment
 */
export type IntakeStatus = 'completed' | 'pending' | 'not_applicable';

/**
 * Queue appointment record displayed in the queue table
 */
export interface QueueAppointment {
  /** Unique appointment ID */
  id: string;
  /** Patient ID */
  patientId: string;
  /** Patient display name */
  patientName: string;
  /** Appointment time (ISO 8601 format) */
  appointmentTime: string;
  /** Current queue status */
  status: QueueStatus;
  /** Provider name */
  providerName: string;
  /** Provider ID */
  providerId: string;
  /** Department name */
  department: string;
  /** Department ID */
  departmentId: string;
  /** Appointment type */
  type: QueueAppointmentType;
  /** Intake form status */
  intakeStatus: IntakeStatus;
  /** Wait time in minutes (null if not applicable) */
  waitTimeMinutes: number | null;
  /** Queue position number */
  queuePosition: number;
  /** Optimistic locking version */
  version: number;
  /** Consultation start time (ISO 8601, null if not started) */
  startedAt: string | null;
  /** Whether this arrival was late (>15 min past appointment time) */
  isLateArrival?: boolean;
  /** Timestamp when no-show was marked (ISO 8601, null if not no-show) */
  noShowMarkedAt?: string | null;
  /** Whether this is an excused no-show */
  excusedNoShow?: boolean;
}

/**
 * Reason for marking a patient as left without being seen
 */
export type LeftWithoutSeenReason =
  | 'long_wait'
  | 'felt_better'
  | 'emergency_elsewhere'
  | 'no_explanation'
  | 'other';

/**
 * Filter state for the queue table
 */
export interface QueueFilters {
  /** Selected status values (multi-select) */
  statuses: QueueStatus[];
  /** Selected provider ID */
  providerId: string;
  /** Selected department ID */
  departmentId: string;
  /** Patient name search term */
  searchTerm: string;
}

/**
 * Sort field options for the queue table
 */
export type QueueSortField = 'appointmentTime' | 'status' | 'queuePosition';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort configuration for the queue table
 */
export interface QueueSortConfig {
  /** Field to sort by */
  field: QueueSortField;
  /** Sort direction */
  direction: SortDirection;
}

/**
 * Provider option for filter dropdown
 */
export interface ProviderOption {
  id: string;
  name: string;
}

/**
 * Department option for filter dropdown
 */
export interface DepartmentOption {
  id: string;
  name: string;
}

/**
 * API response for queue data
 */
export interface QueueResponse {
  /** List of queue appointments */
  appointments: QueueAppointment[];
  /** Total count */
  totalCount: number;
  /** Available providers for filtering */
  providers: ProviderOption[];
  /** Available departments for filtering */
  departments: DepartmentOption[];
}

/**
 * Status update request body sent to PATCH endpoint
 */
export interface StatusUpdateRequest {
  newStatus: QueueStatus;
  version: number;
}

/**
 * Result of a status update API call
 */
export interface QueueActionResult {
  success: boolean;
  data?: QueueAppointment;
  conflict?: ConflictError;
}

/**
 * Conflict error when optimistic locking detects concurrent update
 */
export interface ConflictError {
  message: string;
  currentStatus: string;
  updatedBy: string;
  updatedAt: string;
}

/**
 * WebSocket message structure received from server
 */
export interface WebSocketMessage {
  event: string;
  data: QueueUpdateEvent;
  timestamp: string;
}

/**
 * Queue update event from WebSocket
 */
export interface QueueUpdateEvent {
  type: 'status_change';
  appointmentId: string;
  newStatus: string;
  staffName: string;
  timestamp: string;
}

/**
 * Request payload for marking an appointment as no-show
 */
export interface NoShowRequest {
  notes?: string;
  excusedNoShow?: boolean;
}

/**
 * Response from marking an appointment as no-show
 */
export interface NoShowResponse {
  success: boolean;
  appointmentId: string;
  patientRiskScore: number;
  excused: boolean;
  message: string;
}

/**
 * Response from undoing a no-show marking
 */
export interface UndoNoShowResponse {
  success: boolean;
  appointmentId: string;
  patientRiskScore: number;
  message: string;
}
