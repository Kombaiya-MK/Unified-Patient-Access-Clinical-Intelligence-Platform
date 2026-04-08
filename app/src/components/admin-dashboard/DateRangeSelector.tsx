/**
 * Date Range Selector Component
 *
 * Dropdown for selecting date range preset or custom range.
 *
 * @module DateRangeSelector
 * @task US_039 TASK_002
 */

import React, { useState } from 'react';
import type { DateRangePreset } from '../../types/admin-metrics.types';

interface DateRangeSelectorProps {
  preset: DateRangePreset;
  onRangeChange: (preset: DateRangePreset, customFrom?: string, customTo?: string) => void;
  onExport: () => void;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  preset,
  onRangeChange,
  onExport,
}) => {
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const showCustom = preset === 'custom';

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as DateRangePreset;
    if (val !== 'custom') {
      onRangeChange(val);
    } else {
      onRangeChange('custom', customFrom, customTo);
    }
  };

  const handleApplyCustom = () => {
    if (customFrom && customTo) {
      onRangeChange('custom', customFrom, customTo);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <select
        value={preset}
        onChange={handlePresetChange}
        aria-label="Date range"
        style={{
          padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db',
          fontSize: 14, background: '#fff',
        }}
      >
        <option value="today">Today</option>
        <option value="7d">Last 7 Days</option>
        <option value="30d">Last 30 Days</option>
        <option value="custom">Custom Range</option>
      </select>

      {showCustom && (
        <>
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            aria-label="From date"
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }}
          />
          <span style={{ color: '#6b7280' }}>—</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            aria-label="To date"
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }}
          />
          <button
            onClick={handleApplyCustom}
            style={{
              padding: '8px 14px', borderRadius: 6, border: 'none',
              background: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: 13,
            }}
          >
            Apply
          </button>
        </>
      )}

      <button
        onClick={onExport}
        aria-label="Export metrics as CSV"
        style={{
          padding: '8px 14px', borderRadius: 6, border: '1px solid #d1d5db',
          background: '#fff', color: '#374151', cursor: 'pointer', fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        📥 Export CSV
      </button>
    </div>
  );
};
