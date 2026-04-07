/**
 * Admin Dashboard Page (SCR-004)
 * 
 * Main dashboard for administrators to:
 * - View audit logs
 * - Manage patient queue
 * - Schedule appointments
 * - Access clinical review
 * 
 * @module AdminDashboard
 * @created 2026-03-18
 * @task US_012 TASK_003
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { CircuitBreakerStatusPanel } from '../components/circuit-breaker/CircuitBreakerStatusPanel';
import './Dashboard.css';

interface NavCard {
  title: string;
  description: string;
  path: string;
  icon: string;
}

const ADMIN_NAV_CARDS: NavCard[] = [
  {
    title: 'System Metrics',
    description: 'Real-time operational metrics, system health, and analytics.',
    path: '/admin/metrics',
    icon: '📊',
  },
  {
    title: 'Audit Logs',
    description: 'View, filter, and export system-wide audit trail.',
    path: '/admin/audit-logs',
    icon: '🔐',
  },
  {
    title: 'User Management',
    description: 'Manage user accounts, roles, and permissions.',
    path: '/admin/users',
    icon: '👤',
  },
  {
    title: 'Departments & Providers',
    description: 'Manage departments, providers, and schedules.',
    path: '/admin/departments',
    icon: '🏥',
  },
  {
    title: 'Patient Queue',
    description: 'View and manage the patient queue, update status, and assign providers.',
    path: '/staff/queue',
    icon: '👥',
  },
  {
    title: 'Book Appointment',
    description: 'Schedule appointments on behalf of patients.',
    path: '/staff/appointments/book',
    icon: '📅',
  },
  {
    title: 'AI Intake',
    description: 'AI-assisted patient intake with smart form filling.',
    path: '/intake/ai',
    icon: '🤖',
  },
  {
    title: 'Manual Intake',
    description: 'Manually enter patient intake data.',
    path: '/intake/manual',
    icon: '📋',
  },
];

/**
 * Admin Dashboard Component
 */
export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div className="dashboard__header-content">
          <h1 className="dashboard__title">Admin Dashboard</h1>
          <div className="dashboard__user-info">
            <span className="dashboard__user-name">{user?.name || user?.email}</span>
            <span className="dashboard__user-role">({user?.role})</span>
            <button onClick={logout} className="btn btn--secondary">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard__content">
        <section className="dashboard__welcome">
          <h2>Welcome, {user?.name || user?.email}</h2>
          <p>Select a workflow to get started.</p>
        </section>

        {/* Circuit Breaker Status Panel – US_041 TASK_002 */}
        <CircuitBreakerStatusPanel />

        <section className="dashboard__nav-grid" aria-label="Admin workflows">
          {ADMIN_NAV_CARDS.map((card) => (
            <button
              key={card.path}
              className="dashboard__nav-card"
              onClick={() => navigate(card.path)}
              type="button"
            >
              <span className="dashboard__nav-card-icon" aria-hidden="true">{card.icon}</span>
              <h3 className="dashboard__nav-card-title">{card.title}</h3>
              <p className="dashboard__nav-card-desc">{card.description}</p>
            </button>
          ))}
        </section>
      </main>
    </div>
  );
};
