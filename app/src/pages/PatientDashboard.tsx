/**
 * Patient Dashboard Page (SCR-002)
 * 
 * Main dashboard for patients to:
 * - View upcoming appointments
 * - Book new appointments
 * - Reschedule appointments
 * - View medical history
 * - Update profile
 * 
 * @module PatientDashboard
 * @created 2026-03-18
 * @updated 2026-04-07
 * @task US_012 TASK_003, US_013 TASK_006, US_014 TASK_001, US_019 TASK_001, US_019 TASK_003, US_044 TASK_005
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppointments } from '../context/AppointmentContext';
import { cancelAppointment } from '../services/appointmentService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { AppointmentCard } from '../components/dashboard/AppointmentCard';
import { WaitlistSection } from '../components/waitlist/WaitlistSection';
import { WelcomeBanner } from '../components/dashboard/WelcomeBanner';
import { NotificationsPanel } from '../components/dashboard/NotificationsPanel';
import { QuickActions } from '../components/dashboard/QuickActions';
import { DashboardGrid } from '../components/Dashboard/DashboardGrid';
import { DashboardWidget } from '../components/Dashboard/DashboardWidget';
import { ResponsiveTabs } from '../components/Dashboard/ResponsiveTabs';
import { FAB } from '../components/Dashboard/FAB';
import type { TabItem } from '../components/Dashboard/ResponsiveTabs';
import './Dashboard.css';

/**
 * Patient Dashboard Component
 */
export const PatientDashboard: React.FC = () => {
  const { appointments, loading, error, refreshAppointments } = useAppointments();
  const navigate = useNavigate();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  /**
   * Handle cancel appointment
   */
  const handleCancel = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }
    setCancellingId(appointmentId);
    try {
      await cancelAppointment(appointmentId, 'Cancelled by patient');
      await refreshAppointments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel appointment');
    } finally {
      setCancellingId(null);
    }
  };

  /**
   * Navigate to booking page
   */
  const handleBookAppointment = () => {
    navigate('/appointments/book');
  };

  const appointmentsContent = (
    <DashboardWidget
      title="My Appointments"
      span="full"
      headerAction={
        <button
          onClick={() => refreshAppointments()}
          className="btn btn--text"
          disabled={loading}
          aria-label="Refresh appointments"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      }
    >
      {loading && (
        <div className="loading-container">
          <LoadingSpinner />
          <p>Loading appointments...</p>
        </div>
      )}
      {error && !loading && (
        <div className="error-message" role="alert">
          <strong>Error:</strong> {error}
          <button onClick={() => refreshAppointments()} className="btn btn--text">
            Try Again
          </button>
        </div>
      )}
      {!loading && !error && appointments.length === 0 && (
        <div className="empty-state">
          <p>No upcoming appointments</p>
          <button onClick={handleBookAppointment} className="btn btn--primary" style={{ marginTop: '12px' }}>
            Book Your First Appointment
          </button>
        </div>
      )}
      {!loading && !error && appointments.length > 0 && (
        <div className="appointments-grid">
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}
    </DashboardWidget>
  );

  const waitlistContent = (
    <DashboardWidget title="Waitlist" span="full">
      <WaitlistSection onUpdate={() => refreshAppointments()} />
    </DashboardWidget>
  );

  const notificationsContent = (
    <DashboardWidget title="Notifications">
      <NotificationsPanel />
    </DashboardWidget>
  );

  const tabs: TabItem[] = [
    { id: 'appointments', label: 'Appointments', content: appointmentsContent },
    { id: 'waitlist', label: 'Waitlist', content: waitlistContent },
    { id: 'notifications', label: 'Notifications', content: notificationsContent },
  ];

  return (
    <div className="dashboard">
      <WelcomeBanner />
      <QuickActions />

      <ResponsiveTabs tabs={tabs} defaultTab="appointments" ariaLabel="Patient dashboard sections" />

      <FAB
        icon="+"
        label="Book Appointment"
        onClick={handleBookAppointment}
        ariaLabel="Book a new appointment"
      />
    </div>
  );
};
