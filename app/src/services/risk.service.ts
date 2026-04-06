/**
 * Risk API Service (Frontend)
 *
 * @module risk.service
 * @task US_038 TASK_003
 */

import api from './api';
import type { RiskAssessment, RiskTrendPoint, AttendanceSummary, HighRiskPatient } from '../types/risk.types';

export async function getAppointmentRisk(appointmentId: number): Promise<RiskAssessment | null> {
  try {
    const res = await api.get(`/admin/risk/appointment/${appointmentId}`);
    return res.data.success ? res.data.data : null;
  } catch {
    return null;
  }
}

export async function calculateRisk(appointmentId: number): Promise<RiskAssessment> {
  const res = await api.post('/admin/risk/calculate-noshow', { appointmentId });
  return res.data.data;
}

export async function getRiskTrend(patientId: number): Promise<RiskTrendPoint[]> {
  const res = await api.get(`/admin/risk/trend/${patientId}`);
  return res.data.success ? res.data.data : [];
}

export async function getAttendanceSummary(patientId: number): Promise<AttendanceSummary> {
  const res = await api.get(`/admin/risk/attendance/${patientId}`);
  return res.data.data;
}

export async function getHighRiskPatients(): Promise<HighRiskPatient[]> {
  const res = await api.get('/admin/risk/high-risk-patients');
  return res.data.success ? res.data.data : [];
}
