/**
 * Appointments Controller
 * 
 * HTTP request handlers for appointment booking API endpoints.
 * Handles request/response formatting, validation, and error handling.
 * 
 * @module appointments.controller
 * @created 2026-03-18
 * @task US_013 TASK_002
 */

import { Request, Response } from 'express';
import appointmentsService from '../services/appointments.service';
import { sendAppointmentConfirmation } from '../services/emailService';
import { generateAppointmentPDFBuffer } from '../services/pdfService';
import { savePDF, generateSecureDownloadURL } from '../services/storageService';
import { syncAppointmentToCalendarAsync } from '../services/calendarSyncService';
import waitlistNotificationService from '../services/waitlistNotificationService';
import { acceptWaitlistSlot } from '../services/waitlistAcceptanceService';
import { getPatientAppointments as fetchPatientAppointments } from '../services/dashboardService';
import logger from '../utils/logger';
import type { SlotFilters } from '../types/appointments.types';
import type { WaitlistAcceptanceRequest } from '../middleware/validateWaitlistAcceptance';

/**
 * Extended Request with authenticated user
 */
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

class AppointmentsController {
  /**
   * Get available time slots
   * 
   * GET /api/slots?department=X&provider=Y&date=Z
   * 
   * Query params:
   * - departmentId (optional): Filter by department UUID
   * - providerId (optional): Filter by provider UUID
   * - date (optional): Filter by specific date (YYYY-MM-DD)
   * - startDate (optional): Filter by date range start
   * - endDate (optional): Filter by date range end
   * 
   * @param req - Express request
   * @param res - Express response
   */
  async getAvailableSlots(req: Request, res: Response): Promise<void> {
    try {
      const filters: SlotFilters = {
        departmentId: req.query.department as string | undefined,
        providerId: req.query.provider as string | undefined,
        date: req.query.date as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };

      const slots = await appointmentsService.getAvailableSlots(filters);

      res.status(200).json({
        success: true,
        count: slots.length,
        slots,
      });
    } catch (error: any) {
      logger.error('Error in getAvailableSlots:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch available slots',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Book an appointment
   * 
   * POST /api/appointments
   * 
   * Query params:
   * - waitlist_id (optional): Waitlist entry ID for waitlist acceptance booking
   * 
   * Body:
   * - slotId (required): UUID of the time slot
   * - notes (optional): Patient notes/reason for visit (max 500 chars)
   * 
   * Requires authentication (patient role)
   * 
   * @param req - Express request with authenticated user
   * @param res - Express response
   */
  async bookAppointment(req: WaitlistAcceptanceRequest, res: Response): Promise<void> {
    try {
      // Get patient ID from authenticated user (JWT uses userId, not id)
      const patientId = req.user?.id || (req.user as any)?.userId;

      if (!patientId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Check if this is a waitlist acceptance booking
      const isWaitlistAcceptance = !!req.waitlistEntry;
      let bookingResult: any;

      if (isWaitlistAcceptance) {
        // Waitlist acceptance booking
        logger.info(`Processing waitlist acceptance booking: waitlist ${req.waitlistEntry!.id}, patient ${patientId}`);

        bookingResult = await acceptWaitlistSlot({
          waitlistId: req.waitlistEntry!.id,
          reservationId: req.reservation!.id,
          patientId: patientId,
          slotId: req.body.slotId,
          notes: req.body.notes,
        });
      } else {
        // Regular booking
        logger.debug(`Processing regular appointment booking for patient ${patientId}`);

        bookingResult = await appointmentsService.bookAppointment(
          patientId,
          req.body
        );
      }

      // Send confirmation email with PDF attachment (async, don't block response)
      let emailSent = false;
      try {
        // Send email asynchronously - don't wait for completion
        sendAppointmentConfirmation(bookingResult.appointmentId).catch((emailError) => {
          logger.error('Failed to send confirmation email (async):', {
            appointmentId: bookingResult.appointmentId,
            error: emailError.message,
          });
        });
        emailSent = true; // Email queued successfully
      } catch (emailError: any) {
        // Log error but don't fail the booking
        logger.error('Failed to queue confirmation email:', {
          appointmentId: bookingResult.appointmentId,
          error: emailError.message,
        });
      }

      // Generate and save PDF to storage (async, don't block response)
      // Implements US_018 AC1: Automatically generate PDF after booking
      // Implements US_018 AC2: Return secure download URL valid for 7 days
      try {
        // Generate PDF and save to storage asynchronously
        (async () => {
          try {
            const pdfBuffer = await generateAppointmentPDFBuffer(bookingResult.appointmentId);
            await savePDF(pdfBuffer, {
              appointmentId: bookingResult.appointmentId,
              createdBy: req.user?.email || 'system',
            });
            const downloadUrlResult = await generateSecureDownloadURL(bookingResult.appointmentId);
            logger.info('PDF generated and saved after booking', {
              appointmentId: bookingResult.appointmentId,
              downloadUrl: downloadUrlResult.url,
            });
          } catch (pdfError: any) {
            logger.error('Failed to generate/save PDF after booking (async):', {
              appointmentId: bookingResult.appointmentId,
              error: pdfError.message,
            });
          }
        })();
      } catch (pdfError: any) {
        logger.error('Failed to queue PDF generation:', {
          appointmentId: bookingResult.appointmentId,
          error: pdfError.message,
        });
      }

      // Sync appointment to calendar (async, don't block response)
      let calendarSyncAttempted = false;
      if (req.body.syncCalendar && req.body.calendarProvider) {
        try {
          const provider = req.body.calendarProvider;
          
          // Validate provider
          if (provider === 'google' || provider === 'outlook') {
            // Get patient ID as number for calendar sync
            const patientUserId = parseInt(patientId, 10);
            
            if (!isNaN(patientUserId)) {
              // Fire-and-forget calendar sync
              syncAppointmentToCalendarAsync(
                bookingResult.appointmentId,
                patientUserId,
                provider
              );
              calendarSyncAttempted = true;
              
              logger.info('Calendar sync initiated (async)', {
                appointmentId: bookingResult.appointmentId,
                patientId: patientUserId,
                provider,
              });
            }
          } else {
            logger.warn('Invalid calendar provider specified:', {
              provider: req.body.calendarProvider,
              appointmentId: bookingResult.appointmentId,
            });
          }
        } catch (calendarError: any) {
          // Log error but don't fail the booking
          logger.error('Failed to initiate calendar sync:', {
            appointmentId: bookingResult.appointmentId,
            error: calendarError.message,
          });
        }
      }

      res.status(201).json({
        success: true,
        ...bookingResult,
        emailQueued: emailSent,
        calendarSyncAttempted,
      });
    } catch (error: any) {
      logger.error('Error in bookAppointment:', error);

      // Handle specific error codes
      if (error.status === 404 || error.code === 404) {
        res.status(404).json({
          success: false,
          message: error.message,
          code: error.code,
        });
      } else if (error.status === 409 || error.code === 409) {
        res.status(409).json({
          success: false,
          message: error.message,
          code: error.code,
        });
      } else if (error.status === 410 || error.code === 410) {
        res.status(410).json({
          success: false,
          message: error.message,
          code: error.code,
        });
      } else if (error.status === 400 || error.code === 400) {
        res.status(400).json({
          success: false,
          message: error.message,
          code: error.code,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to book appointment',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
      }
    }
  }

  /**
   * Join waitlist for unavailable slot/date
   * 
   * POST /api/waitlist
   * 
   * Body:
   * - slotId (optional): UUID of desired time slot
   * - preferredDate (required): Preferred date (YYYY-MM-DD)
   * - departmentId (required): Department UUID
   * - providerId (optional): Provider UUID
   * - notes (optional): Patient notes/preferences (max 1000 chars)
   * 
   * Requires authentication (patient role)
   * 
   * @param req - Express request with authenticated user
   * @param res - Express response
   */
  async joinWaitlist(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Get patient ID from authenticated user (JWT uses userId, not id)
      const patientId = req.user?.id || (req.user as any)?.userId;

      if (!patientId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const waitlistResult = await appointmentsService.joinWaitlist(
        patientId,
        req.body
      );

      res.status(201).json({
        success: true,
        ...waitlistResult,
      });
    } catch (error: any) {
      logger.error('Error in joinWaitlist:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to join waitlist',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get patient's appointments
   * 
   * GET /api/appointments/patient/:patientId
   * 
   * Requires authentication (patient can only access their own)
   * 
   * @param req - Express request with authenticated user
   * @param res - Express response
   */
  async getPatientAppointments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const requestedPatientId = req.params.patientId as string;
      const authenticatedUserId = req.user?.id || (req.user as any)?.userId;

      // Patients can only access their own appointments
      // Staff/Admin can access any patient's appointments
      if (
        req.user?.role === 'patient' &&
        authenticatedUserId !== requestedPatientId
      ) {
        res.status(403).json({
          success: false,
          message: 'You can only access your own appointments',
        });
        return;
      }

      // TODO: Implement getPatientAppointments in service
      const appointments = await fetchPatientAppointments(parseInt(requestedPatientId, 10));
      res.status(200).json({
        success: true,
        data: appointments,
      });
    } catch (error: any) {
      logger.error('Error in getPatientAppointments:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch appointments',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Cancel an appointment
   * 
   * PATCH /api/appointments/:appointmentId/cancel
   * 
   * Body:
   * - reason (optional): Cancellation reason
   * 
   * Requires authentication
   * 
   * Side Effects:
   * - Updates appointment status to 'cancelled'
   * - Frees up the slot  
   * - Triggers waitlist notification if patients are waiting
   * - Logs audit event
   * 
   * @param req - Express request with authenticated user
   * @param res - Express response
   */
  async cancelAppointment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const appointmentId = Array.isArray(req.params.appointmentId) 
        ? req.params.appointmentId[0] 
        : req.params.appointmentId;
      const userId = req.user?.id || (req.user as any)?.userId;
      const userRole = req.user?.role || 'patient';
      const { reason } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (!appointmentId) {
        res.status(400).json({
          success: false,
          message: 'Appointment ID is required',
        });
        return;
      }

      // Cancel appointment in service
      const result = await appointmentsService.cancelAppointment(
        appointmentId,
        userId,
        userRole,
        reason
      );

      // Trigger waitlist notification asynchronously (non-blocking)
      if (result.shouldNotifyWaitlist && result.slotId) {
        setImmediate(async () => {
          try {
            await waitlistNotificationService.processAvailableSlots([result.slotId]);
            logger.info(`Waitlist notification triggered for slot ${result.slotId}`);
          } catch (waitlistError) {
            logger.error('Failed to notify waitlist:', waitlistError);
            // Don't fail the cancellation if waitlist notification fails
          }
        });
      }

      res.status(200).json({
        success: true,
        message: 'Appointment cancelled successfully',
        appointment: result.appointment,
      });
    } catch (error: any) {
      logger.error('Error in cancelAppointment:', error);

      // Handle specific error codes
      if (error.code === 'APPOINTMENT_NOT_FOUND') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error.code === 'UNAUTHORIZED') {
        res.status(403).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error.code === 'ALREADY_CANCELLED') {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to cancel appointment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Reschedule an appointment to a new slot
   * 
   * PUT /api/appointments/:appointmentId
   * 
   * Body:
   * - newSlotId (required): UUID of new time slot
   * 
   * Business Rules:
   * - Cannot reschedule within 2 hours of appointment start time
   * - Maximum 3 reschedules per appointment
   * - New slot must be available (concurrency safe)
   * - Patient must own the appointment
   * 
   * Side Effects:
   * - Updates appointment record
   * - Increments reschedule_count
   * - Updates slot availability
   * - Invalidates cache
   * - Logs audit trail
   * - Triggers email notification (async)
   * - Triggers PDF regeneration (async)
   * - Triggers calendar sync update (async)
   * 
   * Requires authentication (patient role)
   * 
   * @param req - Express request with authenticated user
   * @param res - Express response
   */
  async rescheduleAppointment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const appointmentId = Array.isArray(req.params.appointmentId)
        ? req.params.appointmentId[0]
        : req.params.appointmentId;
      const patientId = req.user?.id || (req.user as any)?.userId;
      const { newSlotId } = req.body;

      if (!patientId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (!newSlotId) {
        res.status(400).json({
          success: false,
          message: 'newSlotId is required',
        });
        return;
      }

      // Reschedule appointment
      const updatedAppointment = await appointmentsService.rescheduleAppointment(
        appointmentId,
        newSlotId,
        patientId
      );

      // Send confirmation email with updated PDF (async, don't block response)
      let emailSent = false;
      try {
        sendAppointmentConfirmation(appointmentId).catch((emailError) => {
          logger.error('Failed to send reschedule confirmation email (async):', {
            appointmentId,
            error: emailError.message,
          });
        });
        emailSent = true;
      } catch (emailError: any) {
        logger.error('Failed to queue reschedule confirmation email:', {
          appointmentId,
          error: emailError.message,
        });
      }

      // Regenerate and save updated PDF to storage (async, don't block response)
      // Implements US_018 AC1: Automatically generate new PDF after rescheduling
      // Implements US_018 AC2: Return secure download URL valid for 7 days
      try {
        (async () => {
          try {
            const pdfBuffer = await generateAppointmentPDFBuffer(appointmentId);
            await savePDF(pdfBuffer, {
              appointmentId,
              createdBy: req.user?.email || 'system',
            });
            const downloadUrlResult = await generateSecureDownloadURL(appointmentId);
            logger.info('PDF regenerated and saved after rescheduling', {
              appointmentId,
              downloadUrl: downloadUrlResult.url,
            });
          } catch (pdfError: any) {
            logger.error('Failed to regenerate/save PDF after rescheduling (async):', {
              appointmentId,
              error: pdfError.message,
            });
          }
        })();
      } catch (pdfError: any) {
        logger.error('Failed to queue PDF regeneration:', {
          appointmentId,
          error: pdfError.message,
        });
      }

      // Update calendar sync (async, don't block response)
      let calendarSyncAttempted = false;
      if (req.body.syncCalendar && req.body.calendarProvider) {
        try {
          const provider = req.body.calendarProvider;
          
          if (provider === 'google' || provider === 'outlook') {
            const patientUserId = parseInt(patientId, 10);
            
            if (!isNaN(patientUserId)) {
              syncAppointmentToCalendarAsync(
                appointmentId,
                patientUserId,
                provider
              );
              calendarSyncAttempted = true;
              
              logger.info('Calendar sync update initiated (async)', {
                appointmentId,
                patientId: patientUserId,
                provider,
              });
            }
          }
        } catch (calendarError: any) {
          logger.error('Failed to initiate calendar sync update:', {
            appointmentId,
            error: calendarError.message,
          });
        }
      }

      res.status(200).json({
        success: true,
        message: 'Appointment rescheduled successfully',
        appointment: updatedAppointment,
        emailQueued: emailSent,
        calendarSyncAttempted,
      });
    } catch (error: any) {
      logger.error('Error in rescheduleAppointment:', error);

      // Handle specific error codes
      if (error.code === 404) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
      } else if (error.code === 403) {
        res.status(403).json({
          success: false,
          message: error.message,
        });
      } else if (error.code === 409) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
      } else if (error.code === 400) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to reschedule appointment',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
      }
    }
  }
  /**
   * Get dates with available slots (for calendar highlighting)
   *
   * GET /api/slots/available-dates
   */
  async getAvailableDates(req: Request, res: Response): Promise<void> {
    try {
      const filters: SlotFilters = {
        departmentId: req.query.department as string | undefined,
        providerId: req.query.provider as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };

      const dates = await appointmentsService.getAvailableDates(filters);

      res.status(200).json({
        success: true,
        dates,
      });
    } catch (error: any) {
      logger.error('Error in getAvailableDates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch available dates',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get authenticated user's waitlist entries
   *
   * GET /api/waitlist/my
   */
  async getMyWaitlist(req: AuthRequest, res: Response): Promise<void> {
    try {
      const patientId = req.user?.id || (req.user as any)?.userId;

      if (!patientId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const waitlist = await appointmentsService.getMyWaitlistEntries(patientId);

      res.status(200).json({
        success: true,
        waitlist,
      });
    } catch (error: any) {
      logger.error('Error in getMyWaitlist:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch waitlist entries',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

export default new AppointmentsController();
export { AppointmentsController };
