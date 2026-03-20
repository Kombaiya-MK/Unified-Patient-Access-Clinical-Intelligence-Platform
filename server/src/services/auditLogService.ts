/**
 * Audit Log Service
 * 
 * File: server/src/services/auditLogService.ts
 * Task: US_011 TASK_004 - Frontend Admin Audit Log Viewer (Backend Service)
 * 
 * Purpose: Query audit_logs table with filtering, sorting, and pagination
 * 
 * Features:
 * - Date range filtering (start_date, end_date)
 * - User filtering (user_id)
 * - Action type filtering (LOGIN, CREATE, UPDATE, DELETE, etc.)
 * - Resource type filtering (patient, appointment, user, etc.)
 * - Resource ID search
 * - Sorting (by column and direction)
 * - Pagination (page, pageSize)
 * - Total count for pagination
 */

import { pool } from '../config/database';
import logger from '../utils/logger';

export interface AuditLogFilter {
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

export interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  table_name: string;
  record_id: number | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
  // Joined from users table
  user_email?: string;
  user_role?: string;
}

export interface AuditLogResponse {
  data: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Query audit logs with filters and pagination
 * @param filters - Filter and pagination parameters
 * @returns Paginated audit log response
 */
export async function queryAuditLogs(filters: AuditLogFilter): Promise<AuditLogResponse> {
  try {
    // Default pagination
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const offset = (page - 1) * pageSize;
    
    // Build WHERE clauses
    const whereClauses: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;
    
    // Date range filter
    if (filters.start_date) {
      whereClauses.push(`al.timestamp >= $${paramIndex}`);
      queryParams.push(new Date(filters.start_date));
      paramIndex++;
    }
    
    if (filters.end_date) {
      whereClauses.push(`al.timestamp <= $${paramIndex}`);
      queryParams.push(new Date(filters.end_date));
      paramIndex++;
    }
    
    // User filter
    if (filters.user_id) {
      whereClauses.push(`al.user_id = $${paramIndex}`);
      queryParams.push(filters.user_id);
      paramIndex++;
    }
    
    // Action type filter
    if (filters.action_type) {
      whereClauses.push(`al.action = $${paramIndex}`);
      queryParams.push(filters.action_type);
      paramIndex++;
    }
    
    // Resource type filter (table_name)
    if (filters.resource_type) {
      whereClauses.push(`al.table_name = $${paramIndex}`);
      queryParams.push(filters.resource_type);
      paramIndex++;
    }
    
    // Resource ID filter
    if (filters.resource_id) {
      whereClauses.push(`al.record_id = $${paramIndex}`);
      queryParams.push(parseInt(filters.resource_id, 10));
      paramIndex++;
    }
    
    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
  // Sorting
    const validColumns = ['timestamp', 'action', 'user_id', 'table_name', 'record_id'];
    const orderBy = validColumns.includes(filters.order_by || '') ? filters.order_by : 'timestamp';
    const orderDir = filters.order_dir === 'ASC' ? 'ASC' : 'DESC'; // Default DESC
    
    // Query total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs al
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total, 10);
    
    // Query paginated data with user information
    const dataQuery = `
      SELECT 
        al.id,
        al.user_id,
        al.action,
        al.table_name,
        al.record_id,
        al.old_values,
        al.new_values,
        al.ip_address,
        al.user_agent,
        al.timestamp,
        u.email as user_email,
        u.role as user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.${orderBy} ${orderDir}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const dataParams = [...queryParams, pageSize, offset];
    const dataResult = await pool.query(dataQuery, dataParams);
    
    const totalPages = Math.ceil(total / pageSize);
    
    logger.info('Audit logs queried successfully', {
      filters,
      total,
      page,
      pageSize,
      totalPages,
      resultCount: dataResult.rows.length,
    });
    
    return {
      data: dataResult.rows,
      total,
      page,
      pageSize,
      totalPages,
    };
  } catch (error) {
    logger.error('Failed to query audit logs', {
      error: error instanceof Error ? error.message : 'Unknown error',
      filters,
    });
    throw new Error('Failed to query audit logs');
  }
}

/**
 * Get distinct action types for filter dropdown
 * @returns Array of distinct action types
 */
export async function getDistinctActionTypes(): Promise<string[]> {
  try {
    const query = `
      SELECT DISTINCT action
      FROM audit_logs
      ORDER BY action ASC
    `;
    
    const result = await pool.query(query);
    return result.rows.map(row => row.action);
  } catch (error) {
    logger.error('Failed to get distinct action types', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

/**
 * Get distinct resource types (table names) for filter dropdown
 * @returns Array of distinct resource types
 */
export async function getDistinctResourceTypes(): Promise<string[]> {
  try {
    const query = `
      SELECT DISTINCT table_name
      FROM audit_logs
      WHERE table_name IS NOT NULL
      ORDER BY table_name ASC
    `;
    
    const result = await pool.query(query);
    return result.rows.map(row => row.table_name);
  } catch (error) {
    logger.error('Failed to get distinct resource types', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

/**
 * Search users by email for user filter autocomplete
 * @param searchTerm - Email search term
 * @returns Array of matching users
 */
export async function searchUsers(searchTerm: string): Promise<Array<{ id: number, email: string, role: string }>> {
  try {
    const query = `
      SELECT id, email, role
      FROM users
      WHERE email ILIKE $1
      ORDER BY email ASC
      LIMIT 10
    `;
    
    const result = await pool.query(query, [`%${searchTerm}%`]);
    return result.rows;
  } catch (error) {
    logger.error('Failed to search users', {
      error: error instanceof Error ? error.message : 'Unknown error',
      searchTerm,
    });
    return [];
  }
}

export default {
  queryAuditLogs,
  getDistinctActionTypes,
  getDistinctResourceTypes,
  searchUsers,
};
