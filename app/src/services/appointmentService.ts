/**
 * Appointment Service
 * 
 * Service layer for appointment booking operations including fetching
 * available slots, departments, providers, and managing bookings.
 * 
 * @module appointmentService
 * @created 2026-03-18
 * @task US_013 TASK_001
 */

import axios, { AxiosError } from 'axios';
import type {
  Slot,
  Department,
  Provider,
  Appointment,
  BookAppointmentRequest,
  BookAppointmentResponse,
  JoinWaitlistRequest,
  WaitlistEntry,
  SlotFilters,
  AvailableDatesResponse,
} from '../types/appointment.types';
import { getToken } from '../utils/storage/tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Get authorization token from storage
 */
const getAuthToken = (): string | null => {
  return getToken();
};

/**
 * Create axios instance with auth headers
 */
const createAuthenticatedRequest = () => {
  const token = getAuthToken();
  return {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };
};

/**
 * Fetch available time slots with optional filters
 * 
 * @param filters - Optional filters for department, provider, date
 * @returns Array of available slots
 * @throws Error if API request fails
 */
export const getSlots = async (filters?: SlotFilters): Promise<Slot[]> => {
  try {
    const params = new URLSearchParams();
    
    if (filters?.departmentId) {
      params.append('department', filters.departmentId);
    }
    if (filters?.providerId) {
      params.append('provider', filters.providerId);
    }
    if (filters?.date) {
      params.append('date', filters.date);
    }
    if (filters?.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      params.append('endDate', filters.endDate);
    }

    const response = await axios.get(
      `${API_BASE_URL}/slots?${params.toString()}`,
      createAuthenticatedRequest()
    );

    const data = response.data;
    return data.slots || data.data || data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data?.message || 'Failed to fetch available slots');
    }
    throw error;
  }
};

/**
 * Fetch dates with available slots for calendar highlighting
 * 
 * @param filters - Optional filters for department, provider, date range
 * @returns Array of dates with available slots
 * @throws Error if API request fails
 */
export const getAvailableDates = async (filters?: SlotFilters): Promise<string[]> => {
  try {
    const params = new URLSearchParams();
    
    if (filters?.departmentId) {
      params.append('department', filters.departmentId);
    }
    if (filters?.providerId) {
      params.append('provider', filters.providerId);
    }
    if (filters?.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      params.append('endDate', filters.endDate);
    }

    const response = await axios.get<AvailableDatesResponse>(
      `${API_BASE_URL}/slots/available-dates?${params.toString()}`,
      createAuthenticatedRequest()
    );

    const data = response.data;
    return data.dates || data.data?.dates || [];
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data?.message || 'Failed to fetch available dates');
    }
    throw error;
  }
};

/**
 * Fetch all departments
 * 
 * @returns Array of departments
 * @throws Error if API request fails
 */
export const getDepartments = async (): Promise<Department[]> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/departments`,
      createAuthenticatedRequest()
    );

    const data = response.data;
    return Array.isArray(data) ? data : (data.data || []);
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data?.message || 'Failed to fetch departments');
    }
    throw error;
  }
};

/**
 * Fetch providers with optional department filter
 * 
 * @param departmentId - Optional department ID to filter providers
 * @returns Array of providers
 * @throws Error if API request fails
 */
export const getProviders = async (departmentId?: string): Promise<Provider[]> => {
  try {
    const params = departmentId ? `?department=${departmentId}` : '';
    const response = await axios.get(
      `${API_BASE_URL}/providers${params}`,
      createAuthenticatedRequest()
    );

    const data = response.data;
    return Array.isArray(data) ? data : (data.data || []);
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data?.message || 'Failed to fetch providers');
    }
    throw error;
  }
};

/**
 * Book an appointment
 * 
 * @param request - Booking request payload
 * @returns Booking response with appointment details
 * @throws Error if booking fails (includes 409 conflict for double-booked slots)
 */
export const bookAppointment = async (
  request: BookAppointmentRequest
): Promise<BookAppointmentResponse> => {
  try {
    const response = await axios.post<BookAppointmentResponse>(
      `${API_BASE_URL}/appointments`,
      request,
      createAuthenticatedRequest()
    );

    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      // Handle 409 conflict (slot already booked)
      if (error.response?.status === 409) {
        throw new Error('This slot was just taken. Please select another time.');
      }
      throw new Error(error.response?.data?.message || 'Failed to book appointment');
    }
    throw error;
  }
};

/**
 * Join waitlist for a specific date/department/provider
 * 
 * @param request - Waitlist request payload
 * @returns Waitlist entry
 * @throws Error if request fails
 */
export const joinWaitlist = async (
  request: JoinWaitlistRequest
): Promise<WaitlistEntry> => {
  try {
    const response = await axios.post<WaitlistEntry>(
      `${API_BASE_URL}/waitlist`,
      request,
      createAuthenticatedRequest()
    );

    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data?.message || 'Failed to join waitlist');
    }
    throw error;
  }
};

/**
 * Fetch patient's appointments
 * 
 * @param patientId - Patient ID
 * @returns Array of appointments
 * @throws Error if API request fails
 */
export const getPatientAppointments = async (patientId: string): Promise<Appointment[]> => {
  try {
    const response = await axios.get<Appointment[]>(
      `${API_BASE_URL}/appointments/patient/${patientId}`,
      createAuthenticatedRequest()
    );

    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data?.message || 'Failed to fetch appointments');
    }
    throw error;
  }
};

/**
 * Cancel an appointment
 * 
 * @param appointmentId - Appointment ID to cancel
 * @returns Updated appointment
 * @throws Error if cancellation fails
 */
export const cancelAppointment = async (appointmentId: string): Promise<Appointment> => {
  try {
    const response = await axios.patch<Appointment>(
      `${API_BASE_URL}/appointments/${appointmentId}/cancel`,
      {},
      createAuthenticatedRequest()
    );

    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data?.message || 'Failed to cancel appointment');
    }
    throw error;
  }
};

/**
 * Reschedule an appointment to a new time slot
 * 
 * @param appointmentId - Appointment ID to reschedule
 * @param newSlotId - New slot ID to reschedule to
 * @returns Updated appointment with new slot details
 * @throws Error if reschedule fails (includes 409 conflict, 403 max reschedules, 400 validation)
 * 
 * Error Codes:
 * - 400: Validation error (2-hour restriction, same slot, etc.)
 * - 403: Max reschedules reached (3 reschedules)
 * - 409: Slot conflict (no longer available)
 * - 404: Appointment or slot not found
 * 
 * @task US_014 TASK_001
 */
export const rescheduleAppointment = async (
  appointmentId: string,
  newSlotId: string
): Promise<Appointment> => {
  try {
    const response = await axios.put<Appointment>(
      `${API_BASE_URL}/appointments/${appointmentId}`,
      { slotId: newSlotId },
      createAuthenticatedRequest()
    );

    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.message;

      // Handle specific error codes
      if (status === 409) {
        throw new Error('This slot is no longer available. Please select another time.');
      }
      if (status === 403) {
        throw new Error(message || 'You have reached the maximum number of reschedules for this appointment.');
      }
      if (status === 400) {
        throw new Error(message || 'Cannot reschedule appointment. Please check the selected time slot.');
      }
      if (status === 404) {
        throw new Error('Appointment not found. Please refresh the page.');
      }

      throw new Error(message || 'Failed to reschedule appointment');
    }
    throw error;
  }
};
