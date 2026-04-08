/**
 * NavigationItem
 *
 * Reusable navigation link with icon, label, active state, and
 * optional notification badge. Wraps React Router NavLink.
 *
 * @task US_044 TASK_002
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './navigation.module.css';

export interface NavigationItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onClick?: () => void;
}

export const NavigationItem: React.FC<NavigationItemProps> = ({ to, icon, label, badge, onClick }) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
      }
    >
      <span className={styles.navItemIcon} aria-hidden="true">{icon}</span>
      <span className={styles.navItemLabel}>{label}</span>
      {badge != null && badge > 0 && (
        <span className={styles.navItemBadge} aria-label={`${badge} notifications`}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </NavLink>
  );
};
