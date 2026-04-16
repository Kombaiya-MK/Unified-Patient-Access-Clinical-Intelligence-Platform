/**
 * Notification Type Definitions
 *
 * Defines TypeScript interfaces for notification data structures.
 * Supports appointment, document, and system notification types
 * with priority levels for real-time WebSocket delivery.
 *
 * @module notification.types
 * @created 2026-03-19
 * @updated 2026-04-09
 * @task US_019 TASK_003, US_046 TASK_001
 */

export type NotificationType = 'appointment' | 'document' | 'system';

export type NotificationPriority = 'info' | 'warning' | 'critical';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  read: boolean;
  acknowledged: boolean;
  timestamp: string;
  icon: string;
  actionUrl?: string;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  acknowledge: (id: string) => void;
  dismissPopup: (id: string) => void;
  clearRead: () => void;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  popups: Notification[];
  isPanelOpen: boolean;
  togglePanel: () => void;
  closePanel: () => void;
  loadMore: () => void;
  hasMore: boolean;
}
