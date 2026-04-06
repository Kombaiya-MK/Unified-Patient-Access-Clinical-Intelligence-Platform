/**
 * Clinical Profile Hook
 * @module hooks/useClinicalProfile
 * @description Fetches unified clinical profile with polling for processing documents
 * @epic EP-006
 * @story US-034
 * @task task_002_fe_clinical_data_review_page
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import type { UnifiedProfile } from '../types/clinicalProfile.types';
import { getToken } from '../utils/storage/tokenStorage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const POLL_INTERVAL = 10000; // 10 seconds

export function useClinicalProfile(patientId: string | null) {
  const [profile, setProfile] = useState<UnifiedProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const token = getToken();
      const response = await axios.get<{ success: boolean; data: UnifiedProfile }>(
        `${API_URL}/patients/${patientId}/clinical-profile`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setProfile(response.data.data);
      setError(null);

      // Start/stop polling based on processing status
      if (response.data.data.processing_status.pending_documents > 0) {
        if (!intervalRef.current) {
          intervalRef.current = setInterval(fetchProfile, POLL_INTERVAL);
        }
      } else if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Failed to fetch profile';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const refetch = useCallback(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchProfile();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchProfile]);

  return { profile, loading, error, refetch };
}
