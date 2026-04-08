/**
 * Admin Metrics API Service (Frontend)
 *
 * @module admin-metrics.service
 * @task US_039 TASK_002
 */

import api from './api';
import type {
  RealTimeMetrics,
  OperationalKPIs,
  SystemHealth,
  MetricsAlert,
  MetricsChartData,
} from '../types/admin-metrics.types';

export async function fetchRealTimeMetrics(): Promise<RealTimeMetrics> {
  const res = await api.get('/admin/metrics/realtime');
  return res.data.data;
}

export async function fetchKPIs(from: string, to: string): Promise<OperationalKPIs> {
  const res = await api.get('/admin/metrics/kpis', { params: { from, to } });
  return res.data.data;
}

export async function fetchChartData(from: string, to: string): Promise<MetricsChartData> {
  const res = await api.get('/admin/metrics/chart-data', { params: { from, to } });
  return res.data.data;
}

export async function fetchSystemHealth(): Promise<SystemHealth> {
  const res = await api.get('/admin/metrics/system-health');
  return res.data.data;
}

export async function fetchAlerts(): Promise<MetricsAlert[]> {
  const res = await api.get('/admin/metrics/alerts');
  return res.data.data;
}

export async function resolveAlert(alertId: number): Promise<void> {
  await api.post(`/admin/metrics/alerts/${alertId}/resolve`);
}

export async function exportMetricsCSV(from: string, to: string): Promise<void> {
  const res = await api.post('/admin/metrics/export', { from, to }, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = `metrics_${from}_${to}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
