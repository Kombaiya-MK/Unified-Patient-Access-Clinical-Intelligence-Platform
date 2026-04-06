/**
 * Queue Management Types (Server)
 * 
 * TypeScript interfaces for queue management API endpoints
 * including appointment queue data, status updates, and optimistic locking.
 * 
 * @module queue.types
 * @created 2026-03-31
 * @task US_020 TASK_003
 */

export type QueueStatus = 'pending' | 'confirmed' | 'arrived' | 'in_progress' | 'completed' | 'no_show';

export interface QueueAppointment {
  id: number;
  patient_id: number;
  patient_name: string;
  appointment_time: string;
  status: QueueStatus;
  provider_name: string;
  provider_id: number;
  department_name: string;
  department_id: number;
  appointment_type: string;
  duration_minutes: number;
  version: number;
  arrived_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  checked_in_at: string | null;
  created_at: string;
  is_late_arrival?: boolean;
}

export interface QueueFilters {
  status?: string;
  providerId?: string;
  departmentId?: string;
  search?: string;
}

export interface StatusUpdateRequest {
  newStatus: QueueStatus;
  version: number;
}

export interface StatusUpdateResult {
  success: boolean;
  appointment?: QueueAppointment;
  conflict?: ConflictError;
  isLateArrival?: boolean;
}

export interface ConflictError {
  message: string;
  currentStatus: string;
  updatedBy: string;
  updatedAt: string;
}
