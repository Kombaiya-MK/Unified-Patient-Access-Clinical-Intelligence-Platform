/**
 * useBookingConfirmation Hook
 * 
 * Custom hook for handling appointment booking flow and confirmation.
 * Manages booking state, API calls, calendar sync retry, and optimistic updates.
 * 
 * Features:
 * - Book appointment with calendar sync option
 * - Track booking status (loading, success, error)
 * - Store confirmation data for modal display
 * - Retry calendar sync on failure
 * - Optimistic UI updates to appointment list
 * 
 * @module useBookingConfirmation
 * @created 2026-03-19
 * @task US_013 TASK_006
 */

import { useState } from 'react';
import axios from 'axios';
import { useAppointments } from '../context/AppointmentContext';
import type { Appointment } from '../types/appointment.types';
import { getToken } from '../utils/storage/tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Get authorization token from storage
 */
const getAuthToken = (): string | null => {
  return getToken();
};

/**
 * Booking request data
 */
export interface BookingData {
  slotId: string;
  notes?: string;
  syncCalendar?: boolean;
  calendarProvider?: 'google' | 'outlook';
}

/**
 * Calendar sync status
 */
export interface CalendarSyncStatus {
  attempted: boolean;
  success: boolean;
  error?: string;
}

/**
 * Booking API response
 */
interface BookingResponse {
  success: boolean;
  appointmentId?: string;
  appointment?: Appointment;
  emailQueued?: boolean;
  calendarSyncAttempted?: boolean;
  message?: string;
}

/**
 * Calendar sync API response
 */
interface CalendarSyncResponse {
  success: boolean;
  eventId?: string;
  message?: string;
}

/**
 * Booking result
 */
export interface BookingResult {
  success: boolean;
  appointment?: Appointment & { calendarSyncStatus?: CalendarSyncStatus };
  error?: string;
}

/**
 * Hook for booking confirmation flow
 */
export const useBookingConfirmation = () => {
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<(Appointment & { calendarSyncStatus?: CalendarSyncStatus }) | null>(null);
  
  const { addAppointment } = useAppointments();

  /**
   * Book an appointment
   * 
   * @param bookingData - Booking request data
   * @returns Booking result with success flag and appointment data
   */
  const bookAppointment = async (bookingData: BookingData): Promise<BookingResult> => {
    setBooking(true);
    setError(null);

    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      const response = await axios.post<BookingResponse>(
        `${API_BASE_URL}/appointments`,
        bookingData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success && response.data.appointment) {
        const appointment = response.data.appointment;
        
        // Determine calendar sync status
        const calendarSyncStatus: CalendarSyncStatus = {
          attempted: response.data.calendarSyncAttempted || false,
          success: response.data.calendarSyncAttempted || false,
          error: undefined,
        };

        // Combine appointment with sync status
        const appointmentWithStatus = {
          ...appointment,
          calendarSyncStatus,
        };

        // Store confirmation for modal display
        setConfirmation(appointmentWithStatus);
        
        // Optimistic update: Add to appointment list immediately
        addAppointment(appointment);

        return {
          success: true,
          appointment: appointmentWithStatus,
        };
      } else {
        const errorMessage = response.data.message || 'Booking failed';
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error('Booking error:', err);
      
      let errorMessage = 'Failed to book appointment';
      
      if (err.response) {
        // API error response
        if (err.response.status === 409) {
          errorMessage = 'This slot was just taken. Please select another time.';
        } else if (err.response.status === 404) {
          errorMessage = 'Time slot not found. Please refresh and try again.';
        } else if (err.response.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else {
          errorMessage = err.response.data?.message || errorMessage;
        }
      } else if (err.request) {
        // Network error
        errorMessage = 'Network error. Please check your connection.';
      } else {
        // Other error
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setBooking(false);
    }
  };

  /**
   * Retry calendar sync for an appointment
   * 
   * @param appointmentId - Appointment ID
   * @param provider - Calendar provider ('google' or 'outlook')
   * @returns Sync result with success flag
   */
  const retryCalendarSync = async (
    appointmentId: string,
    provider: 'google' | 'outlook'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post<CalendarSyncResponse>(
        `${API_BASE_URL}/calendar/sync`,
        {
          appointmentId,
          provider,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        // Update confirmation calendar sync status
        if (confirmation) {
          setConfirmation({
            ...confirmation,
            calendarSyncStatus: {
              attempted: true,
              success: true,
              error: undefined,
            },
          });
        }

        return { success: true };
      } else {
        throw new Error(response.data.message || 'Calendar sync failed');
      }
    } catch (err: any) {
      console.error('Calendar sync retry error:', err);
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to sync calendar';
      
      // Update confirmation with error
      if (confirmation) {
        setConfirmation({
          ...confirmation,
          calendarSyncStatus: {
            attempted: true,
            success: false,
            error: errorMessage,
          },
        });
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  /**
   * Close confirmation modal
   * Clears confirmation and error state
   */
  const closeConfirmation = () => {
    setConfirmation(null);
    setError(null);
  };

  return {
    booking,
    error,
    confirmation,
    bookAppointment,
    retryCalendarSync,
    closeConfirmation,
  };
};
