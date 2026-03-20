/**
 * Admin Routes
 * 
 * File: server/src/routes/admin.routes.ts
 * Task: US_011 TASK_004 - Frontend Admin Audit Log Viewer (Routes)
 * 
 * Purpose: Admin-only routes for system management and audit log viewing
 * 
 * All routes require:
 * - Authentication (authenticate middleware)
 * - Admin role (authorize('admin') middleware)
 */

import { Router } from 'express';
import { authenticateToken, authorize } from '../middleware/auth';
import {
  getAuditLogs,
  getActionTypes,
  getResourceTypes,
  searchUsersForFilter,
  exportAuditLogs,
} from '../controllers/auditLogController';

const router = Router();

// Apply authentication and admin authorization to all routes
router.use(authenticateToken);
router.use(authorize('admin'));

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get paginated audit logs with filters
 * @access  Private (Admin only)
 * @query   page, pageSize, start_date, end_date, user_id, action_type, resource_type, resource_id, order_by, order_dir
 */
router.get('/audit-logs', getAuditLogs);

/**
 * @route   GET /api/admin/audit-logs/actions
 * @desc    Get distinct action types for filter dropdown
 * @access  Private (Admin only)
 */
router.get('/audit-logs/actions', getActionTypes);

/**
 * @route   GET /api/admin/audit-logs/resources
 * @desc    Get distinct resource types for filter dropdown
 * @access  Private (Admin only)
 */
router.get('/audit-logs/resources', getResourceTypes);

/**
 * @route   GET /api/admin/audit-logs/users/search
 * @desc    Search users for autocomplete in filter
 * @access  Private (Admin only)
 * @query   q - Search term
 */
router.get('/audit-logs/users/search', searchUsersForFilter);

/**
 * @route   GET /api/admin/audit-logs/export
 * @desc    Export audit logs as CSV or JSON
 * @access  Private (Admin only)
 * @query   format, start_date, end_date, user_id, action_type, resource_type, resource_id
 */
router.get('/audit-logs/export', exportAuditLogs);

export default router;
