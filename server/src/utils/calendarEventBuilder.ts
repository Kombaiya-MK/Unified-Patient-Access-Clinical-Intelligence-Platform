/**
 * Calendar Event Builder
 * 
 * Utility for building calendar event payloads for Google Calendar and Microsoft Outlook.
 * Provides standardized event structure with appointment details, reminders, and clinic information.
 * 
 * Features:
 * - Build Google Calendar events (googleapis format)
 * - Build Microsoft Outlook events (Graph API format)
 * - Standardized event summary and description
 * - Timezone support
 * - 24-hour reminder configuration
 * - Clinic branding and contact information
 * 
 * @module calendarEventBuilder
 * @created 2026-03-20
 * @task US_017 TASK_003
 */

import { calendar_v3 } from 'googleapis';

/**
 * Appointment data for calendar event generation
 */
export interface AppointmentData {
  appointment_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  provider_name: string;
  provider_specialty?: string;
  reason: string;
  patient_name: string;
  location?: string;
}

/**
 * Clinic configuration from environment
 */
const CLINIC_NAME = process.env.CLINIC_NAME || 'Clinical Appointment Platform';
const CLINIC_LOCATION = process.env.CLINIC_LOCATION || '123 Main St, City, State 12345';
const CLINIC_PHONE = process.env.CLINIC_PHONE_NUMBER || '1-800-CLINIC';
const TIMEZONE = process.env.CLINIC_TIMEZONE || 'America/New_York';

/**
 * Build ISO 8601 datetime string from appointment date and time
 * 
 * @param date - Date string (YYYY-MM-DD)
 * @param time - Time string (HH:MM:SS)
 * @returns ISO 8601 datetime string
 */
const buildDateTime = (date: string, time: string): string => {
  const [hours, minutes] = time.split(':');
  const dateTime = new Date(`${date}T${hours}:${minutes}:00`);
  return dateTime.toISOString();
};

/**
 * Build event description with appointment details and instructions
 * 
 * @param appointment - Appointment data
 * @returns Formatted description
 */
const buildDescription = (appointment: AppointmentData): string => {
  const specialtyInfo = appointment.provider_specialty 
    ? ` (${appointment.provider_specialty})` 
    : '';
  
  return `${appointment.reason}

Provider: ${appointment.provider_name}${specialtyInfo}

What to bring:
- Photo ID
- Insurance card
- List of current medications

Please arrive 15 minutes early for check-in.

For questions or to reschedule, call ${CLINIC_PHONE}`;
};

/**
 * Build Google Calendar event object
 * 
 * @param appointment - Appointment data
 * @returns Google Calendar event object (googleapis format)
 */
export const buildGoogleCalendarEvent = (
  appointment: AppointmentData
): calendar_v3.Schema$Event => {
  const startDateTime = buildDateTime(appointment.appointment_date, appointment.start_time);
  const endDateTime = buildDateTime(appointment.appointment_date, appointment.end_time);
  
  return {
    summary: `${CLINIC_NAME} - Appointment with ${appointment.provider_name}`,
    description: buildDescription(appointment),
    location: appointment.location || CLINIC_LOCATION,
    start: {
      dateTime: startDateTime,
      timeZone: TIMEZONE,
    },
    end: {
      dateTime: endDateTime,
      timeZone: TIMEZONE,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 24 * 60 }, // 24 hours before
      ],
    },
    colorId: '5', // Yellow color for medical appointments
  };
};

/**
 * Microsoft Graph event body structure
 */
interface MicrosoftEventBody {
  contentType: 'text';
  content: string;
}

/**
 * Microsoft Graph location structure
 */
interface MicrosoftEventLocation {
  displayName: string;
}

/**
 * Microsoft Graph date time structure
 */
interface MicrosoftEventDateTime {
  dateTime: string;
  timeZone: string;
}

/**
 * Microsoft Graph event structure
 */
export interface MicrosoftCalendarEvent {
  subject: string;
  body: MicrosoftEventBody;
  location: MicrosoftEventLocation;
  start: MicrosoftEventDateTime;
  end: MicrosoftEventDateTime;
  isReminderOn: boolean;
  reminderMinutesBeforeStart: number;
  categories: string[];
}

/**
 * Build Microsoft Outlook Calendar event object
 * 
 * @param appointment - Appointment data
 * @returns Microsoft Graph event object
 */
export const buildMicrosoftCalendarEvent = (
  appointment: AppointmentData
): MicrosoftCalendarEvent => {
  const startDateTime = buildDateTime(appointment.appointment_date, appointment.start_time);
  const endDateTime = buildDateTime(appointment.appointment_date, appointment.end_time);
  
  return {
    subject: `${CLINIC_NAME} - Appointment with ${appointment.provider_name}`,
    body: {
      contentType: 'text',
      content: buildDescription(appointment),
    },
    location: {
      displayName: appointment.location || CLINIC_LOCATION,
    },
    start: {
      dateTime: startDateTime,
      timeZone: TIMEZONE,
    },
    end: {
      dateTime: endDateTime,
      timeZone: TIMEZONE,
    },
    isReminderOn: true,
    reminderMinutesBeforeStart: 24 * 60, // 24 hours
    categories: ['Health', 'Appointment'],
  };
};
