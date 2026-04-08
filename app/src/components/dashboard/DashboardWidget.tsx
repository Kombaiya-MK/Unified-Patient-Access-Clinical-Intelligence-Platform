/**
 * DashboardWidget Component
 *
 * Reusable card component for dashboard content sections.
 * Supports optional header with title/action, body content,
 * and optional footer. Configurable column span for grid.
 *
 * @module Dashboard/DashboardWidget
 * @task US_044 TASK_005
 */

import React from 'react';
import '../../styles/dashboard-responsive.css';

interface DashboardWidgetProps {
  title?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  span?: 1 | 2 | 'full';
  className?: string;
}

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  title,
  headerAction,
  footer,
  children,
  span,
  className,
}) => {
  let spanClass = '';
  if (span === 2) {
    spanClass = 'dashboard-grid__item--span-2';
  } else if (span === 'full') {
    spanClass = 'dashboard-grid__item--span-full';
  }

  const cls = [
    'dashboard-widget',
    spanClass,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={cls}>
      {title && (
        <div className="dashboard-widget__header">
          <h3 className="dashboard-widget__title">{title}</h3>
          {headerAction && (
            <div className="dashboard-widget__action">{headerAction}</div>
          )}
        </div>
      )}
      <div className="dashboard-widget__body">{children}</div>
      {footer && (
        <div className="dashboard-widget__footer">{footer}</div>
      )}
    </div>
  );
};
