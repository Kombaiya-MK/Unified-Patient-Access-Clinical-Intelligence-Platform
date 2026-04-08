/**
 * Risk Factors Popover Component
 *
 * Shows detailed risk breakdown with contributing factors.
 *
 * @module RiskFactorsPopover
 * @task US_038 TASK_003
 */

import React from 'react';
import type { RiskAssessment } from '../../types/risk.types';

interface RiskFactorsPopoverProps {
  riskAssessment: RiskAssessment;
  appointmentId: number;
  onClose: () => void;
}

const categoryColors = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
};

export const RiskFactorsPopover: React.FC<RiskFactorsPopoverProps> = ({
  riskAssessment,
  onClose,
}) => {
  const color = categoryColors[riskAssessment.category];
  const dialogRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="risk-popover-title"
      tabIndex={-1}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div style={{
        background: '#fff', borderRadius: 8, padding: 24,
        maxWidth: 380, width: '90%', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 id="risk-popover-title" style={{ margin: 0, fontSize: 16 }}>No-Show Risk</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}
          >
            ×
          </button>
        </div>

        <div style={{
          textAlign: 'center', marginBottom: 16, padding: 16,
          background: '#f9fafb', borderRadius: 8,
        }}>
          <div style={{ fontSize: 36, fontWeight: 700, color }}>{riskAssessment.riskScore}%</div>
          <div style={{
            display: 'inline-block', padding: '2px 10px', borderRadius: 12,
            fontSize: 13, fontWeight: 600, backgroundColor: color, color: '#fff', marginTop: 4,
          }}>
            {riskAssessment.category.charAt(0).toUpperCase() + riskAssessment.category.slice(1)} Risk
          </div>
        </div>

        {riskAssessment.factors.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 13, color: '#6b7280', marginBottom: 8, margin: 0 }}>Contributing Factors</h4>
            {riskAssessment.factors.map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 0', borderBottom: i < riskAssessment.factors.length - 1 ? '1px solid #f3f4f6' : 'none',
              }}>
                <span style={{ fontSize: 16 }}>{f.icon}</span>
                <span style={{ flex: 1, fontSize: 13 }}>{f.name}</span>
                {f.contribution > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#ef4444' }}>+{f.contribution}%</span>
                )}
              </div>
            ))}
          </div>
        )}

        <p style={{ fontSize: 11, color: '#9ca3af', margin: '12px 0 0', textAlign: 'center' }}>
          Historical factors only. Model accuracy ~78%.
        </p>
      </div>
    </div>
  );
};
