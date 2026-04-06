/**
 * Queue Filters Component
 * 
 * Filter controls for the queue management table including:
 * - Status multi-select (checkboxes)
 * - Provider dropdown
 * - Department dropdown
 * - Patient name search with debounce
 * - Reset filters button
 * 
 * @module QueueFilters
 * @created 2026-03-31
 * @task US_020 TASK_001
 */

import React from 'react';
import type {
  QueueFilters as QueueFiltersType,
  QueueStatus,
  ProviderOption,
  DepartmentOption,
} from '../../types/queue.types';

const ALL_STATUSES: { value: QueueStatus; label: string }[] = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'arrived', label: 'Arrived' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'no_show', label: 'No Show' },
];

interface QueueFiltersProps {
  /** Current filter state */
  filters: QueueFiltersType;
  /** Callback when filters change */
  onFiltersChange: (filters: QueueFiltersType) => void;
  /** Reset all filters */
  onReset: () => void;
  /** Available providers */
  providers: ProviderOption[];
  /** Available departments */
  departments: DepartmentOption[];
}

/**
 * Queue Filters Component
 * 
 * Renders filter controls for the queue table.
 * Filtering is client-side so no debounce is needed.
 */
export const QueueFilters: React.FC<QueueFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  providers,
  departments,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, searchTerm: e.target.value });
  };

  const handleStatusToggle = (status: QueueStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onFiltersChange({ ...filters, statuses: newStatuses });
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, providerId: e.target.value });
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, departmentId: e.target.value });
  };

  const hasActiveFilters =
    filters.statuses.length > 0 ||
    filters.providerId !== '' ||
    filters.departmentId !== '' ||
    filters.searchTerm !== '';

  return (
    <div className="queue-filters" role="search" aria-label="Filter queue appointments">
      {/* Patient Name Search */}
      <div className="queue-filters__search">
        <label htmlFor="queue-search" className="queue-filters__label">
          Search Patient
        </label>
        <input
          id="queue-search"
          type="search"
          className="queue-filters__input"
          placeholder="Search by patient name..."
          value={filters.searchTerm}
          onChange={handleSearchChange}
          aria-label="Search patients by name"
        />
      </div>

      {/* Status Multi-Select */}
      <fieldset className="queue-filters__group">
        <legend className="queue-filters__label">Status</legend>
        <div className="queue-filters__checkboxes">
          {ALL_STATUSES.map(({ value, label }) => (
            <label key={value} className="queue-filters__checkbox-label">
              <input
                type="checkbox"
                checked={filters.statuses.includes(value)}
                onChange={() => handleStatusToggle(value)}
                aria-label={`Filter by ${label}`}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Provider Dropdown */}
      <div className="queue-filters__group">
        <label htmlFor="queue-provider" className="queue-filters__label">
          Provider
        </label>
        <select
          id="queue-provider"
          className="queue-filters__select"
          value={filters.providerId}
          onChange={handleProviderChange}
          aria-label="Filter by provider"
        >
          <option value="">All Providers</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Department Dropdown */}
      <div className="queue-filters__group">
        <label htmlFor="queue-department" className="queue-filters__label">
          Department
        </label>
        <select
          id="queue-department"
          className="queue-filters__select"
          value={filters.departmentId}
          onChange={handleDepartmentChange}
          aria-label="Filter by department"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <div className="queue-filters__actions">
          <button
            type="button"
            className="queue-filters__reset-btn"
            onClick={onReset}
            aria-label="Reset all filters"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
