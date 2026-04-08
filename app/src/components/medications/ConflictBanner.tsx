/**
 * Conflict Banner Component
 * @module components/medications/ConflictBanner
 * @description Banner displaying medication conflict severity (red/yellow/green)
 * @epic EP-006
 * @story US-033
 * @task task_001_fe_conflict_alert_interface
 */

import React from 'react';
import type { ConflictResultItem } from '../../types/clinicalProfile.types';

interface ConflictBannerProps {
  conflicts: ConflictResultItem[];
  onViewDetails?: () => void;
}

export const ConflictBanner: React.FC<ConflictBannerProps> = ({ conflicts, onViewDetails }) => {
  if (conflicts.length === 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          backgroundColor: '#D1FAE5',
          color: '#065F46',
          padding: '0.75rem 1rem',
          borderRadius: '0.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>✅ No medication conflicts detected</span>
      </div>
    );
  }

  const maxSeverity = Math.max(...conflicts.map(c => c.severity_level));
  const criticalCount = conflicts.filter(c => c.severity_level >= 4).length;
  const warningCount = conflicts.filter(c => c.severity_level >= 2 && c.severity_level < 4).length;

  const isCritical = maxSeverity >= 4;
  const bgColor = isCritical ? '#FEE2E2' : '#FEF3C7';
  const borderColor = isCritical ? '#EF4444' : '#F59E0B';
  const textColor = isCritical ? '#991B1B' : '#92400E';

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        backgroundColor: bgColor,
        border: `2px solid ${borderColor}`,
        color: textColor,
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <strong style={{ fontSize: '0.875rem' }}>
          {isCritical ? '🚨 CRITICAL' : '⚠️ WARNING'}: {conflicts.length} Medication Conflict{conflicts.length > 1 ? 's' : ''} Detected
        </strong>
        <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
          {criticalCount > 0 && <span>{criticalCount} critical</span>}
          {criticalCount > 0 && warningCount > 0 && <span> · </span>}
          {warningCount > 0 && <span>{warningCount} warning{warningCount > 1 ? 's' : ''}</span>}
        </div>
      </div>
      {onViewDetails && (
        <button
          onClick={onViewDetails}
          style={{
            padding: '0.375rem 0.75rem',
            border: `1px solid ${borderColor}`,
            borderRadius: '0.375rem',
            backgroundColor: 'transparent',
            color: textColor,
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          View Details
        </button>
      )}
    </div>
  );
};
