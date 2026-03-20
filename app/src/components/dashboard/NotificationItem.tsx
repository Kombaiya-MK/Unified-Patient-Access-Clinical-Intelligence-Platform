/**
 * Notification Item Component
 * 
 * Individual notification list item displaying icon, title, message, and timestamp.
 * Supports color-coded icons by notification type and unread visual highlighting.
 * 
 * Features:
 * - Type-based icon styling (blue=appointment, green=document, gray=system)
 * - Relative timestamp formatting ("2h ago", "1d ago")
 * - Message truncation to 2 lines with ellipsis
 * - Unread background highlight
 * - Click to mark as read
 * - Hover effects for interactivity
 * 
 * @module NotificationItem
 * @created 2026-03-19
 * @task US_019 TASK_003
 */

import React from 'react';
import type { Notification } from '../../types/notification.types';
import './NotificationItem.css';

/**
 * NotificationItem Props
 */
export interface NotificationItemProps {
  /** Notification data to display */
  notification: Notification;
  /** Callback when notification is clicked/marked as read */
  onMarkRead?: (id: string) => void;
}

/**
 * Format timestamp as relative time
 * 
 * @param timestamp - ISO 8601 timestamp string
 * @returns Relative time string (e.g., "2h ago", "1d ago", "just now")
 * 
 * @example
 * formatRelativeTime("2026-03-19T10:00:00Z") // "2h ago"
 */
const formatRelativeTime = (timestamp: string): string => {
  try {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      // Fallback to date string for older notifications
      return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  } catch {
    return timestamp;
  }
};

/**
 * Get CSS class for notification icon based on type
 * 
 * @param type - Notification type
 * @returns CSS class name for icon styling
 */
const getIconClass = (type: Notification['type']): string => {
  switch (type) {
    case 'appointment':
      return 'notification-item__icon--appointment';
    case 'document':
      return 'notification-item__icon--document';
    case 'system':
      return 'notification-item__icon--system';
    default:
      return 'notification-item__icon--system';
  }
};

/**
 * NotificationItem Component
 * 
 * Displays a single notification with icon, title, message, and relative timestamp.
 * Unread notifications have a highlighted background. Clicking marks as read.
 * 
 * @example
 * ```tsx
 * <NotificationItem
 *   notification={{
 *     id: 'notif-001',
 *     title: 'Appointment Confirmed',
 *     message: 'Your appointment with Dr. Johnson is confirmed.',
 *     type: 'appointment',
 *     read: false,
 *     timestamp: '2026-03-19T10:00:00Z',
 *     icon: '📅'
 *   }}
 *   onMarkRead={(id) => markAsRead(id)}
 * />
 * ```
 */
export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkRead,
}) => {
  const { id, title, message, type, read, timestamp, icon } = notification;

  /**
   * Handle click to mark as read
   */
  const handleClick = () => {
    if (!read && onMarkRead) {
      onMarkRead(id);
    }
  };

  const relativeTime = formatRelativeTime(timestamp);
  const iconClass = getIconClass(type);
  const itemClass = `notification-item ${!read ? 'notification-item--unread' : ''}`;

  return (
    <div
      className={itemClass}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`${title}. ${message}. ${relativeTime}. ${read ? 'Read' : 'Unread'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Icon */}
      <div className={`notification-item__icon ${iconClass}`} aria-hidden="true">
        <span className="notification-item__icon-emoji">{icon}</span>
      </div>

      {/* Content */}
      <div className="notification-item__content">
        <div className="notification-item__header">
          <h4 className="notification-item__title">{title}</h4>
          {!read && (
            <span className="notification-item__unread-indicator" aria-label="Unread" />
          )}
        </div>
        <p className="notification-item__message">{message}</p>
        <span className="notification-item__time">{relativeTime}</span>
      </div>
    </div>
  );
};
