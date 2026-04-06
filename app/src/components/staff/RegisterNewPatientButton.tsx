/**
 * RegisterNewPatientButton Component
 * 
 * Button displayed when no patients match the search query.
 * Provides a call-to-action to register a new patient.
 * 
 * @module RegisterNewPatientButton
 * @created 2026-04-01
 * @task US_023 TASK_003
 */

import React from 'react';

interface RegisterNewPatientButtonProps {
  /** Callback when register button clicked */
  onClick: () => void;
}

export const RegisterNewPatientButton: React.FC<RegisterNewPatientButtonProps> = ({ onClick }) => {
  return (
    <button
      type="button"
      className="register-patient-btn"
      onClick={onClick}
      aria-label="Register a new patient"
    >
      <span aria-hidden="true">+</span>
      Register New Patient
    </button>
  );
};
