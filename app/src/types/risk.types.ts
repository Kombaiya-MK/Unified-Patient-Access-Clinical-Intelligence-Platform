/**
 * Risk Types (Frontend)
 *
 * @module risk.types
 * @task US_038 TASK_003
 */

export interface RiskFactor {
  name: string;
  contribution: number;
  icon: string;
}

export interface RiskAssessment {
  riskScore: number;
  category: 'low' | 'medium' | 'high';
  calculatedAt: string;
  factors: RiskFactor[];
}

export interface RiskTrendPoint {
  date: string;
  riskScore: number;
}

export interface AttendanceSummary {
  totalAppointments: number;
  noShowCount: number;
  noShowRate: number;
}

export interface HighRiskPatient {
  appointmentId: number;
  patientId: number;
  patientName: string;
  appointmentDate: string;
  riskScore: number;
  factors: RiskFactor[];
}
