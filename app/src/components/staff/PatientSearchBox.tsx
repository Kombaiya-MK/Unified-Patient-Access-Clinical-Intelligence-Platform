/**
 * PatientSearchBox Component
 * 
 * Search box with debounced input and dropdown results for finding
 * patients by name, phone, or email. Used in staff booking flow.
 * 
 * Features:
 * - Debounced search (300ms)
 * - Dropdown results with patient details
 * - Keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
 * - "No patients found" state with register button
 * - WCAG 2.2 AA compliant
 * 
 * @module PatientSearchBox
 * @created 2026-04-01
 * @task US_023 TASK_003
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePatientSearch } from '../../hooks/usePatientSearch';
import { PatientSearchResultItem } from './PatientSearchResult';
import { RegisterNewPatientButton } from './RegisterNewPatientButton';
import type { PatientSearchResult } from '../../types/patient.types';
import './StaffBooking.css';

interface PatientSearchBoxProps {
  /** Callback when a patient is selected */
  onPatientSelect: (patient: PatientSearchResult) => void;
  /** Callback when register new patient is clicked */
  onRegisterNewPatient?: () => void;
}

export const PatientSearchBox: React.FC<PatientSearchBoxProps> = ({
  onPatientSelect,
  onRegisterNewPatient,
}) => {
  const { searchTerm, setSearchTerm, patients, isLoading } = usePatientSearch();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const showDropdown = isOpen && searchTerm.trim().length >= 2;

  const handleSelect = useCallback(
    (patient: PatientSearchResult) => {
      onPatientSelect(patient);
      setSearchTerm('');
      setIsOpen(false);
      setFocusedIndex(-1);
    },
    [onPatientSelect, setSearchTerm],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) =>
            prev < patients.length - 1 ? prev + 1 : 0,
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) =>
            prev > 0 ? prev - 1 : patients.length - 1,
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < patients.length) {
            handleSelect(patients[focusedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
      }
    },
    [showDropdown, patients, focusedIndex, handleSelect],
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Open dropdown when search term changes and has results
  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      setIsOpen(true);
      setFocusedIndex(-1);
    }
  }, [searchTerm]);

  return (
    <div className="patient-search">
      <label htmlFor="patient-search-input" className="patient-search__label">
        Search Patient
      </label>
      <div className="patient-search__input-wrapper">
        <span className="patient-search__icon" aria-hidden="true">
          🔍
        </span>
        <input
          ref={inputRef}
          id="patient-search-input"
          type="text"
          className="patient-search__input"
          placeholder="Search by name, phone, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            if (searchTerm.trim().length >= 2) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-controls="patient-search-results"
          aria-autocomplete="list"
          autoComplete="off"
        />
      </div>

      {showDropdown && (
        <div
          ref={dropdownRef}
          id="patient-search-results"
          className="patient-search__dropdown"
          role="listbox"
          aria-label="Patient search results"
        >
          {isLoading && (
            <div className="patient-search__loading">Searching patients</div>
          )}

          {!isLoading && patients.length > 0 &&
            patients.map((patient, index) => (
              <PatientSearchResultItem
                key={patient.id}
                patient={patient}
                isFocused={index === focusedIndex}
                onSelect={handleSelect}
              />
            ))}

          {!isLoading && patients.length === 0 && (
            <div className="patient-search__empty">
              <p>No patients found matching "{searchTerm}"</p>
              {onRegisterNewPatient && (
                <RegisterNewPatientButton onClick={onRegisterNewPatient} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
