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
 * @updated 2026-03-19
 * @task US_012 TASK_003, US_013 TASK_006, US_014 TASK_001, US_019 TASK_001, US_019 TASK_003
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppointments } from '../context/AppointmentContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { AppointmentCard } from '../components/dashboard/AppointmentCard';
import { WaitlistSection } from '../components/waitlist/WaitlistSection';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { NavigationSidebar } from '../components/dashboard/NavigationSidebar';
import { WelcomeBanner } from '../components/dashboard/WelcomeBanner';
import { NotificationsPanel } from '../components/dashboard/NotificationsPanel';
import { QuickActions } from '../components/dashboard/QuickActions';
import './Dashboard.css';

/**
 * Patient Dashboard Component
 */
export const PatientDashboard: React.FC = () => {
  const { appointments, loading, error, refreshAppointments } = useAppointments();
  const navigate = useNavigate();

  /**
   * Handle cancel appointment
   */
  const handleCancel = (appointmentId: string) => {
    // TODO: Implement cancel logic with confirmation
    if (confirm('Are you sure you want to cancel this appointment?')) {
      // API call to cancel
      alert(`Cancel appointment ${appointmentId} - Feature coming soon!`);
    }
  };

  /**
   * Navigate to booking page
   */
  const handleBookAppointment = () => {
    navigate('/appointments/book');
  };

  return (
    <DashboardLayout
      sidebar={<NavigationSidebar />}
      notifications={<NotificationsPanel />}
      showNotifications={true}
    >
      {/* Skip Link for Accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Main Content */}
      <div id="main-content">
        {/* Quick Actions Grid */}
        <QuickActions />

        {/* Appointments Section */}
        <section className="dashboard__appointments" aria-label="My appointments">
          <div className="section-header">
            <h2 className="section-title">My Appointments</h2>
            <button
              onClick={() => refreshAppointments()}
              className="btn btn--text"
              disabled={loading}
              aria-label="Refresh appointments"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="loading-container">
              <LoadingSpinner />
              <p>Loading appointments...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="error-message" role="alert">
              <strong>Error:</strong> {error}
              <button onClick={() => refreshAppointments()} className="btn btn--text">
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && appointments.length === 0 && (
            <div className="empty-state">
              <p>No upcoming appointments</p>
              <button onClick={handleBookAppointment} className="btn btn--primary" style={{ marginTop: '12px' }}>
                Book Your First Appointment
              </button>
            </div>
          )}

          {/* Appointments List */}
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
        </section>

        {/* Waitlist Section */}
        <WaitlistSection onUpdate={() => refreshAppointments()} />
      </div>
    </DashboardLayout>
  );
};
