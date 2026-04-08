/**
 * No-Show Routes
 * 
 * Express routes for no-show marking and undo operations.
 * All routes require authentication and staff/admin role.
 * 
 * @module noShowRoutes
 * @created 2026-04-01
 * @task US_024 TASK_002
 */

import { Router } from 'express';
import { authenticateToken, authorize } from '../middleware/auth';
import { markNoShow, undoNoShow } from '../controllers/noShowController';

const router = Router();

// All no-show routes require staff or admin role
router.use(authenticateToken);
router.use(authorize('staff', 'admin'));

/**
 * @route   PATCH /api/staff/queue/:id/mark-noshow
 * @desc    Mark an appointment as no-show with optional notes and excused flag
 * @access  Private (Staff, Admin)
 * @body    { notes?: string, excusedNoShow?: boolean }
 */
router.patch('/:id/mark-noshow', markNoShow);

/**
 * @route   POST /api/staff/queue/:id/undo-noshow
 * @desc    Undo a no-show marking within the 2-hour window
 * @access  Private (Staff, Admin)
 */
router.post('/:id/undo-noshow', undoNoShow);

export default router;
