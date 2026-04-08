/**
 * No-Show Risk Types
 *
 * @module risk.types
 * @task US_038 TASK_002
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

export interface ModelMetadata {
  version: string;
  trainDate: string;
  accuracy: number;
  features: string[];
}
