/**
 * Staff Dashboard Page (SCR-003)
 * 
 * Main dashboard for staff to:
 * - View patient queue
 * - Manage appointments
 * - Access patient records
 * - Update appointment status
 * 
 * This is a placeholder component - full implementation in future tasks.
 * 
 * @module StaffDashboard
 * @created 2026-03-18
 * @task US_012 TASK_003
 */

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import './Dashboard.css';

/**
 * Staff Dashboard Component
 */
export const StaffDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div className="dashboard__header-content">
          <h1 className="dashboard__title">Staff Dashboard</h1>
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
          <h2>✅ Authentication Successful</h2>
          <p>Welcome to the Staff Dashboard!</p>
          <p className="dashboard__user-details">
            <strong>Email:</strong> {user?.email}<br />
            <strong>Role:</strong> {user?.role}<br />
            <strong>ID:</strong> {user?.id}
          </p>
        </section>

        <section className="dashboard__placeholder">
          <h3>Upcoming Features</h3>
          <ul>
            <li>👥 View patient queue</li>
            <li>📋 Manage appointments</li>
            <li>📄 Access patient records</li>
            <li>✅ Update appointment status</li>
            <li>📊 View daily schedule</li>
            <li>💬 Patient communication</li>
          </ul>
          <p><em>This is a placeholder dashboard. Full implementation coming in future tasks.</em></p>
        </section>
      </main>
    </div>
  );
};
