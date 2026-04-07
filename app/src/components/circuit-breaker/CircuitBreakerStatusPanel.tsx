/**
 * CircuitBreakerStatusPanel
 *
 * Admin dashboard section showing all AI-service circuit breakers
 * in a responsive grid (1 col mobile, 2 col tablet, 4 col desktop).
 * Includes loading skeleton and a "View Logs" modal trigger.
 *
 * @module components/circuit-breaker/CircuitBreakerStatusPanel
 * @task US_041 TASK_002
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CircuitBreakerStatusCard } from './CircuitBreakerStatusCard';
import { useCircuitBreakerStatus } from '../../hooks/useCircuitBreakerStatus';
import { getCircuitBreakerLogs } from '../../services/circuit-breaker.service';
import type { CircuitBreakerLog } from '../../types/circuit-breaker.types';

export const CircuitBreakerStatusPanel: React.FC = () => {
  const { statuses, loading, error } = useCircuitBreakerStatus();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [logs, setLogs] = useState<CircuitBreakerLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Focus trap for logs modal
  useEffect(() => {
    if (!selectedService || !modalRef.current) return;
    const modal = modalRef.current;
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableEls = modal.querySelectorAll<HTMLElement>(focusableSelector);
    if (focusableEls.length > 0) {
      focusableEls[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseLogs();
        return;
      }
      if (e.key !== 'Tab') return;
      const currentFocusable = modal.querySelectorAll<HTMLElement>(focusableSelector);
      if (currentFocusable.length === 0) return;
      const first = currentFocusable[0];
      const last = currentFocusable[currentFocusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedService]);

  const handleViewLogs = useCallback(async (service: string) => {
    triggerRef.current = document.activeElement as HTMLButtonElement;
    setSelectedService(service);
    setLogsLoading(true);
    try {
      const data = await getCircuitBreakerLogs(service);
      setLogs(data);
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const handleCloseLogs = useCallback(() => {
    setSelectedService(null);
    setLogs([]);
    triggerRef.current?.focus();
  }, []);

  if (loading) {
    return (
      <section aria-label="AI Service Circuit Breakers" style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
          AI Service Circuit Breakers
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              aria-hidden="true"
              style={{
                height: 130,
                borderRadius: 8,
                backgroundColor: '#f3f4f6',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section aria-label="AI Service Circuit Breakers" style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
          AI Service Circuit Breakers
        </h3>
        <div
          style={{
            backgroundColor: '#E6F3F9',
            border: '1px solid #CCE7F4',
            borderRadius: 8,
            padding: '12px 16px',
          }}
        >
          <p style={{ margin: 0, color: '#0077B6', fontSize: 13 }}>
            Circuit breaker monitoring will be available once backend endpoints are deployed.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="AI Service Circuit Breakers" style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
        AI Service Circuit Breakers
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {statuses.map((s) => (
          <CircuitBreakerStatusCard
            key={s.service}
            status={s}
            onViewLogs={() => handleViewLogs(s.service)}
          />
        ))}
      </div>

      {/* Logs Modal */}
      {selectedService && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Logs for ${selectedService}`}
          onClick={handleCloseLogs}
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 1000,
          }}
        >
          <div
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderRadius: 8,
              padding: 24,
              maxWidth: 560,
              width: '90%',
              maxHeight: '70vh',
              overflowY: 'auto',
              boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>
                {selectedService} — Event Logs
              </h4>
              <button
                type="button"
                onClick={handleCloseLogs}
                aria-label="Close logs"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 18,
                  cursor: 'pointer',
                  color: '#6b7280',
                }}
              >
                ✕
              </button>
            </div>

            {logsLoading ? (
              <p style={{ color: '#6b7280', fontSize: 13 }}>Loading logs…</p>
            ) : logs.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: 13 }}>No logs available.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: '#374151' }}>
                      Event
                    </th>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: '#374151' }}>
                      Timestamp
                    </th>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: '#374151' }}>
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '6px 8px', color: '#111827' }}>{log.event}</td>
                      <td style={{ padding: '6px 8px', color: '#6b7280' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding: '6px 8px', color: '#6b7280' }}>{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
