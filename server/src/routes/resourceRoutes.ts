/**
 * Resource Routes
 *
 * Lightweight lookup endpoints for departments and providers
 * used by the appointment booking page dropdowns.
 *
 * @module resourceRoutes
 * @created 2026-04-02
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import pool from '../config/database';
import logger from '../utils/logger';

const router = Router();

/**
 * @route   GET /api/departments
 * @desc    List active departments
 * @access  Private (any authenticated user)
 */
router.get('/departments', authenticate, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id::text, name, COALESCE(description,'') AS description, is_active AS "isActive"
       FROM app.departments
       WHERE is_active = TRUE
       ORDER BY name`,
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching departments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch departments' });
  }
});

/**
 * @route   GET /api/providers
 * @desc    List doctors, optionally filtered by department
 * @query   department - department ID (optional)
 * @access  Private (any authenticated user)
 */
router.get('/providers', authenticate, async (req: Request, res: Response) => {
  try {
    const departmentId = req.query.department as string | undefined;

    let sql = `
      SELECT DISTINCT
        u.id::text,
        CONCAT(u.first_name, ' ', u.last_name) AS name,
        COALESCE(d.name, '') AS specialty,
        d.id::text AS "departmentId",
        u.email,
        u.is_active AS "isActive"
      FROM app.users u
      LEFT JOIN app.time_slots ts ON ts.doctor_id = u.id
      LEFT JOIN app.departments d  ON d.id = ts.department_id
      WHERE u.role = 'doctor' AND u.is_active = TRUE
    `;
    const params: string[] = [];

    if (departmentId) {
      params.push(departmentId);
      sql += ` AND ts.department_id = $1`;
    }

    sql += ` ORDER BY name`;

    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching providers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch providers' });
  }
});

export default router;
