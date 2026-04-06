/**
 * Queue Management Routes
 * 
 * Express routes for staff queue management operations.
 * All routes require authentication and staff/admin role.
 * 
 * @module queueRoutes
 * @created 2026-03-31
 * @task US_020 TASK_003
 */

import { Router } from 'express';
import { authenticateToken, authorize } from '../middleware/auth';
import { getTodayQueue, updateStatus } from '../controllers/queueController';

const router = Router();

// All queue routes require staff or admin role
router.use(authenticateToken);
router.use(authorize('staff', 'admin'));

/**
 * @route   GET /api/staff/queue/today
 * @desc    Get today's appointment queue with optional filters
 * @access  Private (Staff, Admin)
 * @query   status - Comma-separated status filter
 * @query   providerId - Filter by provider ID
 * @query   departmentId - Filter by department ID
 * @query   search - Search by patient name
 */
router.get('/today', getTodayQueue);

/**
 * @route   PATCH /api/staff/queue/:id/status
 * @desc    Update appointment status with optimistic locking
 * @access  Private (Staff, Admin)
 * @body    { newStatus: string, version: number }
 */
router.patch('/:id/status', updateStatus);

export default router;
