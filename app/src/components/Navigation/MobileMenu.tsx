/**
 * MobileMenu
 *
 * Slide-out drawer from the left for mobile/tablet navigation.
 * Includes backdrop overlay, close button, role-based items, and logout.
 * Hidden on desktop (≥ 1025px) via CSS.
 *
 * @task US_044 TASK_002
 */

import React, { useContext, useRef, useEffect } from 'react';
import { NavigationContext } from '../../context/NavigationContext';
import { useAuth } from '../../hooks/useAuth';
import { NavigationItem } from './NavigationItem';
import { getNavItems } from './navigationConfig';
import styles from './navigation.module.css';

export const MobileMenu: React.FC = () => {
  const { isMenuOpen, closeMenu } = useContext(NavigationContext)!;
  const { user, logout } = useAuth();
  const items = getNavItems(user?.role);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Trap focus within drawer when open
  useEffect(() => {
    if (!isMenuOpen || !drawerRef.current) return;
    const firstFocusable = drawerRef.current.querySelector<HTMLElement>(
      'button, [href], [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();
  }, [isMenuOpen]);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`${styles.overlay} ${isMenuOpen ? styles.overlayOpen : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className={`${styles.drawer} ${isMenuOpen ? styles.drawerOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className={styles.drawerHeader}>
          <span className={styles.logo}>UPACI</span>
          <button
            className={styles.drawerCloseBtn}
            onClick={closeMenu}
            aria-label="Close navigation menu"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <nav className={styles.drawerNav} aria-label="Navigation menu">
          {items.map(item => (
            <NavigationItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              onClick={closeMenu}
            />
          ))}
        </nav>

        <div className={styles.drawerFooter}>
          <button
            className={`${styles.navItem} ${styles.logoutItem}`}
            onClick={() => { logout(); closeMenu(); }}
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
      </div>
    </>
  );
};
