/**
 * useUndoNoShow Hook
 *
 * Custom hook for undoing a no-show marking via the API.
 * Handles loading state, error handling, and undo-window-expired responses.
 *
 * @module useUndoNoShow
 * @created 2026-04-01
 * @task US_024 TASK_004
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getToken } from '../utils/storage/tokenStorage';
import type { UndoNoShowResponse } from '../types/queue.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface UseUndoNoShowReturn {
  undoNoShow: () => Promise<UndoNoShowResponse | null>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useUndoNoShow(appointmentId: string): UseUndoNoShowReturn {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const undoNoShow = useCallback(async (): Promise<UndoNoShowResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/staff/queue/${encodeURIComponent(appointmentId)}/undo-noshow`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      if (response.status === 400) {
        const errData = await response.json().catch(() => ({ message: 'Bad request' }));
        setError(errData.message || 'Undo window expired (>2 hours)');
        return null;
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: 'Unknown error' }));
        setError(errData.message || `Failed to undo no-show: ${response.status}`);
        return null;
      }

      const data: UndoNoShowResponse = await response.json();
      await queryClient.invalidateQueries({ queryKey: ['staff', 'queue', 'today'] });
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [appointmentId, queryClient]);

  return { undoNoShow, loading, error, clearError };
}
