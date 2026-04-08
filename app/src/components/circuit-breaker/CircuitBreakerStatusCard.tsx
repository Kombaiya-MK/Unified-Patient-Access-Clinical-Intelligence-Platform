/**
 * CircuitBreakerStatusCard
 *
 * Displays per-service circuit breaker state with colour-coded badge,
 * failure-rate progress bar, last-updated timestamp and "View Logs" action.
 *
 * @module components/circuit-breaker/CircuitBreakerStatusCard
 * @task US_041 TASK_002
 */

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { CircuitBreakerStatus, CircuitBreakerState } from '../../types/circuit-breaker.types';

interface Props {
  status: CircuitBreakerStatus;
  onViewLogs: () => void;
}

const SERVICE_LABELS: Record<string, string> = {
  'ai-intake': 'AI Intake',
  'document-extraction': 'Document Extraction',
  'medical-coding': 'Medical Coding',
  'medication-conflicts': 'Medication Conflicts',
};

interface StateStyle {
  bg: string;
  border: string;
  text: string;
  badgeBg: string;
  dot: string;
  label: string;
  barBg: string;
}

const STATE_STYLES: Record<CircuitBreakerState, StateStyle> = {
  closed: {
    bg: '#E6F9EF',
    border: '#CCF2DF',
    text: '#007A3D',
    badgeBg: '#00A145',
    dot: '●',
    label: 'Closed',
    barBg: '#00A145',
  },
  'half-open': {
    bg: '#FFF2E6',
    border: '#FFE5CC',
    text: '#CC6600',
    badgeBg: '#FF8800',
    dot: '●●',
    label: 'Half-Open',
    barBg: '#FF8800',
  },
  open: {
    bg: '#FCE8EA',
    border: '#F8D7DA',
    text: '#A02A2A',
    badgeBg: '#DC3545',
    dot: '●●●',
    label: 'Open',
    barBg: '#DC3545',
  },
};

export const CircuitBreakerStatusCard: React.FC<Props> = ({ status, onViewLogs }) => {
  const style = STATE_STYLES[status.state];
  const label = SERVICE_LABELS[status.service] || status.service;

  return (
    <div
      role="region"
      aria-label={`${label} circuit breaker status: ${style.label}`}
      style={{
        padding: 16,
        borderRadius: 8,
        border: `1px solid ${style.border}`,
        backgroundColor: style.bg,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>{label}</h4>
        <span
          aria-label={`Status: ${style.label}`}
          style={{
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            color: '#fff',
            backgroundColor: style.badgeBg,
            whiteSpace: 'nowrap',
          }}
        >
          {style.label} {style.dot}
        </span>
      </div>

      {/* Failure rate bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
          <span style={{ color: '#6b7280' }}>Failure Rate</span>
          <span style={{ color: style.text, fontWeight: 500 }}>{status.failureRate.toFixed(1)}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={status.failureRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Failure rate: ${status.failureRate.toFixed(1)}%`}
          style={{ width: '100%', height: 6, borderRadius: 3, backgroundColor: '#e5e7eb' }}
        >
          <div
            style={{
              width: `${Math.min(status.failureRate, 100)}%`,
              height: 6,
              borderRadius: 3,
              backgroundColor: style.barBg,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#6b7280' }}>
        <span>
          Updated{' '}
          {formatDistanceToNow(new Date(status.lastStateChange), { addSuffix: true })}
        </span>
        <button
          type="button"
          onClick={onViewLogs}
          aria-label={`View logs for ${label}`}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: 11,
            color: '#0066CC',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          View Logs
        </button>
      </div>
    </div>
  );
};
