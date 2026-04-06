/**
 * Merge Data Hook
 * Fetches merge status, history, conflicts, and handles conflict resolution.
 * @module hooks/useMergeData
 * @task US_030 TASK_004
 */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import type { FieldConflict, MergeLogEntry, MergeStatus } from '../types/document.types';
import { getToken } from '../utils/storage/tokenStorage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface MergeStatusInfo {
  mergeStatus: MergeStatus;
  mergedFromDocuments: Array<{ document_id: number }>;
  conflictFields: string[];
}

export function useMergeData(patientId: number | null) {
  const [mergeStatus, setMergeStatus] = useState<MergeStatusInfo | null>(null);
  const [mergeHistory, setMergeHistory] = useState<MergeLogEntry[]>([]);
  const [conflicts, setConflicts] = useState<FieldConflict[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMergeHistory = useCallback(async () => {
    if (!patientId) return;
    try {
      const token = getToken();
      const response = await axios.get<{ success: boolean; data: MergeLogEntry[] }>(
        `${API_URL}/patients/${patientId}/merge-history`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMergeHistory(response.data.data || []);
    } catch {
      // Silent fail
    }
  }, [patientId]);

  const fetchConflicts = useCallback(async () => {
    if (!patientId) return;
    try {
      const token = getToken();
      const response = await axios.get<{ success: boolean; data: FieldConflict[] }>(
        `${API_URL}/patients/${patientId}/conflicts`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setConflicts(response.data.data || []);
    } catch {
      // Silent fail
    }
  }, [patientId]);

  const resolveConflict = useCallback(async (
    conflictId: number,
    resolvedValue: unknown,
    resolutionNotes?: string,
  ) => {
    if (!patientId) return;
    const token = getToken();
    await axios.patch(
      `${API_URL}/patients/${patientId}/conflicts/${conflictId}/resolve`,
      { resolvedValue, resolutionNotes },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    await fetchConflicts();
    await fetchMergeHistory();
  }, [patientId, fetchConflicts, fetchMergeHistory]);

  const triggerDeduplication = useCallback(async () => {
    if (!patientId) return;
    const token = getToken();
    await axios.post(
      `${API_URL}/patients/${patientId}/deduplicate`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
  }, [patientId]);

  useEffect(() => {
    if (patientId) {
      setLoading(true);
      Promise.all([fetchMergeHistory(), fetchConflicts()])
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to fetch merge data'))
        .finally(() => setLoading(false));
    }
  }, [patientId, fetchMergeHistory, fetchConflicts]);

  return {
    mergeStatus,
    setMergeStatus,
    mergeHistory,
    conflicts,
    loading,
    error,
    resolveConflict,
    triggerDeduplication,
    refetchConflicts: fetchConflicts,
    refetchHistory: fetchMergeHistory,
  };
}
