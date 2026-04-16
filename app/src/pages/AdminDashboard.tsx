/**
 * Admin Dashboard Page (SCR-004)
 * 
 * Wireframe-aligned layout:
 * - Heading + subtitle with date
 * - 4 stat cards (Total Users, Active Staff, Today's Appointments, System Alerts)
 * - Recent Users table (2/3 width) + Recent Audit Logs table (1/3 width) side-by-side on desktop
 * 
 * @module AdminDashboard
 * @created 2026-03-18
 * @updated 2026-04-08
 * @task US_012 TASK_003, US_044 TASK_005
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FeatureFlagsTable } from '../components/admin/FeatureFlagsTable';
import './Dashboard.css';

interface UserRow {
  name: string;
  id: string;
  email: string;
  userType: string;
  status: string;
}

interface AuditRow {
  action: string;
  user: string;
  time: string;
}

interface ApiUser {
  id?: string | number;
  name?: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  userType?: string;
  isActive?: boolean;
  is_active?: boolean;
}

interface ApiLog {
  action?: string;
  eventType?: string;
  userName?: string;
  userId?: string;
  user_email?: string;
  user_id?: string | number;
  createdAt?: string;
  timestamp?: string;
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) { return 'Just now'; }
  if (mins < 60) { return `${mins} min ago`; }
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) { return `${hrs} hour${hrs > 1 ? 's' : ''} ago`; }
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function getUserName(u: ApiUser): string {
  if (u.name) { return u.name; }
  const first = u.firstName || u.first_name || '';
  const last = u.lastName || u.last_name || '';
  const fullName = `${first} ${last}`.trim();
  return fullName || u.email || '--';
}

function mapUserRow(u: ApiUser): UserRow {
  const active = u.isActive ?? u.is_active;
  return {
    name: getUserName(u),
    id: u.id?.toString() || '--',
    email: u.email || '--',
    userType: u.role || u.userType || 'patient',
    status: active !== false ? 'Active' : 'Inactive',
  };
}

function mapAuditRow(l: ApiLog): AuditRow {
  const ts = l.createdAt || l.timestamp;
  return {
    action: l.action || l.eventType || '--',
    user: l.userName || l.user_email || l.userId || (l.user_id?.toString()) || 'System',
    time: ts ? getRelativeTime(ts) : '--',
  };
}

function getUserTypeBadgeClass(type: string): string {
  const t = type.toLowerCase();
  if (t === 'staff' || t === 'doctor') { return 'ad-badge--staff'; }
  if (t === 'admin') { return 'ad-badge--admin'; }
  return 'ad-badge--patient';
}

const STAFF_ROLES = ['staff', 'doctor', 'admin'];

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const [activeTab, setActiveTab] = useState<'overview' | 'feature-flags'>('overview');
  const [stats, setStats] = useState({ totalUsers: 0, activeStaff: 0, todayAppointments: 0, systemAlerts: 0 });
  const [recentUsers, setRecentUsers] = useState<UserRow[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const usersRes = await api.get('/admin/users');
      const users: ApiUser[] = usersRes.data?.data || usersRes.data?.users || usersRes.data || [];
      const staffCount = users.filter((u) => STAFF_ROLES.includes(u.role || u.userType || '')).length;
      setRecentUsers(users.slice(0, 5).map(mapUserRow));
      return { totalUsers: users.length, activeStaff: staffCount };
    };

    const fetchLogs = async () => {
      const logsRes = await api.get('/admin/audit-logs?limit=5');
      const logs: ApiLog[] = logsRes.data?.data || logsRes.data?.logs || logsRes.data || [];
      setRecentLogs(logs.slice(0, 5).map(mapAuditRow));
    };

    const fetchAppointmentCount = async (): Promise<number> => {
      try {
        const apptRes = await api.get('/staff/queue/today');
        const appointments = apptRes.data?.data || apptRes.data?.queue || apptRes.data || [];
        return Array.isArray(appointments) ? appointments.length : 0;
      } catch {
        return 0;
      }
    };

    const fetchData = async () => {
      try {
        const [userStats] = await Promise.all([fetchUsers(), fetchLogs()]);
        const apptCount = await fetchAppointmentCount();
        setStats({ ...userStats, todayAppointments: apptCount, systemAlerts: 0 });
      } catch {
        // Graceful empty state
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const renderUsersTable = () => {
    if (loading) { return <p>Loading...</p>; }
    if (recentUsers.length === 0) { return <p>No users found</p>; }
    return (
      <table className="sd-dept-table ad-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>ID</th>
            <th>Email</th>
            <th>User Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {recentUsers.map((u, i) => (
            <tr key={i}>
              <td>{u.name}</td>
              <td>{u.id}</td>
              <td>{u.email}</td>
              <td><span className={`ad-badge ${getUserTypeBadgeClass(u.userType)}`}>{u.userType.toUpperCase()}</span></td>
              <td><span className={u.status === 'Active' ? 'sd-status sd-status--arrived' : 'sd-status'}>{u.status.toUpperCase()}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderLogsTable = () => {
    if (loading) { return <p>Loading...</p>; }
    if (recentLogs.length === 0) { return <p>No recent logs</p>; }
    return (
      <table className="sd-dept-table ad-table">
        <thead>
          <tr>
            <th>Action</th>
            <th>User</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {recentLogs.map((l, i) => (
            <tr key={i}>
              <td>{l.action}</td>
              <td>{l.user}</td>
              <td>{l.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="dashboard ad-dashboard">
      {/* Header */}
      <section className="ad-header">
        <h2 className="ad-header__title">Admin Dashboard</h2>
        <p className="ad-header__subtitle">System overview and management — {todayStr}</p>
      </section>

      {/* Tab Navigation */}
      <nav className="ad-tabs" aria-label="Admin dashboard tabs">
        <button
          className={`ad-tabs__btn ${activeTab === 'overview' ? 'ad-tabs__btn--active' : ''}`}
          onClick={() => setActiveTab('overview')}
          aria-selected={activeTab === 'overview'}
          role="tab"
        >
          Overview
        </button>
        <button
          className={`ad-tabs__btn ${activeTab === 'feature-flags' ? 'ad-tabs__btn--active' : ''}`}
          onClick={() => setActiveTab('feature-flags')}
          aria-selected={activeTab === 'feature-flags'}
          role="tab"
        >
          Feature Flags
        </button>
      </nav>

      {activeTab === 'feature-flags' ? (
        <section className="ad-tab-content" aria-label="Feature flags management">
          <FeatureFlagsTable />
        </section>
      ) : (
      <>
      {/* 4 Stat Cards */}
      <div className="ad-stats">
        <div className="sd-stat-card">
          <span className="sd-stat-card__label">Total Users</span>
          <span className="sd-stat-card__value sd-stat-card__value--blue">{loading ? '...' : stats.totalUsers}</span>
        </div>
        <div className="sd-stat-card">
          <span className="sd-stat-card__label">Active Staff</span>
          <span className="sd-stat-card__value sd-stat-card__value--green">{loading ? '...' : stats.activeStaff}</span>
        </div>
        <div className="sd-stat-card">
          <span className="sd-stat-card__label">Today&apos;s Appointments</span>
          <span className="sd-stat-card__value sd-stat-card__value--orange">{loading ? '...' : stats.todayAppointments}</span>
        </div>
        <div className="sd-stat-card">
          <span className="sd-stat-card__label">System Alerts</span>
          <span className="sd-stat-card__value sd-stat-card__value--red">{loading ? '...' : stats.systemAlerts}</span>
        </div>
      </div>

      {/* Content Grid: Recent Users + Recent Audit Logs */}
      <div className="ad-content-grid">
        {/* Recent Users */}
        <section className="pd-card ad-card--users" aria-label="Recent users">
          <div className="pd-card__header">
            <h3 className="pd-card__title">Recent Users</h3>
            <button className="btn btn--text" onClick={() => navigate('/admin/users')}>View All Users →</button>
          </div>
          <div className="pd-card__body">
            {renderUsersTable()}
          </div>
        </section>

        {/* Recent Audit Logs */}
        <section className="pd-card ad-card--logs" aria-label="Recent audit logs">
          <div className="pd-card__header">
            <h3 className="pd-card__title">Recent Audit Logs</h3>
            <button className="btn btn--text" onClick={() => navigate('/admin/audit-logs')}>View All Logs →</button>
          </div>
          <div className="pd-card__body">
            {renderLogsTable()}
          </div>
        </section>
      </div>
      </>
      )}
    </div>
  );
};
