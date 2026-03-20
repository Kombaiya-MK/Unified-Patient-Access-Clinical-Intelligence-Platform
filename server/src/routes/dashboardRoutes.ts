/**
 * Dashboard Routes
 * 
 * API routes for patient dashboard data aggregation.
 * All routes require authentication via JWT token.
 * 
 * Routes:
 * - GET /dashboard - Get patient dashboard data
 * 
 * @module dashboardRoutes
 * @created 2026-03-19
 * @task US_019 TASK_004
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getDashboard } from '../controllers/dashboardController';

const router = Router();

// All dashboard routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/patients/dashboard
 * @desc    Get patient dashboard data (patient info, appointments, notifications)
 * @access  Private (Patient only)
 * 
 * @returns {DashboardResponse} Dashboard data with patient info, upcoming/past appointments, notifications
 * 
 * @example
 * GET /api/patients/dashboard
 * Headers: { Authorization: "Bearer <jwt_token>" }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "patient": {
 *       "id": 1,
 *       "firstName": "John",
 *       "lastName": "Doe",
 *       "email": "john@example.com",
 *       "profilePhotoUrl": null
 *     },
 *     "upcomingAppointments": [...],
 *     "pastAppointments": [...],
 *     "notifications": [],
 *     "unreadNotificationCount": 0
 *   },
 *   "timestamp": "2026-03-19T10:00:00.000Z"
 * }
 */
router.get('/dashboard', getDashboard);

export default router;
