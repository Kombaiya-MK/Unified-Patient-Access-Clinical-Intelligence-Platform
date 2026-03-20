/**
 * Waitlist Notification Service
 * 
 * Service for managing waitlist notifications when slots become available.
 * 
 * Features:
 * - Find next eligible waitlist patient (first-come-first-served by created_at)
 * - Send email notification with slot details
 * - Create dashboard notification for real-time display
 * - Create 2-hour temporary reservation
 * - Auto-release expired reservations
 * - Notify next patient when reservation expires
 * - Audit all notification actions
 * 
 * Business Rules:
 * - First-in-line patient notified first (ORDER BY created_at ASC)
 * - Slot held for 2 hours after notification
 * - Auto-release if not booked within 2 hours
 * - Notify next person when slot released
 * - Expire waitlist entries after requested_date passes
 * 
 * @module waitlistNotificationService
 * @created 2026-03-19
 * @task US_015 TASK_001, US_015 TASK_004
 */

import { pool } from '../config/database';
import { sendWaitlistNotificationEmail } from './emailService';
import logger from '../utils/logger';
import type { CreateNotificationParams, WaitlistNotificationMetadata } from '../types/notification.types';

/**
 * Waitlist entry data
 */
interface WaitlistEntry {
  id: number;
  patientId: number;
  departmentId: number;
  doctorId: number | null;
  requestedDate: Date;
  preferredTimeStart: string | null;
  preferredTimeEnd: string | null;
  priority: number;
  status: string;
  createdAt: Date;
}

/**
 * Reservation creation result
 */
interface ReservationResult {
  reservationId: number;
  waitlistId: number;
  slotId: number;
  patientId: number;
  reservedUntil: Date;
  notificationSent: boolean;
}

class WaitlistNotificationService {
  /**
   * Create dashboard notification for waitlist availability
   * 
   * Inserts a record into the notifications table for real-time dashboard display.
   * Notification will appear as a popup in the patient's dashboard.
   * 
   * @param params - Notification creation parameters
   * @returns Notification ID
   */
  private async createDashboardNotification(params: CreateNotificationParams): Promise<number> {
    const client = await pool.connect();

    try {
      const query = `
        INSERT INTO notifications (
          user_id, type, title, message, priority,
          delivery_method, action_url, action_label,
          related_appointment_id, expires_at, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `;

      const values = [
        params.userId,
        params.type,
        params.title,
        params.message,
        params.priority || 'high',
        params.deliveryMethod || ['in_app', 'email'],
        params.actionUrl || null,
        params.actionLabel || null,
        params.relatedAppointmentId || null,
        params.expiresAt || null,
        params.metadata ? JSON.stringify(params.metadata) : null,
      ];

      const result = await client.query(query, values);
      const notificationId = result.rows[0].id;

      logger.info(`Created dashboard notification ${notificationId} for user ${params.userId}`);

      return notificationId;
    } catch (error) {
      logger.error('Error creating dashboard notification:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Log audit event for waitlist notifications
   * 
   * Records waitlist notification actions to audit_logs table for compliance.
   * 
   * @param action - Action type (NOTIFY_WAITLIST, EXPIRE_HOLD)
   * @param userId - Patient user ID
   * @param entityId - Waitlist or reservation ID
   * @param changes - Data changes
   */
  private async logAuditEvent(
    action: string,
    userId: number,
    entityId: number,
    changes: Record<string, any>
  ): Promise<void> {
    const client = await pool.connect();

    try {
      const query = `
        INSERT INTO audit_logs (
          user_id, action, table_name, record_id,
          old_values, new_values, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      const values = [
        userId,
        action,
        'waitlist',
        entityId,
        null, // old_values (not applicable for notifications)
        changes,
        'server-internal',
        'waitlist-notification-service',
      ];

      await client.query(query, values);

      logger.debug(`Logged audit event: ${action} for user ${userId}`);
    } catch (error) {
      logger.error('Error logging audit event:', error);
      // Don't throw - audit logging failure shouldn't break main flow
    } finally {
      client.release();
    }
  }

  /**
   * Find next eligible waitlist patient for a specific slot
   * 
   * Criteria:
   * - Status = 'waiting'
   * - Matches department and doctor (if specified)
   * - Requested date matches or is flexible
   * - Preferred time overlaps with slot (if specified)
   * - First by created_at (FIFO)
   * 
   * @param slotId - Available slot ID
   * @returns Next eligible waitlist entry or null
   */
  async findNextEligiblePatient(slotId: number): Promise<WaitlistEntry | null> {
    const client = await pool.connect();

    try {
      // Get slot details first
      const slotQuery = `
        SELECT 
          ts.id,
          ts.start_time,
          ts.end_time,
          ts.doctor_id,
          ts.department_id,
          DATE(ts.start_time) AS slot_date
        FROM time_slots ts
        WHERE ts.id = $1
      `;
      
      const slotResult = await client.query(slotQuery, [slotId]);
      
      if (slotResult.rows.length === 0) {
        logger.warn(`Slot ${slotId} not found`);
        return null;
      }
      
      const slot = slotResult.rows[0];
      
      // Find matching waitlist entries
      const waitlistQuery = `
        SELECT 
          w.id,
          w.patient_id AS "patientId",
          w.department_id AS "departmentId",
          w.doctor_id AS "doctorId",
          w.requested_date AS "requestedDate",
          w.preferred_time_start AS "preferredTimeStart",
          w.preferred_time_end AS "preferredTimeEnd",
          w.priority,
          w.status,
          w.created_at AS "createdAt"
        FROM waitlist w
        WHERE w.status = 'waiting'
          AND w.department_id = $1
          AND (w.doctor_id IS NULL OR w.doctor_id = $2)
          AND w.requested_date = $3
          AND NOT EXISTS (
            SELECT 1 FROM waitlist_reservations wr
            WHERE wr.patient_id = w.patient_id
              AND wr.status = 'active'
              AND wr.reserved_until > NOW()
          )
        ORDER BY w.priority ASC, w.created_at ASC
        LIMIT 1
      `;
      
      const waitlistResult = await client.query(waitlistQuery, [
        slot.department_id,
        slot.doctor_id,
        slot.slot_date,
      ]);
      
      if (waitlistResult.rows.length === 0) {
        logger.debug(`No eligible waitlist patients for slot ${slotId}`);
        return null;
      }
      
      return waitlistResult.rows[0];
    } catch (error) {
      logger.error('Error finding eligible waitlist patient:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create temporary reservation for notified patient
   * 
   * @param waitlistId - Waitlist entry ID
   * @param slotId - Slot ID to reserve
   * @param patientId - Patient ID
   * @returns Reservation ID
   */
  async createReservation(
    waitlistId: number,
    slotId: number,
    patientId: number
  ): Promise<number> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if slot already has active reservation
      const checkQuery = `
        SELECT id FROM waitlist_reservations
        WHERE slot_id = $1 AND status = 'active'
      `;
      const checkResult = await client.query(checkQuery, [slotId]);
      
      if (checkResult.rows.length > 0) {
        await client.query('ROLLBACK');
        throw new Error(`Slot ${slotId} already has active reservation`);
      }
      
      // Create reservation (2-hour hold)
      const insertQuery = `
        INSERT INTO waitlist_reservations (
          waitlist_id,
          slot_id,
          patient_id,
          reserved_at,
          reserved_until,
          status,
          notification_sent_at
        ) VALUES (
          $1, $2, $3, NOW(), NOW() + INTERVAL '2 hours', 'active', NOW()
        )
        RETURNING id
      `;
      
      const insertResult = await client.query(insertQuery, [
        waitlistId,
        slotId,
        patientId,
      ]);
      
      const reservationId = insertResult.rows[0].id;
      
      // Update waitlist entry to 'contacted'
      await client.query(
        `UPDATE waitlist SET status = 'contacted', updated_at = NOW() WHERE id = $1`,
        [waitlistId]
      );
      
      await client.query('COMMIT');
      
      logger.info(`Created reservation ${reservationId} for patient ${patientId}, slot ${slotId}`);
      
      return reservationId;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating reservation:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Notify waitlist patient about available slot
   * 
   * @param waitlistId - Waitlist entry ID
   * @param slotId - Available slot ID
   * @returns Reservation result
   */
  async notifyPatient(waitlistId: number, slotId: number): Promise<ReservationResult | null> {
    const client = await pool.connect();

    try {
      // Get full details for notification
      const query = `
        SELECT 
          w.id AS waitlist_id,
          w.patient_id,
          u.email AS patient_email,
          u.full_name AS patient_name,
          ts.id AS slot_id,
          ts.start_time,
          ts.end_time,
          d.id AS doctor_id,
          d.name AS doctor_name,
          dept.id AS department_id,
          dept.name AS department_name,
          dept.location
        FROM waitlist w
        JOIN users u ON w.patient_id = u.id
        JOIN time_slots ts ON ts.id = $2
        JOIN users d ON ts.doctor_id = d.id
        JOIN departments dept ON ts.department_id = dept.id
        WHERE w.id = $1
      `;
      
      const result = await client.query(query, [waitlistId, slotId]);
      
      if (result.rows.length === 0) {
        logger.warn(`Waitlist entry ${waitlistId} or slot ${slotId} not found`);
        return null;
      }
      
      const data = result.rows[0];
      
      // Create reservation
      const reservationId = await this.createReservation(
        waitlistId,
        slotId,
        data.patient_id
      );
      
      // Send email notification
      const emailData = {
        patientEmail: data.patient_email,
        patientName: data.patient_name,
        slotId: data.slot_id,
        startTime: data.start_time,
        endTime: data.end_time,
        doctorName: data.doctor_name,
        departmentName: data.department_name,
        location: data.location,
        reservationId,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      };
      
      let notificationSent = false;
      try {
        await sendWaitlistNotificationEmail(emailData);
        notificationSent = true;
        logger.info(`Sent waitlist notification to patient ${data.patient_id} for slot ${slotId}`);
      } catch (emailError) {
        logger.error('Failed to send waitlist notification email:', emailError);
        // Don't throw - reservation still created
      }

      // Create dashboard notification for real-time display
      try {
        const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
        const formattedDate = new Date(data.start_time).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const formattedTime = new Date(data.start_time).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        const metadata: WaitlistNotificationMetadata = {
          waitlistId,
          slotId,
          appointmentDate: new Date(data.start_time).toISOString().split('T')[0],
          startTime: data.start_time,
          endTime: data.end_time,
          doctorId: data.doctor_id,
          doctorName: data.doctor_name,
          departmentId: data.department_id,
          departmentName: data.department_name,
          location: data.location,
          reservationId,
          expiresAt: expiresAt.toISOString(),
        };

        await this.createDashboardNotification({
          userId: data.patient_id,
          type: 'waitlist_available',
          title: 'Your Appointment Slot is Available!',
          message: `Your preferred slot on ${formattedDate} at ${formattedTime} is now available! Click to book (expires in 2 hours)`,
          priority: 'high',
          deliveryMethod: ['in_app', 'email'],
          actionUrl: `/patient/book-appointment?reservationId=${reservationId}&slotId=${slotId}`,
          actionLabel: 'Book Now',
          expiresAt,
          metadata,
        });

        logger.info(`Created dashboard notification for patient ${data.patient_id}`);
      } catch (notificationError) {
        logger.error('Failed to create dashboard notification:', notificationError);
        // Don't throw - email already sent, reservation created
      }

      // Log audit event
      await this.logAuditEvent('NOTIFY_WAITLIST', data.patient_id, waitlistId, {
        waitlistId,
        slotId,
        reservationId,
        status: 'contacted',
        notifiedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      });
      
      return {
        reservationId,
        waitlistId,
        slotId,
        patientId: data.patient_id,
        reservedUntil: new Date(Date.now() + 2 * 60 * 60 * 1000),
        notificationSent,
      };
    } catch (error) {
      logger.error('Error notifying waitlist patient:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Release expired reservations and notify next patient
   * 
   * Called by cron job to check for expired reservations.
   * Releases the slot and notifies the next person on the waitlist.
   * 
   * @returns Number of reservations released
   */
  async releaseExpiredReservations(): Promise<number> {
    const client = await pool.connect();
    let releasedCount = 0;

    try {
      // Find expired reservations
      const findQuery = `
        SELECT 
          wr.id,
          wr.waitlist_id,
          wr.slot_id,
          wr.patient_id,
          wr.reserved_until
        FROM waitlist_reservations wr
        WHERE wr.status = 'active'
          AND wr.reserved_until < NOW()
        FOR UPDATE SKIP LOCKED
      `;
      
      const expiredResult = await client.query(findQuery);
      
      for (const reservation of expiredResult.rows) {
        try {
          await client.query('BEGIN');
          
          // Release reservation
          await client.query(
            `UPDATE waitlist_reservations 
             SET status = 'expired', released_at = NOW(), updated_at = NOW()
             WHERE id = $1`,
            [reservation.id]
          );
          
          // Update waitlist entry back to 'waiting'
          await client.query(
            `UPDATE waitlist 
             SET status = 'waiting', updated_at = NOW()
             WHERE id = $1`,
            [reservation.waitlist_id]
          );
          
          await client.query('COMMIT');
          
          logger.info(`Released expired reservation ${reservation.id} for slot ${reservation.slot_id}`);
          releasedCount++;

          // Log audit event for expired hold
          await this.logAuditEvent('EXPIRE_HOLD', reservation.patient_id, reservation.waitlist_id, {
            reservationId: reservation.id,
            slotId: reservation.slot_id,
            status: 'expired',
            releasedAt: new Date().toISOString(),
          });
          
          // Notify next patient in line (async, don't block)
          this.findNextEligiblePatient(reservation.slot_id)
            .then((nextPatient) => {
              if (nextPatient) {
                return this.notifyPatient(nextPatient.id, reservation.slot_id);
              }
              return null;
            })
            .catch((error) => {
              logger.error('Error notifying next patient after release:', error);
            });
        } catch (error) {
          await client.query('ROLLBACK');
          logger.error(`Error releasing reservation ${reservation.id}:`, error);
        }
      }
      
      return releasedCount;
    } catch (error) {
      logger.error('Error releasing expired reservations:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Expire old waitlist entries (past requested_date)
   * 
   * Called by cron job to clean up expired waitlist entries.
   * 
   * @returns Number of entries expired
   */
  async expireOldWaitlistEntries(): Promise<number> {
    try {
      const result = await pool.query(
        `UPDATE waitlist
         SET status = 'expired', updated_at = NOW()
         WHERE status IN ('waiting', 'contacted')
           AND requested_date < CURRENT_DATE
         RETURNING id`
      );
      
      const expiredCount = result.rowCount || 0;
      
      if (expiredCount > 0) {
        logger.info(`Expired ${expiredCount} old waitlist entries`);
      }
      
      return expiredCount;
    } catch (error) {
      logger.error('Error expiring old waitlist entries:', error);
      throw error;
    }
  }

  /**
   * Check for newly available slots and notify waitlist
   * 
   * Called when appointments are cancelled or rescheduled.
   * Finds affected slots and notifies waiting patients.
   * 
   * @param slotIds - Array of slot IDs that became available
   * @returns Number of notifications sent
   */
  async processAvailableSlots(slotIds: number[]): Promise<number> {
    let notifiedCount = 0;

    for (const slotId of slotIds) {
      try {
        const nextPatient = await this.findNextEligiblePatient(slotId);
        
        if (nextPatient) {
          const result = await this.notifyPatient(nextPatient.id, slotId);
          
          if (result && result.notificationSent) {
            notifiedCount++;
          }
        }
      } catch (error) {
        logger.error(`Error processing available slot ${slotId}:`, error);
        // Continue with next slot
      }
    }
    
    return notifiedCount;
  }
}

export default new WaitlistNotificationService();
export { WaitlistNotificationService };
