/**
 * Navigation Sidebar Component
 * 
 * Left navigation sidebar for patient dashboard with icon menu items and active highlighting.
 * Uses React Router's NavLink for automatic active state management.
 * 
 * Features:
 * - Icon-based navigation menu
 * - Active state highlighting
 * - Role badge display
 * - Hover effects
 * - Keyboard navigation support
 * - ARIA labels for accessibility
 * 
 * Navigation Items:
 * - Dashboard (home)
 * - Appointments (booking/management)
 * - Documents (upload/view)
 * - Intake Forms (complete forms)
 * - Profile (account settings)
 * - Settings (preferences)
 * 
 * @module NavigationSidebar
 * @created 2026-03-19
 * @task US_019 TASK_001
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './NavigationSidebar.css';

/**
 * Navigation menu item type
 */
interface NavItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon (emoji or icon class) */
  icon: string;
  /** Route path */
  path: string;
  /** External link flag */
  external?: boolean;
}

/**
 * Build navigation menu items based on user role and ID
 */
function getNavItems(role?: string, userId?: string | number): NavItem[] {
  const patientItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '🏠',
      path: '/patient/dashboard',
    },
    {
      id: 'appointments',
      label: 'Book Appointment',
      icon: '📅',
      path: '/appointments/book',
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: '📄',
      path: `/documents/upload/${userId || 'me'}`,
    },
    {
      id: 'intake-ai',
      label: 'AI Intake',
      icon: '🤖',
      path: '/intake/ai',
    },
    {
      id: 'intake-manual',
      label: 'Manual Intake',
      icon: '📝',
      path: '/intake/manual',
    },
  ];

  const staffItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '🏠',
      path: '/staff/dashboard',
    },
    {
      id: 'queue',
      label: 'Patient Queue',
      icon: '👥',
      path: '/staff/queue',
    },
    {
      id: 'staff-booking',
      label: 'Book for Patient',
      icon: '📅',
      path: '/staff/appointments/book',
    },
    {
      id: 'intake-ai',
      label: 'AI Intake',
      icon: '🤖',
      path: '/intake/ai',
    },
    {
      id: 'intake-manual',
      label: 'Manual Intake',
      icon: '📝',
      path: '/intake/manual',
    },
  ];

  const adminItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '🏠',
      path: '/admin/dashboard',
    },
    {
      id: 'queue',
      label: 'Patient Queue',
      icon: '👥',
      path: '/staff/queue',
    },
    {
      id: 'staff-booking',
      label: 'Book for Patient',
      icon: '📅',
      path: '/staff/appointments/book',
    },
    {
      id: 'audit-logs',
      label: 'Audit Logs',
      icon: '🔐',
      path: '/admin/audit-logs',
    },
  ];

  switch (role) {
    case 'staff':
    case 'doctor':
      return staffItems;
    case 'admin':
      return adminItems;
    default:
      return patientItems;
  }
}

/**
 * Navigation Sidebar Component
 * 
 * Renders left navigation sidebar with menu items and role badge.
 * Uses NavLink for automatic active state management.
 * 
 * @example
 * ```tsx
 * <NavigationSidebar />
 * ```
 */
export const NavigationSidebar: React.FC = () => {
  const { user } = useAuth();
  const navItems = getNavItems(user?.role, user?.id);

  return (
    <nav className="nav-sidebar" role="navigation" aria-label="Main navigation">
      {/* Role Badge */}
      {user?.role && (
        <div className="nav-sidebar__role" role="status" aria-label={`User role: ${user.role}`}>
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </div>
      )}

      {/* Navigation Menu */}
      <ul className="nav-sidebar__menu" role="menu">
        {navItems.map((item) => (
          <li key={item.id} role="none">
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `nav-sidebar__item ${isActive ? 'nav-sidebar__item--active' : ''}`
              }
              role="menuitem"
              aria-label={item.label}
            >
              <span className="nav-sidebar__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="nav-sidebar__label">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Footer Section (optional) */}
      <div className="nav-sidebar__footer">
        <div className="nav-sidebar__branding">
          <span className="nav-sidebar__logo">UPACI</span>
          <span className="nav-sidebar__version">v1.0</span>
        </div>
      </div>
    </nav>
  );
};
