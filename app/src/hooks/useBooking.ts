/**
 * useBooking Hook
 * 
 * React Query mutation hook for booking appointments with optimistic UI updates.
 * Provides instant feedback by updating UI before API response, with automatic
 * rollback on error.
 * 
 * @module useBooking
 * @created 2026-03-18
 * @task US_013 TASK_001
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { bookAppointment, joinWaitlist } from '../services/appointmentService';
import type {
  BookAppointmentRequest,
  BookAppointmentResponse,
  JoinWaitlistRequest,
  WaitlistEntry,
  Slot,
} from '../types/appointment.types';
import { slotsKeys } from './useSlots';

/**
 * Context for rollback on error
 */
interface BookingContext {
  previousSlots?: Slot[];
}

/**
 * Hook to book an appointment with optimistic UI updates
 * 
 * Features:
 * - Optimistic update: Marks slot as booked immediately
 * - Automatic rollback on error
 * - Refreshes slots and appointments on success
 * - Handles 409 conflict errors (slot already booked)
 * 
 * @returns Mutation result with mutate function and status
 * 
 * @example
 * ```tsx
 * const bookingMutation = useBooking();
 * 
 * const handleBook = () => {
 *   bookingMutation.mutate({
 *     patientId: user.id,
 *     slotId: selectedSlot.id,
 *     notes: 'Annual checkup'
 *   }, {
 *     onSuccess: () => navigate('/dashboard'),
 *     onError: (error) => toast.error(error.message)
 *   });
 * };
 * ```
 */
export const useBooking = (): UseMutationResult<
  BookAppointmentResponse,
  Error,
  BookAppointmentRequest,
  BookingContext
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bookAppointment,

    // Optimistic update: Mark slot as booked before API responds
    onMutate: async (newBooking: BookAppointmentRequest) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: slotsKeys.all });

      // Snapshot the previous value for rollback
      const previousSlots = queryClient.getQueryData<Slot[]>(
        slotsKeys.list()
      );

      // Optimistically update the slots cache
      queryClient.setQueriesData<Slot[]>(
        { queryKey: slotsKeys.lists() },
        (old) => {
          if (!old) return old;
          
          return old.map((slot) =>
            slot.id === newBooking.slotId
              ? { ...slot, isAvailable: false }
              : slot
          );
        }
      );

      // Return context for potential rollback
      return { previousSlots };
    },

    // Rollback on error
    onError: (error, _variables, context) => {
      // Restore previous slots data
      if (context?.previousSlots) {
        queryClient.setQueryData(
          slotsKeys.list(),
          context.previousSlots
        );
      }

      // Log error for debugging
      console.error('Booking failed:', error.message);
    },

    // Sync with server on success
    onSuccess: () => {
      // Invalidate and refetch slots to get accurate availability
      queryClient.invalidateQueries({ queryKey: slotsKeys.all });
      
      // Invalidate appointments list to show new appointment
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

/**
 * Hook to join waitlist for unavailable slots
 * 
 * @returns Mutation result with mutate function and status
 * 
 * @example
 * ```tsx
 * const waitlistMutation = useWaitlist();
 * 
 * const handleJoinWaitlist = () => {
 *   waitlistMutation.mutate({
 *     patientId: user.id,
 *     preferredDate: selectedDate,
 *     departmentId: department.id,
 *     providerId: provider?.id,
 *     notes: 'Prefer morning appointments'
 *   }, {
 *     onSuccess: () => toast.success('Added to waitlist')
 *   });
 * };
 * ```
 */
export const useWaitlist = (): UseMutationResult<
  WaitlistEntry,
  Error,
  JoinWaitlistRequest
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: joinWaitlist,

    onSuccess: () => {
      // Invalidate waitlist queries to show new entry
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
    },

    onError: (error) => {
      console.error('Failed to join waitlist:', error.message);
    },
  });
};
