/**
 * ValidationIndicator Component
 * 
 * File: app/src/components/intake/ValidationIndicator.tsx
 * Task: US_027 TASK_003 - Frontend Validation Indicators
 * 
 * Shows validation state icon next to user messages:
 * pending (spinner), validated (green check), needs_clarification (yellow info), error (red).
 */
import React from 'react';
import type { ValidationState } from '../../types/aiIntake.types';

interface ValidationIndicatorProps {
  state: ValidationState;
}

const stateConfig: Record<ValidationState, { icon: string; color: string; title: string }> = {
  pending: { icon: '⏳', color: '#9ca3af', title: 'Validating...' },
  validated: { icon: '✓', color: '#10b981', title: 'Validated' },
  needs_clarification: { icon: 'ℹ', color: '#f59e0b', title: 'Needs clarification' },
  error: { icon: '✕', color: '#ef4444', title: 'Validation error' },
};

export const ValidationIndicator: React.FC<ValidationIndicatorProps> = ({ state }) => {
  const config = stateConfig[state];

  return (
    <span
      className="validation-indicator"
      title={config.title}
      aria-label={config.title}
      role="status"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: `${config.color}20`,
        color: config.color,
        fontSize: '12px',
        fontWeight: 700,
        animation: state === 'pending' ? 'pulse 1.5s ease-in-out infinite' : 'fadeIn 200ms ease',
      }}
    >
      {config.icon}
    </span>
  );
};
