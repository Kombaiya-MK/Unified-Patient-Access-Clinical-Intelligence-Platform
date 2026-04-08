/**
 * useWebSocket Hook
 *
 * WebSocket client hook for real-time queue updates. Connects to the
 * server WebSocket endpoint with JWT authentication, auto-reconnects
 * with exponential backoff, and invalidates React Query cache on updates.
 *
 * @module useWebSocket
 * @created 2026-03-31
 * @task US_020 TASK_002
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getToken } from '../utils/storage/tokenStorage';
import type { QueueUpdateEvent } from '../types/queue.types';

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

/** Maximum reconnect delay in ms */
const MAX_RECONNECT_DELAY = 30_000;

/** Base reconnect delay in ms */
const BASE_RECONNECT_DELAY = 1_000;

interface UseWebSocketReturn {
  /** Whether WebSocket is currently connected */
  connected: boolean;
  /** Last received update event */
  lastUpdate: QueueUpdateEvent | null;
  /** Connection error message */
  error: string | null;
}

/**
 * Hook for connecting to the queue WebSocket for real-time updates
 */
export function useWebSocket(): UseWebSocketReturn {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<QueueUpdateEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    const token = getToken();
    if (!token) {
      setError('No auth token available');
      return;
    }

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(`${WS_BASE_URL}/queue?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setConnected(true);
      setError(null);
      reconnectAttemptRef.current = 0;
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const message = JSON.parse(event.data);
        if (message.event === 'queue:update') {
          setLastUpdate(message.data);
          // Invalidate queue data to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['staff', 'queue', 'today'] });
        }
      } catch {
        // Ignore malformed messages (welcome, pong, etc.)
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setConnected(false);

      // Exponential backoff reconnect
      const delay = Math.min(
        BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttemptRef.current),
        MAX_RECONNECT_DELAY,
      );
      reconnectAttemptRef.current += 1;

      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          connect();
        }
      }, delay);
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      setError('WebSocket connection error');
    };
  }, [queryClient]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { connected, lastUpdate, error };
}
