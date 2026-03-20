/**
 * Reminder Service
 * 
 * Orchestrates sending appointment reminders via SMS and email.
 * Handles consolidated messages, fallback logic, and preference checking.
 * 
 * @module reminderService
 * @created 2026-03-20
 * @task US_016 TASK_004 - Reminder Cron Job
 */

import { pool } from '../config/database';
import { sendSMS } from './smsService';
import { sendEmail } from './emailService';
import { generateAppointmentCalendar, deleteCalendarFile, AppointmentEvent } from './calendarService';
import { generateAppointmentReminderSMS } from '../templates/sms/appointmentReminder';
import logger from '../utils/logger';
import { ReminderJobStats, recordSmsResult, recordEmailResult } from '../utils/reminderStats';
import { format } from 'date-fns';
import fs from 'fs/promises';

/**
 * Appointment Reminder Data
 */
interface AppointmentReminder {
  appointment_id: number;
  patient_id: number;
  patient_email: string;
  patient_phone: string;
  patient_first_name: string;
  patient_last_name: string;
  doctor_first_name: string;
  doctor_last_name: string;
  department_name: string;
  department_location: string;
  department_phone: string;
  appointment_date: Date;
  duration_minutes: number;
  reason_for_visit: string;
  should_send_sms: boolean;
  should_send_email: boolean;
}

/**
 * Patient Appointments Group
 */
interface PatientAppointments {
  patientId: number;
  patientEmail: string;
  patientPhone: string;
  patientName: string;
  appointments: AppointmentReminder[];
  shouldSendSms: boolean;
  shouldSendEmail: boolean;
}

/**
 * Fetch appointments needing reminders from database view
 */
export async function fetchAppointmentsNeedingReminders(): Promise<AppointmentReminder[]> {
  try {
    const result = await pool.query<AppointmentReminder>(`
      SELECT * FROM app.upcoming_appointments_needing_reminders
      ORDER BY patient_id, appointment_date
    `);

    logger.info('Fetched appointments needing reminders', {
      count: result.rows.length,
    });

    return result.rows;
  } catch (error: any) {
    logger.error('Failed to fetch appointments needing reminders', { error: error.message });
    throw error;
  }
}

/**
 * Group appointments by patient for consolidated messages
 */
export function groupAppointmentsByPatient(
  appointments: AppointmentReminder[]
): PatientAppointments[] {
  const grouped = new Map<number, PatientAppointments>();

  for (const appointment of appointments) {
    if (!grouped.has(appointment.patient_id)) {
      grouped.set(appointment.patient_id, {
        patientId: appointment.patient_id,
        patientEmail: appointment.patient_email,
        patientPhone: appointment.patient_phone,
        patientName: `${appointment.patient_first_name} ${appointment.patient_last_name}`,
        appointments: [],
        shouldSendSms: appointment.should_send_sms,
        shouldSendEmail: appointment.should_send_email,
      });
    }

    grouped.get(appointment.patient_id)!.appointments.push(appointment);
  }

  return Array.from(grouped.values());
}

/**
 * Send SMS reminder to patient
 */
async function sendSmsReminder(
  patient: PatientAppointments,
  stats: ReminderJobStats
): Promise<void> {
  if (!patient.shouldSendSms || !patient.patientPhone) {
    logger.info('Skipping SMS (opt-out or no phone)', {
      patientId: patient.patientId,
    });
    return;
  }

  try {
    const appointment = patient.appointments[0];
    const appointmentTime = format(new Date(appointment.appointment_date), 'h:mm a');
    const providerName = `Dr. ${appointment.doctor_last_name}`;

    // Generate SMS message
    const message = generateAppointmentReminderSMS({
      appointmentDate: format(new Date(appointment.appointment_date), 'MMMM d, yyyy'),
      appointmentTime,
      providerName,
      departmentLocation: appointment.department_location,
      clinicPhone: appointment.department_phone,
    });

    // Send SMS
    const result = await sendSMS(
      patient.patientPhone,
      message,
      appointment.appointment_id
    );

    recordSmsResult(stats, result.success, appointment.appointment_id, result.error);

    if (result.success) {
      logger.info('SMS reminder sent', {
        patientId: patient.patientId,
        appointmentId: appointment.appointment_id,
      });
    }
  } catch (error: any) {
    logger.error('SMS reminder failed', {
      patientId: patient.patientId,
      error: error.message,
    });
    recordSmsResult(stats, false, patient.appointments[0].appointment_id, error.message);
  }
}

/**
 * Send email reminder to patient with calendar attachment
 */
async function sendEmailReminder(
  patient: PatientAppointments,
  stats: ReminderJobStats
): Promise<void> {
  if (!patient.shouldSendEmail || !patient.patientEmail) {
    logger.info('Skipping email (opt-out or no email)', {
      patientId: patient.patientId,
    });
    return;
  }

  let calendarFilePath: string | undefined;

  try {
    // Prepare appointment events for calendar
    const events: AppointmentEvent[] = patient.appointments.map(apt => ({
      id: apt.appointment_id,
      appointmentDate: new Date(apt.appointment_date),
      duration: apt.duration_minutes,
      providerName: `Dr. ${apt.doctor_first_name} ${apt.doctor_last_name}`,
      patientEmail: patient.patientEmail,
      patientName: patient.patientName,
      reason: apt.reason_for_visit,
      location: apt.department_location,
      departmentPhone: apt.department_phone,
    }));

    // Generate calendar file
    const calendarResult = await generateAppointmentCalendar(events);

    if (!calendarResult.success) {
      throw new Error(calendarResult.error || 'Calendar generation failed');
    }

    calendarFilePath = calendarResult.filePath;

    // Build email subject and body
    const appointmentCount = patient.appointments.length;
    const subject = appointmentCount > 1
      ? `Reminder: You have ${appointmentCount} appointments tomorrow`
      : 'Reminder: You have an appointment tomorrow';

    const appointment = patient.appointments[0];
    const appointmentTime = format(new Date(appointment.appointment_date), 'h:mm a');
    const providerName = `Dr. ${appointment.doctor_first_name} ${appointment.doctor_last_name}`;

    const htmlBody = `
      <h2>Appointment Reminder</h2>
      <p>Dear ${patient.patientName},</p>
      <p>This is a reminder that you have an appointment tomorrow:</p>
      <ul>
        <li><strong>Date:</strong> ${format(new Date(appointment.appointment_date), 'MMMM d, yyyy')}</li>
        <li><strong>Time:</strong> ${appointmentTime}</li>
        <li><strong>Provider:</strong> ${providerName}</li>
        <li><strong>Location:</strong> ${appointment.department_location}</li>
      </ul>
      <p>A calendar invitation (.ics file) is attached to this email.</p>
      <p>If you need to cancel or reschedule, please call ${appointment.department_phone}.</p>
      <p>Best regards,<br>${process.env.CLINIC_NAME || 'Clinical Appointment Platform'}</p>
    `;

    const textBody = `
Appointment Reminder

Dear ${patient.patientName},

This is a reminder that you have an appointment tomorrow:

Date: ${format(new Date(appointment.appointment_date), 'MMMM d, yyyy')}
Time: ${appointmentTime}
Provider: ${providerName}
Location: ${appointment.department_location}

A calendar invitation (.ics file) is attached to this email.

If you need to cancel or reschedule, please call ${appointment.department_phone}.

Best regards,
${process.env.CLINIC_NAME || 'Clinical Appointment Platform'}
    `.trim();

    // Read calendar file content
    let attachments: Array<{ filename: string; content: Buffer; contentType: string }> = [];
    if (calendarFilePath) {
      try {
        const calendarContent = await fs.readFile(calendarFilePath);
        attachments = [{
          filename: 'appointment.ics',
          content: calendarContent,
          contentType: 'text/calendar',
        }];
      } catch (error: any) {
        logger.error('Failed to read calendar file', { error: error.message });
      }
    }

    // Send email with calendar attachment
    const emailResult = await sendEmail({
      to: patient.patientEmail,
      subject,
      html: htmlBody,
      text: textBody,
      attachments,
    });

    recordEmailResult(stats, emailResult.success, appointment.appointment_id, emailResult.error);

    if (emailResult.success) {
      logger.info('Email reminder sent', {
        patientId: patient.patientId,
        appointmentIds: patient.appointments.map(a => a.appointment_id),
      });
    }
  } catch (error: any) {
    logger.error('Email reminder failed', {
      patientId: patient.patientId,
      error: error.message,
    });
    recordEmailResult(stats, false, patient.appointments[0].appointment_id, error.message);
  } finally {
    // Cleanup calendar file
    if (calendarFilePath) {
      await deleteCalendarFile(calendarFilePath);
    }
  }
}

/**
 * Update reminders_sent_at timestamp for appointments
 */
async function markRemindersSent(appointmentIds: number[]): Promise<void> {
  if (appointmentIds.length === 0) return;

  try {
    await pool.query(
      `UPDATE app.appointments 
       SET reminders_sent_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ANY($1)`,
      [appointmentIds]
    );

    logger.info('Marked reminders as sent', {
      appointmentIds,
      count: appointmentIds.length,
    });
  } catch (error: any) {
    logger.error('Failed to mark reminders as sent', {
      appointmentIds,
      error: error.message,
    });
  }
}

/**
 * Send reminders to a patient (SMS + Email)
 */
export async function sendRemindersToPatient(
  patient: PatientAppointments,
  stats: ReminderJobStats
): Promise<void> {
  logger.info('Sending reminders to patient', {
    patientId: patient.patientId,
    appointmentCount: patient.appointments.length,
    sms: patient.shouldSendSms,
    email: patient.shouldSendEmail,
  });

  // Send SMS
  if (patient.shouldSendSms) {
    await sendSmsReminder(patient, stats);
  }

  // Send Email
  if (patient.shouldSendEmail) {
    await sendEmailReminder(patient, stats);
  }

  // Mark appointments as reminded (if at least one notification sent)
  if (patient.shouldSendSms || patient.shouldSendEmail) {
    const appointmentIds = patient.appointments.map(a => a.appointment_id);
    await markRemindersSent(appointmentIds);
    stats.patientsNotified++;
  }

  stats.appointmentsProcessed += patient.appointments.length;
}

/**
 * Process appointments in batches to avoid memory issues
 */
export async function processAppointmentsInBatches(
  patientGroups: PatientAppointments[],
  stats: ReminderJobStats,
  batchSize: number = 50
): Promise<void> {
  for (let i = 0; i < patientGroups.length; i += batchSize) {
    const batch = patientGroups.slice(i, i + batchSize);

    logger.info('Processing batch', {
      batchNumber: Math.floor(i / batchSize) + 1,
      batchSize: batch.length,
      totalBatches: Math.ceil(patientGroups.length / batchSize),
    });

    // Process batch in parallel
    await Promise.all(
      batch.map(patient => sendRemindersToPatient(patient, stats))
    );
  }
}

export default {
  fetchAppointmentsNeedingReminders,
  groupAppointmentsByPatient,
  sendRemindersToPatient,
  processAppointmentsInBatches,
};
