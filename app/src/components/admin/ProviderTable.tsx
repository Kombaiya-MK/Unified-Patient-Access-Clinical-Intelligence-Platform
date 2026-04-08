/**
 * ProviderTable Component
 *
 * Displays provider list with department, hours, and action buttons.
 *
 * @module ProviderTable
 * @task US_036 TASK_004
 */

import React from 'react';
import { StatusBadge } from './StatusBadge';
import type { Provider } from '../../types/provider.types';

interface ProviderTableProps {
  providers: Provider[];
  onEditSchedule: (provider: Provider) => void;
  onRemove: (provider: Provider) => void;
}

export const ProviderTable: React.FC<ProviderTableProps> = ({
  providers,
  onEditSchedule,
  onRemove,
}) => {
  const tableStyle: React.CSSProperties = {
    width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem',
  };
  const thStyle: React.CSSProperties = {
    textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e5e7eb',
    fontWeight: 600, color: '#374151', backgroundColor: '#f9fafb',
  };
  const tdStyle: React.CSSProperties = {
    padding: '12px 16px', borderBottom: '1px solid #e5e7eb',
  };
  const btnStyle: React.CSSProperties = {
    padding: '4px 12px', borderRadius: '4px', border: '1px solid #d1d5db',
    backgroundColor: '#fff', cursor: 'pointer', fontSize: '0.75rem', marginRight: '4px',
  };

  if (providers.length === 0) {
    return <p style={{ textAlign: 'center', color: '#6b7280', padding: '24px' }}>No providers found</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Provider Name</th>
            <th style={thStyle}>Specialty</th>
            <th style={thStyle}>Departments</th>
            <th style={thStyle}>Availability</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {providers.map((provider) => (
            <tr key={provider.id}>
              <td style={tdStyle}>{provider.last_name}, {provider.first_name}</td>
              <td style={tdStyle}>{provider.specialty}</td>
              <td style={tdStyle}>{provider.departments || '—'}</td>
              <td style={tdStyle}>{Number(provider.total_weekly_hours).toFixed(0)}h/week</td>
              <td style={tdStyle}><StatusBadge isActive={provider.is_active} /></td>
              <td style={tdStyle}>
                <button
                  style={{ ...btnStyle, color: '#2563eb', borderColor: '#93c5fd' }}
                  onClick={() => onEditSchedule(provider)}
                  aria-label={`Edit schedule for ${provider.last_name}`}
                >
                  Edit Schedule
                </button>
                <button
                  style={{ ...btnStyle, color: '#dc2626', borderColor: '#fca5a5' }}
                  onClick={() => onRemove(provider)}
                  aria-label={`Remove ${provider.last_name}`}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
