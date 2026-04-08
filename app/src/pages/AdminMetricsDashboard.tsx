/**
 * Admin Metrics Dashboard Page (SCR-004 Extension)
 *
 * Real-time operational metrics dashboard showing queue stats,
 * system health, charts, and alerts for clinic administrators.
 *
 * @module AdminMetricsDashboard
 * @task US_039 TASK_002
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAdminMetrics } from '../hooks/useAdminMetrics';
import { MetricCard } from '../components/admin-dashboard/MetricCard';
import { SystemHealthPanel } from '../components/admin-dashboard/SystemHealthPanel';
import { AlertsBanner } from '../components/admin-dashboard/AlertsBanner';
import { DateRangeSelector } from '../components/admin-dashboard/DateRangeSelector';
import { DashboardCharts } from '../components/admin-dashboard/DashboardCharts';
import { LiveStatusIndicator } from '../components/admin-dashboard/LiveStatusIndicator';

export const AdminMetricsDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const {
    realtime,
    kpis,
    chartData,
    systemHealth,
    alerts,
    loading,
    error,
    dateRange,
    setDatePreset,
    dismissAlert,
    exportCSV,
    lastUpdated,
  } = useAdminMetrics();

  if (loading && !realtime) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
        Loading dashboard metrics...
      </div>
    );
  }

  const today = realtime?.todayAppointments;
  const totalToday = today
    ? today.scheduled + today.checkedIn + today.completed + today.noShows
    : 0;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      {/* Header */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 24,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Admin Metrics Dashboard</h1>
          <LiveStatusIndicator lastUpdated={lastUpdated} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/admin/dashboard')}
            style={{
              padding: '8px 14px', borderRadius: 6, border: '1px solid #d1d5db',
              background: '#fff', color: '#374151', cursor: 'pointer', fontSize: 13,
            }}
          >
            ← Back to Admin
          </button>
          <span style={{ fontSize: 13, color: '#6b7280' }}>{user?.email}</span>
          <button onClick={logout} style={{
            padding: '8px 14px', borderRadius: 6, border: 'none',
            background: '#374151', color: '#fff', cursor: 'pointer', fontSize: 13,
          }}>
            Logout
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" style={{
          padding: 12, marginBottom: 16, background: '#fef2f2',
          border: '1px solid #fecaca', borderRadius: 8, color: '#991b1b', fontSize: 14,
        }}>
          {error}
        </div>
      )}

      {/* Alerts */}
      <div style={{ marginBottom: 16 }}>
        <AlertsBanner alerts={alerts} onDismiss={dismissAlert} />
      </div>

      {/* Metric Cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16, marginBottom: 24,
      }}>
        <MetricCard
          title="Current Queue"
          value={realtime?.queueSize ?? 0}
          icon="👥"
          subtitle="patients waiting"
        />
        <MetricCard
          title="Avg Wait Time"
          value={`${realtime?.avgWaitTime.toFixed(0) ?? 0} min`}
          icon="⏱️"
          subtitle="target: <15 min"
        />
        <MetricCard
          title="Today's Appointments"
          value={`${today?.completed ?? 0}/${totalToday}`}
          icon="📅"
          subtitle={`${today?.checkedIn ?? 0} checked-in, ${today?.noShows ?? 0} no-shows`}
        />
        <MetricCard
          title="No-Show Rate"
          value={`${realtime?.noShowRate ?? 0}%`}
          icon="⚠️"
          trend={realtime && realtime.noShowRate > 15 ? 'up' : 'stable'}
          trendColor={realtime && realtime.noShowRate > 15 ? '#ef4444' : '#10b981'}
        />
      </div>

      {/* System Health */}
      <div style={{ marginBottom: 24 }}>
        <SystemHealthPanel health={systemHealth} />
      </div>

      {/* Date Range + Export */}
      <div style={{ marginBottom: 16 }}>
        <DateRangeSelector
          preset={dateRange.preset}
          onRangeChange={setDatePreset}
          onExport={exportCSV}
        />
      </div>

      {/* KPIs Summary */}
      {kpis && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12, marginBottom: 24,
        }}>
          <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{kpis.totalAppointments}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Total Appointments</div>
          </div>
          <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{kpis.noShowRate}%</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>No-Show Rate</div>
          </div>
          <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{kpis.avgLeadTimeDays}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Avg Lead Time (days)</div>
          </div>
          <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{kpis.insuranceVerificationSuccessRate}%</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Insurance Verification</div>
          </div>
        </div>
      )}

      {/* Charts */}
      <DashboardCharts data={chartData} />
    </div>
  );
};
