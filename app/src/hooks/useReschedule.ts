/**
 * useReschedule Hook
 * 
 * Custom React hook for rescheduling appointments with optimistic updates.
 * 
 * Features:
 * - TanStack Query mutation with optimistic updates
 * - Automatic rollback on error
 * - Conflict resolution for slot availability (409 errors)
 * - Success/error toast notifications
 * - Cache invalidation on success
 * 
 * Error Handling:
 * - 400: Validation errors (2-hour restriction, same slot, etc.)
 * - 403: Max reschedules reached
 * - 409: Slot no longer available (conflict)
 * - 500: Server error
 * 
 * @module useReschedule
 * @created 2026-03-19
 * @task US_014 TASK_001
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rescheduleAppointment } from '../services/appointmentService';
import type { Appointment } from '../types/appointment.types';

/**
 * Reschedule mutation variables
 */
interface RescheduleMutationVariables {
  /** Appointment ID to reschedule */
  appointmentId: string;
  /** New slot ID */
  newSlotId: string;
}

/**
 * Mutation context for optimistic updates
 */
interface MutationContext {
  previousAppointments?: Appointment[];
}

/**
 * Error response shape from API
 */
interface ApiError {
  response?: {
    status: number;
    data?: {
      message?: string;
      error?: string;
    };
  };
  message: string;
}

/**
 * Success callback parameters
 */
interface RescheduleSuccess {
  /** Updated appointment data */
  appointment: Appointment;
  /** Success message */
  message: string;
}

/**
 * Error callback parameters
 */
interface RescheduleError {
  /** Error message for display */
  message: string;
  /** HTTP status code */
  statusCode?: number;
  /** Original error object */
  error: Error;
}

/**
 * Hook options
 */
interface UseRescheduleOptions {
  /** Callback on success */
  onSuccess?: (data: RescheduleSuccess) => void;
  /** Callback on error */
  onError?: (error: RescheduleError) => void;
  /** Show toast notifications (default: true) */
  showToast?: boolean;
}

/**
 * Parse API error into user-friendly message
 */
const parseErrorMessage = (error: ApiError): string => {
  const status = error.response?.status;
  const apiMessage = error.response?.data?.message || error.response?.data?.error;

  switch (status) {
    case 400:
      return apiMessage || 'Invalid reschedule request. Please check your selection.';
    case 403:
      return apiMessage || 'You have reached the maximum number of reschedules for this appointment.';
    case 409:
      return 'This time slot is no longer available. Please select another time.';
    case 404:
      return 'Appointment not found. Please refresh the page.';
    case 500:
      return 'Server error. Please try again later or contact support.';
    default:
      return apiMessage || 'Failed to reschedule appointment. Please try again.';
  }
};

/**
 * Show toast notification (placeholder - replace with actual toast library)
 */
const showToast = (type: 'success' | 'error', message: string) => {
  // TODO: Replace with actual toast notification library (e.g., react-hot-toast, sonner)
  if (type === 'success') {
    console.log('✓ Success:', message);
  } else {
    console.error('✗ Error:', message);
  }
  
  // Fallback to alert for now (remove in production)
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    // alert(`${type.toUpperCase()}: ${message}`);
  }
};

/**
 * useReschedule Hook
 * 
 * Provides mutation function for rescheduling appointments with optimistic updates.
 * 
 * @example
 * ```tsx
 * const { mutate: reschedule, isPending, isError, error } = useReschedule({
 *   onSuccess: (data) => {
 *     console.log('Rescheduled:', data.appointment);
 *     onClose();
 *   },
 *   onError: (error) => {
 *     console.error('Failed:', error.message);
 *   }
 * });
 * 
 * // Trigger reschedule
 * reschedule({ 
 *   appointmentId: '123', 
 *   newSlotId: '456' 
 * });
 * ```
 * 
 * @param options - Hook configuration options
 * @returns TanStack Query mutation object with mutate, isPending, isError, etc.
 */
export const useReschedule = (options: UseRescheduleOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError, showToast: enableToast = true } = options;

  return useMutation<
    Appointment,
    ApiError,
    RescheduleMutationVariables,
    MutationContext
  >({
    /**
     * Mutation function
     */
    mutationFn: async ({ appointmentId, newSlotId }) => {
      return await rescheduleAppointment(appointmentId, newSlotId);
    },

    /**
     * Optimistic update: immediately update cache before API call
     */
    onMutate: async ({ appointmentId, newSlotId }) => {
      // Cancel outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['appointments'] });

      // Snapshot previous value for rollback
      const previousAppointments = queryClient.getQueryData<Appointment[]>(['appointments']);

      // Optimistically update appointment in cache
      queryClient.setQueryData<Appointment[]>(['appointments'], (old) => {
        if (!old) return old;

        return old.map((appointment) => {
          if (appointment.id === appointmentId) {
            // Update optimistically (real data will come from API response)
            return {
              ...appointment,
              slotId: newSlotId,
              // Note: We don't update appointmentDate here since we don't have slot details
              // The actual date will be updated when the mutation succeeds
            };
          }
          return appointment;
        });
      });

      // Return context for rollback
      return { previousAppointments };
    },

    /**
     * On success: Update cache with real data and show success message
     */
    onSuccess: (updatedAppointment) => {
      // Update cache with real API response data
      queryClient.setQueryData<Appointment[]>(['appointments'], (old) => {
        if (!old) return [updatedAppointment];

        return old.map((appointment) =>
          appointment.id === updatedAppointment.id ? updatedAppointment : appointment
        );
      });

      // Invalidate related queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });

      // Show success toast
      if (enableToast) {
        showToast('success', 'Appointment rescheduled successfully!');
      }

      // Call user callback
      if (onSuccess) {
        onSuccess({
          appointment: updatedAppointment,
          message: 'Appointment rescheduled successfully!',
        });
      }
    },

    /**
     * On error: Rollback optimistic update and show error message
     */
    onError: (error, _variables, context) => {
      // Rollback to previous state
      if (context?.previousAppointments) {
        queryClient.setQueryData(['appointments'], context.previousAppointments);
      }

      // Parse error message
      const errorMessage = parseErrorMessage(error);
      const statusCode = error.response?.status;

      // Show error toast
      if (enableToast) {
        showToast('error', errorMessage);
      }

      // Log error for debugging
      console.error('Reschedule error:', {
        error,
        statusCode,
        message: errorMessage,
      });

      // Call user callback
      if (onError) {
        onError({
          message: errorMessage,
          statusCode,
          error: error as Error,
        });
      }
    },

    /**
     * Retry configuration
     * - Don't retry 4xx errors (client errors)
     * - Retry 5xx errors (server errors) up to 2 times
     */
    retry: (failureCount, error) => {
      const status = (error as ApiError).response?.status;
      
      // Don't retry client errors (400-499)
      if (status && status >= 400 && status < 500) {
        return false;
      }

      // Retry server errors (500+) up to 2 times
      return failureCount < 2;
    },

    /**
     * Retry delay: exponential back-off
     */
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Export type for external usage
 */
export type { 
  RescheduleMutationVariables, 
  RescheduleSuccess, 
  RescheduleError, 
  UseRescheduleOptions 
};
