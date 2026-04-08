/**
 * DashboardGrid Component
 *
 * Responsive CSS Grid layout for dashboard pages.
 * Mobile (<768px): 1 column. Tablet (768-1024): 2 columns.
 * Desktop (≥1025): 3 columns. Large (>1440): max-width 1600px.
 *
 * @module Dashboard/DashboardGrid
 * @task US_044 TASK_005
 */

import React from 'react';
import '../../styles/dashboard-responsive.css';

interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  children,
  className,
}) => {
  const cls = className
    ? `dashboard-grid ${className}`
    : 'dashboard-grid';

  return <div className={cls}>{children}</div>;
};
