/**
 * Conflict Check Hook
 * @module hooks/useConflictCheck
 * @description Hook for medication conflict checking, overriding, and validation
 * @epic EP-006
 * @story US-033
 * @task task_004_fe_conflict_alert_interface
 */

import { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import type { ConflictCheckResult, MedicationConflictItem, ValidateMedicationResult } from '../types/clinicalProfile.types';
import { getToken } from '../utils/storage/tokenStorage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function useConflictCheck(patientId: string | null) {
  const [conflicts, setConflicts] = useState<ConflictCheckResult | null>(null);
  const [activeConflicts, setActiveConflicts] = useState<MedicationConflictItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkConflicts = useCallback(async (
    medications: Array<{ name: string; dosage: string; frequency: string }>,
    allergies?: Array<{ allergen_name: string; severity: string }>,
    conditions?: Array<{ condition_name: string }>
  ) => {
    if (!patientId || medications.length === 0) return null;
    setLoading(true);
    try {
      const token = getToken();
      const response = await axios.post<{ success: boolean; data: ConflictCheckResult }>(
        `${API_URL}/patients/${patientId}/medications/check-conflicts`,
        { medications, allergies, conditions },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setConflicts(response.data.data);
      setError(null);
      return response.data.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        // Critical conflicts - still parse the data
        const data = err.response.data?.data as ConflictCheckResult;
        setConflicts(data);
        return data;
      }
      const message = axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Failed to check conflicts';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const getActiveConflicts = useCallback(async () => {
    if (!patientId) return;
    try {
      const token = getToken();
      const response = await axios.get<{ success: boolean; data: MedicationConflictItem[] }>(
        `${API_URL}/patients/${patientId}/conflicts`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setActiveConflicts(response.data.data);
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Failed to get conflicts';
      setError(message);
    }
  }, [patientId]);

  const overrideConflict = useCallback(async (
    conflictId: string,
    overrideReason: string,
    acknowledged: boolean
  ) => {
    if (!patientId) return;
    try {
      const token = getToken();
      await axios.patch(
        `${API_URL}/patients/${patientId}/conflicts/${conflictId}/override`,
        { override_reason: overrideReason, acknowledged },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      await getActiveConflicts();
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Failed to override conflict';
      setError(message);
      throw new Error(message);
    }
  }, [patientId, getActiveConflicts]);

  const validateMedication = useCallback(async (medicationName: string): Promise<ValidateMedicationResult | null> => {
    if (!medicationName || medicationName.length < 2) return null;

    return new Promise((resolve) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          const token = getToken();
          const response = await axios.post<{ success: boolean; data: ValidateMedicationResult }>(
            `${API_URL}/patients/medications/validate`,
            { medication_name: medicationName },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          resolve(response.data.data);
        } catch {
          resolve(null);
        }
      }, 300);
    });
  }, []);

  return {
    conflicts,
    activeConflicts,
    loading,
    error,
    checkConflicts,
    getActiveConflicts,
    overrideConflict,
    validateMedication,
    hasActiveConflicts: activeConflicts.length > 0,
    criticalCount: conflicts?.critical_conflicts_count || 0,
    warningCount: conflicts?.warning_conflicts_count || 0,
    actionRequired: conflicts?.action_required || false,
  };
}
