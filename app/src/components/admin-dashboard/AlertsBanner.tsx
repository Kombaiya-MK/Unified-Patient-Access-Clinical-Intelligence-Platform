/**
 * Alerts Banner Component
 *
 * Shows critical and warning alerts at the top of the dashboard.
 *
 * @module AlertsBanner
 * @task US_039 TASK_002
 */

import React from 'react';
import type { MetricsAlert } from '../../types/admin-metrics.types';
import { formatDistanceToNow } from 'date-fns';

interface AlertsBannerProps {
  alerts: MetricsAlert[];
  onDismiss: (id: number) => void;
}

const severityStyles: Record<string, { bg: string; border: string; text: string }> = {
  critical: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
  warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
  info: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
};

export const AlertsBanner: React.FC<AlertsBannerProps> = ({ alerts, onDismiss }) => {
  if (alerts.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {alerts.map((alert) => {
        const style = severityStyles[alert.severity] || severityStyles.info;
        return (
          <div
            key={alert.id}
            role="alert"
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', borderRadius: 8,
              background: style.bg, border: `1px solid ${style.border}`,
            }}
          >
            <span style={{ fontSize: 16 }}>
              {alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : 'ℹ️'}
            </span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: style.text }}>
                {alert.message}
              </span>
              <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>
                {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
              </span>
            </div>
            <button
              onClick={() => onDismiss(alert.id)}
              aria-label="Dismiss alert"
              style={{
                padding: '4px 12px', borderRadius: 4, border: `1px solid ${style.border}`,
                background: 'transparent', color: style.text, cursor: 'pointer', fontSize: 12,
              }}
            >
              Dismiss
            </button>
          </div>
        );
      })}
    </div>
  );
};
