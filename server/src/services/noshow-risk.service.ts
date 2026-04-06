/**
 * No-Show Risk Service
 *
 * Calculates no-show risk scores using a weighted factor model.
 * Implements the scoring algorithm in TypeScript for the MVP.
 * Stores results in the appointments table.
 *
 * @module noshow-risk.service
 * @task US_038 TASK_002
 */

import { pool } from '../config/database';
import { mlConfig } from '../config/ml-config';
import { logAuditEntry } from '../utils/auditLogger';
import { AuditAction } from '../types/audit.types';
import { ApiError } from '../types';
// logger available for future debugging
import type { RiskAssessment, RiskFactor } from '../types/risk.types';

function categorize(score: number): 'low' | 'medium' | 'high' {
  if (score < mlConfig.thresholds.low) return 'low';
  if (score > mlConfig.thresholds.high) return 'high';
  return 'medium';
}

/**
 * Calculate no-show risk score for an appointment.
 */
export async function calculateRiskScore(appointmentId: number): Promise<RiskAssessment> {
  // Fetch appointment + patient data
  const apptResult = await pool.query(
    `SELECT a.id, a.patient_id, a.appointment_date, a.created_at AS booking_date,
            a.appointment_type, a.status,
            pp.date_of_birth, pp.has_insurance_issue,
            u.first_name
     FROM appointments a
     JOIN patient_profiles pp ON a.patient_id = pp.id
     JOIN users u ON pp.user_id = u.id
     WHERE a.id = $1`,
    [appointmentId],
  );

  if (apptResult.rows.length === 0) {
    throw new ApiError(404, 'Appointment not found');
  }

  const appt = apptResult.rows[0];
  const patientId = appt.patient_id;

  // Get patient appointment history
  const historyResult = await pool.query(
    `SELECT
       COUNT(*)::int AS total_appointments,
       COUNT(*) FILTER (WHERE status = 'no_show')::int AS noshow_count,
       MAX(CASE WHEN status = 'no_show' THEN appointment_date END) AS last_noshow_date
     FROM appointments
     WHERE patient_id = $1 AND id != $2
       AND status IN ('completed', 'no_show', 'cancelled')`,
    [patientId, appointmentId],
  );

  const history = historyResult.rows[0];
  const totalAppointments: number = history.total_appointments || 0;
  const noshowCount: number = history.noshow_count || 0;

  // Edge case: new patient with no history
  if (totalAppointments === 0) {
    const assessment: RiskAssessment = {
      riskScore: mlConfig.defaults.newPatientRisk,
      category: 'low',
      calculatedAt: new Date().toISOString(),
      factors: [{ name: 'New Patient - Baseline Risk', contribution: mlConfig.defaults.newPatientRisk, icon: '👤' }],
    };

    await saveRiskScore(appointmentId, assessment);
    return assessment;
  }

  // Calculate risk factors
  const factors: RiskFactor[] = [];
  let rawScore = 0;

  // Factor 1: Previous no-show rate (largest weight)
  const noshowRate = noshowCount / totalAppointments;
  const noshowContribution = Math.round(noshowRate * mlConfig.weights.previousNoshowRate * 2);
  if (noshowContribution > 0) {
    factors.push({
      name: `${noshowCount} no-show${noshowCount > 1 ? 's' : ''} in ${totalAppointments} appointments`,
      contribution: noshowContribution,
      icon: '⚠️',
    });
    rawScore += noshowContribution;
  }

  // Factor 2: Recency of last no-show
  if (history.last_noshow_date) {
    const daysSinceNoshow = Math.floor(
      (Date.now() - new Date(history.last_noshow_date).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSinceNoshow < 90) {
      const recencyContribution = Math.round(mlConfig.weights.recency * (1 - daysSinceNoshow / 90));
      if (recencyContribution > 0) {
        factors.push({
          name: `Recent no-show ${daysSinceNoshow} days ago`,
          contribution: recencyContribution,
          icon: '📅',
        });
        rawScore += recencyContribution;
      }
    }
  }

  // Factor 3: Day of week (weekends higher risk)
  const apptDate = new Date(appt.appointment_date);
  const dayOfWeek = apptDate.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    const weekendContribution = mlConfig.weights.dayOfWeek;
    factors.push({
      name: 'Weekend appointment',
      contribution: weekendContribution,
      icon: '📅',
    });
    rawScore += weekendContribution;
  }

  // Factor 4: Lead time (long lead times = higher risk)
  const leadTimeDays = Math.floor(
    (apptDate.getTime() - new Date(appt.booking_date).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (leadTimeDays > 14) {
    const leadContribution = Math.min(mlConfig.weights.leadTime, Math.round(leadTimeDays / 7));
    factors.push({
      name: `Booked ${leadTimeDays} days in advance`,
      contribution: leadContribution,
      icon: '🗓️',
    });
    rawScore += leadContribution;
  }

  // Factor 5: Insurance issue
  if (appt.has_insurance_issue) {
    factors.push({
      name: 'Insurance issue detected',
      contribution: mlConfig.weights.insuranceIssue,
      icon: '💰',
    });
    rawScore += mlConfig.weights.insuranceIssue;
  }

  // Factor 6: Time of day (early morning / late evening higher)
  const hour = apptDate.getHours();
  if (hour < 8 || hour >= 17) {
    const timeContribution = mlConfig.weights.timeOfDay;
    factors.push({
      name: hour < 8 ? 'Early morning appointment' : 'Late afternoon appointment',
      contribution: timeContribution,
      icon: '🕐',
    });
    rawScore += timeContribution;
  }

  // Clamp score between min and 100
  let finalScore = Math.max(mlConfig.defaults.minRisk, Math.min(100, rawScore));

  // Perfect attendance floor
  if (noshowCount === 0 && totalAppointments >= 10) {
    finalScore = mlConfig.defaults.minRisk;
    factors.length = 0;
    factors.push({
      name: 'Reliable Patient - Perfect Attendance',
      contribution: 0,
      icon: '✅',
    });
  }

  // Sort factors by contribution descending, keep top 3
  factors.sort((a, b) => b.contribution - a.contribution);
  const topFactors = factors.slice(0, 3);

  const assessment: RiskAssessment = {
    riskScore: finalScore,
    category: categorize(finalScore),
    calculatedAt: new Date().toISOString(),
    factors: topFactors,
  };

  await saveRiskScore(appointmentId, assessment);
  return assessment;
}

async function saveRiskScore(appointmentId: number, assessment: RiskAssessment): Promise<void> {
  await pool.query(
    `UPDATE appointments
     SET no_show_risk_score = $1,
         risk_category = $2,
         risk_calculated_at = NOW(),
         risk_factors = $3
     WHERE id = $4`,
    [assessment.riskScore, assessment.category, JSON.stringify(assessment.factors), appointmentId],
  );

  await logAuditEntry({
    action: AuditAction.UPDATE,
    table_name: 'appointments',
    record_id: String(appointmentId),
    new_values: { risk_score: assessment.riskScore, category: assessment.category },
  });
}

/**
 * Get current risk data for an appointment.
 */
export async function getAppointmentRisk(appointmentId: number): Promise<RiskAssessment | null> {
  const result = await pool.query(
    `SELECT no_show_risk_score, risk_category, risk_calculated_at, risk_factors
     FROM appointments WHERE id = $1`,
    [appointmentId],
  );

  if (result.rows.length === 0 || result.rows[0].no_show_risk_score == null) {
    return null;
  }

  const row = result.rows[0];
  return {
    riskScore: row.no_show_risk_score,
    category: row.risk_category,
    calculatedAt: row.risk_calculated_at,
    factors: typeof row.risk_factors === 'string' ? JSON.parse(row.risk_factors) : row.risk_factors,
  };
}

/**
 * Get high-risk appointments in the next 7 days.
 */
export async function getHighRiskPatients(): Promise<Array<{
  appointmentId: number;
  patientId: number;
  patientName: string;
  appointmentDate: string;
  riskScore: number;
  factors: RiskFactor[];
}>> {
  const result = await pool.query(
    `SELECT a.id AS appointment_id, a.patient_id, a.appointment_date,
            a.no_show_risk_score, a.risk_factors,
            u.first_name || ' ' || u.last_name AS patient_name
     FROM appointments a
     JOIN patient_profiles pp ON a.patient_id = pp.id
     JOIN users u ON pp.user_id = u.id
     WHERE a.appointment_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
       AND a.risk_category = 'high'
       AND a.status IN ('scheduled', 'confirmed')
     ORDER BY a.no_show_risk_score DESC`,
  );

  return result.rows.map((row) => ({
    appointmentId: row.appointment_id,
    patientId: row.patient_id,
    patientName: row.patient_name,
    appointmentDate: row.appointment_date,
    riskScore: row.no_show_risk_score,
    factors: typeof row.risk_factors === 'string' ? JSON.parse(row.risk_factors) : (row.risk_factors || []),
  }));
}

/**
 * Get risk trend for a patient (last 12 months).
 */
export async function getRiskTrend(patientId: number): Promise<Array<{ date: string; riskScore: number }>> {
  const result = await pool.query(
    `SELECT appointment_date::date AS date, no_show_risk_score AS risk_score
     FROM appointments
     WHERE patient_id = $1
       AND no_show_risk_score IS NOT NULL
       AND appointment_date >= NOW() - INTERVAL '12 months'
     ORDER BY appointment_date ASC`,
    [patientId],
  );
  return result.rows.map((r) => ({ date: r.date, riskScore: r.risk_score }));
}

/**
 * Get attendance summary for a patient.
 */
export async function getAttendanceSummary(patientId: number): Promise<{
  totalAppointments: number;
  noShowCount: number;
  noShowRate: number;
}> {
  const result = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status = 'no_show')::int AS noshows
     FROM appointments
     WHERE patient_id = $1
       AND status IN ('completed', 'no_show')`,
    [patientId],
  );
  const total = result.rows[0].total || 0;
  const noshows = result.rows[0].noshows || 0;
  return {
    totalAppointments: total,
    noShowCount: noshows,
    noShowRate: total > 0 ? Math.round((noshows / total) * 1000) / 10 : 0,
  };
}
