/**
 * Staff Booking Types
 * 
 * Type definitions for staff-assisted appointment booking.
 * 
 * @module staffBooking.types
 * @created 2026-04-01
 * @task US_023 TASK_002
 */

/**
 * Booking priority level
 */
export type BookingPriority = 'normal' | 'urgent';

/**
 * Request payload for staff-assisted appointment booking
 */
export interface StaffBookingRequest {
  /** Patient profile ID */
  patientId: string;
  /** Selected time slot ID */
  slotId: string;
  /** Appointment type */
  appointmentType: string;
  /** Reason for visit */
  reasonForVisit?: string;
  /** Staff internal notes */
  staffBookingNotes?: string;
  /** Booking priority */
  bookingPriority: BookingPriority;
  /** Whether to override slot capacity */
  overrideCapacity: boolean;
}

/**
 * Response from staff-assisted booking
 */
export interface StaffBookingResponse {
  /** Success status */
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
