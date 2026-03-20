/**
 * Admin Dashboard Page (SCR-004)
 * 
 * Main dashboard for administrators to:
 * - Manage users (patients, staff)
 * - View system analytics
 * - Configure system settings
 * - Generate reports
 * 
 * This is a placeholder component - full implementation in future tasks.
 * 
 * @module AdminDashboard
 * @created 2026-03-18
 * @task US_012 TASK_003
 */

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import './Dashboard.css';

/**
 * Admin Dashboard Component
 */
export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();

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
          <h2>✅ Authentication Successful</h2>
          <p>Welcome to the Admin Dashboard!</p>
          <p className="dashboard__user-details">
            <strong>Email:</strong> {user?.email}<br />
            <strong>Role:</strong> {user?.role}<br />
            <strong>ID:</strong> {user?.id}
          </p>
        </section>

        <section className="dashboard__placeholder">
          <h3>Upcoming Features</h3>
          <ul>
            <li>👥 User management (CRUD operations)</li>
            <li>📊 System analytics and metrics</li>
            <li>⚙️ System configuration</li>
            <li>📈 Generate reports</li>
            <li>🔐 Security audit logs</li>
            <li>🏥 Manage facilities and departments</li>
          </ul>
          <p><em>This is a placeholder dashboard. Full implementation coming in future tasks.</em></p>
        </section>
      </main>
    </div>
  );
};
