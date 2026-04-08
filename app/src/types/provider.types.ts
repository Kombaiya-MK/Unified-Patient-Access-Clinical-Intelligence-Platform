/**
 * Provider Management Types
 *
 * Type definitions for admin provider management pages and API interactions.
 *
 * @module provider.types
 * @task US_036 TASK_004
 */

export interface Provider {
  id: number;
  user_id: number;
  specialty: string;
  license_number?: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string | null;
  departments: string;
  total_weekly_hours: number;
  is_active: boolean;
}

export interface ScheduleEntry {
  id?: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface BlockedTime {
  id?: number;
  blocked_date: string;
  start_time: string;
  end_time: string;
  reason: string;
}

export interface ProviderAppointment {
  id: number;
  appointment_date: string;
  duration_minutes: number;
  status: string;
  appointment_type: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_phone?: string;
}

export interface CreateProviderInput {
  user_id: number;
  specialty: string;
  license_number?: string;
  department_assignments: { department_id: number; primary_department: boolean }[];
  weekly_schedule: { day_of_week: number; start_time: string; end_time: string }[];
}

export interface UpdateProviderInput {
  specialty?: string;
  license_number?: string;
  department_assignments?: { department_id: number; primary_department: boolean }[];
}

export interface ProviderScheduleData {
  weekly_schedule: ScheduleEntry[];
  blocked_times: BlockedTime[];
  existing_appointments: ProviderAppointment[];
}

export interface ProviderPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
