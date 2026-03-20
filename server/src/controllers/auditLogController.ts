/**
 * Audit Log Controller
 * 
 * File: server/src/controllers/auditLogController.ts
 * Task: US_011 TASK_004 - Frontend Admin Audit Log Viewer (Controller)
 * 
 * Purpose: Handle HTTP requests for audit log queries and exports
 * 
 * Endpoints:
 * - GET /api/admin/audit-logs - Query audit logs with filters and pagination
 * - GET /api/admin/audit-logs/actions - Get distinct action types
 * - GET /api/admin/audit-logs/resources - Get distinct resource types
 * - GET /api/admin/audit-logs/users/search - Search users for autocomplete
 * - GET /api/admin/audit-logs/export - Export audit logs as CSV or JSON
 */

import { Request, Response, NextFunction } from 'express';
import {
  queryAuditLogs,
  getDistinctActionTypes,
  getDistinctResourceTypes,
  searchUsers,
  AuditLogFilter,
} from '../services/auditLogService';
import logger from '../utils/logger';

/**
 * Get audit logs with filters and pagination
 * @route GET /api/admin/audit-logs
 * @access Private (Admin only)
 */
export const getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filters: AuditLogFilter = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20,
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
      user_id: req.query.user_id ? parseInt(req.query.user_id as string, 10) : undefined,
      action_type: req.query.action_type as string,
      resource_type: req.query.resource_type as string,
      resource_id: req.query.resource_id as string,
      order_by: req.query.order_by as string,
      order_dir: (req.query.order_dir as 'ASC' | 'DESC') || 'DESC',
    };
    
    const result = await queryAuditLogs(filters);
    
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('Failed to get audit logs', {
      error: error instanceof Error ? error.message : 'Unknown error',
      query: req.query,
    });
    next(error);
  }
};

/**
 * Get distinct action types for filter dropdown
 * @route GET /api/admin/audit-logs/actions
 * @access Private (Admin only)
 */
export const getActionTypes = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const actions = await getDistinctActionTypes();
    
    res.json({
      success: true,
      data: actions,
    });
  } catch (error) {
    logger.error('Failed to get action types', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
};

/**
 * Get distinct resource types for filter dropdown
 * @route GET /api/admin/audit-logs/resources
 * @access Private (Admin only)
 */
export const getResourceTypes = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const resources = await getDistinctResourceTypes();
    
    res.json({
      success: true,
      data: resources,
    });
  } catch (error) {
    logger.error('Failed to get resource types', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
};

/**
 * Search users for autocomplete in user filter
 * @route GET /api/admin/audit-logs/users/search
 * @access Private (Admin only)
 */
export const searchUsersForFilter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const searchTerm = req.query.q as string || '';
    
    if (!searchTerm || searchTerm.length < 2) {
      res.json({
        success: true,
        data: [],
      });
      return;
    }
    
    const users = await searchUsers(searchTerm);
    
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    logger.error('Failed to search users', {
      error: error instanceof Error ? error.message : 'Unknown error',
      query: req.query,
    });
    next(error);
  }
};

/**
 * Export audit logs as CSV or JSON
 * @route GET /api/admin/audit-logs/export
 * @access Private (Admin only)
 */
export const exportAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const format = (req.query.format as string) || 'csv';
    
    // Build filters (same as getAuditLogs but no pagination)
    const filters: AuditLogFilter = {
      page: 1,
      pageSize: 10000, // Large limit for export
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
      user_id: req.query.user_id ? parseInt(req.query.user_id as string, 10) : undefined,
      action_type: req.query.action_type as string,
      resource_type: req.query.resource_type as string,
      resource_id: req.query.resource_id as string,
      order_by: req.query.order_by as string || 'timestamp',
      order_dir: (req.query.order_dir as 'ASC' | 'DESC') || 'DESC',
    };
    
    const result = await queryAuditLogs(filters);
    
    if (format === 'json') {
      // Export as JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString()}.json"`);
      
      res.json({
        success: true,
        exportDate: new Date().toISOString(),
        filters,
        total: result.total,
        data: result.data,
      });
    } else {
      // Export as CSV
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString()}.csv"`);
      
      // CSV header
      const csvHeader = 'ID,Timestamp,User ID,User Email,User Role,Action,Resource Type,Resource ID,IP Address,User Agent\n';
      
      // CSV rows
      const csvRows = result.data.map(log => {
        return [
          log.id,
          log.timestamp,
          log.user_id || '',
          log.user_email || '',
          log.user_role || '',
          log.action,
          log.table_name,
          log.record_id || '',
          log.ip_address || '',
          `"${(log.user_agent || '').replace(/"/g, '""')}"`, // Escape quotes
        ].join(',');
      }).join('\n');
      
      res.send(csvHeader + csvRows);
    }
    
    logger.info('Audit logs exported', {
      format,
      filters,
      count: result.data.length,
    });
  } catch (error) {
    logger.error('Failed to export audit logs', {
      error: error instanceof Error ? error.message : 'Unknown error',
      query: req.query,
    });
    next(error);
  }
};

export default {
  getAuditLogs,
  getActionTypes,
  getResourceTypes,
  searchUsersForFilter,
  exportAuditLogs,
};
