/**
 * Staff Dashboard Page (SCR-003)
 * 
 * Main dashboard for staff to:
 * - View patient queue
 * - Manage appointments
 * - Access patient records
 * - Update appointment status
 * 
 * @module StaffDashboard
 * @created 2026-03-18
 * @updated 2026-04-07
 * @task US_012 TASK_003, US_044 TASK_005
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardGrid } from '../components/Dashboard/DashboardGrid';
import { DashboardWidget } from '../components/Dashboard/DashboardWidget';
import { ResponsiveTabs, type TabItem } from '../components/Dashboard/ResponsiveTabs';
import { FAB } from '../components/Dashboard/FAB';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import './Dashboard.css';

interface NavCard {
  title: string;
  description: string;
  path: string;
  icon: string;
}

const QUEUE_CARDS: NavCard[] = [
  {
    title: 'Patient Queue',
    description: 'View and manage the patient queue, update status, and assign providers.',
    path: '/staff/queue',
    icon: '👥',
  },
];

const APPOINTMENT_CARDS: NavCard[] = [
  {
    title: 'Book Appointment',
    description: 'Schedule appointments on behalf of patients.',
    path: '/staff/appointments/book',
    icon: '📅',
  },
];

const INTAKE_CARDS: NavCard[] = [
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
 * Staff Dashboard Component
 */
export const StaffDashboard: React.FC = () => {
  const navigate = useNavigate();

  const shortcuts = useMemo(() => [
    {
      key: 'ctrl+n',
      handler: () => { navigate('/staff/queue'); },
      description: 'Go to Queue',
    },
  ], [navigate]);

  useKeyboardShortcuts(shortcuts);

  const queueContent = <NavCardGrid cards={QUEUE_CARDS} navigate={navigate} />;
  const appointmentContent = <NavCardGrid cards={APPOINTMENT_CARDS} navigate={navigate} />;
  const intakeContent = <NavCardGrid cards={INTAKE_CARDS} navigate={navigate} />;

  const tabs: TabItem[] = [
    { id: 'queue', label: 'Queue', content: queueContent },
    { id: 'appointments', label: 'Appointments', content: appointmentContent },
    { id: 'intake', label: 'Intake', content: intakeContent },
  ];

  return (
    <div className="dashboard">
      <main className="dashboard__content">
        <section className="dashboard__welcome">
          <h2>Staff Dashboard</h2>
          <p>Select a workflow to get started.</p>
        </section>

        <ResponsiveTabs tabs={tabs} defaultTab="queue" ariaLabel="Staff dashboard sections" />
      </main>

      <FAB
        icon="+"
        label="Add Patient"
        onClick={() => navigate('/intake/ai')}
        ariaLabel="Start AI patient intake"
      />
    </div>
  );
};
