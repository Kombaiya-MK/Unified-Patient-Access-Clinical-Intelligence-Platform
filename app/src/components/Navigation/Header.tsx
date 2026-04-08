/**
 * Header
 *
 * Responsive top bar with logo, hamburger (mobile/tablet),
 * role badge, notification bell, and user avatar.
 *
 * Mobile:  56px, hamburger left, logo center, avatar right
 * Desktop: 64px, logo left, role badge, avatar right
 *
 * @task US_044 TASK_002
 */

import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { NavigationContext } from '../../context/NavigationContext';
import { useAuth } from '../../hooks/useAuth';
import styles from './navigation.module.css';

export const Header: React.FC = () => {
  const { toggleMenu } = useContext(NavigationContext)!;
  const { user } = useAuth();

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
        <button
          className={styles.notificationBtn}
          aria-label="Notifications"
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 2C7.239 2 5 4.239 5 7V11L3 14H17L15 11V7C15 4.239 12.761 2 10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M8 16C8 17.105 8.895 18 10 18C11.105 18 12 17.105 12 16" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          <span className={styles.notificationBadge} aria-hidden="true" />
        </button>
        <div className={styles.avatar} aria-label={`User: ${user?.name ?? user?.email ?? 'Unknown'}`}>
          {initials}
        </div>
      </div>
    </header>
  );
};
