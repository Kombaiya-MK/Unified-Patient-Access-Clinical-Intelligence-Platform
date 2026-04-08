/**
 * No-Show Risk Badge Component
 *
 * Color-coded badge displaying no-show risk level with dot indicators.
 *
 * @module NoShowRiskBadge
 * @task US_038 TASK_003
 */

import React, { useState, useEffect } from 'react';
import { getAppointmentRisk } from '../../services/risk.service';
import type { RiskAssessment } from '../../types/risk.types';
import { RiskFactorsPopover } from './RiskFactorsPopover';

interface NoShowRiskBadgeProps {
  appointmentId: number;
  compact?: boolean;
}

const categoryConfig = {
  low: { bg: '#10b981', label: 'Low Risk', dots: '●' },
  medium: { bg: '#f59e0b', label: 'Med Risk', dots: '●●' },
  high: { bg: '#ef4444', label: 'High Risk', dots: '●●●' },
};

export const NoShowRiskBadge: React.FC<NoShowRiskBadgeProps> = ({ appointmentId, compact }) => {
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPopover, setShowPopover] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAppointmentRisk(appointmentId).then((data) => {
      if (!cancelled) {
        setRisk(data);
        setLoading(false);
      }
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [appointmentId]);

  if (loading) {
    return <span style={{ display: 'inline-block', width: 60, height: 20, background: '#f3f4f6', borderRadius: 10 }} />;
  }

  if (!risk) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        padding: '2px 8px', borderRadius: 12, fontSize: 11,
        background: '#f3f4f6', color: '#9ca3af',
      }}>
        Not Scored
      </span>
    );
  }

  const config = categoryConfig[risk.category];

  return (
    <>
      <span
        onClick={() => setShowPopover(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowPopover(true); } }}
        role="button"
        tabIndex={0}
        aria-label={`No-show risk: ${risk.riskScore}% ${config.label}`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
          backgroundColor: config.bg, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        {compact ? `${risk.riskScore}%` : `${config.label} ${config.dots}`}
      </span>

      {showPopover && (
        <RiskFactorsPopover
          riskAssessment={risk}
          appointmentId={appointmentId}
          onClose={() => setShowPopover(false)}
        />
      )}
    </>
  );
};
