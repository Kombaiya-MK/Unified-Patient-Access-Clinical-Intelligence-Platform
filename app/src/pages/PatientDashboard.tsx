/**
 * Patient Dashboard Page (SCR-002)
 * 
 * Wireframe-aligned layout:
 * - Welcome banner with greeting
 * - 3 quick-action cards in row (Book Appointment, Complete Intake, Upload Documents)
 * - Desktop: Upcoming Appointments (~2/3) + Notifications (~1/3) side-by-side
 * - Mobile: tabbed sections
 * 
 * @module PatientDashboard
 * @created 2026-03-18
 * @updated 2026-04-08
 * @task US_012 TASK_003, US_013 TASK_006, US_014 TASK_001, US_019 TASK_001, US_019 TASK_003, US_044 TASK_005
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppointments } from '../context/AppointmentContext';
import { cancelAppointment } from '../services/appointmentService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { AppointmentCard } from '../components/dashboard/AppointmentCard';
import { WelcomeBanner } from '../components/dashboard/WelcomeBanner';
import { NotificationsPanel } from '../components/dashboard/NotificationsPanel';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { FAB } from '../components/Dashboard/FAB';
import { useAuth } from '../hooks/useAuth';
import './Dashboard.css';

/**
 * Patient Dashboard Component
 */
export const PatientDashboard: React.FC = () => {
  const { appointments, loading, error, refreshAppointments } = useAppointments();
  const navigate = useNavigate();
  const { user } = useAuth();
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === 'desktop' || breakpoint === 'large-desktop';
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'appointments' | 'notifications'>('appointments');

  const handleCancel = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
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

  const handleBookAppointment = () => navigate('/appointments/book');

  /** Quick-action cards matching wireframe (3 across) */
  const quickActionCards = [
    { icon: '📅', title: 'Book Appointment', desc: 'Find and book available time slots', path: '/appointments/book' },
    { icon: '📋', title: 'Complete Intake', desc: 'AI-assisted or manual intake form', path: '/intake/ai' },
    { icon: '📁', title: 'Upload Documents', desc: 'Upload medical records and files', path: `/documents/upload/${user?.id || 'me'}` },
  ];

  const appointmentsSection = (
    <section className="pd-card pd-card--appointments" aria-label="Upcoming Appointments">
      <div className="pd-card__header">
        <h3 className="pd-card__title">Upcoming Appointments</h3>
        <button onClick={() => refreshAppointments()} className="btn btn--text" disabled={loading} aria-label="Refresh appointments">
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      <div className="pd-card__body">
        {loading && <div className="loading-container"><LoadingSpinner /><p>Loading appointments...</p></div>}
        {error && !loading && (
          <div className="error-message" role="alert">
            <strong>Error:</strong> {error}
            <button onClick={() => refreshAppointments()} className="btn btn--text">Try Again</button>
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
          <div className="pd-appointments-list">
            {appointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} onCancel={handleCancel} />
            ))}
          </div>
        )}
      </div>
    </section>
  );

  const notificationsSection = (
    <section className="pd-card pd-card--notifications" aria-label="Notifications">
      <NotificationsPanel />
    </section>
  );

  return (
    <div className="dashboard pd-dashboard">
      <WelcomeBanner />

      {/* Quick Action Cards — 3 across on desktop, stacked on mobile */}
      <div className="pd-quick-actions" role="navigation" aria-label="Quick actions">
        {quickActionCards.map((card) => (
          <button
            key={card.path}
            className="pd-action-card"
            onClick={() => navigate(card.path)}
            type="button"
          >
            <span className="pd-action-card__icon" aria-hidden="true">{card.icon}</span>
            <h3 className="pd-action-card__title">{card.title}</h3>
            <p className="pd-action-card__desc">{card.desc}</p>
          </button>
        ))}
      </div>

      {/* Desktop: side-by-side layout matching wireframe */}
      {isDesktop ? (
        <div className="pd-content-grid">
          {appointmentsSection}
          {notificationsSection}
        </div>
      ) : (
        /* Mobile/Tablet: tabbed layout */
        <>
          <div className="pd-tabs" role="tablist" aria-label="Dashboard sections">
            <button
              role="tab"
              aria-selected={activeTab === 'appointments'}
              className={`pd-tabs__tab ${activeTab === 'appointments' ? 'pd-tabs__tab--active' : ''}`}
              onClick={() => setActiveTab('appointments')}
            >Appointments</button>
            <button
              role="tab"
              aria-selected={activeTab === 'notifications'}
              className={`pd-tabs__tab ${activeTab === 'notifications' ? 'pd-tabs__tab--active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >Notifications</button>
          </div>
          <div role="tabpanel">
            {activeTab === 'appointments' ? appointmentsSection : notificationsSection}
          </div>
        </>
      )}

      <FAB icon="+" label="Book Appointment" onClick={handleBookAppointment} ariaLabel="Book a new appointment" />
    </div>
  );
};
