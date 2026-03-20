/**
 * AvailabilityFilters Component
 * 
 * Department and provider filter dropdowns for narrowing appointment availability.
 * Uses react-select for searchable, accessible dropdowns.
 * 
 * @module AvailabilityFilters
 * @created 2026-03-18
 * @task US_013 TASK_001
 */

import React, { useEffect } from 'react';
import Select from 'react-select';
import type { SingleValue, StylesConfig } from 'react-select';
import { useQuery } from '@tanstack/react-query';
import { getDepartments, getProviders } from '../services/appointmentService';
import './AvailabilityFilters.css';

interface AvailabilityFiltersProps {
  /** Selected department ID */
  selectedDepartment: string | null;
  /** Selected provider ID */
  selectedProvider: string | null;
  /** Callback when department is selected */
  onDepartmentChange: (departmentId: string | null) => void;
  /** Callback when provider is selected */
  onProviderChange: (providerId: string | null) => void;
}

interface SelectOption {
  value: string;
  label: string;
}

/**
 * Custom styles for react-select with WCAG compliance
 */
const customStyles: StylesConfig<SelectOption, false> = {
  control: (provided, state) => ({
    ...provided,
    minHeight: '44px',
    borderColor: state.isFocused ? '#007BFF' : '#CED4DA',
    borderWidth: '2px',
    borderRadius: '4px',
    boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0, 123, 255, 0.25)' : 'none',
    '&:hover': {
      borderColor: '#007BFF',
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? '#007BFF'
      : state.isFocused
      ? '#E7F3FF'
      : 'transparent',
    color: state.isSelected ? '#FFFFFF' : '#212529',
    padding: '12px 16px',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: '#0056B3',
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#6C757D',
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#212529',
  }),
};

/**
 * Availability filters with department and provider dropdowns
 * 
 * Features:
 * - Searchable dropdowns
 * - Provider list filtered by selected department
 * - Automatic provider clear when department changes
 * - WCAG 2.2 AA compliant (4.5:1 contrast, ARIA labels)
 * - Responsive stacking on mobile
 * 
 * @example
 * ```tsx
 * <AvailabilityFilters
 *   selectedDepartment={deptId}
 *   selectedProvider={providerId}
 *   onDepartmentChange={setDeptId}
 *   onProviderChange={setProviderId}
 * />
 * ```
 */
export const AvailabilityFilters: React.FC<AvailabilityFiltersProps> = ({
  selectedDepartment,
  selectedProvider,
  onDepartmentChange,
  onProviderChange,
}) => {
  // Fetch departments
  const {
    data: departments = [],
    isLoading: departmentsLoading,
    error: departmentsError,
  } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch providers (filtered by department if selected)
  const {
    data: providers = [],
    isLoading: providersLoading,
    error: providersError,
  } = useQuery({
    queryKey: ['providers', selectedDepartment],
    queryFn: () => getProviders(selectedDepartment || undefined),
    staleTime: 10 * 60 * 1000,
    enabled: true, // Always fetch to show all providers
  });

  // Clear provider selection when department changes
  useEffect(() => {
    if (selectedProvider && selectedDepartment) {
      const providerStillValid = providers.some(
        (p) => p.id === selectedProvider && p.departmentId === selectedDepartment
      );
      if (!providerStillValid) {
        onProviderChange(null);
      }
    }
  }, [selectedDepartment, providers, selectedProvider, onProviderChange]);

  // Convert departments to select options
  const departmentOptions: SelectOption[] = departments.map((dept) => ({
    value: dept.id,
    label: dept.name,
  }));

  // Convert providers to select options (filtered by department if selected)
  const providerOptions: SelectOption[] = providers
    .filter((provider) =>
      selectedDepartment ? provider.departmentId === selectedDepartment : true
    )
    .map((provider) => ({
      value: provider.id,
      label: `${provider.name} - ${provider.specialty}`,
    }));

  // Handle department selection
  const handleDepartmentChange = (option: SingleValue<SelectOption>) => {
    onDepartmentChange(option ? option.value : null);
  };

  // Handle provider selection
  const handleProviderChange = (option: SingleValue<SelectOption>) => {
    onProviderChange(option ? option.value : null);
  };

  // Get selected values for react-select
  const selectedDepartmentOption = departmentOptions.find(
    (opt) => opt.value === selectedDepartment
  );

  const selectedProviderOption = providerOptions.find(
    (opt) => opt.value === selectedProvider
  );

  return (
    <div className="availability-filters">
      <div className="filter-group">
        <label htmlFor="department-select" className="filter-label">
          Department
        </label>
        <Select<SelectOption>
          inputId="department-select"
          value={selectedDepartmentOption || null}
          onChange={handleDepartmentChange}
          options={departmentOptions}
          styles={customStyles}
          placeholder="Select department..."
          isClearable
          isSearchable
          isLoading={departmentsLoading}
          isDisabled={departmentsLoading || !!departmentsError}
          aria-label="Select department"
          className="filter-select"
          classNamePrefix="react-select"
        />
        {departmentsError && (
          <span className="filter-error" role="alert">
            Failed to load departments
          </span>
        )}
      </div>

      <div className="filter-group">
        <label htmlFor="provider-select" className="filter-label">
          Provider {selectedDepartment && '(filtered by department)'}
        </label>
        <Select<SelectOption>
          inputId="provider-select"
          value={selectedProviderOption || null}
          onChange={handleProviderChange}
          options={providerOptions}
          styles={customStyles}
          placeholder="Select provider (optional)..."
          isClearable
          isSearchable
          isLoading={providersLoading}
          isDisabled={providersLoading || !!providersError}
          aria-label="Select provider"
          className="filter-select"
          classNamePrefix="react-select"
          noOptionsMessage={() =>
            selectedDepartment
              ? 'No providers in this department'
              : 'Select a department first'
          }
        />
        {providersError && (
          <span className="filter-error" role="alert">
            Failed to load providers
          </span>
        )}
      </div>
    </div>
  );
};

export default AvailabilityFilters;
