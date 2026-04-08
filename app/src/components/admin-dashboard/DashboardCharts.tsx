/**
 * Dashboard Charts Component
 *
 * Renders daily appointments, no-shows by weekday, and appointment types
 * using simple SVG-based charts (no external chart library dependency).
 *
 * @module DashboardCharts
 * @task US_039 TASK_002
 */

import React from 'react';
import type { MetricsChartData } from '../../types/admin-metrics.types';

interface DashboardChartsProps {
  data: MetricsChartData | null;
}

const BarChart: React.FC<{ data: { label: string; value: number }[]; title: string; color: string }> = ({
  data, title, color,
}) => {
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 20 }}>
      <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600 }}>{title}</h4>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: '#6b7280' }}>{d.value}</span>
            <div
              title={`${d.label}: ${d.value}`}
              style={{
                width: '100%', maxWidth: 40,
                height: `${Math.max(4, (d.value / maxVal) * 100)}px`,
                backgroundColor: color, borderRadius: '4px 4px 0 0',
              }}
            />
            <span style={{ fontSize: 10, color: '#9ca3af', whiteSpace: 'nowrap' }}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const PieChart: React.FC<{ data: { label: string; value: number }[]; title: string }> = ({ data, title }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const colors = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#6b7280'];

  return (
    <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 20 }}>
      <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600 }}>{title}</h4>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.map((d, i) => {
            const pct = Math.round((d.value / total) * 100);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 12, height: 12, borderRadius: 2,
                  backgroundColor: colors[i % colors.length],
                }} />
                <span style={{ fontSize: 13 }}>{d.label}</span>
                <span style={{ fontSize: 12, color: '#6b7280' }}>{pct}% ({d.value})</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ data }) => {
  if (!data) {
    return <div style={{ padding: 20, color: '#6b7280' }}>Loading charts...</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
      <BarChart data={data.dailyVolume} title="Daily Appointments" color="#3b82f6" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <BarChart data={data.noShowsByDay} title="No-Shows by Weekday" color="#ef4444" />
        <PieChart data={data.appointmentTypes} title="Appointment Types" />
      </div>
    </div>
  );
};
