/**
 * Metric Card Component
 *
 * Displays a single metric with value, icon, and trend indicator.
 *
 * @module MetricCard
 * @task US_039 TASK_002
 */

import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendColor?: string;
}

const trendIcons = { up: '↑', down: '↓', stable: '→' };
const defaultTrendColors = { up: '#10b981', down: '#ef4444', stable: '#6b7280' };

export const MetricCard: React.FC<MetricCardProps> = ({
  title, value, icon, subtitle, trend, trendColor,
}) => {
  return (
    <div style={{
      background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb',
      padding: 20, display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        {trend && (
          <span style={{
            fontSize: 14, fontWeight: 600,
            color: trendColor || defaultTrendColors[trend],
          }}>
            {trendIcons[trend]}
          </span>
        )}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: '#111827' }}>{value}</div>
      <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: '#9ca3af' }}>{subtitle}</div>}
    </div>
  );
};
