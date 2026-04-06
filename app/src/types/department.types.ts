/**
 * Department Management Types
 *
 * Type definitions for admin department management pages and API interactions.
 *
 * @module department.types
 * @task US_036 TASK_004
 */

export interface DayHours {
  open: string;
  close: string;
  is_open: boolean;
}

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DepartmentManaged {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  operating_hours: OperatingHours | null;
  location?: string | null;
  phone_number?: string | null;
  email?: string | null;
  is_active: boolean;
  provider_count: number;
  appointment_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDepartmentInput {
  name: string;
  code: string;
  description?: string;
  operating_hours?: OperatingHours;
  location?: string;
  phone_number?: string;
  email?: string;
}

export interface UpdateDepartmentInput {
  name?: string;
  code?: string;
  description?: string;
  operating_hours?: OperatingHours;
  location?: string;
  phone_number?: string;
  email?: string;
}

export interface DepartmentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
