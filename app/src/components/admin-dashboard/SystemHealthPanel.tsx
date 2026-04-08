/**
 * System Health Panel Component
 *
 * Traffic light indicators for system health metrics.
 *
 * @module SystemHealthPanel
 * @task US_039 TASK_002
 */

import React from 'react';
import type { SystemHealth, HealthStatus } from '../../types/admin-metrics.types';

interface SystemHealthPanelProps {
  health: SystemHealth | null;
}

const statusColors: Record<HealthStatus, string> = {
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#ef4444',
};

interface IndicatorProps {
  label: string;
  value: string;
  status: HealthStatus;
}

const HealthIndicator: React.FC<IndicatorProps> = ({ label, value, status }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px', background: '#f9fafb', borderRadius: 8,
  }}>
    <div
      aria-label={`${label}: ${status}`}
      style={{
        width: 16, height: 16, borderRadius: '50%',
        backgroundColor: statusColors[status],
        flexShrink: 0,
      }}
    />
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{label}</div>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{value}</div>
    </div>
  </div>
);

export const SystemHealthPanel: React.FC<SystemHealthPanelProps> = ({ health }) => {
  if (!health) {
    return (
      <div style={{ padding: 20, background: '#f9fafb', borderRadius: 8 }}>
        <p style={{ color: '#6b7280', fontSize: 14 }}>Loading system health...</p>
      </div>
    );
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 20,
    }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>System Health</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
        <HealthIndicator
          label="API Speed"
          value={`${health.apiResponseTime.value}ms (target: <${health.apiResponseTime.target}ms)`}
          status={health.apiResponseTime.status}
        />
        <HealthIndicator
          label="AI Service"
          value={`${health.aiService.successRate}% success rate`}
          status={health.aiService.status}
        />
        <HealthIndicator
          label="Database"
          value={`${health.database.activeConnections}/${health.database.maxConnections} connections`}
          status={health.database.status}
        />
        <HealthIndicator
          label="Cache"
          value={`${health.cache.hitRate}% hit rate`}
          status={health.cache.status}
        />
      </div>
    </div>
  );
};
