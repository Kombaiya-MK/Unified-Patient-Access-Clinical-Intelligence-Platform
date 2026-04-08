/**
 * Alert Detection Service
 *
 * Detects system issues and manages alert lifecycle.
 *
 * @module alert-detection.service
 * @task US_039 TASK_001
 */

import { pool } from '../config/database';
import redisClient from '../utils/redisClient';
import type { MetricsAlert } from '../types/adminMetrics.types';
import logger from '../utils/logger';

/**
 * Get all active (unresolved) alerts.
 */
export async function getActiveAlerts(): Promise<MetricsAlert[]> {
  const result = await pool.query(
    `SELECT * FROM metrics_alerts
     WHERE resolved_at IS NULL
     ORDER BY created_at DESC`,
  );
  return result.rows;
}

/**
 * Create a new alert if one of this type doesn't already exist unresolved.
 */
export async function createAlert(
  alertType: string,
  severity: 'critical' | 'warning' | 'info',
  message: string,
  details: Record<string, unknown> = {},
): Promise<void> {
  // Check if unreolved alert of same type exists
  const existing = await pool.query(
    `SELECT id FROM metrics_alerts
     WHERE alert_type = $1 AND resolved_at IS NULL`,
    [alertType],
  );

  if (existing.rows.length > 0) return;

  await pool.query(
    `INSERT INTO metrics_alerts (alert_type, severity, message, details)
     VALUES ($1, $2, $3, $4)`,
    [alertType, severity, message, JSON.stringify(details)],
  );

  logger.warn(`System alert created: [${severity}] ${alertType} - ${message}`);
}

/**
 * Resolve an alert.
 */
export async function resolveAlert(alertId: number, userId: number): Promise<void> {
  await pool.query(
    `UPDATE metrics_alerts SET resolved_at = NOW(), resolved_by = $1 WHERE id = $2`,
    [userId, alertId],
  );
}

/**
 * Run detection checks for all monitored thresholds.
 */
export async function detectAlerts(): Promise<void> {
  // Check Redis health
  try {
    await redisClient.get('health-check');
  } catch {
    await createAlert('redis_down', 'critical', 'Redis connection failed - cache unavailable');
  }

  // Check for slow database queries
  try {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS slow_count
       FROM pg_stat_activity
       WHERE state = 'active'
         AND NOW() - query_start > INTERVAL '5 seconds'
         AND query NOT LIKE '%pg_stat_activity%'`,
    );
    if (result.rows[0].slow_count > 0) {
      await createAlert(
        'db_slow_queries',
        'warning',
        `${result.rows[0].slow_count} slow queries detected (>5s)`,
        { count: result.rows[0].slow_count },
      );
    }
  } catch {
    // pg_stat_activity may not be accessible
  }
}
