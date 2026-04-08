/**
 * Quick Actions Component
 * 
 * Icon grid with 4 primary patient actions: Upload Documents, Complete Intake,
 * Update Profile, and View Lab Results. Each action navigates to its respective page.
 * 
 * Features:
 * - 2x2 grid layout on desktop, 4x1 on mobile
 * - Icon buttons with centered labels
 * - Hover/focus effects with elevation
 * - Accessible with ARIA labels and keyboard navigation
 * - Uses React Router for navigation
 * 
 * @module QuickActions
 * @created 2026-03-19
 * @task US_019 TASK_003
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './QuickActions.css';

/**
 * Upload Icon Component
 */
const UploadIcon: React.FC = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

/**
 * Clipboard Icon Component
 */
const ClipboardIcon: React.FC = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

/**
 * User Icon Component
 */
const UserIcon: React.FC = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/**
 * Activity Icon Component
 */
const ActivityIcon: React.FC = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

/**
 * Quick action definition
 */
interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  ariaLabel: string;
}

/**
 * Build quick actions based on user ID
 */
function getQuickActions(userId?: string | number): QuickAction[] {
  return [
    {
      id: 'book-appointment',
      label: 'Book Appointment',
      icon: <ClipboardIcon />,
      path: '/appointments/book',
      ariaLabel: 'Book a new appointment',
    },
    ...(userId ? [{
      id: 'upload-documents',
      label: 'Upload Documents',
      icon: <UploadIcon />,
      path: `/documents/upload/${userId}`,
      ariaLabel: 'Upload medical documents',
    }] : []),
    {
      id: 'complete-intake',
      label: 'AI Intake',
      icon: <ActivityIcon />,
      path: '/intake/ai',
      ariaLabel: 'Start AI-assisted patient intake',
    },
    {
      id: 'manual-intake',
      label: 'Manual Intake',
      icon: <UserIcon />,
      path: '/intake/manual',
      ariaLabel: 'Complete manual intake form',
    },
  ];
}

/**
 * QuickActions Component
 * 
 * Displays a 2x2 grid of action buttons (4x1 on mobile) that navigate to key pages.
 * Each action has an icon and label with hover effects.
 * 
 * @example
 * ```tsx
 * <div className="dashboard__content">
 *   <WelcomeBanner />
 *   <QuickActions />
 *   <UpcomingAppointments />
 * </div>
 * ```
 */
export const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const quickActions = getQuickActions(user?.id);

  /**
   * Handle action button click
   * 
   * @param path - Route path to navigate to
   */
  const handleActionClick = (path: string) => {
    navigate(path);
  };

  return (
    <section className="quick-actions" aria-label="Quick actions">
      <h2 className="quick-actions__title">Quick Actions</h2>
      <div className="quick-actions__grid">
        {quickActions.map((action) => (
          <button
            key={action.id}
            className="quick-actions__button"
            onClick={() => handleActionClick(action.path)}
            aria-label={action.ariaLabel}
          >
            <div className="quick-actions__icon">{action.icon}</div>
            <span className="quick-actions__label">{action.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
};
