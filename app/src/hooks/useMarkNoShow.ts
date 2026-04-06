/**
 * useMarkNoShow Hook
 *
 * Custom hook for marking an appointment as no-show via the API.
 * Handles loading state, error handling, and 409 conflict responses.
 *
 * @module useMarkNoShow
 * @created 2026-04-01
 * @task US_024 TASK_003
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getToken } from '../utils/storage/tokenStorage';
import type { NoShowResponse } from '../types/queue.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface UseMarkNoShowReturn {
  markNoShow: (notes?: string, excusedNoShow?: boolean) => Promise<NoShowResponse | null>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useMarkNoShow(appointmentId: string): UseMarkNoShowReturn {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const markNoShow = useCallback(
    async (notes?: string, excusedNoShow?: boolean): Promise<NoShowResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const token = getToken();
        const response = await fetch(
          `${API_BASE_URL}/staff/queue/${encodeURIComponent(appointmentId)}/mark-noshow`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ notes, excusedNoShow }),
          },
        );

        if (response.status === 409) {
          setError('Patient cancelled this appointment. Please refresh the queue.');
          await queryClient.invalidateQueries({ queryKey: ['staff', 'queue', 'today'] });
          return null;
        }

        if (response.status === 422) {
          const errData = await response.json().catch(() => ({ message: 'Validation error' }));
          setError(errData.message || 'Appointment is not eligible for no-show marking yet');
          return null;
        }

        if (!response.ok) {
          const errData = await response.json().catch(() => ({ message: 'Unknown error' }));
          setError(errData.message || `Failed to mark no-show: ${response.status}`);
          return null;
        }

        const data: NoShowResponse = await response.json();
        await queryClient.invalidateQueries({ queryKey: ['staff', 'queue', 'today'] });
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Network error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [appointmentId, queryClient],
  );

  return { markNoShow, loading, error, clearError };
}
