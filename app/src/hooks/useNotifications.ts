/**
 * Notifications Hook
 * 
 * Custom React hook for managing notifications state.
 * Returns mock data until US-046 API integration is completed.
 * 
 * Features:
 * - Fetch notifications list
 * - Track unread count
 * - Mark individual notifications as read
 * - Mark all notifications as read
 * - Loading and error states
 * 
 * @module useNotifications
 * @created 2026-03-19
 * @task US_019 TASK_003
 * @todo Replace mock data with API calls when US-046 is implemented
 */

import { useState, useEffect, useCallback } from 'react';
import type { Notification, UseNotificationsReturn } from '../types/notification.types';

/**
 * Mock notifications data
 * 
 * Simulates 5 notifications with mix of read/unread status.
 * Types: appointment, document, system
 */
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-001',
    title: 'Appointment Confirmed',
    message: 'Your appointment with Dr. Sarah Johnson on March 25, 2026 at 2:30 PM has been confirmed.',
    type: 'appointment',
    read: false,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    icon: '📅',
  },
  {
    id: 'notif-002',
    title: 'Lab Results Available',
    message: 'Your lab results from March 15, 2026 are now available to view.',
    type: 'document',
    read: false,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    icon: '📊',
  },
  {
    id: 'notif-003',
    title: 'Medication Refill Reminder',
    message: 'Your prescription for Lisinopril is due for refill in 3 days.',
    type: 'system',
    read: true,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    icon: '💊',
  },
  {
    id: 'notif-004',
    title: 'Intake Form Completed',
    message: 'Thank you for completing your patient intake form. Your provider will review it before your visit.',
    type: 'document',
    read: true,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    icon: '✅',
  },
  {
    id: 'notif-005',
    title: 'Appointment Reminder',
    message: 'Reminder: You have an appointment tomorrow at 10:00 AM with Dr. Michael Chen.',
    type: 'appointment',
    read: false,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    icon: '⏰',
  },
];

/**
 * useNotifications Hook
 * 
 * Manages notification state with mock data.
 * 
 * @returns {UseNotificationsReturn} Notifications state and actions
 * 
 * @example
 * ```tsx
 * const { notifications, unreadCount, markAsRead, loading } = useNotifications();
 * 
 * return (
 *   <div>
 *     <p>Unread: {unreadCount}</p>
 *     {notifications.map(notif => (
 *       <NotificationItem key={notif.id} notification={notif} onMarkRead={markAsRead} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Simulate API fetch on mount
   */
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);

      try {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Load mock data (would be API call in production)
        setNotifications(MOCK_NOTIFICATIONS);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  /**
   * Calculate unread count
   */
  const unreadCount = notifications.filter((n) => !n.read).length;

  /**
   * Mark a single notification as read
   * 
   * @param id - Notification ID to mark as read
   */
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );

    // TODO: Call API to update read status when US-046 is implemented
    // await updateNotificationStatus(id, { read: true });
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );

    // TODO: Call API to mark all as read when US-046 is implemented
    // await updateAllNotificationsStatus({ read: true });
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    loading,
    error,
  };
};
