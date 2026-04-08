/**
 * Admin Dashboard Metrics Types
 *
 * @module adminMetrics.types
 * @task US_039 TASK_001
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
  apiResponseTime: { value: number; status: 'green' | 'yellow' | 'red'; target: number };
  aiService: { successRate: number; status: 'green' | 'yellow' | 'red' };
  database: { activeConnections: number; maxConnections: number; status: 'green' | 'yellow' | 'red' };
  cache: { hitRate: number; status: 'green' | 'yellow' | 'red' };
}

export interface MetricsAlert {
  id: number;
  alert_type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  details: Record<string, unknown>;
  created_at: string;
  resolved_at: string | null;
  resolved_by: number | null;
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
