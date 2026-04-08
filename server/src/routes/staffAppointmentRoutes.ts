/**
 * Staff Appointment Routes
 * 
 * Express routes for staff-assisted appointment booking.
 * All routes require authentication and staff/admin role.
 * 
 * @module staffAppointmentRoutes
 * @created 2026-04-01
 * @task US_023 TASK_002
 */

import { Router } from 'express';
import { authenticateToken, authorize } from '../middleware/auth';
import { bookForPatient } from '../controllers/staffAppointmentController';

const router = Router();

// All staff appointment routes require staff or admin role
router.use(authenticateToken);
router.use(authorize('staff', 'admin'));

/**
 * @route   POST /api/staff/appointments/book
 * @desc    Book an appointment on behalf of a patient
 * @access  Private (Staff, Admin)
 * @body    patientId, slotId, appointmentType, reasonForVisit?, staffBookingNotes?, bookingPriority, overrideCapacity
 */
router.post('/book', bookForPatient);

export default router;
