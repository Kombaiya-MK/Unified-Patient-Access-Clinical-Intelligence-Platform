/**
 * LimitedFunctionalityBanner
 *
 * Yellow warning banner rendered at the top of AI-enabled pages when
 * one or more circuit breakers are open. Lists affected services,
 * can be dismissed (session-scoped), and auto-reappears on new opens.
 *
 * @module components/circuit-breaker/LimitedFunctionalityBanner
 * @task US_041 TASK_002
 */

import React, { useState, useEffect, useRef } from 'react';
import { useCircuitBreakerStatus } from '../../hooks/useCircuitBreakerStatus';

const SESSION_KEY = 'circuit-breaker-banner-dismissed';

const SERVICE_LABELS: Record<string, string> = {
  'ai-intake': 'AI Intake',
  'document-extraction': 'Document Extraction',
  'medical-coding': 'Medical Coding',
  'medication-conflicts': 'Medication Conflicts',
};

export const LimitedFunctionalityBanner: React.FC = () => {
  const { hasOpenCircuits, openServices } = useCircuitBreakerStatus();
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  });
  const [showToast, setShowToast] = useState(false);
  const prevOpenRef = useRef(hasOpenCircuits);

  useEffect(() => {
    if (!hasOpenCircuits) {
      // Detect recovery: was open, now closed → show toast
      if (prevOpenRef.current) {
        setShowToast(true);
      }
      setDismissed(false);
      sessionStorage.removeItem(SESSION_KEY);
    } else if (!prevOpenRef.current && hasOpenCircuits) {
      // New circuits opened after previous recovery — re-show
      setDismissed(false);
      sessionStorage.removeItem(SESSION_KEY);
    }
    prevOpenRef.current = hasOpenCircuits;
  }, [hasOpenCircuits]);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(SESSION_KEY, 'true');
  };

  if (!hasOpenCircuits || dismissed) {
    return showToast ? (
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 1100,
          backgroundColor: '#E6F9EF',
          border: '1px solid #CCF2DF',
          borderRadius: 8,
          padding: '12px 16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
          fontSize: 13,
          color: '#007A3D',
          fontWeight: 500,
        }}
      >
        ✓ AI services have recovered and are fully operational.
      </div>
    ) : null;
  }

  return (
    <div
      role="alert"
      style={{
        backgroundColor: '#FFF2E6',
        borderLeft: '4px solid #FF8800',
        padding: '12px 16px',
        marginBottom: 16,
        borderRadius: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        {/* Warning icon */}
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="#FF8800"
          style={{ width: 20, height: 20, flexShrink: 0, marginTop: 2 }}
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>

        {/* Content */}
        <div style={{ marginLeft: 12, flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#CC6600' }}>
            Limited Functionality — AI Services Temporarily Unavailable
          </h3>
          <div style={{ marginTop: 6, fontSize: 13, color: '#CC6600' }}>
            <p style={{ margin: 0 }}>The following AI features are currently unavailable:</p>
            <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
              {openServices.map((svc) => (
                <li key={svc}>{SERVICE_LABELS[svc] || svc}</li>
              ))}
            </ul>
            <p style={{ margin: '4px 0 0' }}>You can still complete your task using fallback options.</p>
          </div>
        </div>

        {/* Dismiss */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss banner"
          style={{
            background: 'none',
            border: 'none',
            marginLeft: 8,
            cursor: 'pointer',
            color: '#CC6600',
            fontSize: 16,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};
