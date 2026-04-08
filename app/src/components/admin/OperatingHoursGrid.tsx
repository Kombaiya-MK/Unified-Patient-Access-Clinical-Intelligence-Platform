/**
 * OperatingHoursGrid Component
 *
 * 7-day time picker grid for department operating hours.
 *
 * @module OperatingHoursGrid
 * @task US_036 TASK_004
 */

import React from 'react';
import type { OperatingHours, DayHours } from '../../types/department.types';

const DAYS: { key: keyof OperatingHours; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const DEFAULT_HOURS: OperatingHours = {
  monday: { open: '08:00', close: '20:00', is_open: true },
  tuesday: { open: '08:00', close: '20:00', is_open: true },
  wednesday: { open: '08:00', close: '20:00', is_open: true },
  thursday: { open: '08:00', close: '20:00', is_open: true },
  friday: { open: '08:00', close: '20:00', is_open: true },
  saturday: { open: '08:00', close: '20:00', is_open: true },
  sunday: { open: '08:00', close: '20:00', is_open: true },
};

interface OperatingHoursGridProps {
  value: OperatingHours | null;
  onChange: (hours: OperatingHours) => void;
}

export const OperatingHoursGrid: React.FC<OperatingHoursGridProps> = ({ value, onChange }) => {
  const hours = value || DEFAULT_HOURS;

  const handleDayChange = (day: keyof OperatingHours, field: keyof DayHours, val: string | boolean) => {
    onChange({
      ...hours,
      [day]: { ...hours[day], [field]: val },
    });
  };

  const gridStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' };
  const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '120px 60px 1fr 1fr',
    gap: '8px',
    alignItems: 'center',
    padding: '4px 0',
  };
  const inputStyle: React.CSSProperties = {
    padding: '4px 8px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '0.875rem',
  };

  return (
    <div style={gridStyle} role="group" aria-label="Operating Hours">
      <div style={{ ...rowStyle, fontWeight: 600, fontSize: '0.75rem', color: '#6b7280' }}>
        <span>Day</span>
        <span>Open</span>
        <span>From</span>
        <span>To</span>
      </div>
      {DAYS.map(({ key, label }) => {
        const day = hours[key];
        return (
          <div key={key} style={rowStyle}>
            <label htmlFor={`${key}-open`} style={{ fontSize: '0.875rem', fontWeight: 500 }}>
              {label}
            </label>
            <input
              id={`${key}-open`}
              type="checkbox"
              checked={day.is_open}
              onChange={(e) => handleDayChange(key, 'is_open', e.target.checked)}
              aria-label={`${label} is open`}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <input
              type="time"
              value={day.open}
              disabled={!day.is_open}
              onChange={(e) => handleDayChange(key, 'open', e.target.value)}
              aria-label={`${label} opening time`}
              style={{ ...inputStyle, opacity: day.is_open ? 1 : 0.5 }}
            />
            <input
              type="time"
              value={day.close}
              disabled={!day.is_open}
              onChange={(e) => handleDayChange(key, 'close', e.target.value)}
              aria-label={`${label} closing time`}
              style={{ ...inputStyle, opacity: day.is_open ? 1 : 0.5 }}
            />
          </div>
        );
      })}
    </div>
  );
};
