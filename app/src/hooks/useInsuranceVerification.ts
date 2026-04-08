/**
 * Insurance Verification Hook
 *
 * Custom hook for fetching and managing insurance verification data.
 * Polls every 30s when status is pending.
 *
 * @module useInsuranceVerification
 * @task US_037 TASK_003
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { InsuranceVerification } from '../types/insuranceVerification';

interface UseInsuranceVerificationResult {
  verification: InsuranceVerification | null;
  history: InsuranceVerification[];
  historyTotal: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  reVerify: (appointmentId: number) => Promise<void>;
  reVerifying: boolean;
  fetchHistory: (page?: number) => void;
}

export function useInsuranceVerification(patientId: number | null): UseInsuranceVerificationResult {
  const [verification, setVerification] = useState<InsuranceVerification | null>(null);
  const [history, setHistory] = useState<InsuranceVerification[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reVerifying, setReVerifying] = useState(false);

  const fetchVerification = useCallback(async () => {
    if (!patientId) return;
    try {
      setLoading(true);
      const res = await api.get(`/admin/insurance/verifications/${patientId}`);
      if (res.data.success) {
        setVerification(res.data.data);
      }
      setError(null);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 404) {
        setVerification(null);
        setError(null);
      } else {
        setError('Failed to load verification');
      }
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const fetchHistory = useCallback(async (page = 1) => {
    if (!patientId) return;
    try {
      const res = await api.get(`/admin/insurance/verifications/${patientId}/history`, {
        params: { page, limit: 10 },
      });
      if (res.data.success) {
        setHistory(res.data.data);
        setHistoryTotal(res.data.pagination.total);
      }
    } catch {
      // History fetch failure is non-critical
    }
  }, [patientId]);

  const reVerify = useCallback(async (appointmentId: number) => {
    try {
      setReVerifying(true);
      const res = await api.post(`/admin/insurance/verifications/verify/${appointmentId}`);
      if (res.data.success) {
        setVerification(res.data.data);
      }
    } catch {
      setError('Re-verification failed');
    } finally {
      setReVerifying(false);
    }
  }, []);

  useEffect(() => {
    fetchVerification();
  }, [fetchVerification]);

  // Poll every 30s when status is pending
  useEffect(() => {
    if (verification?.status !== 'pending') return;
    const interval = setInterval(fetchVerification, 30000);
    return () => clearInterval(interval);
  }, [verification?.status, fetchVerification]);

  return {
    verification,
    history,
    historyTotal,
    loading,
    error,
    refetch: fetchVerification,
    reVerify,
    reVerifying,
    fetchHistory,
  };
}
