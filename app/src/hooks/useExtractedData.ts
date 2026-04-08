/**
 * Extracted Data Hook
 * Fetches, polls, reviews, and retries extraction data for a document.
 * @module hooks/useExtractedData
 * @task US_029 TASK_004
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import type { ExtractedDataResponse, ExtractedData, ExtractionLogEntry } from '../types/document.types';
import { getToken } from '../utils/storage/tokenStorage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function useExtractedData(documentId: number | null) {
  const [data, setData] = useState<ExtractedDataResponse | null>(null);
  const [logs, setLogs] = useState<ExtractionLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchExtractedData = useCallback(async () => {
    if (!documentId) return;
    setLoading(true);
    try {
      const token = getToken();
      const response = await axios.get<{ success: boolean; data: ExtractedDataResponse }>(
        `${API_URL}/documents/${documentId}/extracted-data`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setData(response.data.data);
      setError(null);
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Failed to fetch data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  const fetchLogs = useCallback(async () => {
    if (!documentId) return;
    try {
      const token = getToken();
      const response = await axios.get<{ success: boolean; data: ExtractionLogEntry[] }>(
        `${API_URL}/documents/${documentId}/extraction-logs`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setLogs(response.data.data || []);
    } catch {
      // Silent fail for logs
    }
  }, [documentId]);

  const approveData = useCallback(async (correctedData: ExtractedData, reviewNotes?: string) => {
    if (!documentId) return;
    const token = getToken();
    await axios.patch(
      `${API_URL}/documents/${documentId}/review`,
      { correctedData, reviewNotes },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    await fetchExtractedData();
  }, [documentId, fetchExtractedData]);

  const retryExtraction = useCallback(async () => {
    if (!documentId) return;
    const token = getToken();
    await axios.post(
      `${API_URL}/documents/${documentId}/extract`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    await fetchExtractedData();
  }, [documentId, fetchExtractedData]);

  // Poll while processing
  useEffect(() => {
    if (data?.extractionStatus === 'Processing') {
      intervalRef.current = setInterval(fetchExtractedData, 5000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [data?.extractionStatus, fetchExtractedData]);

  // Initial fetch
  useEffect(() => {
    if (documentId) {
      fetchExtractedData();
      fetchLogs();
    }
  }, [documentId, fetchExtractedData, fetchLogs]);

  return {
    data,
    logs,
    loading,
    error,
    refetch: fetchExtractedData,
    approveData,
    retryExtraction,
  };
}
