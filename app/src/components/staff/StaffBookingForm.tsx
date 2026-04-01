/**
 * StaffBookingForm Component
 * 
 * Booking form for staff-assisted appointments. Reuses existing
 * appointment booking components (calendar, slots, filters) and adds
 * staff-specific fields: priority, override capacity, and notes.
 * 
 * @module StaffBookingForm
 * @created 2026-04-01
 * @task US_023 TASK_004
 */

import React, { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { getDepartments, getProviders } from '../../services/appointmentService';
import { useSlots, useAvailableDates } from '../../hooks/useSlots';
import AppointmentCalendar from '../AppointmentCalendar';
import AvailabilityFilters from '../AvailabilityFilters';
import TimeSlotsGrid from '../TimeSlotsGrid';
import { OverrideCapacityCheckbox } from './OverrideCapacityCheckbox';
import { BookingNotesTextarea } from './BookingNotesTextarea';
import { useStaffBooking } from '../../hooks/useStaffBooking';
import type { PatientSearchResult } from '../../types/patient.types';
import type { Slot } from '../../types/appointment.types';
import type { BookingPriority } from '../../types/staffBooking.types';
import './StaffBooking.css';

interface StaffBookingFormProps {
  /** Selected patient to book for */
  selectedPatient: PatientSearchResult | null;
  /** Callback after successful booking */
  onBookingSuccess: () => void;
}

const APPOINTMENT_TYPES = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'routine_checkup', label: 'Routine Checkup' },
  { value: 'diagnostic', label: 'Diagnostic' },
  { value: 'treatment', label: 'Treatment' },
];

export const StaffBookingForm: React.FC<StaffBookingFormProps> = ({
  selectedPatient,
  onBookingSuccess,
}) => {
  // Form state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [appointmentType, setAppointmentType] = useState('consultation');
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [bookingPriority, setBookingPriority] = useState<BookingPriority>('normal');
  const [overrideCapacity, setOverrideCapacity] = useState(false);
  const [staffBookingNotes, setStaffBookingNotes] = useState('');

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Booking hook
  const { bookAppointment, loading, error: bookingError, success } = useStaffBooking();

  const isDisabled = !selectedPatient;

  // Fetch departments
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch providers
  const { data: providers = [] } = useQuery({
    queryKey: ['providers', selectedDepartment],
    queryFn: () => getProviders(selectedDepartment || undefined),
    staleTime: 10 * 60 * 1000,
  });

  // Available dates
  const { data: availableDates = [] } = useAvailableDates({
    departmentId: selectedDepartment || undefined,
    providerId: selectedProvider || undefined,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
  });

  // Slots for selected date
  const {
    data: slots = [],
    isLoading: slotsLoading,
  } = useSlots({
    departmentId: selectedDepartment || undefined,
    providerId: selectedProvider || undefined,
    date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined,
  });

  // Clear slot when date/filters change
  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate, selectedDepartment, selectedProvider]);

  // Reset form on success
  useEffect(() => {
    if (success) {
      setSelectedDate(null);
      setSelectedDepartment(null);
      setSelectedProvider(null);
      setSelectedSlot(null);
      setAppointmentType('consultation');
      setReasonForVisit('');
      setBookingPriority('normal');
      setOverrideCapacity(false);
      setStaffBookingNotes('');
      setErrors({});
      onBookingSuccess();
    }
  }, [success, onBookingSuccess]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedSlot) {
      newErrors.slot = 'Please select a time slot';
    }
    if (!appointmentType) {
      newErrors.appointmentType = 'Appointment type is required';
    }
    if (reasonForVisit && reasonForVisit.length < 10) {
      newErrors.reasonForVisit = 'Reason must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !selectedSlot || !validate()) return;

    await bookAppointment({
      patientId: selectedPatient.id,
      slotId: selectedSlot.id,
      appointmentType,
      reasonForVisit,
      bookingPriority,
      overrideCapacity,
      staffBookingNotes,
    });
  };

  const formClassName = [
    'staff-booking-form',
    isDisabled ? 'staff-booking-form--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <form className={formClassName} onSubmit={handleSubmit} aria-label="Staff booking form">
      {/* Department & Provider Filters */}
      <AvailabilityFilters
        selectedDepartment={selectedDepartment}
        selectedProvider={selectedProvider}
        onDepartmentChange={(dept) => {
          setSelectedDepartment(dept);
          setSelectedProvider(null);
        }}
        onProviderChange={setSelectedProvider}
      />

      {/* Calendar */}
      <div className="staff-booking-form__field">
        <label className="staff-booking-form__label staff-booking-form__label--required">
          Appointment Date
        </label>
        <AppointmentCalendar
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          availableDates={availableDates}
        />
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div className="staff-booking-form__field">
          <label className="staff-booking-form__label staff-booking-form__label--required">
            Time Slot
          </label>
          <TimeSlotsGrid
            slots={slots}
            selectedSlotId={selectedSlot?.id || null}
            onSlotSelect={setSelectedSlot}
            isLoading={slotsLoading}
            selectedDate={selectedDate}
          />
          {errors.slot && (
            <span className="staff-booking-form__error" role="alert">
              {errors.slot}
            </span>
          )}
        </div>
      )}

      {/* Appointment Type */}
      <div className="staff-booking-form__field">
        <label
          htmlFor="appointment-type"
          className="staff-booking-form__label staff-booking-form__label--required"
        >
          Appointment Type
        </label>
        <select
          id="appointment-type"
          className="staff-booking-form__select"
          value={appointmentType}
          onChange={(e) => setAppointmentType(e.target.value)}
          disabled={isDisabled}
        >
          {APPOINTMENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {errors.appointmentType && (
          <span className="staff-booking-form__error" role="alert">
            {errors.appointmentType}
          </span>
        )}
      </div>

      {/* Reason for Visit */}
      <div className="staff-booking-form__field">
        <label htmlFor="reason-for-visit" className="staff-booking-form__label">
          Reason for Visit
        </label>
        <textarea
          id="reason-for-visit"
          className="staff-booking-form__textarea"
          placeholder="Describe the reason for this appointment..."
          value={reasonForVisit}
          onChange={(e) => setReasonForVisit(e.target.value)}
          rows={3}
          disabled={isDisabled}
        />
        {errors.reasonForVisit && (
          <span className="staff-booking-form__error" role="alert">
            {errors.reasonForVisit}
          </span>
        )}
      </div>

      {/* Priority */}
      <div className="staff-booking-form__field">
        <label htmlFor="booking-priority" className="staff-booking-form__label staff-booking-form__label--required">
          Priority
        </label>
        <select
          id="booking-priority"
          className={`staff-booking-form__select${bookingPriority === 'urgent' ? ' priority-select--urgent' : ''}`}
          value={bookingPriority}
          onChange={(e) => setBookingPriority(e.target.value as BookingPriority)}
          disabled={isDisabled}
        >
          <option value="normal">Normal</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {/* Override Capacity */}
      <OverrideCapacityCheckbox
        checked={overrideCapacity}
        onChange={setOverrideCapacity}
        disabled={isDisabled}
      />

      {/* Booking Notes */}
      <BookingNotesTextarea
        value={staffBookingNotes}
        onChange={setStaffBookingNotes}
        disabled={isDisabled}
      />

      {/* Error Display */}
      {bookingError && (
        <div className="staff-booking-toast staff-booking-toast--error" role="alert">
          {bookingError}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        className="staff-booking-form__submit"
        disabled={isDisabled || loading || !selectedSlot}
      >
        {loading ? 'Booking...' : 'Book Appointment'}
      </button>
    </form>
  );
};
