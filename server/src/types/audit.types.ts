/**
 * Comprehensive Audit Logging Types
 * 
 * File: server/src/types/audit.types.ts
 * Purpose: Type definitions for comprehensive audit logging system
 * Task: US_011 TASK_001 - Immutable Audit Logging Service
 * 
 * Features:
 * - All CRUD operations (CREATE, READ, UPDATE, DELETE)
 * - Security events (LOGIN, LOGOUT, AUTHORIZATION_FAILED)
 * - PII-redacted details
 * - HIPAA-compliant immutable logging
 * - 7-year retention support
 */

/**
 * Audit Action Types
 * All possible actions that can be logged
 */
export enum AuditAction {
  // Authentication Events
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  FAILED_LOGIN = 'FAILED_LOGIN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  
  // Authorization Events
  AUTHORIZATION_FAILED = 'AUTHORIZATION_FAILED',
  MISSING_ROLE_CLAIM = 'MISSING_ROLE_CLAIM',
  INVALID_ROLE_CLAIM = 'INVALID_ROLE_CLAIM',
  
  // CRUD Operations
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  
  // Special Access
  ACCESS = 'ACCESS',
  SEARCH = 'SEARCH',
  EXPORT = 'EXPORT',
  
  // Security Events
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  DISTRIBUTED_ATTACK = 'DISTRIBUTED_ATTACK',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  
  // System Events
  CONFIGURATION_CHANGED = 'CONFIGURATION_CHANGED',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
}

/**
 * Audit Log Entry
 * Structure matching audit_logs table in database
 */
export interface AuditLogEntry {
  id?: number; // Auto-generated
  user_id: number | null; // User performing action (null for unauthenticated)
  action: AuditAction | string; // Action type
  table_name: string; // Resource type (e.g., 'patients', 'appointments')
  record_id: string | null; // Resource ID (e.g., patient ID, appointment ID)
  old_values: Record<string, any> | null; // Previous values (for UPDATE/DELETE)
  new_values: Record<string, any> | null; // New values (for INSERT/UPDATE)
  ip_address: string; // Client IP address
  user_agent: string; // User-Agent header
  timestamp?: Date; // Auto-generated server timestamp
}

/**
 * Audit Context
 * Contextual information about the request
 */
export interface AuditContext {
  userId: number | null; // User ID (null for unauthenticated)
  userRole: string | null; // User role (admin, staff, patient)
  ip: string; // IP address
  userAgent: string; // User-Agent header
  method?: string; // HTTP method
  path?: string; // Request path
  statusCode?: number; // Response status code
  duration?: number; // Request duration (ms)
}

/**
 * Resource Information
 * Extracted from request path and params
 */
export interface ResourceInfo {
  resourceType: string; // Type of resource (e.g., 'patient', 'appointment')
  resourceId: string | null; // Specific resource ID (null for collection operations)
}

/**
 * Audit Details
 * Additional metadata stored in new_values JSONB field
 */
export interface AuditDetails {
  method?: string; //HTTP method (GET, POST, PUT, DELETE)
  path?: string; // Request path
  status_code?: number;     // Response status code
  duration?: number; // Request duration (ms)
  query?: Record<string, any>; // Query parameters (PII-redacted)
  request_body?: Record<string, any>; // Request body (PII-redacted)
  error_message?: string; // Error message (if failed)
  changes?: Record<string, any>; // Changed fields (for UPDATE)
  reason?: string; // Reason (for authorization failures)
  metadata?: Record<string, any>; // Additional context
}

/**
 * Audit Error Log Entry
 * Fallback logging when audit_logs INSERT fails
 */
export interface AuditErrorLog {
  id?: number; // Auto-generated
  error_message: string; // Error description
  attempted_entry: Record<string, any>; // The audit entry that failed
  stack_trace: string | null; // Error stack trace
  created_at?: Date; // Auto-generated timestamp
}

/**
 * PII Redaction Rules
 * Fields that contain PII and must be redacted
 */
export const PII_FIELDS = [
  'email',
  'first_name',
  'last_name',
  'full_name',
  'ssn',
  'social_security_number',
  'phone_number',
  'phone',
  'address',
  'street',
  'city',
  'zip',
  'postal_code',
  'date_of_birth',
  'dob',
  'birth_date',
] as const;

/**
 * Resource Type Mapping
 * Maps table/entity names to friendly resource types
 */
export const RESOURCE_TYPE_MAP: Record<string, string> = {
  users: 'user',
  patient_profiles: 'patient',
  appointments: 'appointment',
  departments: 'department',
  notifications: 'notification',
  audit_logs: 'audit_log',
  clinical_documents: 'clinical_document',
  medications: 'medication',
  allergies: 'allergy',
} as const;

/**
 * Audit Configuration
 * Settings for audit logging behavior
 */
export interface AuditConfig {
  enableMiddleware: boolean; // Enable automatic audit middleware
  enablePIIRedaction: boolean; // Enable PII redaction
  failOnAuditError: boolean; // Fail primary operation if audit fails
  logPublicEndpoints: boolean; // Log unauthenticated requests
  enableDetailedLogging: boolean; // Include request/response bodies
  retentionYears: number; // Retention period (default: 7)
}

/**
 * Default Audit Configuration
 */
export const DEFAULT_AUDIT_CONFIG: AuditConfig = {
  enableMiddleware: true,
  enablePIIRedaction: true,
  failOnAuditError: true,
  logPublicEndpoints: false,
  enableDetailedLogging: process.env.NODE_ENV === 'development',
  retentionYears: 7,
};
