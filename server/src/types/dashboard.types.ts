/**
 * Dashboard Type Definitions
 * 
 * TypeScript interfaces for dashboard API responses and data structures.
 * Supports patient dashboard aggregation with appointments and notifications.
 * 
 * @module dashboard.types
 * @created 2026-03-19
 * @task US_019 TASK_004
 */

/**
 * Dashboard Appointment
 * Simplified appointment structure for dashboard display
 */
export interface DashboardAppointment {
  id: string;
  appointmentDate: string; // ISO 8601 format
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  provider: {
    id: number;
    firstName: string;
    lastName: string;
    specialization?: string;
  };
  department: {
    id: number;
    name: string;
    location?: string;
  };
  appointmentType?: string;
  rescheduleCount?: number;
}

/**
 * Dashboard Notification
 * Simplified notification structure for dashboard display
 */
export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  type: 'appointment' | 'document' | 'system';
  read: boolean;
  createdAt: string; // ISO 8601 format
}

/**
 * Patient Info for Dashboard
 */
export interface DashboardPatient {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  profilePhotoUrl?: string;
}

/**
 * Aggregate Dashboard Data
 */
export interface DashboardData {
  patient: DashboardPatient;
  upcomingAppointments: DashboardAppointment[];
  pastAppointments: DashboardAppointment[];
  notifications: DashboardNotification[];
  unreadNotificationCount: number;
}

/**
 * Dashboard API Response
 */
export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
  timestamp: string;
}
