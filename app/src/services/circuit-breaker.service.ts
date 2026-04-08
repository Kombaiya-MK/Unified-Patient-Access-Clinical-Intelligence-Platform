/**
 * Circuit Breaker API Service
 *
 * Fetches circuit breaker status and event logs from the backend.
 *
 * @module services/circuit-breaker.service
 * @task US_041 TASK_002
 */

import api from './api';
import type { CircuitBreakerStatus, CircuitBreakerLog } from '../types/circuit-breaker.types';

export async function getCircuitBreakerStatus(): Promise<CircuitBreakerStatus[]> {
  const res = await api.get<{ data: CircuitBreakerStatus[] }>('/circuit-breaker/status');
  return res.data.data;
}

export async function getCircuitBreakerLogs(service: string): Promise<CircuitBreakerLog[]> {
  const res = await api.get<{ data: CircuitBreakerLog[] }>(
    `/circuit-breaker/logs/${encodeURIComponent(service)}`,
  );
  return res.data.data;
}
