/**
 * Appointment Context
 * 
 * Global appointment state management using React Context API.
 * Provides appointment list, add/refresh operations, and loading state.
 * 
 * Usage:
 * ```tsx
 * import { AppointmentProvider, useAppointments } from './context/AppointmentContext';
 * 
 * // Wrap app with AppointmentProvider
 * <AppointmentProvider>
 *   <App />
 * </AppointmentProvider>
 * 
 * // Use appointments in components
 * const { appointments, addAppointment, refreshAppointments, loading } = useAppointments();
 * ```
 * 
 * @module AppointmentContext
 * @created 2026-03-19
 * @task US_013 TASK_006
 */

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
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
 * Appointment context type
 */
export interface AppointmentContextType {
  /** List of user's appointments */
  appointments: Appointment[];
  /** Add new appointment to state (optimistic update) */
  addAppointment: (appointment: Appointment) => void;
  /** Update existing appointment in state (for rescheduling) */
  updateAppointment: (updatedAppointment: Appointment) => void;
  /** Refresh appointments from API */
  refreshAppointments: () => Promise<void>;
  /** Whether appointments are being loaded */
  loading: boolean;
  /** Error message from last operation */
  error: string | null;
}

/**
 * Appointment context
 * Provides global appointment state to all components
 */
export const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

/**
 * AppointmentProvider Props
 */
interface AppointmentProviderProps {
  children: ReactNode;
}

/**
 * Appointment Provider Component
 * 
 * Wraps the application and provides appointment context.
 * Automatically fetches appointments on mount.
 * Provides optimistic updates for instant UI feedback.
 */
export const AppointmentProvider: React.FC<AppointmentProviderProps> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Refresh appointments from API
   * Fetches all appointments for the authenticated user
   */
  const refreshAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get<{ success: boolean; appointments: Appointment[] }>(
        `${API_BASE_URL}/appointments/my`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success && response.data.appointments) {
        setAppointments(response.data.appointments);
      } else {
        setAppointments([]);
      }
    } catch (err: any) {
      console.error('Failed to load appointments:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load appointments';
      setError(errorMessage);
      
      // Set empty array on error instead of leaving stale data
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Add appointment to state (optimistic update)
   * Used for immediate UI feedback before API confirmation
   */
  const addAppointment = useCallback((appointment: Appointment) => {
    setAppointments(prev => [appointment, ...prev]);
  }, []);

  /**
   * Update appointment in state (for rescheduling)
   * Used for optimistic updates when rescheduling appointments
   */
  const updateAppointment = useCallback((updatedAppointment: Appointment) => {
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === updatedAppointment.id ? updatedAppointment : apt
      )
    );
  }, []);

  /**
   * Initialize appointments on mount
   * Only fetch if user is authenticated
   */
  useEffect(() => {
    const token = getAuthToken();
    
    if (token) {
      refreshAppointments();
    }
  }, [refreshAppointments]);

  const value: AppointmentContextType = {
    appointments,
    addAppointment,
    updateAppointment,
    refreshAppointments,
    loading,
    error,
  };

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
};

/**
 * Hook to use appointment context
 * 
 * @throws Error if used outside AppointmentProvider
 * @returns Appointment context value
 * 
 * @example
 * ```tsxupdateAppointment, refreshAppointments, loading } = useAppointments();
 * 
 * // Display appointments
 * {appointments.map(apt => <AppointmentCard key={apt.id} appointment={apt} />)}
 * 
 * // Add new appointment (optimistic)
 * addAppointment(newAppointment);
 * 
 * // Update appointment (for rescheduling)
 * updateAppointment(updatedment (optimistic)
 * addAppointment(newAppointment);
 * 
 * // Refresh from server
 * await refreshAppointments();
 * ```
 */
export const useAppointments = (): AppointmentContextType => {
  const context = useContext(AppointmentContext);
  
  if (!context) {
    throw new Error('useAppointments must be used within AppointmentProvider');
  }
  
  return context;
};
