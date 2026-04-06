/**
 * Staff Booking Form Data Type
 * 
 * Type definition for staff-assisted booking form submission.
 * 
 * @module staffBooking.types
 * @created 2026-04-01
 * @task US_023 TASK_004
 */

/**
 * Booking priority level
 */
export type BookingPriority = 'normal' | 'urgent';

/**
 * Form data for staff-assisted appointment booking
 */
export interface StaffBookingFormData {
  /** Patient profile ID */
  patientId: string;
  /** Selected time slot ID */
  slotId: string;
  /** Appointment type */
  appointmentType: string;
  /** Reason for visit */
  reasonForVisit: string;
  /** Override slot capacity */
  overrideCapacity: boolean;
  /** Booking priority */
  bookingPriority: BookingPriority;
  /** Internal staff booking notes */
  staffBookingNotes: string;
}

/**
 * API response for staff booking
 */
export interface StaffBookingResponse {
  /** Success indicator */
  success: boolean;
  /** Created appointment ID */
  appointmentId: string;
  /** Patient name */
  patientName: string;
  /** Appointment date/time */
  appointmentDate: string;
  /** Provider name */
  providerName: string;
  /** Confirmation message */
  message: string;
}
