/**
 * Staff Dashboard Page (SCR-003)
 * 
 * Wireframe-aligned layout:
 * - Welcome banner with greeting + date
 * - 3 stat cards (Today's Appointments, Patients Arrived, Pending Intake)
 * - Today's Appointments grouped by department with table view
 * 
 * @module StaffDashboard
 * @created 2026-03-18
 * @updated 2026-04-08
 * @task US_012 TASK_003, US_044 TASK_005
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FAB } from '../components/Dashboard/FAB';
import api from '../services/api';
import './Dashboard.css';

interface StaffAppointment {
  id: string;
  time: string;
  patientId: string;
  patientName: string;
  type: string;
  status: string;
  department: string;
}

interface DepartmentGroup {
  name: string;
  count: number;
  appointments: StaffAppointment[];
}

interface ApiAppointment {
  id: string;
  departmentName?: string;
  department?: string;
  status?: string;
  appointmentDate?: string;
  patientId?: string;
  patientName?: string;
  appointmentType?: string;
  type?: string;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) { return 'Good Morning'; }
  if (h < 18) { return 'Good Afternoon'; }
  return 'Good Evening';
}

function mapAppointment(a: ApiAppointment): StaffAppointment {
  const dept = a.departmentName || a.department || 'General';
  const time = a.appointmentDate
    ? new Date(a.appointmentDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '--';
  return {
    id: a.id,
    time,
    patientId: a.patientId || '--',
    patientName: a.patientName || 'Patient',
    type: a.appointmentType || a.type || 'General',
    status: a.status || 'scheduled',
    department: dept,
  };
}

function isArrivedStatus(status: string): boolean {
  return status === 'arrived' || status === 'checked_in' || status === 'checked-in';
}

function isPendingIntakeStatus(status: string): boolean {
  return status === 'pending_intake' || status === 'pending intake';
}

function getStatusClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'completed') { return 'sd-status--completed'; }
  if (isArrivedStatus(s)) { return 'sd-status--arrived'; }
  if (s.includes('pending')) { return 'sd-status--pending'; }
  return 'sd-status--scheduled';
}

/**
 * Staff Dashboard Component
 */
export const StaffDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [departments, setDepartments] = useState<DepartmentGroup[]>([]);
  const [stats, setStats] = useState({ total: 0, arrived: 0, pendingIntake: 0 });
  const [loading, setLoading] = useState(true);

  const greeting = getGreeting();
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/staff/queue/today');
        const appts: ApiAppointment[] = res.data?.data || res.data?.queue || res.data || [];
        processAppointments(appts);
      } catch {
        // Use empty state on error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const processAppointments = (appts: ApiAppointment[]) => {
    let totalCount = 0;
    let arrivedCount = 0;
    let pendingIntakeCount = 0;
    const deptMap = new Map<string, StaffAppointment[]>();

    for (const a of appts) {
      const mapped = mapAppointment(a);
      const statusLower = (a.status || '').toLowerCase();
      totalCount++;

      if (isArrivedStatus(statusLower)) { arrivedCount++; }
      if (isPendingIntakeStatus(statusLower)) { pendingIntakeCount++; }

      if (!deptMap.has(mapped.department)) { deptMap.set(mapped.department, []); }
      deptMap.get(mapped.department)!.push(mapped);
    }

    const groups: DepartmentGroup[] = Array.from(deptMap.entries()).map(([name, apptList]) => ({
      name,
      count: apptList.length,
      appointments: apptList,
    }));

    setDepartments(groups);
    setStats({ total: totalCount, arrived: arrivedCount, pendingIntake: pendingIntakeCount });
  };

  const renderAppointmentContent = () => {
    if (loading) {
      return <div className="loading-container"><p>Loading appointments...</p></div>;
    }

    if (departments.length === 0) {
      return (
        <div className="pd-card">
          <div className="pd-card__body" style={{ padding: '32px', textAlign: 'center' }}>
            <p>No appointments scheduled for today</p>
            <button className="btn btn--primary" style={{ marginTop: 12 }} onClick={() => navigate('/staff/queue')}>
              Go to Patient Queue
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="sd-dept-grid">
        {departments.map((dept) => (
          <section key={dept.name} className="sd-dept-card" aria-label={`${dept.name} appointments`}>
            <div className="sd-dept-card__header">
              <h4 className="sd-dept-card__name">{dept.name}</h4>
              <span className="sd-dept-card__badge">{dept.count}</span>
            </div>
            <table className="sd-dept-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Patient ID</th>
                  <th>Patient</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dept.appointments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.time}</td>
                    <td>{a.patientId}</td>
                    <td><span className="sd-patient-link">{a.patientName}</span></td>
                    <td>{a.type}</td>
                    <td><span className={`sd-status ${getStatusClass(a.status)}`}>{a.status.toUpperCase()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    );
  };

  return (
    <div className="dashboard sd-dashboard">
      {/* Welcome Banner */}
      <section className="sd-welcome">
        <h2 className="sd-welcome__greeting">{greeting}, {user?.name?.split(' ')[0] || 'Staff'}</h2>
        <p className="sd-welcome__subtitle">Today&apos;s schedule and patient overview — {todayStr}</p>
      </section>

      {/* Stat Cards */}
      <div className="sd-stats">
        <div className="sd-stat-card">
          <span className="sd-stat-card__label">Today&apos;s Appointments</span>
          <span className="sd-stat-card__value sd-stat-card__value--blue">{stats.total}</span>
        </div>
        <div className="sd-stat-card">
          <span className="sd-stat-card__label">Patients Arrived</span>
          <span className="sd-stat-card__value sd-stat-card__value--green">{stats.arrived}</span>
        </div>
        <div className="sd-stat-card">
          <span className="sd-stat-card__label">Pending Intake</span>
          <span className="sd-stat-card__value sd-stat-card__value--orange">{stats.pendingIntake}</span>
        </div>
      </div>

      {/* Today's Appointments Header */}
      <div className="sd-section-header">
        <h3 className="sd-section-header__title">Today&apos;s Appointments</h3>
        <span className="sd-section-header__count">{stats.total} TOTAL</span>
      </div>

      {/* Department Appointment Tables */}
      {renderAppointmentContent()}

      <FAB icon="+" label="Add Patient" onClick={() => navigate('/intake/ai')} ariaLabel="Start AI patient intake" />
    </div>
  );
};
