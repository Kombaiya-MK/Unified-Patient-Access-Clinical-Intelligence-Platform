/**
 * Severity Indicator Component
 * @module components/medications/SeverityIndicator
 * @description Visual severity scale indicator (1-5)
 * @epic EP-006
 * @story US-033
 */

import React from 'react';

interface SeverityIndicatorProps {
  level: number;
  showLabel?: boolean;
}

const SEVERITY_CONFIG: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Minor', color: '#065F46', bg: '#D1FAE5' },
  2: { label: 'Moderate', color: '#92400E', bg: '#FEF3C7' },
  3: { label: 'Significant', color: '#9A3412', bg: '#FFEDD5' },
  4: { label: 'Severe', color: '#991B1B', bg: '#FEE2E2' },
  5: { label: 'Critical', color: '#7F1D1D', bg: '#FEE2E2' },
};

export const SeverityIndicator: React.FC<SeverityIndicatorProps> = ({ level, showLabel = true }) => {
  const config = SEVERITY_CONFIG[Math.min(Math.max(level, 1), 5)];

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            style={{
              width: '0.5rem',
              height: '1rem',
              borderRadius: '2px',
              backgroundColor: i <= level ? config.color : '#E5E7EB',
            }}
          />
        ))}
      </div>
      {showLabel && (
        <span style={{
          padding: '0.125rem 0.375rem',
          borderRadius: '0.25rem',
          fontSize: '0.6875rem',
          fontWeight: 600,
          backgroundColor: config.bg,
          color: config.color,
        }}>
          {config.label}
        </span>
      )}
    </div>
  );
};
