/**
 * Time Slot Controller
 *
 * HTTP request handler for the dedicated time-slot caching endpoint.
 *
 * @module timeSlotController
 * @task US_004 TASK_002
 */

import { Request, Response } from 'express';
import { getCachedTimeSlots } from '../services/timeSlotCache';
import logger from '../utils/logger';
import type { TimeSlotQuery } from '../types/timeSlot.types';

class TimeSlotController {
  /**
   * GET /api/timeslots?date=YYYY-MM-DD&providerId=X&departmentId=Y
   */
  async getTimeSlots(req: Request, res: Response): Promise<void> {
    try {
      const date = req.query.date as string | undefined;
      const providerId = req.query.providerId as string | undefined;
      const departmentId = req.query.departmentId as string | undefined;

      if (!date) {
        res.status(400).json({
          success: false,
          error: 'date query parameter is required (YYYY-MM-DD)',
        });
        return;
      }

      const query: TimeSlotQuery = { date, providerId, departmentId };
      const result = await getCachedTimeSlots(query);

      res.status(200).json({
        success: true,
        count: result.data.length,
        cached: result.cached,
        responseTimeMs: result.responseTimeMs,
        data: result.data,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('timeSlotController.getTimeSlots error:', msg);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch time slots',
        message: process.env.NODE_ENV === 'development' ? msg : undefined,
      });
    }
  }
}

export default new TimeSlotController();
