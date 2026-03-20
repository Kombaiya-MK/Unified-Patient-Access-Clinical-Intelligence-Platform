/**
 * Dashboard Layout Component
 * 
 * Reusable 3-column grid layout wrapper for dashboard pages.
 * Provides consistent structure with navigation sidebar, main content area, and notifications panel.
 * 
 * Layout Structure:
 * - Fixed header (64px height)
 * - Navigation sidebar (240px width, fixed left)
 * - Main content area (flexible width, center)
 * - Notifications panel (320px width, fixed right, optional)
 * 
 * Responsive Behavior:
 * - Desktop (>1024px): All 3 columns visible
 * - Tablet (768px-1024px): Sidebar + main only
 * - Mobile (<768px): Stacked layout, sidebar as drawer
 * 
 * @module DashboardLayout
 * @created 2026-03-19
 * @task US_019 TASK_001
 */

import React, { type ReactNode } from 'react';
import './DashboardLayout.css';

/**
 * Dashboard Layout Props
 */
interface DashboardLayoutProps {
  /** Navigation sidebar content */
  sidebar: ReactNode;
  /** Main content area */
  children: ReactNode;
  /** Optional notifications panel content */
  notifications?: ReactNode;
  /** Show notifications panel */
  showNotifications?: boolean;
}

/**
 * Dashboard Layout Component
 * 
 * Provides consistent 3-column grid layout for all dashboard pages.
 * Uses CSS Grid for precise column sizing and responsive behavior.
 * 
 * @example
 * ```tsx
 * <DashboardLayout
 *   sidebar={<NavigationSidebar />}
 *   notifications={<NotificationsPanel />}
 *   showNotifications={true}
 * >
 *   <div>Main content here</div>
 * </DashboardLayout>
 * ```
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  sidebar,
  children,
  notifications,
  showNotifications = false,
}) => {
  return (
    <div
      className={`dashboard-layout ${
        showNotifications ? 'dashboard-layout--with-notifications' : ''
      }`}
    >
      {/* Navigation Sidebar - Fixed left column */}
      <aside className="dashboard-layout__sidebar" role="navigation" aria-label="Main navigation">
        {sidebar}
      </aside>

      {/* Main Content Area - Flexible center column */}
      <main className="dashboard-layout__main" role="main">
        {children}
      </main>

      {/* Notifications Panel - Fixed right column (optional) */}
      {showNotifications && notifications && (
        <aside
          className="dashboard-layout__notifications"
          role="complementary"
          aria-label="Notifications"
        >
          {notifications}
        </aside>
      )}
    </div>
  );
};
