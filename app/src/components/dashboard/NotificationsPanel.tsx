/**
 * Notifications Panel Component
 * 
 * Right sidebar panel displaying recent notifications with unread count badge.
 * Shows latest 5 notifications with scroll, "View All" link, and empty state.
 * 
 * Features:
 * - Header with bell icon and unread count badge
 * - Scrollable notification list (max 5 items)
 * - Empty state for zero notifications
 * - "View All Notifications" footer link
 * - Loading and error states
 * - Mark individual notifications as read on click
 * 
 * @module NotificationsPanel
 * @created 2026-03-19
 * @task US_019 TASK_003
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { LoadingSpinner } from '../common/LoadingSpinner';
import './NotificationsPanel.css';

/**
 * Bell Icon Component
 */
const BellIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

/**
 * Empty State Icon Component
 */
const EmptyNotificationsIcon: React.FC = () => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/**
 * NotificationsPanel Component
 * 
 * Displays notification list with header, scroll container, and footer.
 * Integrates with useNotifications hook for data management.
 * 
 * @example
 * ```tsx
 * <DashboardLayout
 *   sidebar={<NavigationSidebar />}
 *   notifications={<NotificationsPanel />}
 * >
 *   {mainContent}
 * </DashboardLayout>
 * ```
 */
export const NotificationsPanel: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, loading, error } = useNotifications();

  /**
   * Navigate to full notifications page
   */
  const handleViewAll = () => {
    navigate('/notifications');
  };

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <div className="notifications-panel">
        <div className="notifications-panel__header">
          <div className="notifications-panel__header-icon">
            <BellIcon />
          </div>
          <h3 className="notifications-panel__title">Notifications</h3>
        </div>
        <div className="notifications-panel__loading">
          <LoadingSpinner />
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <div className="notifications-panel">
        <div className="notifications-panel__header">
          <div className="notifications-panel__header-icon">
            <BellIcon />
          </div>
          <h3 className="notifications-panel__title">Notifications</h3>
        </div>
        <div className="notifications-panel__error">
          <p role="alert">Failed to load notifications</p>
          <p className="notifications-panel__error-message">{error}</p>
        </div>
      </div>
    );
  }

  /**
   * Render empty state
   */
  if (notifications.length === 0) {
    return (
      <div className="notifications-panel">
        <div className="notifications-panel__header">
          <div className="notifications-panel__header-icon">
            <BellIcon />
          </div>
          <h3 className="notifications-panel__title">Notifications</h3>
        </div>
        <div className="notifications-panel__empty">
          <EmptyNotificationsIcon />
          <p className="notifications-panel__empty-title">No notifications</p>
          <p className="notifications-panel__empty-message">
            You're all caught up! We'll notify you of any important updates.
          </p>
        </div>
      </div>
    );
  }

  // Show latest 5 notifications
  const displayNotifications = notifications.slice(0, 5);

  return (
    <div className="notifications-panel">
      {/* Header with bell icon and unread badge */}
      <div className="notifications-panel__header">
        <div className="notifications-panel__header-icon">
          <BellIcon />
          {unreadCount > 0 && (
            <span className="notifications-panel__badge" aria-label={`${unreadCount} unread notifications`}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <h3 className="notifications-panel__title">Notifications</h3>
      </div>

      {/* Scrollable notification list */}
      <div className="notifications-panel__body">
        {displayNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkRead={markAsRead}
          />
        ))}
      </div>

      {/* Footer with "View All" link */}
      <div className="notifications-panel__footer">
        <button
          onClick={handleViewAll}
          className="notifications-panel__view-all"
          aria-label="View all notifications"
        >
          View All Notifications
        </button>
      </div>
    </div>
  );
};
