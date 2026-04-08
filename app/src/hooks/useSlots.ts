/**
 * useSlots Hook
 * 
 * React Query hook for fetching available time slots with caching and
 * automatic refetching on window focus.
 * 
 * @module useSlots
 * @created 2026-03-18
 * @task US_013 TASK_001
 */

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { getSlots, getAvailableDates } from '../services/appointmentService';
import type { Slot, SlotFilters } from '../types/appointment.types';

/**
 * Query key factory for slots
 */
export const slotsKeys = {
  all: ['slots'] as const,
  lists: () => [...slotsKeys.all, 'list'] as const,
  list: (filters?: SlotFilters) => [...slotsKeys.lists(), filters] as const,
  availableDates: (filters?: SlotFilters) => [...slotsKeys.all, 'available-dates', filters] as const,
};

/**
 * Hook to fetch available time slots
 * 
 * Features:
 * - 5-minute cache for performance
 * - Automatic refetch on window focus
 * - Disabled when no filters provided (prevents unnecessary API calls)
 * 
 * @param filters - Optional filters for department, provider, date
 * @returns Query result with slots data, loading state, and error
 * 
 * @example
 * ```tsx
 * const { data: slots, isLoading, error } = useSlots({
 *   departmentId: '123',
 *   providerId: '456',
 *   date: '2026-03-20'
 * });
 * ```
 */
export const useSlots = (filters?: SlotFilters): UseQueryResult<Slot[], Error> => {
  return useQuery({
    queryKey: slotsKeys.list(filters),
    queryFn: () => getSlots(filters),
    // Cache for 5 minutes to reduce API calls
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Refetch when user returns to window (ensures fresh data)
    refetchOnWindowFocus: true,
    // Only fetch if at least a date is provided
    enabled: !!filters?.date,
    // Retry once on failure
    retry: 1,
    // Show cached data while refetching
    refetchOnMount: 'always',
  });
};

/**
 * Hook to fetch dates with available slots (for calendar highlighting)
 * 
 * @param filters - Optional filters for department, provider, date range
 * @returns Query result with array of dates
 * 
 * @example
 * ```tsx
 * const { data: availableDates } = useAvailableDates({
 *   departmentId: '123',
 *   startDate: '2026-03-01',
 *   endDate: '2026-03-31'
 * });
 * ```
 */
export const useAvailableDates = (filters?: SlotFilters): UseQueryResult<string[], Error> => {
  return useQuery({
    queryKey: slotsKeys.availableDates(filters),
    queryFn: () => getAvailableDates(filters),
    // Keep the calendar renderable while loading/refetching without masking failures
    placeholderData: [],
    // Cache for 10 minutes (dates change less frequently)
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    // Always enabled to show available dates in calendar
    enabled: true,
    retry: 1,
  });
};
