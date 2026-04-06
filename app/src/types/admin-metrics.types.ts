/**
 * Admin Metrics Types (Frontend)
 *
 * @module admin-metrics.types
 * @task US_039 TASK_002
 */

export interface RealTimeMetrics {
  queueSize: number;
  avgWaitTime: number;
  todayAppointments: {
    scheduled: number;
    checkedIn: number;
    completed: number;
    noShows: number;
  };
  noShowRate: number;
}

export interface OperationalKPIs {
  totalAppointments: number;
  noShowRate: number;
  avgLeadTimeDays: number;
  insuranceVerificationSuccessRate: number;
  patientSatisfactionScore: number | null;
}

export interface SystemHealth {
  apiResponseTime: { value: number; status: HealthStatus; target: number };
  aiService: { successRate: number; status: HealthStatus };
  database: { activeConnections: number; maxConnections: number; status: HealthStatus };
  cache: { hitRate: number; status: HealthStatus };
}

export type HealthStatus = 'green' | 'yellow' | 'red';

export interface MetricsAlert {
  id: number;
  alert_type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  created_at: string;
  resolved_at: string | null;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface MetricsChartData {
  dailyVolume: ChartDataPoint[];
  noShowsByDay: ChartDataPoint[];
  appointmentTypes: ChartDataPoint[];
}

export type DateRangePreset = 'today' | '7d' | '30d' | 'custom';
