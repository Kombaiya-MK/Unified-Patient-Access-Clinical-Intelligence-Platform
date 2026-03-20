/**
 * Audit Log Types
 * 
 * File: app/src/types/audit.types.ts
 * Task: US_011 TASK_004 - Frontend Admin Audit Log Viewer (Types)
 * 
 * Purpose: TypeScript type definitions for audit log data structures
 */

/**
 * Audit Log Entry
 * Represents a single audit log record from the database
 */
export interface AuditLog {
  id: number;
  user_id: number | null;
  user_email?: string;
  user_role?: string;
  action: string;
  table_name: string;
  record_id: number | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
}

/**
 * Filter Parameters
 * Query parameters for filtering and sorting audit logs
 */
export interface FilterParams {
  page?: number;
  pageSize?: number;
  start_date?: string;
  end_date?: string;
  user_id?: number;
  action_type?: string;
  resource_type?: string;
  resource_id?: string;
  order_by?: string;
  order_dir?: 'ASC' | 'DESC';
}

/**
 * Audit Log API Response
 * Response structure from the API including pagination metadata
 */
export interface AuditLogResponse {
  success: boolean;
  data: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * User Option
 * User data for autocomplete dropdown
 */
export interface UserOption {
  id: number;
  email: string;
  role: string;
}

/**
 * Export Format
 * Supported export formats
 */
export type ExportFormat = 'csv' | 'json';
