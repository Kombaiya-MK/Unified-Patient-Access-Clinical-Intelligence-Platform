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
 * @updated 2026-04-07
 * @task US_012 TASK_003, US_044 TASK_005
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CircuitBreakerStatusPanel } from '../components/circuit-breaker/CircuitBreakerStatusPanel';
import { DashboardGrid } from '../components/Dashboard/DashboardGrid';
import { DashboardWidget } from '../components/Dashboard/DashboardWidget';
import { ResponsiveTabs, type TabItem } from '../components/Dashboard/ResponsiveTabs';
import './Dashboard.css';

interface NavCard {
  title: string;
  description: string;
  path: string;
  icon: string;
}

const ADMIN_CARDS: NavCard[] = [
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
];

const WORKFLOW_CARDS: NavCard[] = [
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

function NavCardGrid({ cards, navigate }: { cards: NavCard[]; navigate: (path: string) => void }) {
  return (
    <DashboardGrid>
      {cards.map((card) => (
        <DashboardWidget key={card.path}>
          <button
            className="dashboard__nav-card"
            onClick={() => navigate(card.path)}
            type="button"
            style={{ width: '100%', border: 'none', background: 'transparent', padding: 0, textAlign: 'left', cursor: 'pointer' }}
          >
            <span className="dashboard__nav-card-icon" aria-hidden="true">{card.icon}</span>
            <h3 className="dashboard__nav-card-title">{card.title}</h3>
            <p className="dashboard__nav-card-desc">{card.description}</p>
          </button>
        </DashboardWidget>
      ))}
    </DashboardGrid>
  );
}

/**
 * Admin Dashboard Component
 */
export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const usersContent = (
    <>
      <NavCardGrid cards={ADMIN_CARDS} navigate={navigate} />
    </>
  );

  const auditContent = (
    <DashboardWidget title="Circuit Breaker Status" span="full">
      <CircuitBreakerStatusPanel />
    </DashboardWidget>
  );

  const workflowContent = (
    <NavCardGrid cards={WORKFLOW_CARDS} navigate={navigate} />
  );

  const tabs: TabItem[] = [
    { id: 'admin', label: 'Admin Tools', content: usersContent },
    { id: 'monitoring', label: 'Monitoring', content: auditContent },
    { id: 'workflows', label: 'Workflows', content: workflowContent },
  ];

  return (
    <div className="dashboard">
      <main className="dashboard__content">
        <section className="dashboard__welcome">
          <h2>Admin Dashboard</h2>
          <p>Select a workflow to get started.</p>
        </section>

        <ResponsiveTabs tabs={tabs} defaultTab="admin" ariaLabel="Admin dashboard sections" />
      </main>
    </div>
  );
};
