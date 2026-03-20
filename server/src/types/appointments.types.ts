/**
 * Appointment Types
 * 
 * Type definitions for appointment booking system backend API.
 * Includes types for slots, appointments, booking requests, and waitlist management.
 * 
 * @module appointments.types
 * @created 2026-03-18
 * @task US_013 TASK_002
 */

/**
 * Time slot availability status
 */
export type SlotStatus = 'available' | 'booked' | 'blocked';

/**
 * Appointment status
 */
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';

/**
 * Waitlist entry status
 */
export type WaitlistStatus = 'waiting' | 'notified' | 'expired' | 'converted';

/**
 * Available time slot
 */
export interface Slot {
  /** Unique slot ID */
  id: string;
  /** Start time (ISO 8601) */
  startTime: Date;
  /** End time (ISO 8601) */
  endTime: Date;
  /** Whether slot is available for booking */
  isAvailable: boolean;
  /** Associated provider ID */
  providerId: string;
  /** Associated department ID */
  departmentId: string;
  /** Appointment duration in minutes */
  duration: number;
  /** Provider name (joined from providers table) */
  providerName?: string;
  /** Department name (joined from departments table) */
  departmentName?: string;
}

/**
 * Appointment record
 */
export interface Appointment {
  /** Unique appointment ID */
  id: string;
  /** Patient ID */
  patientId: string;
  /** Provider ID */
  providerId: string;
  /** Slot ID */
  slotId: string;
  /** Department ID */
  departmentId: string;
  /** Appointment date and time */
  appointmentDate: Date;
  /** Current status */
  status: AppointmentStatus;
  /** Patient notes/reason for visit */
  notes?: string;
  /** Appointment duration in minutes */
  duration: number;
  /** Created by (user ID) */
  createdBy: string;
  /** Created timestamp */
  createdAt: Date;
  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Request payload for booking an appointment
 */
export interface BookingRequest {
  /** Selected slot ID */
  slotId: string;
  /** Optional notes/reason for visit (max 500 chars) */
  notes?: string;
}

/**
 * Response from successful booking
 */
export interface BookingResponse {
  /** Created appointment ID */
  appointmentId: string;
  /** Appointment status */
  status: AppointmentStatus;
  /** Success message */
  message: string;
  /** Appointment details */
  appointment: Appointment;
}

/**
 * Request payload for joining waitlist
 */
export interface WaitlistRequest {
  /** Desired slot ID (if specific) */
  slotId?: string;
  /** Preferred date (ISO 8601 date string) */
  preferredDate: string;
  /** Department ID */
  departmentId: string;
  /** Provider ID (optional) */
  providerId?: string;
  /** Notes/preferences */
  notes?: string;
}

/**
 * Waitlist entry
 */
export interface WaitlistEntry {
  /** Unique waitlist entry ID */
  id: string;
  /** Patient ID */
  patientId: string;
  /** Desired slot ID */
  slotId?: string;
  /** Preferred date */
  preferredDate: Date;
  /** Department ID */
  departmentId: string;
  /** Provider ID */
  providerId?: string;
  /** Current status */
  status: WaitlistStatus;
  /** Patient notes */
  notes?: string;
  /** Position in waitlist (1-indexed) */
  position?: number;
  /** Created timestamp */
  createdAt: Date;
}

/**
 * Response from joining waitlist
 */
export interface WaitlistResponse {
  /** Created waitlist entry ID */
  waitlistId: string;
  /** Position in waitlist */
  position: number;
  /** Success message */
  message: string;
  /** Waitlist entry details */
  entry: WaitlistEntry;
}

/**
 * Query parameters for fetching available slots
 */
export interface SlotFilters {
  /** Filter by department ID */
  departmentId?: string;
  /** Filter by provider ID */
  providerId?: string;
  /** Filter by specific date (YYYY-MM-DD) */
  date?: string;
  /** Filter by date range start */
  startDate?: string;
  /** Filter by date range end */
  endDate?: string;
}

/**
 * Business hours configuration
 */
export interface BusinessHours {
  /** Opening time (24-hour format: 8 = 8AM) */
  openingHour: number;
  /** Closing time (24-hour format: 20 = 8PM) */
  closingHour: number;
}

/**
 * Concurrency control result
 */
export interface LockResult {
  /** Whether lock was acquired */
  acquired: boolean;
  /** Locked slot data if acquired */
  slot?: Slot;
  /** Error message if lock failed */
  error?: string;
}
