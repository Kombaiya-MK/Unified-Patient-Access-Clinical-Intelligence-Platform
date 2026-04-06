/**
 * useQueueActions Hook
 *
 * Provides status transition actions for queue appointments with optimistic
 * locking and conflict resolution. Uses React Query for cache invalidation.
 *
 * @module useQueueActions
 * @created 2026-03-31
 * @task US_020 TASK_002
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getToken } from '../utils/storage/tokenStorage';
import type { QueueStatus, ConflictError } from '../types/queue.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/** Valid status transitions */
const VALID_TRANSITIONS: Record<string, QueueStatus[]> = {
  scheduled: ['arrived', 'no_show'],
  arrived: ['in_progress', 'no_show'],
  in_progress: ['completed', 'no_show'],
};

interface UseQueueActionsReturn {
  /** Execute a status transition */
  updateStatus: (appointmentId: string, newStatus: QueueStatus, version: number) => Promise<boolean>;
  /** Whether a transition is in progress */
  isUpdating: boolean;
  /** Current appointment being updated */
  updatingId: string | null;
  /** Last conflict error, if any */
  conflict: ConflictError | null;
  /** Last general error */
  error: string | null;
  /** Success message to display as toast */
  successMessage: string | null;
  /** Clear error/conflict state */
  clearError: () => void;
  /** Clear success message */
  clearSuccess: () => void;
  /** Check if a transition is valid for a given status */
  canTransition: (currentStatus: QueueStatus, targetStatus: QueueStatus) => boolean;
}

/**
 * Hook for performing queue status updates via API
 */
export function useQueueActions(): UseQueueActionsReturn {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [conflict, setConflict] = useState<ConflictError | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setConflict(null);
    setError(null);
  }, []);

  const clearSuccess = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  const canTransition = useCallback(
    (currentStatus: QueueStatus, targetStatus: QueueStatus): boolean => {
      const allowed = VALID_TRANSITIONS[currentStatus];
      return allowed ? allowed.includes(targetStatus) : false;
    },
    [],
  );

  const updateStatus = useCallback(
    async (appointmentId: string, newStatus: QueueStatus, version: number): Promise<boolean> => {
      setIsUpdating(true);
      setUpdatingId(appointmentId);
      setConflict(null);
      setError(null);
      setSuccessMessage(null);

      try {
        const token = getToken();
        const response = await fetch(
          `${API_BASE_URL}/staff/queue/${appointmentId}/status`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ newStatus, version }),
          },
        );

        if (response.status === 409) {
          const conflictData = await response.json();
          setConflict(conflictData);
          // Refetch to get latest data
          await queryClient.invalidateQueries({ queryKey: ['staff', 'queue', 'today'] });
          return false;
        }

        if (!response.ok) {
          const errData = await response.json().catch(() => ({ message: 'Unknown error' }));
          setError(errData.message || `Failed to update status: ${response.status}`);
          return false;
        }

        // Invalidate queue data to refetch
        await queryClient.invalidateQueries({ queryKey: ['staff', 'queue', 'today'] });

        // Set success message based on transition
        const statusMessages: Record<string, string> = {
          arrived: 'Patient marked as arrived',
          in_progress: 'Consultation started',
          completed: 'Appointment marked as completed',
          no_show: 'Patient marked as left without being seen',
        };
        setSuccessMessage(statusMessages[newStatus] || 'Status updated successfully');

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Network error');
        return false;
      } finally {
        setIsUpdating(false);
        setUpdatingId(null);
      }
    },
    [queryClient],
  );

  return {
    updateStatus,
    isUpdating,
    updatingId,
    conflict,
    error,
    successMessage,
    clearError,
    clearSuccess,
    canTransition,
  };
}
