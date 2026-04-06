/**
 * useQueueData Hook
 * 
 * Custom hook for fetching and managing queue management data with
 * client-side filtering, sorting, and URL query param persistence.
 * Uses React Query for data fetching with auto-refresh.
 * 
 * @module useQueueData
 * @created 2026-03-31
 * @task US_020 TASK_001
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import type {
  QueueAppointment,
  QueueFilters,
  QueueSortConfig,
  QueueSortField,
  QueueResponse,
  ProviderOption,
  DepartmentOption,
  QueueStatus,
} from '../types/queue.types';
import { getToken } from '../utils/storage/tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/** Query key for queue data */
const QUEUE_QUERY_KEY = ['staff', 'queue', 'today'] as const;

/** Status sort order for sorting by status column */
const STATUS_SORT_ORDER: Record<QueueStatus, number> = {
  in_progress: 0,
  arrived: 1,
  scheduled: 2,
  no_show: 3,
  completed: 4,
};

/**
 * Fetch today's queue data from the API
 */
const fetchQueueData = async (): Promise<QueueResponse> => {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/staff/queue/today`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch queue data: ${response.status}`);
  }

  return response.json();
};

/**
 * Parse filter values from URL search params
 */
const parseFiltersFromParams = (searchParams: URLSearchParams): QueueFilters => {
  const statusParam = searchParams.get('statuses');
  return {
    statuses: statusParam ? (statusParam.split(',') as QueueStatus[]) : [],
    providerId: searchParams.get('providerId') || '',
    departmentId: searchParams.get('departmentId') || '',
    searchTerm: searchParams.get('search') || '',
  };
};

/**
 * Serialize filter values to URL search params
 */
const serializeFiltersToParams = (filters: QueueFilters): Record<string, string> => {
  const params: Record<string, string> = {};
  if (filters.statuses.length > 0) {
    params.statuses = filters.statuses.join(',');
  }
  if (filters.providerId) {
    params.providerId = filters.providerId;
  }
  if (filters.departmentId) {
    params.departmentId = filters.departmentId;
  }
  if (filters.searchTerm) {
    params.search = filters.searchTerm;
  }
  return params;
};

/**
 * Hook return type
 */
interface UseQueueDataReturn {
  /** Filtered and sorted appointments */
  appointments: QueueAppointment[];
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: string | null;
  /** Current filter state */
  filters: QueueFilters;
  /** Update filters */
  setFilters: (filters: QueueFilters) => void;
  /** Current sort configuration */
  sort: QueueSortConfig;
  /** Update sort */
  setSort: (field: QueueSortField) => void;
  /** Total unfiltered count */
  totalCount: number;
  /** Available providers for dropdown */
  providers: ProviderOption[];
  /** Available departments for dropdown */
  departments: DepartmentOption[];
  /** Reset all filters */
  resetFilters: () => void;
  /** Refetch data */
  refetch: () => void;
}

/**
 * Queue data management hook
 * 
 * Fetches today's queue data and provides client-side filtering and sorting.
 * Filter state is persisted in URL query params for refresh persistence.
 * 
 * @returns Queue data, filter/sort controls, and loading/error states
 */
export function useQueueData(): UseQueueDataReturn {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(
    () => parseFiltersFromParams(searchParams),
    [searchParams],
  );

  const [sort, setSortState] = useState<QueueSortConfig>({
    field: 'appointmentTime',
    direction: 'asc',
  });

  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery<QueueResponse>({
    queryKey: QUEUE_QUERY_KEY,
    queryFn: fetchQueueData,
    refetchInterval: 30000, // Auto-refresh every 30s for live queue
    staleTime: 10000,
  });

  const setFilters = useCallback(
    (newFilters: QueueFilters) => {
      const params = serializeFiltersToParams(newFilters);
      setSearchParams(params, { replace: true });
    },
    [setSearchParams],
  );

  const resetFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const setSort = useCallback((field: QueueSortField) => {
    setSortState((prev: QueueSortConfig) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  /** Apply client-side filtering and sorting */
  const appointments = useMemo(() => {
    if (!data?.appointments) {
      return [];
    }

    let filtered = [...data.appointments];

    // Filter by status (multi-select)
    if (filters.statuses.length > 0) {
      filtered = filtered.filter((a) => filters.statuses.includes(a.status));
    }

    // Filter by provider
    if (filters.providerId) {
      filtered = filtered.filter((a) => a.providerId === filters.providerId);
    }

    // Filter by department
    if (filters.departmentId) {
      filtered = filtered.filter((a) => a.departmentId === filters.departmentId);
    }

    // Filter by patient name search
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter((a) =>
        a.patientName.toLowerCase().includes(term),
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      if (sort.field === 'appointmentTime') {
        comparison = new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime();
      } else if (sort.field === 'status') {
        comparison = STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status];
      } else if (sort.field === 'queuePosition') {
        comparison = a.queuePosition - b.queuePosition;
      }

      return sort.direction === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [data, filters, sort]);

  return {
    appointments,
    loading: isLoading,
    error: queryError ? (queryError as Error).message : null,
    filters,
    setFilters,
    sort,
    setSort,
    totalCount: data?.totalCount ?? 0,
    providers: data?.providers ?? [],
    departments: data?.departments ?? [],
    resetFilters,
    refetch: () => { refetch(); },
  };
}
