/**
 * Date Validation Utilities
 * 
 * Utility functions for validating appointment dates and times.
 * Enforces business rules like 2-hour minimum notice and reschedule limits.
 * 
 * Business Rules:
 * - Cannot reschedule within 2 hours of appointment start time
 * - Maximum 3 reschedules per appointment
 * - Cannot select slots in the past
 * 
 * @module dateValidation
 * @created 2026-03-19
 * @task US_014 TASK_001
 */

import { isAfter, addHours, parseISO, isBefore } from 'date-fns';
import type { Appointment } from '../types/appointment.types';

/**
 * Reschedule validation result
 */
export interface RescheduleValidation {
  /** Whether reschedule is allowed */
  allowed: boolean;
  /** Reason if not allowed */
  reason?: string;
}

/**
 * Check if a date/time is at least 2 hours in the future
 * 
 * @param appointmentDateTime - ISO 8601 date-time string (e.g., "2026-03-19T14:30:00Z") or full appointment date
 * @returns True if date/time is more than 2 hours away, false otherwise
 * 
 * @example
 * ```ts
 * isTwoHoursAway('2026-03-19T14:30:00Z') // true if >2 hours away
 * isTwoHoursAway('2026-03-19T10:00:00Z') // false if <2 hours away
 * ```
 */
export const isTwoHoursAway = (appointmentDateTime: string): boolean => {
  try {
    const appointmentTime = parseISO(appointmentDateTime);
    const twoHoursFromNow = addHours(new Date(), 2);
    
    return isAfter(appointmentTime, twoHoursFromNow);
  } catch (error) {
    console.error('Error parsing date in isTwoHoursAway:', error);
    return false;
  }
};

/**
 * Check if a date is in the past
 * 
 * @param dateTime - ISO 8601 date-time string
 * @returns True if date is in the past, false otherwise
 */
export const isInPast = (dateTime: string): boolean => {
  try {
    const date = parseISO(dateTime);
    return isBefore(date, new Date());
  } catch (error) {
    console.error('Error parsing date in isInPast:', error);
    return false;
  }
};

/**
 * Check if an appointment can be rescheduled
 * 
 * Validates:
 * - Appointment must be at least 2 hours in the future
 * - Reschedule count must be less than 3
 * 
 * @param appointment - Appointment record to validate
 * @returns Validation result with allowed flag and reason if not allowed
 * 
 * @example
 * ```ts
 * const validation = canReschedule(appointment);
 * if (!validation.allowed) {
 *   console.error(validation.reason);
 * }
 * ```
 */
export const canReschedule = (appointment: Appointment): RescheduleValidation => {
  // Build full date-time string from appointment date
  const dateTime = appointment.appointmentDate;
  
  // Check 2-hour restriction
  if (!isTwoHoursAway(dateTime)) {
    return {
      allowed: false,
      reason: 'Cannot reschedule appointments within 2 hours of start time. Please call the office at (555) 123-4567.',
    };
  }
  
  // Check reschedule count limit (if rescheduleCount exists on appointment)
  const rescheduleCount = (appointment as any).rescheduleCount || 0;
  if (rescheduleCount >= 3) {
    return {
      allowed: false,
      reason: 'Maximum reschedules (3) reached for this appointment. Please call the office at (555) 123-4567.',
    };
  }
  
  return { allowed: true };
};

/**
 * Format appointment date-time for validation
 * Combines appointment date and start time into ISO 8601 string
 * 
 * @param appointmentDate - Date string (YYYY-MM-DD or ISO 8601)
 * @param startTime - Time string (HH:mm:ss or ISO 8601)
 * @returns ISO 8601 date-time string for validation
 * 
 * @example
 * ```ts
 * formatAppointmentDateTime('2026-03-19', '14:30:00') // '2026-03-19T14:30:00'
 * ```
 */
export const formatAppointmentDateTime = (appointmentDate: string, startTime?: string): string => {
  try {
    // If appointmentDate is already ISO 8601 with time, return as-is
    if (appointmentDate.includes('T')) {
      return appointmentDate;
    }
    
    // Combine date and time
    if (startTime) {
      return `${appointmentDate}T${startTime}`;
    }
    
    // Default to start of day if no time provided
    return `${appointmentDate}T00:00:00`;
  } catch (error) {
    console.error('Error formatting appointment date-time:', error);
    return appointmentDate;
  }
};

/**
 * Validate if a new slot time is valid for rescheduling
 * 
 * @param newSlotDateTime - New slot date-time (ISO 8601)
 * @param currentAppointmentDateTime - Current appointment date-time (ISO 8601)
 * @returns Validation result
 * 
 * @example
 * ```ts
 * const validation = validateRescheduleSlot(
 *   '2026-03-20T14:30:00Z',
 *   '2026-03-19T10:00:00Z'
 * );
 * ```
 */
export const validateRescheduleSlot = (
  newSlotDateTime: string,
  currentAppointmentDateTime: string
): RescheduleValidation => {
  // Check if new slot is in the past
  if (isInPast(newSlotDateTime)) {
    return {
      allowed: false,
      reason: 'Cannot reschedule to a past time. Please select a future time slot.',
    };
  }
  
  // Check if new slot is at least 2 hours in the future
  if (!isTwoHoursAway(newSlotDateTime)) {
    return {
      allowed: false,
      reason: 'Cannot reschedule to a slot within 2 hours. Please select a later time.',
    };
  }
  
  // Check if trying to reschedule to the same time
  if (newSlotDateTime === currentAppointmentDateTime) {
    return {
      allowed: false,
      reason: 'This appointment is already scheduled at this time. Please select a different slot.',
    };
  }
  
  return { allowed: true };
};
