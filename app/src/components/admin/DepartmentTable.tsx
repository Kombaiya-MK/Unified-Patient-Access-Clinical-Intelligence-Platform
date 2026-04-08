/**
 * DepartmentTable Component
 *
 * Displays department list with status, counts, and action buttons.
 *
 * @module DepartmentTable
 * @task US_036 TASK_004
 */

import React from 'react';
import { StatusBadge } from './StatusBadge';
import type { DepartmentManaged } from '../../types/department.types';

interface DepartmentTableProps {
  departments: DepartmentManaged[];
  onEdit: (department: DepartmentManaged) => void;
  onDeactivate: (department: DepartmentManaged) => void;
}

export const DepartmentTable: React.FC<DepartmentTableProps> = ({
  departments,
  onEdit,
  onDeactivate,
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

  if (departments.length === 0) {
    return <p style={{ textAlign: 'center', color: '#6b7280', padding: '24px' }}>No departments found</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Department Name</th>
            <th style={thStyle}>Code</th>
            <th style={thStyle}>Active Providers</th>
            <th style={thStyle}>Total Appointments</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {departments.map((dept) => (
            <tr key={dept.id}>
              <td style={tdStyle}>{dept.name}</td>
              <td style={tdStyle}><code>{dept.code}</code></td>
              <td style={tdStyle}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '12px', padding: '2px 10px', fontWeight: 600, fontSize: '0.75rem' }}>
                  {dept.provider_count}
                </span>
              </td>
              <td style={tdStyle}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', color: '#374151', borderRadius: '12px', padding: '2px 10px', fontWeight: 600, fontSize: '0.75rem' }}>
                  {dept.appointment_count}
                </span>
              </td>
              <td style={tdStyle}><StatusBadge isActive={dept.is_active} /></td>
              <td style={tdStyle}>
                <button style={btnStyle} onClick={() => onEdit(dept)} aria-label={`Edit ${dept.name}`}>
                  Edit
                </button>
                {dept.is_active && (
                  <button
                    style={{ ...btnStyle, color: '#dc2626', borderColor: '#fca5a5' }}
                    onClick={() => onDeactivate(dept)}
                    aria-label={`Deactivate ${dept.name}`}
                  >
                    Deactivate
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
