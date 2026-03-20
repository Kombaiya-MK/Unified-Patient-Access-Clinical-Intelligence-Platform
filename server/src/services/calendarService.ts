/**
 * Calendar Service (.ics generation)
 * 
 * Generates iCalendar (.ics) files for appointment reminders.
 * Creates calendar events that can be added to Google Calendar, Outlook, etc.
 * 
 * Features:
 * - Generate .ics file with VEVENT
 * - Multiple appointments in single  .ics file
 * - 24-hour reminder alarm
 * - Timezone support
 * - Unique UID for each event
 * 
 * @module calendarService
 * @created 2026-03-20
 * @task US_016 TASK_003 - Calendar ICS Generation
 */

import ical, { ICalCalendar, ICalEventData } from 'ical-generator';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import logger from '../utils/logger';

/**
 * Appointment Event Data
 */
export interface AppointmentEvent {
  id: number;
  appointmentDate: Date;
  duration: number; // minutes
  providerName: string;
  patientEmail: string;
  patientName: string;
  reason?: string;
  location: string;
  departmentPhone?: string;
  preparationInstructions?: string;
}

/**
 * Calendar Generation Result
 */
export interface CalendarResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

/**
 * Temporary directory for .ics files
 */
const TMP_DIR = join(__dirname, '../../tmp');

/**
 * Clinic organization details
 */
const CLINIC_ORG = {
  name: process.env.CLINIC_NAME || 'Clinical Appointment Platform',
  email: process.env.CLINIC_EMAIL || 'noreply@clinic.com',
  url: process.env.CLINIC_URL || 'https://clinic.com',
};

/**
 * Generate .ics calendar file for appointment(s)
 * 
 * @param appointments - Array of appointments to include
 * @returns Promise<CalendarResult>
 */
export async function generateAppointmentCalendar(
  appointments: AppointmentEvent[]
): Promise<CalendarResult> {
  if (appointments.length === 0) {
    return {
      success: false,
      error: 'No appointments provided',
    };
  }

  try {
    // Create calendar
    const calendar = ical({
      name: `${CLINIC_ORG.name} - Appointment Reminder`,
      prodId: {
        company: CLINIC_ORG.name,
        product: 'Appointment Reminder',
        language: 'EN',
      },
      timezone: 'America/New_York',
    });

    // Add events for each appointment
    for (const appointment of appointments) {
      addAppointmentEvent(calendar, appointment);
    }

    // Generate filename: appointment_{id}_{timestamp}.ics
    const timestamp = Date.now();
    const appointmentIds = appointments.map(a => a.id).join('_');
    const filename = `appointment_${appointmentIds}_${timestamp}.ics`;
    const filePath = join(TMP_DIR, filename);

    // Save to file
    const icsContent = calendar.toString();
    await writeFile(filePath, icsContent, 'utf8');

    logger.info('Calendar file generated', {
      filePath,
      appointmentCount: appointments.length,
      appointmentIds: appointments.map(a => a.id),
    });

    return {
      success: true,
      filePath,
    };
  } catch (error: any) {
    logger.error('Failed to generate calendar file', { error: error.message });
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Add appointment event to calendar
 */
function addAppointmentEvent(calendar: ICalCalendar, appointment: AppointmentEvent): void {
  const {
    id,
    appointmentDate,
    duration,
    providerName,
    patientEmail,
    patientName,
    reason,
    location,
    departmentPhone,
    preparationInstructions,
  } = appointment;

  // Calculate end time
  const endDate = new Date(appointmentDate.getTime() + duration * 60000);

  // Build description
  let description = `Appointment with ${providerName}\n`;
  if (reason) {
    description += `Reason: ${reason}\n`;
  }
  if (preparationInstructions) {
    description += `\nPreparation:\n${preparationInstructions}\n`;
  }
  if (departmentPhone) {
    description += `\nContact: ${departmentPhone}`;
  }
  description += `\n\nThis is an automated reminder from ${CLINIC_ORG.name}.`;

  // Event data
  const eventData: ICalEventData = {
    start: appointmentDate,
    end: endDate,
    summary: `Appointment with ${providerName}`,
    description,
    location,
    uid: `appointment-${id}@${CLINIC_ORG.url.replace(/^https?:\/\//, '')}`,
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    organizer: {
      name: CLINIC_ORG.name,
      email: CLINIC_ORG.email,
    },
    attendees: [
      {
        name: patientName,
        email: patientEmail,
        rsvp: true,
        status: 'NEEDS-ACTION',
        role: 'REQ-PARTICIPANT' as any,
      },
    ],
    alarms: [
      {
        type: 'display' as any,
        trigger: 86400, // 24 hours before (in seconds)
        description: `Reminder: Appointment with ${providerName} tomorrow`,
      },
    ],
    url: `${CLINIC_ORG.url}/appointments/${id}`,
  };

  // Add event to calendar
  calendar.createEvent(eventData);
}

/**
 * Delete temporary .ics file
 * 
 * @param filePath - Path to .ics file
 */
export async function deleteCalendarFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
    logger.info('Calendar file deleted', { filePath });
  } catch (error: any) {
    logger.warn('Failed to delete calendar file', {
      filePath,
      error: error.message,
    });
  }
}

/**
 * Generate .ics content as string (without saving to file)
 * Useful for direct email attachment
 * 
 * @param appointments - Array of appointments
 * @returns Promise<string> - .ics file content
 */
export async function generateCalendarContent(
  appointments: AppointmentEvent[]
): Promise<string> {
  const calendar = ical({
    name: `${CLINIC_ORG.name} - Appointment Reminder`,
    prodId: {
      company: CLINIC_ORG.name,
      product: 'Appointment Reminder',
      language: 'EN',
    },
    timezone: 'America/New_York',
  });

  for (const appointment of appointments) {
    addAppointmentEvent(calendar, appointment);
  }

  return calendar.toString();
}

export default {
  generateAppointmentCalendar,
  generateCalendarContent,
  deleteCalendarFile,
};
