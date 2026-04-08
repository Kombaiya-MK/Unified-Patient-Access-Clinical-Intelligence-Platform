/**
 * BottomNav
 *
 * Fixed bottom navigation bar for mobile/tablet (< 1025px).
 * Shows items flagged with bottomNav: true plus a "More" button
 * that opens the mobile drawer.
 *
 * @task US_044 TASK_002
 */

import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { NavigationContext } from '../../context/NavigationContext';
import { useAuth } from '../../hooks/useAuth';
import { getNavItems, MoreIcon } from './navigationConfig';
import styles from './navigation.module.css';

export const BottomNav: React.FC = () => {
  const { openMenu } = useContext(NavigationContext)!;
  const { user } = useAuth();
  const items = getNavItems(user?.role).filter(i => i.bottomNav);

  return (
    <nav className={styles.bottomNav} aria-label="Bottom navigation">
      {items.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `${styles.bottomNavItem} ${isActive ? styles.bottomNavItemActive : ''}`
          }
        >
          <span className={styles.bottomNavIcon} aria-hidden="true">{item.icon}</span>
          <span className={styles.bottomNavLabel}>{item.label}</span>
        </NavLink>
      ))}

      <button
        className={styles.bottomNavItem}
        onClick={openMenu}
        type="button"
        aria-label="Open navigation menu"
      >
        <span className={styles.bottomNavIcon} aria-hidden="true">{MoreIcon}</span>
        <span className={styles.bottomNavLabel}>More</span>
      </button>
    </nav>
  );
};
