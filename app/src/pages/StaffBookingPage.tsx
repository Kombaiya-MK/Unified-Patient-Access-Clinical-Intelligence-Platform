/**
 * StaffBookingPage
 * 
 * Main page for staff to book appointments on behalf of patients.
 * Integrates patient search and booking form with staff override options.
 * 
 * @module StaffBookingPage
 * @created 2026-04-01
 * @task US_023 TASK_004
 */

import React, { useState, useCallback, useEffect } from 'react';
import { PatientSearchBox } from '../components/staff/PatientSearchBox';
import { StaffBookingForm } from '../components/staff/StaffBookingForm';
import type { PatientSearchResult } from '../types/patient.types';
import '../components/staff/StaffBooking.css';

export const StaffBookingPage: React.FC = () => {
  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handlePatientSelect = useCallback((patient: PatientSearchResult) => {
    setSelectedPatient(patient);
    setSuccessMessage(null);
  }, []);

  const handleClearPatient = useCallback(() => {
    setSelectedPatient(null);
  }, []);

  const handleBookingSuccess = useCallback(() => {
    if (selectedPatient) {
      setSuccessMessage(
        `Appointment booked for ${selectedPatient.fullName}. Confirmation sent to patient.`,
      );
    }
    setSelectedPatient(null);
  }, [selectedPatient]);

  const handleRegisterNewPatient = useCallback(() => {
    // Navigate to patient registration (placeholder for future implementation)
    window.alert('Patient registration feature coming soon.');
  }, []);

  // Auto-dismiss success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div className="staff-booking-page">
      <div className="staff-booking-page__header">
        <h1 className="staff-booking-page__title">Book Appointment for Patient</h1>
        <p className="staff-booking-page__subtitle">
          Search for a patient, then fill in the appointment details below.
        </p>
      </div>

      {/* Success Toast */}
      {successMessage && (
        <div className="staff-booking-toast staff-booking-toast--success" role="status">
          {successMessage}
        </div>
      )}

      {/* Patient Search */}
      {!selectedPatient && (
        <PatientSearchBox
          onPatientSelect={handlePatientSelect}
          onRegisterNewPatient={handleRegisterNewPatient}
        />
      )}

      {/* Selected Patient Card */}
      {selectedPatient && (
        <div className="selected-patient-card">
          <div className="selected-patient-card__info">
            <div className="selected-patient-card__name">
              {selectedPatient.fullName}
            </div>
            <div className="selected-patient-card__details">
              DOB: {new Date(selectedPatient.dateOfBirth).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
              {selectedPatient.phoneNumber && ` · Phone: ${selectedPatient.phoneNumber}`}
              {' '}· MRN: {selectedPatient.medicalRecordNumber}
            </div>
          </div>
          <button
            type="button"
            className="selected-patient-card__clear"
            onClick={handleClearPatient}
          >
            Change Patient
          </button>
        </div>
      )}

      {/* Booking Form */}
      <StaffBookingForm
        selectedPatient={selectedPatient}
        onBookingSuccess={handleBookingSuccess}
      />
    </div>
  );
};
