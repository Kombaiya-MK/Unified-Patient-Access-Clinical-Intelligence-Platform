import { pool } from '../config/database';
import logger from './logger';
import { AuthAuditLog } from '../types/auth.types';
import { 
  AuditLogEntry, 
  AuditContext, 
  AuditAction,
  AuditDetails,
} from '../types/audit.types';
import { Client } from 'pg';
import { redactAuditLogEntry } from '../middleware/piiRedaction';

/**
 * Comprehensive Audit Logging Service
 * 
 * File: server/src/utils/auditLogger.ts
 * Extended for: US_011 TASK_001 - Immutable Audit Logging Service
 * 
 * HIPAA Compliance Requirements (NFR-003, NFR-005):
 * - Log all authentication attempts (success and failure)
 * - Log all CRUD operations (CREATE, READ, UPDATE, DELETE)
 * - Log authorization failures and security events
 * - Record user identification, timestamp, IP address, action
 * - PII redaction before logging
 * - Immutable logs (INSERT only, no UPDATE/DELETE)
 * - Persistent storage in PostgreSQL audit_logs table
 * - 7-year retention support
 * - Transaction-safe logging (rollback on audit failure)
 * 
 * Logged Events:
 * - Authentication: LOGIN, LOGOUT, FAILED_LOGIN, TOKEN_EXPIRED, TOKEN_INVALID
 * - CRUD: CREATE, READ, UPDATE, DELETE
 * - Authorization: AUTHORIZATION_FAILED, MISSING_ROLE_CLAIM, INVALID_ROLE_CLAIM
 * - Security: RATE_LIMIT_EXCEEDED, DISTRIBUTED_ATTACK, ACCOUNT_LOCKED
 */

/**
 * Log an authentication event to audit_logs table
 * @param event - Authentication event details
 * @returns Promise<void> - Resolves when logged (or fails gracefully)
 */
export const logAuthEvent = async (event: AuthAuditLog): Promise<void> => {
  try {
    const query = `
      INSERT INTO audit_logs (
        user_id,
        action,
        ip_address,
        user_agent,
        table_name,
        record_id,
        old_values,
        new_values,
        created_at
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        'users',
        $5,
        NULL,
        $6,
        NOW()
      )
    `;

    const values = [
      event.userId,
      event.action,
      event.ipAddress,
      event.userAgent,
      event.userId, // record_id (user being authenticated)
      JSON.stringify({
        success: event.success,
        errorMessage: event.errorMessage || null,
        metadata: event.metadata || {},
        timestamp: new Date().toISOString(),
      }),
    ];

    await pool.query(query, values);

    logger.info('Authentication event logged', {
      action: event.action,
      userId: event.userId,
      success: event.success,
      ipAddress: event.ipAddress,
    });
  } catch (error) {
    // Don't throw error - audit logging should not block authentication flow
    // Log error and continue
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to log authentication event to database', {
      error: errorMessage,
      event,
    });
  }
};

/**
 * Log successful login
 * @param userId - ID of authenticated user
 * @param ipAddress - IP address of request
 * @param userAgent - User-Agent header from request
 */
export const logLogin = async (
  userId: number,
  ipAddress: string,
  userAgent: string,
): Promise<void> => {
  await logAuthEvent({
    userId,
    action: 'LOGIN',
    ipAddress,
    userAgent,
    success: true,
  });
};

/**
 * Log failed login attempt
 * @param email - Email attempted (user may not exist)
 * @param ipAddress - IP address of request
 * @param userAgent - User-Agent header from request
 * @param errorMessage - Reason for failure
 */
export const logLoginFailed = async (
  email: string,
  ipAddress: string,
  userAgent: string,
  errorMessage: string,
): Promise<void> => {
  await logAuthEvent({
    userId: null, // No user ID for failed attempts
    action: 'LOGIN_FAILED',
    ipAddress,
    userAgent,
    success: false,
    errorMessage,
    metadata: { email }, // Store email in metadata for investigation
  });
};

/**
 * Log successful logout
 * @param userId - ID of user logging out
 * @param ipAddress - IP address of request
 * @param userAgent - User-Agent header from request
 */
export const logLogout = async (
  userId: number,
  ipAddress: string,
  userAgent: string,
): Promise<void> => {
  await logAuthEvent({
    userId,
    action: 'LOGOUT',
    ipAddress,
    userAgent,
    success: true,
  });
};

/**
 * Log expired token usage attempt
 * @param userId - ID from expired token (if decodable)
 * @param ipAddress - IP address of request
 * @param userAgent - User-Agent header from request
 */
export const logTokenExpired = async (
  userId: number | null,
  ipAddress: string,
  userAgent: string,
): Promise<void> => {
  await logAuthEvent({
    userId,
    action: 'TOKEN_EXPIRED',
    ipAddress,
    userAgent,
    success: false,
    errorMessage: 'JWT token has expired',
  });
};

/**
 * Log invalid token usage attempt
 * @param ipAddress - IP address of request
 * @param userAgent - User-Agent header from request
 * @param errorMessage - Description of token invalidity
 */
export const logTokenInvalid = async (
  ipAddress: string,
  userAgent: string,
  errorMessage: string,
): Promise<void> => {
  await logAuthEvent({
    userId: null, // Cannot decode invalid token
    action: 'TOKEN_INVALID',
    ipAddress,
    userAgent,
    success: false,
    errorMessage,
  });
};

/**
 * Get recent audit logs for a user
 * Useful for security monitoring and debugging
 * @param userId - User ID to query
 * @param limit - Maximum number of logs to return
 * @returns Array of audit log entries
 */
export const getRecentAuthLogs = async (
  userId: number,
  limit: number = 10,
): Promise<any[]> => {
  try {
    const query = `
      SELECT 
        id,
        action,
        ip_address,
        user_agent,
        new_values,
        created_at
      FROM audit_logs
      WHERE user_id = $1
        AND action IN ('LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'TOKEN_EXPIRED', 'TOKEN_INVALID')
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  } catch (error) {
    logger.error('Failed to retrieve audit logs', {
      userId,
      error,
    });
    return [];
  }
};

/**
 * Get failed login attempts for security monitoring
 * Useful for detecting brute-force attacks
 * @param timeWindowMinutes - Time window to check (default: 60 minutes)
 * @returns Array of failed login attempts with IP addresses
 */
export const getFailedLoginAttempts = async (
  timeWindowMinutes: number = 60,
): Promise<any[]> => {
  try {
    const query = `
      SELECT 
        ip_address,
        new_values->>'metadata' as metadata,
        COUNT(*) as attempt_count,
        MAX(created_at) as last_attempt
      FROM audit_logs
      WHERE action = 'LOGIN_FAILED'
        AND created_at > NOW() - INTERVAL '${timeWindowMinutes} minutes'
      GROUP BY ip_address, new_values->>'metadata'
      HAVING COUNT(*) > 5
      ORDER BY attempt_count DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    logger.error('Failed to retrieve failed login attempts', {
      error,
    });
    return [];
  }
};

export default {
  logAuthEvent,
  logLogin,
  logLoginFailed,
  logLogout,
  logTokenExpired,
  logTokenInvalid,
  getRecentAuthLogs,
  getFailedLoginAttempts,
  // New comprehensive audit logging functions
  logAuditEntry,
  logCreate,
  logRead,
  logUpdate,
  logDelete,
  logAccess,
  logSearch,
  logExport,
  logAuthorizationFailure,
  logSecurityEvent,
  logSystemError,
  redactPII,
  logToErrorTable,
};

// ============================================================================
// COMPREHENSIVE AUDIT LOGGING FUNCTIONS
// Added for US_011 TASK_001
// ============================================================================

/**
 * Redact PII from Object
 * Replace PII fields with appropriate redaction modes for HIPAA compliance
 * 
 * ENHANCED in US_011 TASK_003:
 * - Field-based redaction (50+ known PII fields)
 * - Pattern-based redaction (regex for SSN, email, phone, credit cards)
 * - Multiple redaction modes (MASK, REDACT, REFERENCE, HASH, etc.)
 * - Validation algorithms (Luhn for credit cards, SSN validation)
 * - Preserves entity IDs for audit traceability
 * - Whitelist for safe fields (IDs, timestamps, status codes)
 * 
 * @param data - Object potentially containing PII
 * @returns Object with PII redacted
 * 
 * @example
 * ```typescript
 * const input = { 
 *   email: 'patient@example.com', 
 *   patient_id: 123,
 *   ssn: '123-45-6789',
 *   notes: 'Patient called from phone (555) 123-4567'
 * };
 * redactPII(input);
 * // { 
 * //   email: 'p***@example.com',              // MASK mode
 * //   patient_id: 123,                        // Preserved
 * //   ssn: '[REDACTED]',                      // REDACT mode
 * //   notes: 'Patient called from phone [REDACTED]'  // Pattern detection
 * // }
 * ```
 */
export function redactPII(data: any): any {
  // Use comprehensive PII redaction middleware from US_011 TASK_003
  return redactAuditLogEntry(data);
}

/**
 * Core Audit Log Entry Function
 * Universal function for logging all audit events
 * 
 * @param entry - Audit log entry
 * @param client - Optional PostgreSQL client for transaction support
 * @throws Error if audit logging fails and no error table fallback
 * 
 * Features:
 * - PII redaction
 * - Transaction support
 * - Error table fallback
 * - Graceful degradation
 */
export async function logAuditEntry(
  entry: Partial<AuditLogEntry>,
  client?: Client,
): Promise<void> {
  try {
    // Redact PII from old_values and new_values
    const redactedOldValues = entry.old_values ? redactPII(entry.old_values) : null;
    const redactedNewValues = entry.new_values ? redactPII(entry.new_values) : null;
    
    const query = `
      INSERT INTO audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values,
        ip_address,
        user_agent,
        timestamp
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW()
      )
    `;
    
    const values = [
      entry.user_id || null,
      entry.action || AuditAction.ACCESS,
      entry.table_name || 'unknown',
      entry.record_id || null,
      redactedOldValues ? JSON.stringify(redactedOldValues) : null,
      redactedNewValues ? JSON.stringify(redactedNewValues) : null,
      entry.ip_address || 'unknown',
      entry.user_agent || 'unknown',
    ];
    
    // Use provided client (transaction) or pool
    if (client) {
      await client.query(query, values);
    } else {
      await pool.query(query, values);
    }
    
    logger.debug('Audit entry logged', {
      action: entry.action,
      tableName: entry.table_name,
      recordId: entry.record_id,
      userId: entry.user_id,
    });
  } catch (error) {
    // Log to error table as fallback
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to log audit entry', {
      error: errorMessage,
      entry,
    });
    
    // Attempt to log to audit_error_logs table
    await logToErrorTable(errorMessage, entry, error);
    
    // Re-throw error to fail the primary operation (transaction safety)
    throw new Error(`Audit logging failed: ${errorMessage}`);
  }
}

/**
 * Log CREATE Operation
 * 
 * @param userId - User performing action
 * @param tableName - Table/resource type
 * @param recordId - Created record ID
 * @param newValues - Created record data
 * @param context - Audit context
 * @param client - Optional client for transaction
 */
export async function logCreate(
  userId: number,
  tableName: string,
  recordId: string,
  newValues: Record<string, any>,
  context: AuditContext,
  client?: Client,
): Promise<void> {
  await logAuditEntry({
    user_id: userId,
    action: AuditAction.CREATE,
    table_name: tableName,
    record_id: recordId,
    old_values: null,
    new_values: newValues,
    ip_address: context.ip,
    user_agent: context.userAgent,
  }, client);
}

/**
 * Log READ Operation
 * 
 * @param userId - User performing action
 * @param tableName - Table/resource type
 * @param recordId - Accessed record ID
 * @param context - Audit context
 * @param client - Optional client for transaction
 */
export async function logRead(
  userId: number,
  tableName: string,
  recordId: string,
  context: AuditContext,
  client?: Client,
): Promise<void> {
  await logAuditEntry({
    user_id: userId,
    action: AuditAction.READ,
    table_name: tableName,
    record_id: recordId,
    old_values: null,
    new_values: { accessed: true, timestamp: new Date().toISOString() },
    ip_address: context.ip,
    user_agent: context.userAgent,
  }, client);
}

/**
 * Log UPDATE Operation
 * 
 * @param userId - User performing action
 * @param tableName - Table/resource type
 * @param recordId - Updated record ID
 * @param oldValues - Previous record data
 * @param newValues - New record data
 * @param context - Audit context
 * @param client - Optional client for transaction
 */
export async function logUpdate(
  userId: number,
  tableName: string,
  recordId: string,
  oldValues: Record<string, any>,
  newValues: Record<string, any>,
  context: AuditContext,
  client?: Client,
): Promise<void> {
  await logAuditEntry({
    user_id: userId,
    action: AuditAction.UPDATE,
    table_name: tableName,
    record_id: recordId,
    old_values: oldValues,
    new_values: newValues,
    ip_address: context.ip,
    user_agent: context.userAgent,
  }, client);
}

/**
 * Log DELETE Operation
 * 
 * @param userId - User performing action
 * @param tableName - Table/resource type
 * @param recordId - Deleted record ID
 * @param oldValues - Deleted record data
 * @param context - Audit context
 * @param client - Optional client for transaction
 */
export async function logDelete(
  userId: number,
  tableName: string,
  recordId: string,
  oldValues: Record<string, any>,
  context: AuditContext,
  client?: Client,
): Promise<void> {
  await logAuditEntry({
    user_id: userId,
    action: AuditAction.DELETE,
    table_name: tableName,
    record_id: recordId,
    old_values: oldValues,
    new_values: null,
    ip_address: context.ip,
    user_agent: context.userAgent,
  }, client);
}

/**
 * Log General ACCESS Operation
 * 
 * @param userId - User performing action
 * @param tableName - Table/resource type
 * @param recordId - Accessed record ID
 * @param details - Additional details
 * @param context - Audit context
 * @param client - Optional client for transaction
 */
export async function logAccess(
  userId: number,
  tableName: string,
  recordId: string,
  details: AuditDetails,
  context: AuditContext,
  client?: Client,
): Promise<void> {
  await logAuditEntry({
    user_id: userId,
    action: AuditAction.ACCESS,
    table_name: tableName,
    record_id: recordId,
    old_values: null,
    new_values: details,
    ip_address: context.ip,
    user_agent: context.userAgent,
  }, client);
}

/**
 * Log SEARCH Operation
 * 
 * @param userId - User performing action
 * @param tableName - Table/resource type being searched
 * @param searchParams - Search parameters (PII-redacted)
 * @param context - Audit context
 * @param client - Optional client for transaction
 */
export async function logSearch(
  userId: number,
  tableName: string,
  searchParams: Record<string, any>,
  context: AuditContext,
  client?: Client,
): Promise<void> {
  await logAuditEntry({
    user_id: userId,
    action: AuditAction.SEARCH,
    table_name: tableName,
    record_id: 'search',
    old_values: null,
    new_values: { searchParams, timestamp: new Date().toISOString() },
    ip_address: context.ip,
    user_agent: context.userAgent,
  }, client);
}

/**
 * Log EXPORT Operation
 * 
 * @param userId - User performing action
 * @param tableName - Table/resource type being exported
 * @param exportParams - Export parameters
 * @param context - Audit context
 * @param client - Optional client for transaction
 */
export async function logExport(
  userId: number,
  tableName: string,
  exportParams: Record<string, any>,
  context: AuditContext,
  client?: Client,
): Promise<void> {
  await logAuditEntry({
    user_id: userId,
    action: AuditAction.EXPORT,
    table_name: tableName,
    record_id: 'export',
    old_values: null,
    new_values: { exportParams, timestamp: new Date().toISOString() },
    ip_address: context.ip,
    user_agent: context.userAgent,
  }, client);
}

/**
 * Log Authorization Failure
 * 
 * @param userId - User attempting action
 * @param path - Request path
 * @param userRole - User's role
 * @param requiredRoles - Required roles
 * @param context - Audit context
 * @param client - Optional client for transaction
 */
export async function logAuthorizationFailure(
  userId: number | null,
  path: string,
  userRole: string | null,
  requiredRoles: string[],
  context: AuditContext,
  client?: Client,
): Promise<void> {
  await logAuditEntry({
    user_id: userId,
    action: AuditAction.AUTHORIZATION_FAILED,
    table_name: 'authorization',
    record_id: path,
    old_values: null,
    new_values: {
      path,
      userRole,
      requiredRoles,
      timestamp: new Date().toISOString(),
    },
    ip_address: context.ip,
    user_agent: context.userAgent,
  }, client);
}

/**
 * Log Security Event
 * 
 * @param userId - User involved (null if unknown)
 * @param eventType - Type of security event
 * @param details - Event details
 * @param context - Audit context
 * @param client - Optional client for transaction
 */
export async function logSecurityEvent(
  userId: number | null,
  eventType: string,
  details: Record<string, any>,
  context: AuditContext,
  client?: Client,
): Promise<void> {
  await logAuditEntry({
    user_id: userId,
    action: eventType as AuditAction,
    table_name: 'security',
    record_id: eventType,
    old_values: null,
    new_values: { ...details, timestamp: new Date().toISOString() },
    ip_address: context.ip,
    user_agent: context.userAgent,
  }, client);
}

/**
 * Log System Error
 * 
 * @param userId - User involved (null if system error)
 * @param errorMessage - Error message
 * @param details - Error details
 * @param context - Audit context
 * @param client - Optional client for transaction
 */
export async function logSystemError(
  userId: number | null,
  errorMessage: string,
  details: Record<string, any>,
  context: AuditContext,
  client?: Client,
): Promise<void> {
  await logAuditEntry({
    user_id: userId,
    action: AuditAction.SYSTEM_ERROR,
    table_name: 'system',
    record_id: 'error',
    old_values: null,
    new_values: {
      errorMessage,
      ...details,
      timestamp: new Date().toISOString(),
    },
    ip_address: context.ip,
    user_agent: context.userAgent,
  }, client);
}

/**
 * Log to Error Table (Fallback)
 * When audit_logs INSERT fails, log to audit_error_logs
 * 
 * @param errorMessage - Error description
 * @param attemptedEntry - The audit entry that failed
 * @param originalError - Original error object
 */
async function logToErrorTable(
  errorMessage: string,
  attemptedEntry: any,
  originalError: any,
): Promise<void> {
  try {
    const stackTrace = originalError instanceof Error 
      ? originalError.stack 
      : String(originalError);
    
    const query = `
      INSERT INTO audit_error_logs (
        error_message,
        attempted_entry,
        stack_trace,
        created_at
      ) VALUES (
        $1, $2, $3, NOW()
      )
    `;
    
    const values = [
      errorMessage,
      JSON.stringify(attemptedEntry),
      stackTrace,
    ];
    
    await pool.query(query, values);
    
    logger.info('Audit error logged to error table', {
      errorMessage,
    });
  } catch (errorTableError) {
    // Last resort: log to console
    logger.error('Failed to log to audit_error_logs table', {
      originalError: errorMessage,
      errorTableError,
      attemptedEntry,
    });
    
    console.error('CRITICAL: Audit logging completely failed', {
      originalError: errorMessage,
      errorTableError,
      attemptedEntry: JSON.stringify(attemptedEntry),
    });
  }
}
