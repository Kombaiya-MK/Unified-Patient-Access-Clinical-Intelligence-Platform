/**
 * Notification Type Definitions
 * 
 * TypeScript interfaces and types for notification system.
 * Used for dashboard notifications, email/SMS notifications, and system alerts.
 * 
 * @module notification.types
 * @created 2026-03-19
 * @task US_015 TASK_004
 */

/**
 * Notification type enumeration
 * Matches database CHECK constraint in notifications table
 */
export type NotificationType =
  | 'appointment_reminder'
  | 'appointment_confirmation'
  | 'appointment_cancellation'
  | 'appointment_rescheduled'
  | 'waitlist_available'
  | 'test_result_available'
  | 'prescription_ready'
  | 'payment_due'
  | 'system_alert'
  | 'general_message';

/**
 * Notification priority level
 * Matches database CHECK constraint in notifications table
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Notification delivery methods
 * Array of channels through which notification should be sent
 */
export type DeliveryMethod = 'in_app' | 'email' | 'sms' | 'push';

/**
 * Base notification record structure
 * Matches database notifications table schema
 */
export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  isRead: boolean;
  readAt: Date | null;
  deliveryMethod: DeliveryMethod[];
  emailSent: boolean;
  emailSentAt: Date | null;
  smsSent: boolean;
  smsSentAt: Date | null;
  pushSent: boolean;
  pushSentAt: Date | null;
  actionUrl: string | null;
  actionLabel: string | null;
  relatedAppointmentId: number | null;
  relatedDocumentId: number | null;
  expiresAt: Date | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
}

/**
 * Notification creation parameters
 * Required fields for creating a new notification
 */
export interface CreateNotificationParams {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  deliveryMethod?: DeliveryMethod[];
  actionUrl?: string;
  actionLabel?: string;
  relatedAppointmentId?: number;
  relatedDocumentId?: number;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Waitlist notification metadata
 * Additional data stored in metadata JSONB column for waitlist notifications
 */
export interface WaitlistNotificationMetadata {
  waitlistId: number;
  slotId: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  doctorId: number;
  doctorName: string;
  departmentId: number;
  departmentName: string;
  location?: string;
  reservationId: number;
  expiresAt: string; // ISO 8601 timestamp
}

/**
 * Notification query filters
 * Used for fetching notifications with filters
 */
export interface NotificationFilters {
  userId?: number;
  type?: NotificationType | NotificationType[];
  isRead?: boolean;
  priority?: NotificationPriority | NotificationPriority[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Notification update parameters
 * Fields that can be updated on an existing notification
 */
export interface UpdateNotificationParams {
  isRead?: boolean;
  readAt?: Date;
  emailSent?: boolean;
  emailSentAt?: Date;
  smsSent?: boolean;
  smsSentAt?: Date;
  pushSent?: boolean;
  pushSentAt?: Date;
}

/**
 * Per-category notification preferences
 * Controls which notification types the user wants to receive
 */
export interface NotificationCategoryPreferences {
  appointment: boolean;
  medication: boolean;
  system: boolean;
  waitlist: boolean;
}

export const DEFAULT_CATEGORY_PREFERENCES: NotificationCategoryPreferences = {
  appointment: true,
  medication: true,
  system: true,
  waitlist: true,
};

/**
 * Paginated notification response shape
 */
export interface PaginatedNotifications {
  notifications: Notification[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
