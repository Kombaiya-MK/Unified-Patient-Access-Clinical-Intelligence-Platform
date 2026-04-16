/**
 * AppointmentBookingPage
 * 
 * Main page for booking appointments with calendar, time slots, and filters.
 * Integrates all booking components with state management and API calls.
 * 
 * @module AppointmentBookingPage
 * @created 2026-03-18
 * @task US_013 TASK_001 - SCR-006
 */

import React, { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getDepartments, getProviders } from '../services/appointmentService';
import { useSlots, useAvailableDates } from '../hooks/useSlots';
// import { useWaitlist } from '../hooks/useBooking'; // Reserved for future use
import { useBookingConfirmation } from '../hooks/useBookingConfirmation';
import { useAuth } from '../hooks/useAuth';
import AppointmentCalendar from '../components/AppointmentCalendar';
import AvailabilityFilters from '../components/AvailabilityFilters';
import TimeSlotsGrid from '../components/TimeSlotsGrid';
import { ConfirmationModal } from '../components/booking/ConfirmationModal';
import { JoinWaitlistModal } from '../components/waitlist/JoinWaitlistModal';
import type { WaitlistSlotData } from '../components/waitlist/JoinWaitlistModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { LimitedFunctionalityBanner } from '../components/circuit-breaker/LimitedFunctionalityBanner';
import type { Slot } from '../types/appointment.types';
import '../styles/form-responsive.css';
import './AppointmentBookingPage.css';

/**
 * Appointment Booking Page
 * 
 * Features:
 * - Calendar with available dates highlighted
 * - Department and provider filters
 * - Time slots grid with 30-minute intervals
 * - Booking confirmation modal
 * - Waitlist functionality for unavailable dates
 * - Responsive 3-column layout (desktop: 3-col, tablet: 2-col, mobile: 1-col)
 * - WCAG 2.2 AA compliant
 * 
 * @example
 * Route: /appointments/book
 * Protected route - requires authentication
 */
export const AppointmentBookingPage: React.FC = () => {
  // State management
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [syncCalendar, setSyncCalendar] = useState(false);
  const [calendarProvider, setCalendarProvider] = useState<'google' | 'outlook'>('google');
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistSlotData, setWaitlistSlotData] = useState<WaitlistSlotData | null>(null);

  // Hooks
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookAppointment, booking, confirmation, retryCalendarSync, closeConfirmation } = useBookingConfirmation();

  // Fetch departments for filters
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch providers for filters
  const { data: providers = [] } = useQuery({
    queryKey: ['providers', selectedDepartment],
    queryFn: () => getProviders(selectedDepartment || undefined),
    staleTime: 10 * 60 * 1000,
  });

  // Fetch available dates for calendar highlighting
  const { data: availableDates = [] } = useAvailableDates({
    departmentId: selectedDepartment || undefined,
    providerId: selectedProvider || undefined,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
  });

  // Fetch slots for selected date
  const {
    data: slots = [],
    isLoading: slotsLoading,
    error: slotsError,
  } = useSlots({
    departmentId: selectedDepartment || undefined,
    providerId: selectedProvider || undefined,
    date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined,
  });

  // Waitlist mutation (reserved for future use)
  // const waitlistMutation = useWaitlist();

  // Get current department and provider objects
  const currentDepartment = useMemo(
    () => departments.find((d) => d.id === selectedDepartment) || null,
    [departments, selectedDepartment]
  );

  const currentProvider = useMemo(
    () => providers.find((p) => p.id === selectedProvider) || null,
    [providers, selectedProvider]
  );

  // Clear selected slot when date or filters change
  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate, selectedDepartment, selectedProvider]);

  /**
   * Handle date selection from calendar
   */
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  /**
   * Handle slot selection
   */
  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlot(slot);
  };

  /**
   * Book appointment with API call
   */
  const handleBookAppointment = async () => {
    if (!selectedSlot || !user) {
      alert('Please select a time slot');
      return;
    }

    const bookingData = {
      slotId: selectedSlot.id,
      notes: '', // Can add notes input in UI if needed
      syncCalendar,
      calendarProvider: syncCalendar ? calendarProvider : undefined,
    };

    const result = await bookAppointment(bookingData);
    
    if (!result.success) {
      alert(result.error || 'Failed to book appointment');
    }
    // On success, confirmation modal will show automatically
  };

  /**
   * Handle confirmation modal close
   */
  const handleCloseConfirmation = () => {
    closeConfirmation();
    setSelectedSlot(null);
    // Navigate to dashboard
    navigate('/patient/dashboard');
  };

  /**
   * Handle calendar sync retry
   */
  const handleRetrySync = async () => {
    if (confirmation?.id) {
      await retryCalendarSync(confirmation.id, calendarProvider);
    }
    // TODO: Navigate to dashboard
    // navigate('/dashboard');
  };

  /**
   * Handle join waitlist button click
   * Opens modal with slot details for waitlist confirmation
   */
  const handleJoinWaitlist = () => {
    if (!selectedDate || !user || !currentDepartment || !currentProvider) return;

    // Prepare waitlist slot data for modal
    const slotData: WaitlistSlotData = {
      date: selectedDate,
      timeStart: '09:00:00', // Default time for full-day waitlist
      timeEnd: '17:00:00',
      providerName: currentProvider.name,
      providerId: Number(currentProvider.id),
      departmentName: currentDepartment.name,
      departmentId: Number(currentDepartment.id),
    };

    setWaitlistSlotData(slotData);
    setShowWaitlistModal(true);
  };

  /**
   * Handle waitlist modal close
   */
  const handleCloseWaitlistModal = () => {
    setShowWaitlistModal(false);
    setWaitlistSlotData(null);
  };

  /**
   * Handle successful waitlist join
   */
  const handleWaitlistSuccess = () => {
    // Modal will close automatically after success
    // Could optionally navigate to dashboard
    // navigate('/patient/dashboard');
  };

  // Calculate available slots count (reserved for future use)
  // const availableSlotsCount = slots.filter((s) => s.isAvailable).length;

  return (
    <div className="booking-page">
      {/* Circuit Breaker Banner – US_041 TASK_002 */}
      <LimitedFunctionalityBanner />

      <div className="booking-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '4px' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '6px',
              background: '#fff', cursor: 'pointer', fontSize: '14px', color: '#374151',
            }}
          >
            &#8592; Back
          </button>
          <h1 style={{ margin: 0 }}>Book an Appointment</h1>
        </div>
        <p className="header-subtitle">
          Select a date, time, and provider for your appointment
        </p>
      </div>

      {/* Filters */}
      <AvailabilityFilters
        selectedDepartment={selectedDepartment}
        selectedProvider={selectedProvider}
        onDepartmentChange={setSelectedDepartment}
        onProviderChange={setSelectedProvider}
      />

      {/* Main content grid */}
      <div className="booking-grid">
        {/* Column 1: Calendar */}
        <div className="booking-grid-item calendar-column">
          <h2 className="column-title">Select Date</h2>
          <AppointmentCalendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            availableDates={availableDates}
          />
        </div>

        {/* Column 2: Time Slots */}
        <div className="booking-grid-item slots-column">
          <TimeSlotsGrid
            slots={slots}
            selectedSlotId={selectedSlot?.id || null}
            onSlotSelect={handleSlotSelect}
            isLoading={slotsLoading}
            selectedDate={selectedDate}
          />

          {slotsError && (
            <div className="error-message" role="alert">
              <strong>Error:</strong> Failed to load available slots.
              Please try again.
            </div>
          )}

          {selectedDate && !slotsLoading && slots.length === 0 && (
            <div className="no-slots-message">
              <p>No appointments available for this date.</p>
              <button
                type="button"
                className="button button-secondary"
                onClick={handleJoinWaitlist}
                disabled={!currentDepartment || !currentProvider}
                title={!currentDepartment || !currentProvider ? 'Please select department and provider' : 'Join waitlist for this date'}
              >
                Join Waitlist
              </button>
            </div>
          )}
        </div>

        {/* Column 3: Details Panel */}
        <div className="booking-grid-item details-column">
          <h2 className="column-title">Appointment Details</h2>

          {!selectedSlot ? (
            <div className="details-placeholder">
              <p>Select a time slot to view details</p>
            </div>
          ) : (
            <div className="slot-details">
              <div className="detail-section">
                <h3>Selected Time</h3>
                <p className="detail-value-large">
                  {format(new Date(selectedSlot.startTime), 'h:mm a')}
                </p>
                <p className="detail-value-sub">
                  {format(new Date(selectedSlot.startTime), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>

              {(currentProvider || selectedSlot.providerName) && (
                <div className="detail-section">
                  <h3>Provider</h3>
                  <p className="detail-value">{currentProvider?.name || selectedSlot.providerName}</p>
                  {currentProvider?.specialty && (
                    <p className="detail-value-sub">{currentProvider.specialty}</p>
                  )}
                </div>
              )}

              {currentDepartment && (
                <div className="detail-section">
                  <h3>Department</h3>
                  <p className="detail-value">{currentDepartment.name}</p>
                </div>
              )}

              <div className="detail-section">
                <h3>Duration</h3>
                <p className="detail-value">{Math.round(Number(selectedSlot.duration) || 30)} minutes</p>
              </div>

              <div className="detail-actions">
                {/* Calendar Sync Option */}
                <div className="calendar-sync-option">
                  <label>
                    <input
                      type="checkbox"
                      checked={syncCalendar}
                      onChange={(e) => setSyncCalendar(e.target.checked)}
                    />
                    <span>Add to my calendar</span>
                  </label>
                  {syncCalendar && (
                    <select
                      value={calendarProvider}
                      onChange={(e) => setCalendarProvider(e.target.value as 'google' | 'outlook')}
                      className="calendar-provider-select select responsive-select"
                    >
                      <option value="google">Google Calendar</option>
                      <option value="outlook">Outlook Calendar</option>
                    </select>
                  )}
                </div>

                <button
                  type="button"
                  className="button button-primary button-block btn-responsive btn-responsive--primary btn-responsive--full-width-mobile"
                  onClick={handleBookAppointment}
                  disabled={booking}
                >
                  {booking ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Confirmation Modal */}
      {confirmation && (
        <ConfirmationModal
          appointment={confirmation}
          calendarSyncStatus={confirmation.calendarSyncStatus}
          onClose={handleCloseConfirmation}
          onRetrySync={handleRetrySync}
        />
      )}

      {/* Join Waitlist Modal */}
      {showWaitlistModal && (
        <JoinWaitlistModal
          isOpen={showWaitlistModal}
          slotData={waitlistSlotData}
          patientEmail={user?.email || ''}
          onClose={handleCloseWaitlistModal}
          onSuccess={handleWaitlistSuccess}
        />
      )}

      {/* Loading Overlay */}
      {booking && (
        <div className="loading-overlay">
          <LoadingSpinner />
          <p>Booking your appointment...</p>
        </div>
      )}
    </div>
  );
};

export default AppointmentBookingPage;
