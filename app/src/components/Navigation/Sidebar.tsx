/**
 * Sidebar
 *
 * Persistent desktop sidebar navigation (≥ 1025px).
 * 240px wide, role-based items, logout, active route indicator.
 *
 * @task US_044 TASK_002
 */

import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { NavigationItem } from './NavigationItem';
import { getNavItems } from './navigationConfig';
import styles from './navigation.module.css';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const items = getNavItems(user?.role);

  return (
    <aside className={styles.sidebar} role="navigation" aria-label="Main navigation">
      <nav className={styles.sidebarNav}>
        {items.map(item => (
          <NavigationItem key={item.to} to={item.to} icon={item.icon} label={item.label} />
        ))}
      </nav>
      <div className={styles.sidebarFooter}>
        <button
          className={`${styles.navItem} ${styles.logoutItem}`}
          onClick={() => { logout(); }}
          type="button"
        >
          <span className={styles.navItemIcon} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 17H4C3.448 17 3 16.552 3 16V4C3 3.448 3.448 3 4 3H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M13 14L17 10L13 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 10H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </span>
          <span className={styles.navItemLabel}>Logout</span>
        </button>
      </div>
    </aside>
  );
};
