/**
 * Metrics Aggregation Service
 *
 * Calculates real-time metrics, operational KPIs, and chart data
 * from the database for the admin dashboard.
 *
 * @module metrics-aggregation.service
 * @task US_039 TASK_001
 */

import { pool } from '../config/database';
import type { RealTimeMetrics, OperationalKPIs, MetricsChartData, ChartDataPoint } from '../types/adminMetrics.types';
import logger from '../utils/logger';

/**
 * Get real-time operational metrics for today.
 */
export async function getRealTimeMetrics(): Promise<RealTimeMetrics> {
  try {
    // Current queue size
    const queueResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM appointments
       WHERE appointment_date::date = CURRENT_DATE
         AND status IN ('scheduled', 'confirmed', 'arrived')`,
    );

    // Average wait time (minutes)
    const waitResult = await pool.query(
      `SELECT COALESCE(
         AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60), 0
       )::numeric(8,1) AS avg_wait
       FROM appointments
       WHERE appointment_date::date = CURRENT_DATE
         AND status = 'completed'`,
    );

    // Today's appointment breakdown
    const todayResult = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status IN ('scheduled', 'confirmed'))::int AS scheduled,
         COUNT(*) FILTER (WHERE status = 'arrived')::int AS checked_in,
         COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
         COUNT(*) FILTER (WHERE status = 'no_show')::int AS no_shows,
         COUNT(*)::int AS total
       FROM appointments
       WHERE appointment_date::date = CURRENT_DATE`,
    );

    const today = todayResult.rows[0];
    const total = today.total || 1;

    return {
      queueSize: queueResult.rows[0].count,
      avgWaitTime: parseFloat(waitResult.rows[0].avg_wait) || 0,
      todayAppointments: {
        scheduled: today.scheduled,
        checkedIn: today.checked_in,
        completed: today.completed,
        noShows: today.no_shows,
      },
      noShowRate: Math.round((today.no_shows / total) * 1000) / 10,
    };
  } catch (error) {
    logger.error('getRealTimeMetrics error:', error);
    return {
      queueSize: 0,
      avgWaitTime: 0,
      todayAppointments: { scheduled: 0, checkedIn: 0, completed: 0, noShows: 0 },
      noShowRate: 0,
    };
  }
}

/**
 * Get operational KPIs for a date range.
 */
export async function getOperationalKPIs(startDate: string, endDate: string): Promise<OperationalKPIs> {
  const apptResult = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status = 'no_show')::int AS no_shows,
       COALESCE(AVG(EXTRACT(DAYS FROM appointment_date - created_at)), 0)::numeric(8,1) AS avg_lead_time
     FROM appointments
     WHERE appointment_date::date BETWEEN $1 AND $2`,
    [startDate, endDate],
  );

  const appt = apptResult.rows[0];
  const total = appt.total || 1;

  // Insurance verification success rate
  let insuranceRate = 0;
  try {
    const insResult = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'active')::int AS success,
         COUNT(*)::int AS total
       FROM insurance_verifications
       WHERE created_at::date BETWEEN $1 AND $2`,
      [startDate, endDate],
    );
    const insTotal = insResult.rows[0].total || 1;
    insuranceRate = Math.round((insResult.rows[0].success / insTotal) * 1000) / 10;
  } catch {
    // Table may not exist yet
  }

  return {
    totalAppointments: appt.total,
    noShowRate: Math.round((appt.no_shows / total) * 1000) / 10,
    avgLeadTimeDays: parseFloat(appt.avg_lead_time) || 0,
    insuranceVerificationSuccessRate: insuranceRate,
    patientSatisfactionScore: null, // Not implemented in MVP
  };
}

/**
 * Get chart data for the dashboard.
 */
export async function getChartData(startDate: string, endDate: string): Promise<MetricsChartData> {
  // Daily appointment volume
  const dailyResult = await pool.query(
    `SELECT appointment_date::date AS date, COUNT(*)::int AS count
     FROM appointments
     WHERE appointment_date::date BETWEEN $1 AND $2
     GROUP BY appointment_date::date
     ORDER BY date`,
    [startDate, endDate],
  );

  const dailyVolume: ChartDataPoint[] = dailyResult.rows.map((r) => ({
    label: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: r.count,
  }));

  // No-shows by day of week
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const noshowResult = await pool.query(
    `SELECT EXTRACT(DOW FROM appointment_date)::int AS dow, COUNT(*)::int AS count
     FROM appointments
     WHERE status = 'no_show'
       AND appointment_date::date BETWEEN $1 AND $2
     GROUP BY dow ORDER BY dow`,
    [startDate, endDate],
  );

  const noShowsByDay: ChartDataPoint[] = dayNames.map((name, i) => {
    const found = noshowResult.rows.find((r) => r.dow === i);
    return { label: name, value: found ? found.count : 0 };
  });

  // Appointment types distribution
  const typesResult = await pool.query(
    `SELECT COALESCE(appointment_type, 'other') AS type, COUNT(*)::int AS count
     FROM appointments
     WHERE appointment_date::date BETWEEN $1 AND $2
     GROUP BY appointment_type
     ORDER BY count DESC`,
    [startDate, endDate],
  );

  const appointmentTypes: ChartDataPoint[] = typesResult.rows.map((r) => ({
    label: r.type,
    value: r.count,
  }));

  return { dailyVolume, noShowsByDay, appointmentTypes };
}
