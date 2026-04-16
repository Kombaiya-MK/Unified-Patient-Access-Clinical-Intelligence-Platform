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
import {
  getUsers,
  createUser,
  updateUser,
  deactivateUser,
  getDepartments,
} from '../controllers/adminUserController';
import {
  listDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deactivateDepartment,
} from '../controllers/departmentController';
import {
  getProviders,
  getProvider,
  createProvider,
  updateProvider,
  deleteProvider,
  getProviderSchedule,
  updateProviderSchedule,
  createBlockedTime,
  getProviderAppointments,
} from '../controllers/providerController';
import {
  getVerification,
  manualVerify,
  getVerificationHistoryHandler,
} from '../controllers/insuranceVerificationController';
import {
  calculateNoshow,
  getAppointmentRiskHandler,
  getHighRiskPatientsHandler,
  getRiskTrendHandler,
  getAttendanceSummaryHandler,
} from '../controllers/risk.controller';
import {
  getRealtimeMetrics,
  getKPIs,
  getChartDataHandler,
  getSystemHealthHandler,
  getAlertsHandler,
  resolveAlertHandler,
  exportMetricsCSV,
} from '../controllers/metrics.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { UserManagementDTOSchema, UserUpdateDTOSchema } from '../schemas/userManagementDTO.schema';

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

// ============================================================================
// User Management Routes (US_035 TASK_001)
// ============================================================================

/**
 * @route   GET /api/admin/users
 * @desc    Get paginated user list with filters
 * @access  Private (Admin only)
 * @query   page, limit, sortBy, sortOrder, role, status, search
 */
router.get('/users', getUsers);

/**
 * @route   POST /api/admin/users
 * @desc    Create a new user account
 * @access  Private (Admin only)
 * @body    { email, password, role, first_name, last_name, phone_number?, department_id? }
 */
router.post('/users', validateRequest(UserManagementDTOSchema), createUser);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user role, department, or profile
 * @access  Private (Admin only)
 * @body    { role?, first_name?, last_name?, phone_number?, department_id? }
 */
router.put('/users/:id', validateRequest(UserUpdateDTOSchema), updateUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Deactivate user account (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/users/:id', deactivateUser);

/**
 * @route   GET /api/admin/departments
 * @desc    Get active departments for dropdown selection
 * @access  Private (Admin only)
 */
router.get('/departments', getDepartments);

// ============================================================================
// Department Management Routes (US_036 TASK_002)
// ============================================================================

/**
 * @route   GET /api/admin/departments/manage
 * @desc    Get paginated departments with provider/appointment counts
 * @access  Private (Admin only)
 * @query   page, limit, status
 */
router.get('/departments/manage', listDepartments);

/**
 * @route   GET /api/admin/departments/manage/:id
 * @desc    Get single department detail
 * @access  Private (Admin only)
 */
router.get('/departments/manage/:id', getDepartment);

/**
 * @route   POST /api/admin/departments/manage
 * @desc    Create a new department
 * @access  Private (Admin only)
 */
router.post('/departments/manage', createDepartment);

/**
 * @route   PUT /api/admin/departments/manage/:id
 * @desc    Update a department
 * @access  Private (Admin only)
 */
router.put('/departments/manage/:id', updateDepartment);

/**
 * @route   PATCH /api/admin/departments/manage/:id/deactivate
 * @desc    Deactivate a department (soft delete)
 * @access  Private (Admin only)
 */
router.patch('/departments/manage/:id/deactivate', deactivateDepartment);

// ============================================================================
// Provider Management Routes (US_036 TASK_003)
// ============================================================================

/**
 * @route   GET /api/admin/providers
 * @desc    Get paginated providers with department/hours info
 * @access  Private (Admin only)
 * @query   page, limit, department_id, specialty, status
 */
router.get('/providers', getProviders);

/**
 * @route   GET /api/admin/providers/:id
 * @desc    Get single provider detail
 * @access  Private (Admin only)
 */
router.get('/providers/:id', getProvider);

/**
 * @route   POST /api/admin/providers
 * @desc    Create a new provider profile
 * @access  Private (Admin only)
 */
router.post('/providers', createProvider);

/**
 * @route   PUT /api/admin/providers/:id
 * @desc    Update provider info and departments
 * @access  Private (Admin only)
 */
router.put('/providers/:id', updateProvider);

/**
 * @route   DELETE /api/admin/providers/:id
 * @desc    Delete provider (validates future appointments first)
 * @access  Private (Admin only)
 */
router.delete('/providers/:id', deleteProvider);

/**
 * @route   GET /api/admin/providers/:id/schedule
 * @desc    Get provider's weekly schedule and blocked times
 * @access  Private (Admin only)
 */
router.get('/providers/:id/schedule', getProviderSchedule);

/**
 * @route   POST /api/admin/providers/:id/schedule
 * @desc    Bulk upsert weekly schedule entries
 * @access  Private (Admin only)
 */
router.post('/providers/:id/schedule', updateProviderSchedule);

/**
 * @route   POST /api/admin/providers/:id/blocked-times
 * @desc    Create a blocked time slot
 * @access  Private (Admin only)
 */
router.post('/providers/:id/blocked-times', createBlockedTime);

/**
 * @route   GET /api/admin/providers/:id/appointments
 * @desc    Get provider's future appointments for reassignment
 * @access  Private (Admin only)
 */
router.get('/providers/:id/appointments', getProviderAppointments);

// ============================================================================
// Insurance Verification Routes (US_037 TASK_002)
// ============================================================================

/**
 * @route   GET /api/admin/insurance/verifications/:patientId
 * @desc    Get latest insurance verification for a patient
 * @access  Private (Admin only)
 */
router.get('/insurance/verifications/:patientId', getVerification);

/**
 * @route   POST /api/admin/insurance/verifications/verify/:appointmentId
 * @desc    Trigger manual insurance verification for an appointment
 * @access  Private (Admin only)
 */
router.post('/insurance/verifications/verify/:appointmentId', manualVerify);

/**
 * @route   GET /api/admin/insurance/verifications/:patientId/history
 * @desc    Get insurance verification history for a patient
 * @access  Private (Admin only)
 * @query   page, limit
 */
router.get('/insurance/verifications/:patientId/history', getVerificationHistoryHandler);

// ============================================================================
// No-Show Risk Routes (US_038 TASK_002)
// ============================================================================

/**
 * @route   POST /api/admin/risk/calculate-noshow
 * @desc    Calculate no-show risk for an appointment
 * @access  Private (Admin only)
 * @body    { appointmentId: number }
 */
router.post('/risk/calculate-noshow', calculateNoshow);

/**
 * @route   GET /api/admin/risk/appointment/:id
 * @desc    Get risk data for a specific appointment
 * @access  Private (Admin only)
 */
router.get('/risk/appointment/:id', getAppointmentRiskHandler);

/**
 * @route   GET /api/admin/risk/high-risk-patients
 * @desc    Get high-risk appointments in next 7 days
 * @access  Private (Admin only)
 */
router.get('/risk/high-risk-patients', getHighRiskPatientsHandler);

/**
 * @route   GET /api/admin/risk/trend/:patientId
 * @desc    Get risk trend for a patient over 12 months
 * @access  Private (Admin only)
 */
router.get('/risk/trend/:patientId', getRiskTrendHandler);

/**
 * @route   GET /api/admin/risk/attendance/:patientId
 * @desc    Get attendance summary for a patient
 * @access  Private (Admin only)
 */
router.get('/risk/attendance/:patientId', getAttendanceSummaryHandler);

// ============================================================================
// Admin Dashboard Metrics Routes (US_039 TASK_001)
// ============================================================================

/**
 * @route   GET /api/admin/metrics/realtime
 * @desc    Get real-time operational metrics (queue, wait time, today's appointments)
 * @access  Private (Admin only)
 */
router.get('/metrics/realtime', getRealtimeMetrics);

/**
 * @route   GET /api/admin/metrics/kpis
 * @desc    Get operational KPIs for a date range
 * @access  Private (Admin only)
 * @query   from, to
 */
router.get('/metrics/kpis', getKPIs);

/**
 * @route   GET /api/admin/metrics/chart-data
 * @desc    Get chart data (daily volume, no-shows by day, appointment types)
 * @access  Private (Admin only)
 * @query   from, to
 */
router.get('/metrics/chart-data', getChartDataHandler);

/**
 * @route   GET /api/admin/metrics/system-health
 * @desc    Get system health indicators (API, DB, Redis, AI)
 * @access  Private (Admin only)
 */
router.get('/metrics/system-health', getSystemHealthHandler);

/**
 * @route   GET /api/admin/metrics/alerts
 * @desc    Get active system alerts
 * @access  Private (Admin only)
 */
router.get('/metrics/alerts', getAlertsHandler);

/**
 * @route   POST /api/admin/metrics/alerts/:id/resolve
 * @desc    Resolve a system alert
 * @access  Private (Admin only)
 */
router.post('/metrics/alerts/:id/resolve', resolveAlertHandler);

/**
 * @route   POST /api/admin/metrics/export
 * @desc    Export metrics data as CSV
 * @access  Private (Admin only)
 * @body    { from, to }
 */
router.post('/metrics/export', exportMetricsCSV);

export default router;
