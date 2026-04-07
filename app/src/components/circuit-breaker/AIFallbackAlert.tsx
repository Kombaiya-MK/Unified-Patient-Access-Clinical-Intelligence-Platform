/**
 * AIFallbackAlert
 *
 * Inline info alert displayed inside AI feature components when the
 * corresponding circuit breaker is open and fallback mode is active.
 *
 * @module components/circuit-breaker/AIFallbackAlert
 * @task US_041 TASK_002
 */

import React from 'react';
import type { CircuitBreakerServiceId } from '../../types/circuit-breaker.types';

interface Props {
  service: CircuitBreakerServiceId;
  isActive: boolean;
}

interface FallbackConfig {
  icon: string;
  title: string;
  message: string;
}

const FALLBACK_MESSAGES: Record<CircuitBreakerServiceId, FallbackConfig> = {
  'ai-intake': {
    icon: '💬',
    title: 'AI Chat Unavailable',
    message:
      'The AI-powered intake assistant is temporarily unavailable. Please complete the appointment form manually.',
  },
  'document-extraction': {
    icon: '📄',
    title: 'Processing Delayed',
    message:
      'Document extraction has been queued and will be processed when the AI service recovers.',
  },
  'medical-coding': {
    icon: '🏥',
    title: 'AI Coding Unavailable',
    message:
      'AI-powered medical coding suggestions are temporarily unavailable. Please use the manual coding interface.',
  },
  'medication-conflicts': {
    icon: '💊',
    title: 'Using Basic Validation',
    message:
      'Advanced AI conflict detection is unavailable. Using basic rule-based validation.',
  },
};

export const AIFallbackAlert: React.FC<Props> = ({ service, isActive }) => {
  if (!isActive) return null;

  const config = FALLBACK_MESSAGES[service];

  return (
    <div
      role="alert"
      style={{
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: 8,
        padding: '12px 16px',
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <span aria-hidden="true" style={{ fontSize: 22, marginRight: 12, lineHeight: 1 }}>
          {config.icon}
        </span>
        <div>
          <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1e3a5f' }}>
            {config.title}
          </h4>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#1d4ed8' }}>
            {config.message}
          </p>
        </div>
      </div>
    </div>
  );
};
