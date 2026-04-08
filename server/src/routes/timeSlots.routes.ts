/**
 * Time Slots Routes
 *
 * Dedicated endpoint for time-slot availability with Redis caching.
 *
 * @module timeSlots.routes
 * @task US_004 TASK_002
 */

import { Router } from 'express';
import timeSlotController from '../controllers/timeSlotController';

const router = Router();

/**
 * @route   GET /api/timeslots
 * @desc    Get available time slots (cache-aside with 5-min TTL)
 * @query   date         - Slot date YYYY-MM-DD (required)
 * @query   providerId   - Provider UUID (optional)
 * @query   departmentId - Department UUID (optional)
 * @access  Public
 */
router.get('/timeslots', timeSlotController.getTimeSlots);

export default router;
