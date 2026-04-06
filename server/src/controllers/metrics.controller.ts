/**
 * Metrics Controller
 *
 * API endpoints for admin dashboard metrics, health, alerts, and CSV export.
 *
 * @module metrics.controller
 * @task US_039 TASK_001
 */

import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { getRealTimeMetrics, getOperationalKPIs, getChartData } from '../services/metrics-aggregation.service';
import { getSystemHealth } from '../services/system-health.service';
import { getActiveAlerts, resolveAlert } from '../services/alert-detection.service';
import logger from '../utils/logger';

/**
 * GET /api/admin/metrics/realtime
 */
export async function getRealtimeMetrics(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const metrics = await getRealTimeMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    logger.error('getRealtimeMetrics error:', error);
    res.status(500).json({ success: false, message: 'Failed to get real-time metrics' });
  }
}

/**
 * GET /api/admin/metrics/kpis?from=&to=
 */
export async function getKPIs(req: AuthRequest, res: Response): Promise<void> {
  try {
    const from = req.query.from as string;
    const to = req.query.to as string;

    if (!from || !to) {
      // Default to last 7 days
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      const kpis = await getOperationalKPIs(
        start.toISOString().split('T')[0],
        end.toISOString().split('T')[0],
      );
      res.json({ success: true, data: kpis });
      return;
    }

    const kpis = await getOperationalKPIs(from, to);
    res.json({ success: true, data: kpis });
  } catch (error) {
    logger.error('getKPIs error:', error);
    res.status(500).json({ success: false, message: 'Failed to get KPIs' });
  }
}

/**
 * GET /api/admin/metrics/chart-data?from=&to=
 */
export async function getChartDataHandler(req: AuthRequest, res: Response): Promise<void> {
  try {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);

    const from = (req.query.from as string) || start.toISOString().split('T')[0];
    const to = (req.query.to as string) || end.toISOString().split('T')[0];

    const data = await getChartData(from, to);
    res.json({ success: true, data });
  } catch (error) {
    logger.error('getChartData error:', error);
    res.status(500).json({ success: false, message: 'Failed to get chart data' });
  }
}

/**
 * GET /api/admin/metrics/system-health
 */
export async function getSystemHealthHandler(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const health = await getSystemHealth();
    res.json({ success: true, data: health });
  } catch (error) {
    logger.error('getSystemHealth error:', error);
    res.status(500).json({ success: false, message: 'Failed to get system health' });
  }
}

/**
 * GET /api/admin/metrics/alerts
 */
export async function getAlertsHandler(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const alerts = await getActiveAlerts();
    res.json({ success: true, data: alerts });
  } catch (error) {
    logger.error('getAlerts error:', error);
    res.status(500).json({ success: false, message: 'Failed to get alerts' });
  }
}

/**
 * POST /api/admin/metrics/alerts/:id/resolve
 */
export async function resolveAlertHandler(req: AuthRequest, res: Response): Promise<void> {
  try {
    const raw = req.params.id;
    const alertId = parseInt(Array.isArray(raw) ? raw[0] : raw, 10);
    if (isNaN(alertId)) {
      res.status(400).json({ success: false, message: 'Invalid alert ID' });
      return;
    }

    const userId = req.user!.userId;
    await resolveAlert(alertId, userId);
    res.json({ success: true, message: 'Alert resolved' });
  } catch (error) {
    logger.error('resolveAlert error:', error);
    res.status(500).json({ success: false, message: 'Failed to resolve alert' });
  }
}

/**
 * POST /api/admin/metrics/export
 * Export metrics as CSV.
 */
export async function exportMetricsCSV(req: AuthRequest, res: Response): Promise<void> {
  try {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    const from = (req.body.from as string) || start.toISOString().split('T')[0];
    const to = (req.body.to as string) || end.toISOString().split('T')[0];

    const kpis = await getOperationalKPIs(from, to);
    const charts = await getChartData(from, to);

    // Build CSV
    const lines: string[] = [];
    lines.push('Metric,Value');
    lines.push(`Total Appointments,${kpis.totalAppointments}`);
    lines.push(`No-Show Rate,${kpis.noShowRate}%`);
    lines.push(`Avg Lead Time (days),${kpis.avgLeadTimeDays}`);
    lines.push(`Insurance Verification Rate,${kpis.insuranceVerificationSuccessRate}%`);
    lines.push('');
    lines.push('Date,Appointments');
    for (const d of charts.dailyVolume) {
      lines.push(`${d.label},${d.value}`);
    }
    lines.push('');
    lines.push('Day,No-Shows');
    for (const d of charts.noShowsByDay) {
      lines.push(`${d.label},${d.value}`);
    }

    const csv = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=metrics_${from}_${to}.csv`);
    res.send(csv);
  } catch (error) {
    logger.error('exportMetricsCSV error:', error);
    res.status(500).json({ success: false, message: 'Failed to export metrics' });
  }
}
