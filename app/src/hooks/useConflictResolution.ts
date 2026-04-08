/**
 * Conflict Resolution Hook
 * @module hooks/useConflictResolution
 * @description Hook for resolving profile field conflicts
 * @epic EP-006
 * @story US-034
 * @task task_003_fe_conflict_resolution_interface
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import { getToken } from '../utils/storage/tokenStorage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function useConflictResolution(patientId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveConflict = useCallback(async (
    fieldName: string,
    selectedValue: string,
    resolutionNotes: string
  ) => {
    if (!patientId) return;
    setLoading(true);
    try {
      const token = getToken();
      await axios.patch(
        `${API_URL}/patients/${patientId}/conflicts/${encodeURIComponent(fieldName)}/resolve`,
        { selected_value: selectedValue, resolution_notes: resolutionNotes },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setError(null);
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Failed to resolve conflict';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const getHistory = useCallback(async (limit = 20, offset = 0) => {
    if (!patientId) return null;
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_URL}/patients/${patientId}/clinical-profile/history?limit=${limit}&offset=${offset}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return response.data.data;
    } catch {
      return null;
    }
  }, [patientId]);

  return { resolveConflict, getHistory, loading, error };
}
