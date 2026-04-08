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
  QueueAppointmentType,
  QueueFilters,
  QueueSortConfig,
  QueueSortField,
  QueueResponse,
  ProviderOption,
  DepartmentOption,
  QueueStatus,
  IntakeStatus,
} from '../types/queue.types';
import { getToken } from '../utils/storage/tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/** Query key for queue data */
const QUEUE_QUERY_KEY = ['staff', 'queue', 'today'] as const;

const VALID_QUEUE_STATUSES: QueueStatus[] = ['scheduled', 'arrived', 'in_progress', 'completed', 'no_show'];

/** Safely map a raw status string to a valid QueueStatus */
function toQueueStatus(raw: string): QueueStatus {
  if (raw === 'confirmed') return 'scheduled';
  if (VALID_QUEUE_STATUSES.includes(raw as QueueStatus)) return raw as QueueStatus;
  return 'scheduled';
}

/** Status sort order for sorting by status column */
const STATUS_SORT_ORDER: Record<string, number> = {
  in_progress: 0,
  arrived: 1,
  scheduled: 2,
  confirmed: 2,
  pending: 3,
  no_show: 4,
  completed: 5,
};

/**
 * Map a single raw API appointment (snake_case) to camelCase QueueAppointment
 */
const mapAppointment = (raw: Record<string, unknown>): QueueAppointment => ({
  id: String(raw.id ?? ''),
  patientId: String(raw.patient_id ?? ''),
  patientName: String(raw.patient_name ?? '').trim() || 'Unknown Patient',
  appointmentTime: String(raw.appointment_time ?? raw.appointment_date ?? ''),
  status: toQueueStatus(String(raw.status ?? 'scheduled')),
  providerName: String(raw.provider_name ?? ''),
  providerId: String(raw.provider_id ?? raw.doctor_id ?? ''),
  department: String(raw.department_name ?? ''),
  departmentId: String(raw.department_id ?? ''),
  type: (String(raw.appointment_type ?? 'scheduled') === 'walk_in' ? 'walk_in' : 'scheduled') as QueueAppointmentType,
  intakeStatus: 'pending' as IntakeStatus,
  waitTimeMinutes: null,
  queuePosition: 0,
  version: Number(raw.version ?? 1),
  startedAt: raw.started_at ? String(raw.started_at) : null,
  isLateArrival: Boolean(raw.is_late_arrival),
  noShowMarkedAt: raw.no_show_marked_at ? String(raw.no_show_marked_at) : null,
  excusedNoShow: Boolean(raw.excused_no_show),
});

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

  const json = await response.json();
  const payload = json.data || json;

  const appointments: QueueAppointment[] = (payload.appointments || []).map(
    (raw: Record<string, unknown>) => mapAppointment(raw),
  );

  return {
    appointments,
    totalCount: payload.totalCount ?? appointments.length,
    providers: (payload.providers || []).map((p: Record<string, unknown>) => ({
      id: String(p.id ?? ''),
      name: String(p.name ?? ''),
    })),
    departments: (payload.departments || []).map((d: Record<string, unknown>) => ({
      id: String(d.id ?? ''),
      name: String(d.name ?? ''),
    })),
  };
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
