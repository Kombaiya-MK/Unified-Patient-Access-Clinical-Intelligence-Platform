/**
 * Notifications Hook
 *
 * Custom React hook providing access to the NotificationContext.
 * Manages real-time notification state, popup queue, panel toggle,
 * read/acknowledge actions, and pagination.
 *
 * @module useNotifications
 * @created 2026-03-19
 * @updated 2026-04-09
 * @task US_019 TASK_003, US_046 TASK_001
 */

import { useContext, useCallback, useEffect } from 'react';
import { NotificationContext } from '../contexts/NotificationContext';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  acknowledgeNotification as acknowledgeApi,
  clearReadNotifications,
} from '../services/notificationService';
import type { UseNotificationsReturn } from '../types/notification.types';

export const useNotifications = (): UseNotificationsReturn => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }

  const {
    state,
    addNotification,
    markAsRead: markAsReadLocal,
    markAllAsRead: markAllAsReadLocal,
    acknowledge: acknowledgeLocal,
    dismissPopup,
    clearRead: clearReadLocal,
    togglePanel,
    closePanel,
    setLoading,
    setError,
    setNotifications,
    appendPage,
  } = ctx;

  // Load initial notifications
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchNotifications(1, 20);
        if (!cancelled) {
          setNotifications(data.notifications);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load notifications');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [setLoading, setError, setNotifications]);

  const markAsRead = useCallback(
    (id: string) => {
      markAsReadLocal(id);
      markNotificationAsRead(id).catch(() => {
        /* silent — optimistic update */
      });
    },
    [markAsReadLocal],
  );

  const markAllAsRead = useCallback(() => {
    markAllAsReadLocal();
    markAllNotificationsAsRead().catch(() => {
      /* silent */
    });
  }, [markAllAsReadLocal]);

  const acknowledge = useCallback(
    (id: string) => {
      acknowledgeLocal(id);
      acknowledgeApi(id).catch(() => {
        /* silent */
      });
    },
    [acknowledgeLocal],
  );

  const clearRead = useCallback(() => {
    clearReadLocal();
    clearReadNotifications().catch(() => {
      /* silent */
    });
  }, [clearReadLocal]);

  const loadMore = useCallback(async () => {
    if (!state.hasMore || state.loading) return;
    setLoading(true);
    try {
      const data = await fetchNotifications(state.page + 1, 20);
      appendPage(data.notifications, data.hasMore);
    } catch {
      setError('Failed to load more notifications');
    } finally {
      setLoading(false);
    }
  }, [state.hasMore, state.loading, state.page, setLoading, setError, appendPage]);

  return {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    acknowledge,
    dismissPopup,
    clearRead,
    loading: state.loading,
    error: state.error,
    isConnected: state.isConnected,
    popups: state.popups,
    isPanelOpen: state.isPanelOpen,
    togglePanel,
    closePanel,
    loadMore,
    hasMore: state.hasMore,
  };
};
