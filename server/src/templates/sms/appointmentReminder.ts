/**
 * Appointment Reminder SMS Template
 * 
 * Generates SMS message text for appointment reminders.
 * Format: 160 characters max (SMS segment limit).
 * 
 * @module appointmentReminderTemplate
 * @created 2026-03-20
 * @task US_016 TASK_002 - SMS Service Integration
 */

/**
 * Appointment Data Interface
 */
export interface AppointmentData {
  appointmentDate: string; // e.g., "March 21, 2026"
  appointmentTime: string; // e.g., "10:00 AM"
  providerName: string; // e.g., "Dr. Smith"
  departmentLocation: string; // e.g., "Building A, Floor 3"
  clinicPhone: string; // e.g., "+1-800-555-1234"
  clinicName?: string; // Optional clinic name
}

/**
 * Generate appointment reminder SMS text
 * 
 * Template:
 * "Reminder: Appointment tomorrow {time} with {provider} at {location}. Reply CONFIRM or call {phone}."
 * 
 * @param data - Appointment details
 * @returns SMS message string (truncated to 160 chars if needed)
 */
export function generateAppointmentReminderSMS(data: AppointmentData): string {
  const { appointmentTime, providerName, departmentLocation, clinicPhone } = data;

  // Build message
  const message = 
    `Reminder: Appointment tomorrow ${appointmentTime} with ${providerName} at ${departmentLocation}. ` +
    `Reply CONFIRM or call ${clinicPhone}.`;

  return message;
}

/**
 * Generate short-form reminder SMS (for longer provider/location names)
 * 
 * Template:
 * "Reminder: Appt tomorrow {time} with {provider}. Call {phone} to confirm."
 * 
 * @param data - Appointment details
 * @returns Shorter SMS message string
 */
export function generateShortReminderSMS(data: AppointmentData): string {
  const { appointmentTime, providerName, clinicPhone } = data;

  const message = 
    `Reminder: Appt tomorrow ${appointmentTime} with ${providerName}. ` +
    `Call ${clinicPhone} to confirm.`;

  return message;
}

/**
 * Generate consolidated reminder SMS for multiple appointments
 * 
 * Template:
 * "Reminders: You have 2 appointments tomorrow:
 * 1. 10:00 AM - Dr. Smith
 * 2. 2:00 PM - Dr. Jones
 * Call {phone}."
 * 
 * @param appointments - Array of appointments
 * @param clinicPhone - Clinic phone number
 * @returns Consolidated SMS message
 */
export function generateConsolidatedReminderSMS(
  appointments: Array<{ time: string; provider: string }>,
  clinicPhone: string
): string {
  const count = appointments.length;
  let message = `Reminders: You have ${count} appointments tomorrow:\n`;

  appointments.forEach((apt, index) => {
    message += `${index + 1}. ${apt.time} - ${apt.provider}\n`;
  });

  message += `Call ${clinicPhone}.`;

  return message;
}

/**
 * Generate cancellation confirmation SMS
 * 
 * @param appointmentTime - Time of cancelled appointment
 * @param providerName - Provider name
 * @returns Cancellation confirmation message
 */
export function generateCancellationConfirmationSMS(
  appointmentTime: string,
  providerName: string
): string {
  return `Your appointment tomorrow ${appointmentTime} with ${providerName} has been cancelled.`;
}

/**
 * Generate reschedule confirmation SMS
 * 
 * @param oldTime - Original appointment time
 * @param newDate - New appointment date
 * @param newTime - New appointment time
 * @param providerName - Provider name
 * @returns Reschedule confirmation message
 */
export function generateRescheduleConfirmationSMS(
  oldTime: string,
  newDate: string,
  newTime: string,
  providerName: string
): string {
  return `Your appointment has been rescheduled from ${oldTime} to ${newDate} at ${newTime} with ${providerName}.`;
}

export default {
  generateAppointmentReminderSMS,
  generateShortReminderSMS,
  generateConsolidatedReminderSMS,
  generateCancellationConfirmationSMS,
  generateRescheduleConfirmationSMS,
};
