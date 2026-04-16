/**
 * Header
 *
 * Responsive top bar with logo, hamburger (mobile/tablet),
 * role badge, notification bell, and user avatar.
 *
 * Mobile:  56px, hamburger left, logo center, avatar right
 * Desktop: 64px, logo left, role badge, avatar right
 *
 * @task US_044 TASK_002, US_046 TASK_001
 */

import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { NavigationContext } from '../../context/NavigationContext';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationBellIcon } from '../notifications/NotificationBellIcon';
import { NotificationPanel } from '../notifications/NotificationPanel';
import styles from './navigation.module.css';

export const Header: React.FC = () => {
  const { toggleMenu } = useContext(NavigationContext)!;
  const { user } = useAuth();
  const {
    unreadCount,
    isPanelOpen,
    togglePanel,
    closePanel,
    notifications,
    markAsRead,
    markAllAsRead,
    clearRead,
    loadMore,
    hasMore,
    loading,
  } = useNotifications();

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?';

  const roleDashboard =
    user?.role === 'patient' ? '/patient/dashboard'
    : user?.role === 'admin' ? '/admin/dashboard'
    : user?.role === 'doctor' ? '/doctor/dashboard'
    : '/staff/dashboard';

  return (
    <header className={styles.header} role="banner">
      <div className={styles.headerLeft}>
        <button
          className={styles.hamburgerBtn}
          onClick={toggleMenu}
          aria-label="Open navigation menu"
          type="button"
        >
          {/* Hamburger icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6H21M3 12H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <Link to={roleDashboard} className={styles.logo}>UPACI</Link>
        {user?.role && <span className={styles.roleBadge}>{user.role}</span>}
      </div>

      <div className={styles.headerRight}>
        <NotificationBellIcon
          unreadCount={unreadCount}
          isPanelOpen={isPanelOpen}
          onTogglePanel={togglePanel}
        />
        <div className={styles.avatar} aria-label={`User: ${user?.name ?? user?.email ?? 'Unknown'}`}>
          {initials}
        </div>

        {isPanelOpen && (
          <NotificationPanel
            notifications={notifications}
            onClose={closePanel}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onClearRead={clearRead}
            onLoadMore={loadMore}
            hasMore={hasMore}
            loading={loading}
          />
        )}
      </div>
    </header>
  );
};
