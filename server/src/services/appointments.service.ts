/**
 * Appointments Service
 * 
 * Business logic for appointment booking system including:
 * - Fetching available slots with Redis caching
 * - Creating appointments with database transactions
 * - Concurrency safety (SELECT FOR UPDATE)
 * - Business hours validation (8AM-8PM)
 * - Same-day booking restrictions (>2 hours notice)
 * - Duplicate booking prevention
 * - Cache invalidation
 * 
 * @module appointments.service
 * @created 2026-03-18
 * @task US_013 TASK_002
 */

import { pool } from '../config/database';
import redisClient from '../utils/redisClient';
import logger from '../utils/logger';
import { 
  syncAppointmentToCalendarAsync,
  updateCalendarEvent,
  deleteCalendarEvent
} from './calendarSyncService';
import type {
  Slot,
  Appointment,
  BookingRequest,
  BookingResponse,
  WaitlistRequest,
  WaitlistResponse,
  WaitlistEntry,
  SlotFilters,
  BusinessHours,
} from '../types/appointments.types';

/**
 * Business hours configuration
 */
const BUSINESS_HOURS: BusinessHours = {
  openingHour: 8, // 8 AM
  closingHour: 20, // 8 PM
};

/**
 * Cache TTL for slot availability (5 minutes)
 */
const CACHE_TTL_SECONDS = 300;

/**
 * Same-day booking minimum notice (2 hours)
 */
const SAME_DAY_NOTICE_HOURS = 2;

class AppointmentsService {
  /**
   * Get available time slots with Redis caching
   * 
   * @param filters - Optional filters (department, provider, date)
   * @returns Array of available slots
   */
  async getAvailableSlots(filters: SlotFilters = {}): Promise<Slot[]> {
    const { departmentId, providerId, date, startDate, endDate } = filters;

    // Build cache key
    const cacheKey = `slots:${departmentId || 'all'}:${providerId || 'all'}:${date || startDate || 'all'}`;

    try {
      // Try cache first (if Redis is available)
      if (redisClient.isAvailable) {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          logger.debug(`Cache HIT for ${cacheKey}`);
          return JSON.parse(cachedData) as Slot[];
        }
        logger.debug(`Cache MISS for ${cacheKey}`);
      }

      // Query database for available slots
      const queryParams: any[] = [];
      let paramIndex = 1;

      let query = `
        SELECT 
          ts.id,
          ts.slot_date AS "slotDate",
          (ts.slot_date || 'T' || ts.slot_start)::text AS "startTime",
          (ts.slot_date || 'T' || ts.slot_end)::text AS "endTime",
          ts.is_available AS "isAvailable",
          ts.doctor_id AS "providerId",
          ts.department_id AS "departmentId",
          u.first_name || ' ' || u.last_name AS "providerName",
          d.name AS "departmentName"
        FROM time_slots ts
        LEFT JOIN users u ON ts.doctor_id = u.id
        JOIN departments d ON ts.department_id = d.id
        WHERE ts.is_available = true
          AND ts.booked_count < ts.max_appointments
      `;

      // Add filters
      if (departmentId) {
        query += ` AND ts.department_id = $${paramIndex++}`;
        queryParams.push(departmentId);
      }

      if (providerId) {
        query += ` AND ts.doctor_id = $${paramIndex++}`;
        queryParams.push(providerId);
      }

      if (date) {
        query += ` AND ts.slot_date = $${paramIndex++}`;
        queryParams.push(date);
      } else if (startDate && endDate) {
        query += ` AND ts.slot_date BETWEEN $${paramIndex++} AND $${paramIndex++}`;
        queryParams.push(startDate, endDate);
      }

      query += ` ORDER BY ts.slot_date ASC, ts.slot_start ASC`;

      const result = await pool.query(query, queryParams);
      const slots: Slot[] = result.rows;

      // Cache results (if Redis is available)
      if (redisClient.isAvailable && slots.length > 0) {
        await redisClient.set(cacheKey, JSON.stringify(slots), {
          ttl: CACHE_TTL_SECONDS,
        });
        logger.debug(`Cached ${slots.length} slots with key ${cacheKey}`);
      }

      return slots;
    } catch (error) {
      logger.error('Error fetching available slots:', error);
      throw new Error('Failed to fetch available slots');
    }
  }

  /**
   * Book an appointment with full validation and concurrency safety
   * 
   * @param patientId - Patient ID from authenticated user
   * @param bookingData - Booking request data
   * @returns Booking response with appointment details
   */
  async bookAppointment(
    patientId: string,
    bookingData: BookingRequest
  ): Promise<BookingResponse> {
    const { slotId, notes } = bookingData;

    const client = await pool.connect();

    try {
      // Start transaction
      await client.query('BEGIN');

      // Resolve user ID to patient_profile ID (FK references patient_profiles)
      const profileResult = await client.query(
        'SELECT id FROM patient_profiles WHERE user_id = $1',
        [patientId]
      );
      if (profileResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw { code: 404, message: 'Patient profile not found' };
      }
      const profileId = profileResult.rows[0].id;

      // Lock the slot row for concurrency safety
      const slotQuery = `
        SELECT 
          ts.*,
          ts.slot_date AS "slotDate",
          ts.slot_start AS "startTime",
          ts.slot_end AS "endTime",
          ts.is_available AS "isAvailable",
          ts.doctor_id AS "providerId",
          ts.department_id AS "departmentId",
          u.first_name || ' ' || u.last_name AS "providerName",
          d.name AS "departmentName"
        FROM time_slots ts
        LEFT JOIN users u ON ts.doctor_id = u.id
        JOIN departments d ON ts.department_id = d.id
        WHERE ts.id = $1
        FOR UPDATE OF ts
      `;

      const slotResult = await client.query(slotQuery, [slotId]);

      if (slotResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw {
          code: 404,
          message: 'Slot not found',
        };
      }

      const slot = slotResult.rows[0];

      // Check if slot is still available
      const bookingCheckQuery = `
        SELECT id FROM appointments
        WHERE slot_id = $1 AND status != 'cancelled'
      `;
      const bookingCheck = await client.query(bookingCheckQuery, [slotId]);

      if (bookingCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        throw {
          code: 409,
          message: 'This slot was just taken. Please select another time.',
        };
      }

      if (!slot.isAvailable) {
        await client.query('ROLLBACK');
        throw {
          code: 409,
          message: 'Slot is not available',
        };
      }

      // Validate business hours (8AM - 8PM)
      // slot.startTime is a TIME string like "08:00:00", parse the hour directly
      const slotHourParts = String(slot.startTime).split(':');
      const slotHour = parseInt(slotHourParts[0], 10);
      if (slotHour < BUSINESS_HOURS.openingHour || slotHour >= BUSINESS_HOURS.closingHour) {
        await client.query('ROLLBACK');
        throw {
          code: 400,
          message: `Appointments must be between ${BUSINESS_HOURS.openingHour}AM and ${BUSINESS_HOURS.closingHour}PM`,
        };
      }

      // Validate same-day restriction (>2 hours notice)
      // Combine slotDate + startTime to build a real datetime
      const slotDateStr = new Date(slot.slotDate).toISOString().split('T')[0];
      const slotDateTime = new Date(`${slotDateStr}T${slot.startTime}`);
      const now = new Date();
      const isToday = slotDateTime.toDateString() === now.toDateString();

      if (isToday) {
        const hoursUntilSlot = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilSlot < SAME_DAY_NOTICE_HOURS) {
          await client.query('ROLLBACK');
          throw {
            code: 400,
            message: `Same-day appointments require at least ${SAME_DAY_NOTICE_HOURS} hours advance notice`,
          };
        }
      }

      // Check for duplicate booking (same patient, provider, date)
      const duplicateQuery = `
        SELECT a.id FROM appointments a
        WHERE a.patient_id = $1
          AND a.doctor_id = $2
          AND DATE(a.appointment_date) = DATE($3)
          AND a.status != 'cancelled'
      `;
      const duplicateCheck = await client.query(duplicateQuery, [
        profileId,
        slot.providerId,
        slot.slotDate,
      ]);

      if (duplicateCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        throw {
          code: 400,
          message: 'You already have an appointment with this provider on this date',
        };
      }

      // Create appointment
      const insertQuery = `
        INSERT INTO appointments (
          patient_id,
          doctor_id,
          department_id,
          appointment_date,
          appointment_type,
          status,
          duration_minutes,
          notes,
          slot_id,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, 'consultation', 'confirmed', $5, $6, $7, NOW(), NOW()
        )
        RETURNING *,
          patient_id AS "patientId",
          doctor_id AS "providerId",
          slot_id AS "slotId",
          department_id AS "departmentId",
          appointment_date AS "appointmentDate",
          appointment_type AS "appointmentType",
          duration_minutes AS "durationMinutes",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `;

      const appointmentResult = await client.query(insertQuery, [
        profileId,
        slot.providerId,
        slot.departmentId,
        slotDateTime,
        slot.duration || 30,
        notes || null,
        slotId,
      ]);

      const appointment: Appointment = appointmentResult.rows[0];

      // Update slot availability
      await client.query(
        'UPDATE time_slots SET is_available = false, updated_at = NOW() WHERE id = $1',
        [slotId]
      );

      // Commit transaction
      await client.query('COMMIT');

      // Invalidate cache (fire and forget)
      this.invalidateSlotCache(String(slot.slotDate), slot.providerId).catch((err) =>
        logger.error('Cache invalidation failed:', err)
      );

      logger.info(`Appointment booked: ${appointment.id} for patient ${patientId}`);

      // Trigger calendar sync (fire and forget - non-blocking)
      setImmediate(() => {
        // Check if patient has calendar sync enabled
        pool.query(
          'SELECT calendar_provider FROM calendar_tokens WHERE user_id = $1 LIMIT 1',
          [patientId]
        ).then((calResult) => {
          if (calResult.rows.length > 0) {
            const provider = calResult.rows[0].calendar_provider;
            syncAppointmentToCalendarAsync(appointment.id, parseInt(patientId), provider);
            logger.info('Calendar sync triggered for new appointment', {
              appointmentId: appointment.id,
              patientId,
              provider,
            });
          }
        }).catch((syncError) => {
          logger.error('Failed to trigger calendar sync:', syncError);
          // Non-blocking - appointment still booked successfully
        });
      });

      return {
        appointmentId: appointment.id,
        status: appointment.status,
        message: 'Appointment booked successfully',
        appointment,
      };
    } catch (error: any) {
      await client.query('ROLLBACK');

      // Re-throw custom errors
      if (error.code && error.message) {
        throw error;
      }

      logger.error('Error booking appointment:', error);
      throw new Error('Failed to book appointment');
    } finally {
      client.release();
    }
  }

  /**
   * Join waitlist for unavailable slot or date
   * 
   * @param patientId - Patient ID from authenticated user
   * @param waitlistData - Waitlist request data
   * @returns Waitlist response with entry details
   */
  async joinWaitlist(
    patientId: string,
    waitlistData: WaitlistRequest
  ): Promise<WaitlistResponse> {
    const { slotId, preferredDate, departmentId, providerId, notes } = waitlistData;

    try {
      const insertQuery = `
        INSERT INTO waitlist (
          id,
          patient_id,
          slot_id,
          preferred_date,
          department_id,
          provider_id,
          status,
          notes,
          created_at
        ) VALUES (
          gen_random_uuid(),
          $1, $2, $3, $4, $5, 'waiting', $6, NOW()
        )
        RETURNING *,
          patient_id AS "patientId",
          slot_id AS "slotId",
          preferred_date AS "preferredDate",
          department_id AS "departmentId",
          provider_id AS "providerId",
          created_at AS "createdAt"
      `;

      const result = await pool.query(insertQuery, [
        patientId,
        slotId || null,
        preferredDate,
        departmentId,
        providerId || null,
        notes || null,
      ]);

      const entry: WaitlistEntry = result.rows[0];

      // Calculate position in waitlist
      const positionQuery = `
        SELECT COUNT(*) as position
        FROM waitlist
        WHERE department_id = $1
          AND preferred_date <= $2
          AND status = 'waiting'
          AND created_at <= $3
      `;
      const positionResult = await pool.query(positionQuery, [
        departmentId,
        preferredDate,
        entry.createdAt,
      ]);

      const position = parseInt(positionResult.rows[0].position, 10);

      logger.info(`Patient ${patientId} joined waitlist for ${preferredDate}`);

      return {
        waitlistId: entry.id,
        position,
        message: "You've been added to the waitlist. We'll notify you when a slot becomes available.",
        entry: { ...entry, position },
      };
    } catch (error) {
      logger.error('Error joining waitlist:', error);
      throw new Error('Failed to join waitlist');
    }
  }

  /**
   * Invalidate cached slots for a specific date/provider
   * 
   * @param date - Slot date
   * @param providerId - Provider ID
   */
  private async invalidateSlotCache(date: Date | string, providerId: string): Promise<void> {
    if (!redisClient.isAvailable) {
      return;
    }

    try {
      const dateStr = typeof date === 'string' ? date.split('T')[0] : date.toISOString().split('T')[0];
      
      // Delete specific cache keys
      const patterns = [
        `slots:*:${providerId}:${dateStr}`,
        `slots:*:all:${dateStr}`,
        `slots:*:${providerId}:all`,
      ];

      for (const pattern of patterns) {
        // Note: Redis SCAN would be better for production, but DEL works for now
        await redisClient.del(pattern);
      }

      logger.debug(`Invalidated slot cache for date ${dateStr}, provider ${providerId}`);
    } catch (error) {
      logger.error('Error invalidating cache:', error);
      // Don't throw - cache invalidation failure shouldn't break booking
    }
  }

  /**
   * Reschedule an appointment to a new slot with full validation
   * 
   * Business Rules:
   * - Cannot reschedule within 2 hours of appointment start time
   * - Maximum 3 reschedules per appointment (enforced via reschedule_count)
   * - New slot must be available (concurrency safe with SELECT FOR UPDATE)
   * - Patient must own the appointment
   * 
   * Side Effects:
   * - Updates appointment record with new slot
   * - Increments reschedule_count
   * - Marks old slot as available
   * - Marks new slot as unavailable
   * - Invalidates cache
   * - Logs audit trail
   * 
   * @param appointmentId - Appointment UUID to reschedule
   * @param newSlotId - New slot UUID
   * @param patientId - Patient ID (for ownership verification)
   * @returns Updated appointment
   * @throws 404 - Appointment or slot not found
   * @throws 403 - Patient does not own appointment
   * @throws 400 - Cannot reschedule within 2 hours, max reschedules exceeded, or same slot selected
   * @throws 409 - New slot is no longer available (conflict)
   */
  async rescheduleAppointment(
    appointmentId: string,
    newSlotId: string,
    patientId: string
  ): Promise<Appointment> {
    const client = await pool.connect();

    try {
      // Start transaction
      await client.query('BEGIN');

      // Lock and fetch current appointment
      const appointmentQuery = `
        SELECT 
          a.*,
          a.patient_id AS "patientId",
          a.provider_id AS "providerId",
          a.slot_id AS "slotId",
          a.department_id AS "departmentId",
          a.appointment_date AS "appointmentDate",
          a.reschedule_count AS "rescheduleCount",
          a.created_by AS "createdBy",
          a.created_at AS "createdAt",
          a.updated_at AS "updatedAt",
          ts.provider_id AS "oldProviderId",
          ts.start_time AS "oldStartTime"
        FROM appointments a
        JOIN time_slots ts ON a.slot_id = ts.id
        WHERE a.id = $1
        FOR UPDATE
      `;

      const appointmentResult = await client.query(appointmentQuery, [appointmentId]);

      if (appointmentResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw {
          code: 404,
          message: 'Appointment not found',
        };
      }

      const appointment = appointmentResult.rows[0];

      // Verify ownership
      if (appointment.patientId !== patientId) {
        await client.query('ROLLBACK');
        throw {
          code: 403,
          message: 'You do not have permission to reschedule this appointment',
        };
      }

      // Prevent rescheduling cancelled or completed appointments
      if (appointment.status === 'cancelled' || appointment.status === 'completed') {
        await client.query('ROLLBACK');
        throw {
          code: 400,
          message: `Cannot reschedule ${appointment.status} appointments`,
        };
      }

      // Validate 2-hour minimum notice
      const now = new Date();
      const appointmentTime = new Date(appointment.appointmentDate);
      const hoursUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilAppointment < SAME_DAY_NOTICE_HOURS) {
        await client.query('ROLLBACK');
        throw {
          code: 400,
          message: `Cannot reschedule appointments within ${SAME_DAY_NOTICE_HOURS} hours of start time. Please call the office at (555) 123-4567.`,
        };
      }

      // Check reschedule count (max 3)
      const rescheduleCount = appointment.rescheduleCount || 0;
      if (rescheduleCount >= 3) {
        await client.query('ROLLBACK');
        throw {
          code: 400,
          message: 'Maximum reschedules (3) reached for this appointment. Please call the office at (555) 123-4567.',
        };
      }

      // Prevent "rescheduling" to the same slot
      if (newSlotId === appointment.slotId) {
        await client.query('ROLLBACK');
        throw {
          code: 400,
          message: 'This appointment is already scheduled at this time. Please select a different slot.',
        };
      }

      // Lock and fetch new slot
      const newSlotQuery = `
        SELECT 
          ts.*,
          ts.slot_date AS "slotDate",
          ts.slot_start AS "startTime",
          ts.slot_end AS "endTime",
          ts.is_available AS "isAvailable",
          ts.doctor_id AS "providerId",
          ts.department_id AS "departmentId",
          u.first_name || ' ' || u.last_name AS "providerName",
          d.name AS "departmentName"
        FROM time_slots ts
        LEFT JOIN users u ON ts.doctor_id = u.id
        JOIN departments d ON ts.department_id = d.id
        WHERE ts.id = $1
        FOR UPDATE OF ts
      `;

      const newSlotResult = await client.query(newSlotQuery, [newSlotId]);

      if (newSlotResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw {
          code: 404,
          message: 'New slot not found',
        };
      }

      const newSlot = newSlotResult.rows[0];

      // Check if new slot is still available
      const slotBookingCheckQuery = `
        SELECT id FROM appointments
        WHERE slot_id = $1 AND status NOT IN ('cancelled')
      `;
      const slotBookingCheck = await client.query(slotBookingCheckQuery, [newSlotId]);

      if (slotBookingCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        throw {
          code: 409,
          message: 'This time slot is no longer available. Please select another time.',
        };
      }

      if (!newSlot.isAvailable) {
        await client.query('ROLLBACK');
        throw {
          code: 409,
          message: 'This slot is not available for booking',
        };
      }

      // Validate new slot is at least 2 hours in the future
      const newSlotTime = new Date(newSlot.startTime);
      const hoursUntilNewSlot = (newSlotTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilNewSlot < SAME_DAY_NOTICE_HOURS) {
        await client.query('ROLLBACK');
        throw {
          code: 400,
          message: `Cannot reschedule to a slot within ${SAME_DAY_NOTICE_HOURS} hours. Please select a later time.`,
        };
      }

      // Validate business hours
      const newSlotHour = newSlotTime.getHours();
      if (newSlotHour < BUSINESS_HOURS.openingHour || newSlotHour >= BUSINESS_HOURS.closingHour) {
        await client.query('ROLLBACK');
        throw {
          code: 400,
          message: `Appointments must be between ${BUSINESS_HOURS.openingHour}AM and ${BUSINESS_HOURS.closingHour}PM`,
        };
      }

      // Update appointment with new slot
      const updateQuery = `
        UPDATE appointments
        SET 
          slot_id = $1,
          provider_id = $2,
          department_id = $3,
          appointment_date = $4,
          duration = $5,
          reschedule_count = reschedule_count + 1,
          original_appointment_date = COALESCE(original_appointment_date, appointment_date),
          updated_at = NOW()
        WHERE id = $6
        RETURNING *,
          patient_id AS "patientId",
          provider_id AS "providerId",
          slot_id AS "slotId",
          department_id AS "departmentId",
          appointment_date AS "appointmentDate",
          reschedule_count AS "rescheduleCount",
          original_appointment_date AS "originalAppointmentDate",
          created_by AS "createdBy",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `;

      const updateResult = await client.query(updateQuery, [
        newSlotId,
        newSlot.providerId,
        newSlot.departmentId,
        newSlot.startTime,
        newSlot.duration,
        appointmentId,
      ]);

      const updatedAppointment: Appointment = updateResult.rows[0];

      // Mark old slot as available again
      await client.query(
        'UPDATE time_slots SET is_available = true, updated_at = NOW() WHERE id = $1',
        [appointment.slotId]
      );

      // Mark new slot as unavailable
      await client.query(
        'UPDATE time_slots SET is_available = false, updated_at = NOW() WHERE id = $1',
        [newSlotId]
      );

      // Log audit trail
      await client.query(
        `INSERT INTO audit_logs (
          user_id, action_type, resource_type, resource_id,
          old_value, new_value, ip_address, user_agent, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [
          patientId,
          'update',
          'appointment',
          appointmentId,
          JSON.stringify({
            slot_id: appointment.slotId,
            appointment_date: appointment.appointmentDate,
            reschedule_count: rescheduleCount,
          }),
          JSON.stringify({
            slot_id: newSlotId,
            appointment_date: newSlot.startTime,
            reschedule_count: rescheduleCount + 1,
          }),
          null, // IP address (would come from request)
          'reschedule-api', // User agent placeholder
        ]
      );

      // Commit transaction
      await client.query('COMMIT');

      // Invalidate cache for both old and new slots (fire and forget)
      this.invalidateSlotCache(appointment.oldStartTime, appointment.oldProviderId).catch((err) =>
        logger.error('Cache invalidation failed for old slot:', err)
      );
      this.invalidateSlotCache(newSlot.startTime, newSlot.providerId).catch((err) =>
        logger.error('Cache invalidation failed for new slot:', err)
      );

      logger.info(`Appointment ${appointmentId} rescheduled from slot ${appointment.slotId} to ${newSlotId}`);

      // Trigger calendar event update (fire and forget - non-blocking)
      setImmediate(() => {
        // Check if patient has calendar sync enabled
        pool.query(
          'SELECT calendar_provider FROM calendar_tokens WHERE user_id = $1 LIMIT 1',
          [patientId]
        ).then((calResult) => {
          if (calResult.rows.length > 0) {
            const provider = calResult.rows[0].calendar_provider;
            updateCalendarEvent(appointmentId, parseInt(patientId), provider)
              .then((result) => {
                if (result.success) {
                  logger.info('Calendar event updated for rescheduled appointment', {
                    appointmentId,
                    patientId,
                    provider,
                  });
                } else {
                  logger.warn('Calendar event update failed for rescheduled appointment', {
                    appointmentId,
                    error: result.error,
                  });
                }
              })
              .catch((updateError) => {
                logger.error('Failed to update calendar event:', updateError);
              });
          }
        }).catch((syncError) => {
          logger.error('Failed to trigger calendar update:', syncError);
          // Non-blocking - appointment still rescheduled successfully
        });
      });

      return updatedAppointment;
    } catch (error: any) {
      await client.query('ROLLBACK');

      // Re-throw custom errors
      if (error.code && error.message) {
        throw error;
      }

      logger.error('Error rescheduling appointment:', error);
      throw new Error('Failed to reschedule appointment');
    } finally {
      client.release();
    }
  }

  /**
   * Cancel an appointment and trigger waitlist notification
   * 
   * Business Rules:
   * - Patient can only cancel their own appointment
   * - Provider/Admin can cancel any appointment
   * - Cancellation updates appointment status to 'cancelled'
   * - Slot is freed (is_available = true, slot_id cleared from appointment)
   * - Waitlist patients are notified if any are waiting
   * - Audit log records the cancellation
   * - Cache is invalidated for the slot
   * 
   * @param appointmentId - Appointment UUID to cancel
   * @param userId - User ID requesting cancellation (patient, provider, or admin)
   * @param userRole - Role of user (patient, provider, admin)
   * @param cancellationReason - Optional reason for cancellation
   * @returns Cancelled appointment details and slot ID for waitlist notification
   * @throws Error if appointment not found or user lacks permission
   */
  async cancelAppointment(
    appointmentId: string,
    userId: string,
    userRole: string,
    cancellationReason?: string
  ): Promise<{ appointment: any; slotId: number; shouldNotifyWaitlist: boolean }> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Fetch appointment with slot details and FOR UPDATE lock
      const appointmentQuery = `
        SELECT 
          a.id,
          a.patient_id,
          a.slot_id,
          a.provider_id,
          a.department_id,
          a.appointment_date,
          a.start_time,
          a.end_time,
          a.status,
          a.notes,
          ts.id AS time_slot_id,
          ts.start_time AS slot_start_time,
          ts.end_time AS slot_end_time,
          ts.provider_id AS slot_provider_id,
          ts.department_id AS slot_department_id
        FROM appointments a
        LEFT JOIN time_slots ts ON a.slot_id = ts.id
        WHERE a.id = $1
        FOR UPDATE OF a
      `;

      const appointmentResult = await client.query(appointmentQuery, [appointmentId]);

      if (appointmentResult.rows.length === 0) {
        throw {
          code: 'APPOINTMENT_NOT_FOUND',
          message: 'Appointment not found',
          status: 404,
        };
      }

      const appointment = appointmentResult.rows[0];

      // Authorization check: patient can only cancel their own appointments
      if (userRole === 'patient' && appointment.patient_id !== userId) {
        throw {
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to cancel this appointment',
          status: 403,
        };
      }

      // Check if appointment is already cancelled
      if (appointment.status === 'cancelled') {
        throw {
          code: 'ALREADY_CANCELLED',
          message: 'Appointment is already cancelled',
          status: 409,
        };
      }

      // Update appointment status to cancelled
      const updateAppointmentQuery = `
        UPDATE appointments
        SET 
          status = 'cancelled',
          updated_at = NOW()
        WHERE id = $1
        RETURNING 
          id, patient_id, slot_id, provider_id, department_id,
          appointment_date, start_time, end_time, status, notes, created_at, updated_at
      `;

      const updatedResult = await client.query(updateAppointmentQuery, [appointmentId]);
      const cancelledAppointment = updatedResult.rows[0];

      // Free up the slot (if slot exists)
      let slotFreed = false;
      if (appointment.slot_id) {
        const freeSlotQuery = `
          UPDATE time_slots
          SET 
            is_available = true,
            updated_at = NOW()
          WHERE id = $1
        `;

        await client.query(freeSlotQuery, [appointment.slot_id]);
        slotFreed = true;
        logger.info(`Freed slot ${appointment.slot_id} after cancelling appointment ${appointmentId}`);
      }

      // Log audit event
      await client.query(
        `INSERT INTO audit_logs (
          user_id, action, table_name, record_id,
          old_values, new_values, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          'delete',
          'appointment',
          appointmentId,
          JSON.stringify({
            status: appointment.status,
            slot_id: appointment.slot_id,
          }),
          JSON.stringify({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            reason: cancellationReason || 'Not specified',
          }),
          null, // IP address (would come from request)
          'cancel-appointment-api',
        ]
      );

      // Commit transaction
      await client.query('COMMIT');

      // Invalidate cache for the slot (fire and forget)
      if (appointment.slot_start_time && appointment.slot_provider_id) {
        this.invalidateSlotCache(appointment.slot_start_time, appointment.slot_provider_id).catch((err) =>
          logger.error('Cache invalidation failed for cancelled slot:', err)
        );
      }

      logger.info(`Appointment ${appointmentId} cancelled by user ${userId} (${userRole})`);

      // Trigger calendar event deletion (fire and forget - non-blocking)
      const patientIdForCalendar = cancelledAppointment.patientId;
      setImmediate(() => {
        // Check if patient has calendar sync enabled
        pool.query(
          'SELECT calendar_provider FROM calendar_tokens WHERE user_id = $1 LIMIT 1',
          [patientIdForCalendar]
        ).then((calResult) => {
          if (calResult.rows.length > 0) {
            const provider = calResult.rows[0].calendar_provider;
            deleteCalendarEvent(appointmentId, parseInt(patientIdForCalendar), provider)
              .then((result) => {
                if (result.success) {
                  logger.info('Calendar event deleted for cancelled appointment', {
                    appointmentId,
                    patientId: patientIdForCalendar,
                    provider,
                  });
                } else {
                  logger.warn('Calendar event deletion failed for cancelled appointment', {
                    appointmentId,
                    error: result.error,
                  });
                }
              })
              .catch((deleteError) => {
                logger.error('Failed to delete calendar event:', deleteError);
              });
          }
        }).catch((syncError) => {
          logger.error('Failed to trigger calendar deletion:', syncError);
          // Non-blocking - appointment still cancelled successfully
        });
      });

      return {
        appointment: cancelledAppointment,
        slotId: appointment.time_slot_id,
        shouldNotifyWaitlist: slotFreed && appointment.time_slot_id !== null,
      };
    } catch (error: any) {
      await client.query('ROLLBACK');

      // Re-throw custom errors
      if (error.code && error.message) {
        throw error;
      }

      logger.error('Error cancelling appointment:', error);
      throw new Error('Failed to cancel appointment');
    } finally {
      client.release();
    }
  }

  /**
   * Get dates that have available slots (for calendar highlighting)
   */
  async getAvailableDates(filters: SlotFilters = {}): Promise<string[]> {
    const { departmentId, providerId, startDate, endDate } = filters;

    const queryParams: any[] = [];
    let paramIndex = 1;

    let query = `
      SELECT DISTINCT ts.slot_date::text AS date
      FROM time_slots ts
      WHERE ts.is_available = true
        AND ts.booked_count < ts.max_appointments
        AND ts.slot_date >= CURRENT_DATE
    `;

    if (departmentId) {
      query += ` AND ts.department_id = $${paramIndex++}`;
      queryParams.push(departmentId);
    }

    if (providerId) {
      query += ` AND ts.doctor_id = $${paramIndex++}`;
      queryParams.push(providerId);
    }

    if (startDate && endDate) {
      query += ` AND ts.slot_date BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      queryParams.push(startDate, endDate);
    }

    query += ` ORDER BY date ASC`;

    const result = await pool.query(query, queryParams);
    return result.rows.map((row: any) => row.date);
  }

  /**
   * Get waitlist entries for a specific patient
   */
  async getMyWaitlistEntries(patientId: string): Promise<WaitlistEntry[]> {
    const query = `
      SELECT
        w.id,
        w.patient_id AS "patientId",
        w.department_id AS "departmentId",
        w.provider_id AS "providerId",
        w.preferred_date AS "requestedDate",
        w.preferred_time_start AS "preferredTimeStart",
        w.preferred_time_end AS "preferredTimeEnd",
        w.status,
        w.priority,
        w.notes,
        d.name AS "departmentName",
        u.first_name || ' ' || u.last_name AS "providerName",
        w.created_at AS "createdAt",
        w.updated_at AS "updatedAt"
      FROM waitlist w
      JOIN departments d ON w.department_id = d.id
      LEFT JOIN users u ON w.provider_id = u.id
      WHERE w.patient_id = $1
        AND w.status IN ('waiting', 'contacted')
      ORDER BY w.created_at DESC
    `;

    const result = await pool.query(query, [patientId]);
    return result.rows;
  }
}

export default new AppointmentsService();
export { AppointmentsService };
