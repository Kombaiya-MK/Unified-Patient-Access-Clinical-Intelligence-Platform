/**
 * Appointment Types
 * 
 * Type definitions for appointment booking system including slots,
 * departments, providers, and appointment records.
 * 
 * @module appointment.types
 * @created 2026-03-18
 * @task US_013 TASK_001
 */

/**
 * Time slot status
 */
export type TimeSlotStatus = 'available' | 'booked' | 'selected';

/**
 * Appointment status
 */
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';

/**
 * Department in the healthcare facility
 */
export interface Department {
  /** Unique department ID */
  id: string;
  /** Department name (e.g., "Cardiology", "Pediatrics") */
  name: string;
  /** Department description */
  description?: string;
  /** Whether department is currently active */
  isActive: boolean;
}

/**
 * Healthcare provider (doctor, nurse practitioner, etc.)
 */
export interface Provider {
  /** Unique provider ID */
  id: string;
  /** Provider's full name */
  name: string;
  /** Medical specialty */
  specialty: string;
  /** Associated department ID */
  departmentId: string;
  /** Provider's email */
  email?: string;
  /** Whether provider is currently available for bookings */
  isActive: boolean;
}

/**
 * Available time slot for appointments
 */
export interface Slot {
  /** Unique slot ID */
  id: string;
  /** Start time (ISO 8601 format) */
  startTime: string;
  /** End time (ISO 8601 format) */
  endTime: string;
  /** Whether slot is available for booking */
  isAvailable: boolean;
  /** Associated provider ID */
  providerId: string;
  /** Associated department ID */
  departmentId: string;
  /** Appointment duration in minutes */
  duration: number;
  /** Provider name (enriched from JOIN) */
  providerName?: string;
  /** Department name (enriched from JOIN) */
  departmentName?: string;
  /** Appointment type/reason (optional) */
  appointmentType?: string;
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
  /** Appointment date and time (ISO 8601 format) */
  appointmentDate: string;
  /** Current appointment status */
  status: AppointmentStatus;
  /** Patient notes/reason for visit */
  notes?: string;
  /** Appointment duration in minutes */
  duration: number;
  /** Created timestamp */
  createdAt: string;
  /** Last updated timestamp */
  updatedAt: string;
  /** Provider name (enriched from booking response) */
  providerName?: string;
  /** Department name (enriched from booking response) */
  departmentName?: string;
  /** Start time (HH:mm:ss format, enriched from booking response) */
  startTime?: string;
  /** End time (HH:mm:ss format, enriched from booking response) */
  endTime?: string;
}

/**
 * Request payload for booking an appointment
 */
export interface BookAppointmentRequest {
  /** Patient ID (from auth context) */
  patientId: string;
  /** Selected slot ID */
  slotId: string;
  /** Optional notes/reason for visit */
  notes?: string;
}

/**
 * Response from booking an appointment
 */
export interface BookAppointmentResponse {
  /** Success status */
  success: boolean;
  /** Created appointment */
  appointment: Appointment;
  /** Success message */
  message: string;
  /** Confirmation code */
  confirmationCode?: string;
}

/**
 * Request payload for joining waitlist
 */
export interface JoinWaitlistRequest {
  /** Patient ID */
  patientId: string;
  /** Desired slot ID (if specific) */
  slotId?: string;
  /** Preferred date */
  preferredDate: string;
  /** Department ID */
  departmentId: string;
  /** Provider ID (optional) */
  providerId?: string;
  /** Notes */
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
  /** Preferred date */
  preferredDate: string;
  /** Department ID */
  departmentId: string;
  /** Provider ID (optional) */
  providerId?: string;
  /** Entry status */
  status: 'pending' | 'notified' | 'expired';
  /** Notes */
  notes?: string;
  /** Created timestamp */
  createdAt: string;
}

/**
 * Filters for querying available slots
 */
export interface SlotFilters {
  /** Filter by department */
  departmentId?: string;
  /** Filter by provider */
  providerId?: string;
  /** Filter by date (YYYY-MM-DD format) */
  date?: string;
  /** Filter by date range start */
  startDate?: string;
  /** Filter by date range end */
  endDate?: string;
}

/**
 * Available dates response (for calendar highlighting)
 */
export interface AvailableDatesResponse {
  /** Array of dates with available slots (YYYY-MM-DD format) */
  dates: string[];
}
