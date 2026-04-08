/**
 * Medical Coding Hook
 * @module hooks/useMedicalCoding
 * @description Hook for medical coding operations (generate, review, search)
 * @epic EP-006
 * @story US-032
 * @task task_004_fe_medical_coding_tab
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import type { MedicalCodeSuggestion, CodeSearchResult } from '../types/clinicalProfile.types';
import { getToken } from '../utils/storage/tokenStorage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function useMedicalCoding(appointmentId: string | null) {
  const [suggestions, setSuggestions] = useState<MedicalCodeSuggestion[]>([]);
  const [searchResults, setSearchResults] = useState<CodeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    if (!appointmentId) return;
    setLoading(true);
    try {
      const token = getToken();
      const response = await axios.get<{ success: boolean; data: MedicalCodeSuggestion[] }>(
        `${API_URL}/appointments/${appointmentId}/codes`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSuggestions(response.data.data);
      setError(null);
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Failed to fetch suggestions';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  const generateCodes = useCallback(async (
    patientId: string,
    clinicalNotes: string,
    chiefComplaint?: string
  ) => {
    if (!appointmentId) return;
    setLoading(true);
    try {
      const token = getToken();
      const response = await axios.post<{ success: boolean; data: { suggestions: MedicalCodeSuggestion[] } }>(
        `${API_URL}/appointments/${appointmentId}/codes/generate`,
        { patient_id: patientId, clinical_notes: clinicalNotes, chief_complaint: chiefComplaint },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSuggestions(response.data.data.suggestions);
      setError(null);
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Failed to generate codes';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  const reviewCode = useCallback(async (
    suggestionId: string,
    action: 'approve' | 'reject' | 'modify',
    modifiedCode?: string,
    modifiedDescription?: string,
    reason?: string
  ) => {
    try {
      const token = getToken();
      await axios.patch(
        `${API_URL}/appointments/codes/${suggestionId}/review`,
        { action, modified_code: modifiedCode, modified_description: modifiedDescription, modification_reason: reason },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      await fetchSuggestions();
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Failed to review code';
      setError(message);
    }
  }, [fetchSuggestions]);

  const bulkApprove = useCallback(async (suggestionIds: string[]) => {
    try {
      const token = getToken();
      await axios.post(
        `${API_URL}/appointments/codes/bulk-approve`,
        { suggestion_ids: suggestionIds },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      await fetchSuggestions();
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Failed to bulk approve';
      setError(message);
    }
  }, [fetchSuggestions]);

  const searchCodes = useCallback(async (query: string, codeType?: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const token = getToken();
      const params = new URLSearchParams({ q: query });
      if (codeType) params.append('code_type', codeType);
      const response = await axios.get<{ success: boolean; data: CodeSearchResult[] }>(
        `${API_URL}/appointments/codes/search?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSearchResults(response.data.data);
    } catch (err) {
      setSearchResults([]);
    }
  }, []);

  return {
    suggestions,
    searchResults,
    loading,
    error,
    fetchSuggestions,
    generateCodes,
    reviewCode,
    bulkApprove,
    searchCodes,
  };
}
