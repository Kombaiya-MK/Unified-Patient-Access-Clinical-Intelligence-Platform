/**
 * Admin Metrics Hook
 *
 * Custom hook for fetching and managing admin dashboard metrics data.
 * Polls real-time metrics every 30 seconds.
 *
 * @module useAdminMetrics
 * @task US_039 TASK_002
 */

import { useState, useEffect, useCallback } from 'react';
import {
  fetchRealTimeMetrics,
  fetchKPIs,
  fetchChartData,
  fetchSystemHealth,
  fetchAlerts,
  resolveAlert as resolveAlertApi,
  exportMetricsCSV,
} from '../services/admin-metrics.service';
import type {
  RealTimeMetrics,
  OperationalKPIs,
  SystemHealth,
  MetricsAlert,
  MetricsChartData,
  DateRangePreset,
} from '../types/admin-metrics.types';

interface UseAdminMetricsResult {
  realtime: RealTimeMetrics | null;
  kpis: OperationalKPIs | null;
  chartData: MetricsChartData | null;
  systemHealth: SystemHealth | null;
  alerts: MetricsAlert[];
  loading: boolean;
  error: string | null;
  dateRange: { from: string; to: string; preset: DateRangePreset };
  setDatePreset: (preset: DateRangePreset, customFrom?: string, customTo?: string) => void;
  dismissAlert: (id: number) => void;
  exportCSV: () => void;
  lastUpdated: Date | null;
}

function getDateRange(preset: DateRangePreset): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  switch (preset) {
    case 'today':
      break;
    case '7d':
      from.setDate(from.getDate() - 7);
      break;
    case '30d':
      from.setDate(from.getDate() - 30);
      break;
    default:
      from.setDate(from.getDate() - 7);
  }
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

export function useAdminMetrics(): UseAdminMetricsResult {
  const [realtime, setRealtime] = useState<RealTimeMetrics | null>(null);
  const [kpis, setKpis] = useState<OperationalKPIs | null>(null);
  const [chartData, setChartData] = useState<MetricsChartData | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [alerts, setAlerts] = useState<MetricsAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPresetState] = useState<DateRangePreset>('7d');
  const [dateFrom, setDateFrom] = useState(() => getDateRange('7d').from);
  const [dateTo, setDateTo] = useState(() => getDateRange('7d').to);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = useCallback(async (from: string, to: string) => {
    try {
      setLoading(true);
      const [rt, k, cd, sh, al] = await Promise.all([
        fetchRealTimeMetrics(),
        fetchKPIs(from, to),
        fetchChartData(from, to),
        fetchSystemHealth(),
        fetchAlerts(),
      ]);
      setRealtime(rt);
      setKpis(k);
      setChartData(cd);
      setSystemHealth(sh);
      setAlerts(al);
      setError(null);
      setLastUpdated(new Date());
    } catch {
      setError('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(dateFrom, dateTo);
  }, [dateFrom, dateTo, loadData]);

  // Poll real-time metrics every 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const rt = await fetchRealTimeMetrics();
        setRealtime(rt);
        setLastUpdated(new Date());
      } catch {
        // non-critical polling failure
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const setDatePreset = useCallback((p: DateRangePreset, customFrom?: string, customTo?: string) => {
    setPresetState(p);
    if (p === 'custom' && customFrom && customTo) {
      setDateFrom(customFrom);
      setDateTo(customTo);
    } else {
      const range = getDateRange(p);
      setDateFrom(range.from);
      setDateTo(range.to);
    }
  }, []);

  const dismissAlert = useCallback(async (id: number) => {
    try {
      await resolveAlertApi(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // non-critical
    }
  }, []);

  const handleExportCSV = useCallback(async () => {
    try {
      await exportMetricsCSV(dateFrom, dateTo);
    } catch {
      setError('Export failed');
    }
  }, [dateFrom, dateTo]);

  return {
    realtime,
    kpis,
    chartData,
    systemHealth,
    alerts,
    loading,
    error,
    dateRange: { from: dateFrom, to: dateTo, preset },
    setDatePreset,
    dismissAlert,
    exportCSV: handleExportCSV,
    lastUpdated,
  };
}
