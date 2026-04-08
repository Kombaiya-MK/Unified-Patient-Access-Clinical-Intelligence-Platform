/**
 * useStaffBooking Hook
 * 
 * Custom hook for staff-assisted appointment booking.
 * Handles the POST request to /api/staff/appointments/book
 * with success/error state management.
 * 
 * @module useStaffBooking
 * @created 2026-04-01
 * @task US_023 TASK_004
 */

import { useState, useCallback } from 'react';
import { getToken } from '../utils/storage/tokenStorage';
import type { StaffBookingFormData, StaffBookingResponse } from '../types/staffBooking.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface UseStaffBookingReturn {
  /** Submit a staff booking */
  bookAppointment: (data: StaffBookingFormData) => Promise<StaffBookingResponse | null>;
  /** Whether a booking request is in progress */
  loading: boolean;
  /** Error message from last failed attempt */
  error: string | null;
  /** Success response from last successful booking */
  success: StaffBookingResponse | null;
  /** Clear success state */
  clearSuccess: () => void;
  /** Clear error state */
  clearError: () => void;
}

export function useStaffBooking(): UseStaffBookingReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<StaffBookingResponse | null>(null);

  const clearSuccess = useCallback(() => setSuccess(null), []);
  const clearError = useCallback(() => setError(null), []);

  const bookAppointment = useCallback(
    async (data: StaffBookingFormData): Promise<StaffBookingResponse | null> => {
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/staff/appointments/book`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            patientId: data.patientId,
            slotId: data.slotId,
            appointmentType: data.appointmentType,
            reasonForVisit: data.reasonForVisit || undefined,
            staffBookingNotes: data.staffBookingNotes || undefined,
            bookingPriority: data.bookingPriority,
            overrideCapacity: data.overrideCapacity,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const message =
            response.status === 409
              ? errorData.message || 'Slot unavailable. Enable override if urgent.'
              : errorData.message || 'Failed to book appointment';
          throw new Error(message);
        }

        const result: StaffBookingResponse = await response.json();
        setSuccess(result);
        return result;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    bookAppointment,
    loading,
    error,
    success,
    clearSuccess,
    clearError,
  };
}
