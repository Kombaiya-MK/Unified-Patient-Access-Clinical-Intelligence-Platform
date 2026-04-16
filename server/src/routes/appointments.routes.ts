/**
 * Appointments Routes
 * 
 * API routes for appointment booking system:
 * - GET /slots - Fetch available time slots (public/authenticated)
 * - POST /appointments - Book appointment (patient only)
 * - POST /waitlist - Join waitlist (patient only)
 * - GET /appointments/patient/:patientId - Get patient's appointments
 * - PATCH /appointments/:appointmentId/cancel - Cancel appointment
 * 
 * @module appointments.routes
 * @created 2026-03-18
 * @task US_013 TASK_002
 */

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import appointmentsController from '../controllers/appointments.controller';
import { validateWaitlistAcceptance } from '../middleware/validateWaitlistAcceptance';
import {
  bookAppointmentSchema,
  joinWaitlistSchema,
  getSlotsQuerySchema,
  rescheduleAppointmentSchema,
  validate,
  validateQuery,
} from '../validators/appointments.validator';
import { validateRequest } from '../middleware/validation.middleware';
import { AppointmentBookingDTOSchema } from '../schemas/appointmentBookingDTO.schema';

const router = Router();

/**
 * @route   GET /api/slots  * @desc    Get available time slots (with Redis caching)
 * @query   department - Department UUID (optional)
 * @query   provider - Provider UUID (optional)
 * @query   date - Specific date YYYY-MM-DD (optional)
 * @query   startDate - Date range start (optional)
 * @query   endDate - Date range end (optional)
 * @access  Public (or authenticated for better caching)
 * @cache   5 minutes
 */
router.get(
  '/slots',
  validateQuery(getSlotsQuerySchema),
  appointmentsController.getAvailableSlots
);

/**
 * @route   GET /api/slots/available-dates
 * @desc    Get dates that have available time slots (for calendar highlighting)
 * @query   department - Department ID (optional)
 * @query   provider - Provider ID (optional)
 * @query   startDate - Date range start (optional)
 * @query   endDate - Date range end (optional)
 * @access  Public
 */
router.get(
  '/slots/available-dates',
  appointmentsController.getAvailableDates
);

/**
 * @route   GET /api/waitlist/my
 * @desc    Get authenticated user's waitlist entries
 * @access  Private (patient role)
 */
router.get(
  '/waitlist/my',
  authenticate,
  appointmentsController.getMyWaitlist
);

/**
 * @route   GET /api/appointments/my
 * @desc    Get authenticated user's appointments
 * @access  Private (patient role only)
 * @returns Array of appointments for the authenticated patient
 */
router.get(
  '/appointments/my',
  authenticate,
  authorize('patient'),
  async (req, res) => {
    try {
      const { getMyAppointments } = await import('../controllers/dashboardController');
      await getMyAppointments(req, res);
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

/**
 * @route   POST /api/appointments
 * @desc    Book an appointment (supports waitlist acceptance via ?waitlist_id=X)
 * @query   waitlist_id - Waitlist entry ID (optional, for waitlist acceptance)
 * @body    slotId - UUID (required)
 * @body    notes - String max 500 chars (optional)
 * @access  Private (patient role only)
 * @security JWT + Role check
 * @validation bookAppointmentSchema
 * @middleware validateWaitlistAcceptance (checks waitlist ownership/status if waitlist_id provided)
 * @concurrency SELECT FOR UPDATE
 * @business-rules:
 *   - Slot must be available
 *   - Business hours: 8AM - 8PM
 *   - Same-day: >2 hours notice required
 *   - No duplicate bookings (same patient, provider, date)
 *   - Waitlist: Hold must not be expired, slot reserved for patient
 */
router.post(
  '/appointments',
  authenticate,
  authorize('patient'),
  validateWaitlistAcceptance,
  validateRequest(AppointmentBookingDTOSchema),
  validate(bookAppointmentSchema),
  appointmentsController.bookAppointment
);

/**
 * @route   POST /api/waitlist
 * @desc    Join waitlist for unavailable slot/date
 * @body    slotId - UUID (optional)
 * @body    preferredDate - ISO date string (required)
 * @body    departmentId - UUID (required)
 * @body    providerId - UUID (optional)
 * @body    notes - String max 1000 chars (optional)
 * @access  Private (patient role only)
 * @security JWT + Role check
 * @validation joinWaitlistSchema
 */
router.post(
  '/waitlist',
  authenticate,
  authorize('patient'),
  validate(joinWaitlistSchema),
  appointmentsController.joinWaitlist
);

/**
 * @route   GET /api/appointments/patient/:patientId
 * @desc    Get patient's appointments
 * @param   patientId - Patient UUID
 * @access  Private (patient can only access own; staff/admin can access any)
 * @security JWT + Role check + Ownership validation
 */
router.get(
  '/appointments/patient/:patientId',
  authenticate,
  appointmentsController.getPatientAppointments
);

/**
 * @route   PATCH /api/appointments/:appointmentId/cancel
 * @desc    Cancel an appointment
 * @param   appointmentId - Appointment UUID
 * @access  Private
 * @security JWT + Role check + Ownership validation
 */
router.patch(
  '/appointments/:appointmentId/cancel',
  authenticate,
  appointmentsController.cancelAppointment
);

/**
 * @route   PUT /api/appointments/:appointmentId
 * @desc    Reschedule an appointment to a new slot
 * @param   appointmentId - Appointment UUID
 * @body    newSlotId - UUID (required)
 * @access  Private (patient role only)
 * @security JWT + Role check + Ownership validation
 * @validation rescheduleAppointmentSchema
 * @concurrency SELECT FOR UPDATE
 * @business-rules:
 *   - Cannot reschedule within 2 hours of appointment start time
 *   - Maximum 3 reschedules per appointment (enforced via reschedule_count)
 *   - New slot must be available (concurrency safe)
 *   - Patient must own the appointment
 * @side-effects:
 *   - Updates appointment with new slot
 *   - Increments reschedule_count
 *   - Updates slot availability (old slot → available, new slot → unavailable)
 *   - Invalidates Redis cache
 *   - Logs audit trail
 *   - Triggers email notification (async)
 *   - Triggers PDF regeneration (async)
 *   - Triggers calendar sync update (async)
 */
router.put(
  '/appointments/:appointmentId',
  authenticate,
  authorize('patient'),
  validate(rescheduleAppointmentSchema),
  appointmentsController.rescheduleAppointment
);

export default router;
