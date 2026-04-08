/**
 * usePatientSearch Hook
 * 
 * Custom hook for searching patients by name, phone, or email.
 * Uses React Query with debounced input for efficient API calls.
 * 
 * @module usePatientSearch
 * @created 2026-04-01
 * @task US_023 TASK_003
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getToken } from '../utils/storage/tokenStorage';
import { useDebounce } from './useDebounce';
import type { PatientSearchResult, PatientSearchResponse } from '../types/patient.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Fetch patients from the search API
 */
async function fetchPatientSearch(searchTerm: string): Promise<PatientSearchResult[]> {
  const token = getToken();
  const params = new URLSearchParams();

  // Determine search type based on input format
  const trimmed = searchTerm.trim();
  if (!trimmed) return [];

  if (trimmed.includes('@')) {
    params.set('email', trimmed);
  } else if (/^\+?\d[\d\s\-().]+$/.test(trimmed)) {
    params.set('phone', trimmed);
  } else {
    params.set('name', trimmed);
  }

  const response = await fetch(
    `${API_BASE_URL}/staff/patients/search?${params.toString()}`,
    {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to search patients');
  }

  const data: PatientSearchResponse = await response.json();
  return data.patients;
}

/**
 * Hook for patient search with debounced input.
 * 
 * @returns Search state and controls
 */
export function usePatientSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const {
    data: patients = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['staff', 'patients', 'search', debouncedSearch],
    queryFn: () => fetchPatientSearch(debouncedSearch),
    enabled: debouncedSearch.trim().length >= 2,
    staleTime: 30_000,
  });

  return {
    searchTerm,
    setSearchTerm,
    patients,
    isLoading,
    isError,
    error: error instanceof Error ? error.message : null,
  };
}
