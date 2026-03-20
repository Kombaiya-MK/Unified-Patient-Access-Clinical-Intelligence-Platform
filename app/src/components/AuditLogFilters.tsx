/**
 * Audit Log Filters Component
 * 
 * File: app/src/components/AuditLogFilters.tsx
 * Task: US_011 TASK_004 - Frontend Admin Audit Log Viewer (Filters)
 * 
 * Purpose: Filter controls for audit log viewer
 * 
 * Features:
 * - Date range picker (from/to)
 * - User autocomplete search
 * - Action type dropdown
 * - Resource type dropdown
 * - Resource ID text search
 * - Apply and Reset buttons
 * - WCAG 2.2 AA accessible
 */

import React, { useState, useEffect } from 'react';
import type { FilterParams, UserOption } from '../types/audit.types';

interface AuditLogFiltersProps {
  filters: FilterParams;
  onFiltersChange: (filters: FilterParams) => void;
  actionTypes: string[];
  resourceTypes: string[];
  onUserSearch: (query: string) => Promise<UserOption[]>;
}

const AuditLogFilters: React.FC<AuditLogFiltersProps> = ({
  filters,
  onFiltersChange,
  actionTypes,
  resourceTypes,
  onUserSearch,
}) => {
  const [localFilters, setLocalFilters] = useState<FilterParams>(filters);
  const [userQuery, setUserQuery] = useState('');
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  /**
   * Handle user search input change
   */
  const handleUserSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setUserQuery(query);
    
    if (query.length >= 2) {
      const users = await onUserSearch(query);
      setUserOptions(users);
      setShowUserDropdown(true);
    } else {
      setUserOptions([]);
      setShowUserDropdown(false);
    }
  };

  /**
   * Handle user selection from dropdown
   */
  const handleUserSelect = (user: UserOption) => {
    setLocalFilters({ ...localFilters, user_id: user.id });
    setUserQuery(user.email);
    setShowUserDropdown(false);
  };

  /**
   * Handle filter input changes
   */
  const handleInputChange = (field: keyof FilterParams, value: string | number) => {
    setLocalFilters({
      ...localFilters,
      [field]: value || undefined,
    });
  };

  /**
   * Apply filters
   */
  const handleApplyFilters = () => {
    onFiltersChange({ ...localFilters, page: 1 }); // Reset to page 1 when applying filters
  };

  /**
   * Reset all filters
   */
  const handleResetFilters = () => {
    const resetFilters: FilterParams = {
      page: 1,
      pageSize: 20,
    };
    setLocalFilters(resetFilters);
    setUserQuery('');
    setUserOptions([]);
    onFiltersChange(resetFilters);
  };

  /**
   * Effect: Sync local filters with prop filters
   */
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  return (
    <div className="audit-log-filters" role="search" aria-label="Audit log filters">
      <div className="filters-grid">
        {/* Date Range Filters */}
        <div className="filter-group">
          <label htmlFor="start-date" className="filter-label">
            Start Date
          </label>
          <input
            type="date"
            id="start-date"
            className="filter-input"
            value={localFilters.start_date || ''}
            onChange={(e) => handleInputChange('start_date', e.target.value)}
            aria-label="Filter by start date"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="end-date" className="filter-label">
            End Date
          </label>
          <input
            type="date"
            id="end-date"
            className="filter-input"
            value={localFilters.end_date || ''}
            onChange={(e) => handleInputChange('end_date', e.target.value)}
            aria-label="Filter by end date"
          />
        </div>

        {/* User Search (Autocomplete) */}
        <div className="filter-group">
          <label htmlFor="user-search" className="filter-label">
            User
          </label>
          <div className="autocomplete-wrapper">
            <input
              type="text"
              id="user-search"
              className="filter-input"
              placeholder="Search by email..."
              value={userQuery}
              onChange={handleUserSearchChange}
              onFocus={() => userOptions.length > 0 && setShowUserDropdown(true)}
              onBlur={() => setTimeout(() => setShowUserDropdown(false), 200)}
              aria-label="Search users by email"
              aria-autocomplete="list"
              aria-controls="user-dropdown"
              aria-expanded={showUserDropdown}
            />
            {showUserDropdown && userOptions.length > 0 && (
              <ul id="user-dropdown" className="autocomplete-dropdown" role="listbox">
                {userOptions.map((user) => (
                  <li
                    key={user.id}
                    className="autocomplete-item"
                    onClick={() => handleUserSelect(user)}
                    role="option"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleUserSelect(user);
                      }
                    }}
                  >
                    {user.email} ({user.role})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Action Type Dropdown */}
        <div className="filter-group">
          <label htmlFor="action-type" className="filter-label">
            Action Type
          </label>
          <select
            id="action-type"
            className="filter-select"
            value={localFilters.action_type || ''}
            onChange={(e) => handleInputChange('action_type', e.target.value)}
            aria-label="Filter by action type"
          >
            <option value="">All Actions</option>
            {actionTypes.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>

        {/* Resource Type Dropdown */}
        <div className="filter-group">
          <label htmlFor="resource-type" className="filter-label">
            Resource Type
          </label>
          <select
            id="resource-type"
            className="filter-select"
            value={localFilters.resource_type || ''}
            onChange={(e) => handleInputChange('resource_type', e.target.value)}
            aria-label="Filter by resource type"
          >
            <option value="">All Resources</option>
            {resourceTypes.map((resource) => (
              <option key={resource} value={resource}>
                {resource}
              </option>
            ))}
          </select>
        </div>

        {/* Resource ID Search */}
        <div className="filter-group">
          <label htmlFor="resource-id" className="filter-label">
            Resource ID
          </label>
          <input
            type="text"
            id="resource-id"
            className="filter-input"
            placeholder="Search by ID..."
            value={localFilters.resource_id || ''}
            onChange={(e) => handleInputChange('resource_id', e.target.value)}
            aria-label="Search by resource ID"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="filter-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleApplyFilters}
          aria-label="Apply filters"
        >
          Apply Filters
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleResetFilters}
          aria-label="Reset all filters"
        >
          Reset
        </button>
      </div>

      <style>{`
        .audit-log-filters {
          background: #fff;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
        }

        .filter-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .filter-input,
        .filter-select {
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 0.875rem;
          transition: border-color 0.15s;
        }

        .filter-input:focus,
        .filter-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .autocomplete-wrapper {
          position: relative;
        }

        .autocomplete-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #fff;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 10;
          list-style: none;
          padding: 0;
          margin: 0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .autocomplete-item {
          padding: 0.5rem 0.75rem;
          cursor: pointer;
          transition: background-color 0.15s;
        }

        .autocomplete-item:hover,
        .autocomplete-item:focus {
          background-color: #f3f4f6;
          outline: none;
        }

        .filter-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-start;
        }

        .btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.15s;
        }

        .btn-primary {
          background-color: #3b82f6;
          color: #fff;
        }

        .btn-primary:hover {
          background-color: #2563eb;
        }

        .btn-primary:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }

        .btn-secondary {
          background-color: #6b7280;
          color: #fff;
        }

        .btn-secondary:hover {
          background-color: #4b5563;
        }

        .btn-secondary:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.3);
        }

        @media (max-width: 768px) {
          .filters-grid {
            grid-template-columns: 1fr;
          }

          .filter-actions {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default AuditLogFilters;
