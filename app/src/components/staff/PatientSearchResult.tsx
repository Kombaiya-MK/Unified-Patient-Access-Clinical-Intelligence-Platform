/**
 * PatientSearchResult Component
 * 
 * Displays a single patient search result row in the dropdown.
 * Shows patient name, contact details, and MRN.
 * 
 * @module PatientSearchResult
 * @created 2026-04-01
 * @task US_023 TASK_003
 */

import React from 'react';
import type { PatientSearchResult as PatientResult } from '../../types/patient.types';

interface PatientSearchResultProps {
  /** Patient data to display */
  patient: PatientResult;
  /** Whether this result is focused via keyboard */
  isFocused: boolean;
  /** Callback when patient is selected */
  onSelect: (patient: PatientResult) => void;
}

export const PatientSearchResultItem: React.FC<PatientSearchResultProps> = ({
  patient,
  isFocused,
  onSelect,
}) => {
  const formattedDob = patient.dateOfBirth
    ? new Date(patient.dateOfBirth).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <button
      type="button"
      className={`patient-search__result${isFocused ? ' patient-search__result--focused' : ''}`}
      onClick={() => onSelect(patient)}
      role="option"
      aria-selected={isFocused}
    >
      <div>
        <div className="patient-search__result-name">{patient.fullName}</div>
        <div className="patient-search__result-details">
          {formattedDob}
          {patient.phoneNumber && ` · ${patient.phoneNumber}`}
          {patient.email && ` · ${patient.email}`}
        </div>
      </div>
      <span className="patient-search__result-mrn">MRN: {patient.medicalRecordNumber}</span>
    </button>
  );
};
