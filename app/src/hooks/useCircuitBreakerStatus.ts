/**
 * useCircuitBreakerStatus Hook
 *
 * Fetches initial circuit breaker state and subscribes to real-time
 * WebSocket events ('circuit-breaker:update') for live status updates.
 *
 * @module hooks/useCircuitBreakerStatus
 * @task US_041 TASK_002
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getCircuitBreakerStatus } from '../services/circuit-breaker.service';
import { getToken } from '../utils/storage/tokenStorage';
import type { CircuitBreakerStatus, CircuitBreakerServiceId } from '../types/circuit-breaker.types';

const WS_BASE_URL = import.meta.env.VITE_WS_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
    : 'ws://localhost:3001');

interface UseCircuitBreakerStatusReturn {
  statuses: CircuitBreakerStatus[];
  loading: boolean;
  error: string | null;
  hasOpenCircuits: boolean;
  openServices: CircuitBreakerServiceId[];
  refresh: () => Promise<void>;
}

export function useCircuitBreakerStatus(): UseCircuitBreakerStatusReturn {
  const [statuses, setStatuses] = useState<CircuitBreakerStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getCircuitBreakerStatus();
      if (mountedRef.current) {
        setStatuses(data);
        setError(null);
      }
    } catch {
      if (mountedRef.current) {
        setError('Failed to fetch circuit breaker status');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchStatus();

    const token = getToken();
    if (token) {
      const ws = new WebSocket(
        `${WS_BASE_URL}/circuit-breaker?token=${encodeURIComponent(token)}`,
      );
      wsRef.current = ws;

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const message = JSON.parse(event.data);
          if (message.event === 'circuit-breaker:update') {
            const update = message.data as Partial<CircuitBreakerStatus> & { service: CircuitBreakerServiceId };
            if (!update.service) return;
            setStatuses((prev) => {
              const exists = prev.some((s) => s.service === update.service);
              if (exists) {
                return prev.map((s) =>
                  s.service === update.service ? { ...s, ...update } : s,
                );
              }
              // Upsert: add new service if not already tracked
              return [...prev, update as CircuitBreakerStatus];
            });
          }
        } catch {
          // malformed message — ignore
        }
      };
    }

    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
    };
  }, [fetchStatus]);

  const hasOpenCircuits = useMemo(
    () => statuses.some((s) => s.state === 'open'),
    [statuses],
  );

  const openServices = useMemo(
    () =>
      statuses
        .filter((s) => s.state === 'open')
        .map((s) => s.service),
    [statuses],
  );

  return { statuses, loading, error, hasOpenCircuits, openServices, refresh: fetchStatus };
}
