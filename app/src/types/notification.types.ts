/**
 * Notification Type Definitions
 * 
 * Defines TypeScript interfaces for notification data structures.
 * Supports appointment, document, and system notification types.
 * 
 * @module notification.types
 * @created 2026-03-19
 * @task US_019 TASK_003
 */

/**
 * Notification type enum
 */
export type NotificationType = 'appointment' | 'document' | 'system';

/**
 * Notification interface
 * 
 * @property id - Unique notification identifier
 * @property title - Notification title (bold text)
 * @property message - Notification message body
 * @property type - Category of notification (appointment/document/system)
 * @property read - Whether notification has been read
 * @property timestamp - ISO 8601 timestamp when notification was created
 * @property icon - Emoji or icon identifier for visual representation
 */
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  timestamp: string; // ISO 8601 date string
  icon: string;
}

/**
 * Notifications hook return type
 */
export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  loading: boolean;
  error: string | null;
}
