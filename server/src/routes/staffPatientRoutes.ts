/**
 * Staff Patient Routes
 * 
 * Express routes for staff patient search operations.
 * All routes require authentication and staff/admin role.
 * 
 * @module staffPatientRoutes
 * @created 2026-04-01
 * @task US_023 TASK_001
 */

import { Router } from 'express';
import { authenticateToken, authorize } from '../middleware/auth';
import { searchPatients } from '../controllers/staffPatientController';

const router = Router();

// All patient search routes require staff, admin, or doctor role
router.use(authenticateToken);
router.use(authorize('staff', 'admin', 'doctor'));

/**
 * @route   GET /api/staff/patients/search
 * @desc    Search patients by name, phone, or email
 * @access  Private (Staff, Admin)
 * @query   name - Search by patient name (fuzzy ILIKE)
 * @query   phone - Search by phone number (normalized digits)
 * @query   email - Search by email (exact, case-insensitive)
 */
router.get('/search', searchPatients);

export default router;
