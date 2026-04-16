/**
 * Waitlist Context
 * 
 * Global waitlist state management using React Context API.
 * Provides waitlist entries, join/cancel operations, and loading state.
 * 
 * Usage:
 * ```tsx
 * import { WaitlistProvider, useWaitlistContext } from './context/WaitlistContext';
 * 
 * // Wrap app with WaitlistProvider
 * <WaitlistProvider>
 *   <App />
 * </WaitlistProvider>
 * 
 * // Use waitlist in components
 * const { waitlistEntries, joinWaitlist, cancelWaitlist, loading } = useWaitlistContext();
 * ```
 * 
 * @module WaitlistContext
 * @created 2026-03-19
 * @task US_015 TASK_003
 */

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { getToken } from '../utils/storage/tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Waitlist entry interface
 */
export interface WaitlistEntry {
  /** Unique waitlist entry ID */
  id: number;
  /** Patient ID */
  patientId: number;
  /** Department ID */
  departmentId: number;
  /** Provider ID (optional) */
  providerId?: number | null;
  /** Requested appointment date */
  requestedDate: string; // ISO date string (YYYY-MM-DD)
  /** Preferred time start (optional) */
  preferredTimeStart?: string | null; // HH:MM:SS format
  /** Preferred time end (optional) */
  preferredTimeEnd?: string | null; // HH:MM:SS format
  /** Status: waiting, contacted, scheduled, cancelled, expired */
  status: 'waiting' | 'contacted' | 'scheduled' | 'cancelled' | 'expired';
  /** Priority level (1-10, 10 = highest) */
  priority: number;
  /** Department name */
  departmentName?: string;
  /** Provider name */
  providerName?: string;
  /** Created timestamp */
  createdAt: string; // ISO timestamp
  /** Updated timestamp */
  updatedAt: string; // ISO timestamp
}

/**
 * Join waitlist request data
 */
export interface JoinWaitlistRequest {
  /** Department ID */
  departmentId: number;
  /** Provider ID (optional) */
  providerId?: number | null;
  /** Preferred appointment date (ISO format YYYY-MM-DD) */
  preferredDate: string;
  /** Notes (optional) */
  notes?: string;
}

/**
 * Get authorization token from storage
 */
const getAuthToken = (): string | null => {
  return getToken();
};

/**
 * Waitlist context type
 */
export interface WaitlistContextType {
  /** List of user's waitlist entries */
  waitlistEntries: WaitlistEntry[];
  /** Join waitlist with specified criteria */
  joinWaitlist: (data: JoinWaitlistRequest) => Promise<{ success: boolean; entry?: WaitlistEntry; error?: string }>;
  /** Cancel waitlist entry by ID */
  cancelWaitlist: (waitlistId: number) => Promise<{ success: boolean; error?: string }>;
  /** Refresh waitlist entries from API */
  refreshWaitlist: () => Promise<void>;
  /** Whether waitlist data is being loaded */
  loading: boolean;
  /** Error message from last operation */
  error: string | null;
}

/**
 * Waitlist context
 * Provides global waitlist state to all components
 */
export const WaitlistContext = createContext<WaitlistContextType | undefined>(undefined);

/**
 * WaitlistProvider Props
 */
interface WaitlistProviderProps {
  children: ReactNode;
}

/**
 * Waitlist Provider Component
 * 
 * Wraps the application and provides waitlist context.
 * Automatically fetches waitlist entries on mount.
 * Provides optimistic updates for instant UI feedback.
 */
export const WaitlistProvider: React.FC<WaitlistProviderProps> = ({ children }) => {
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Refresh waitlist entries from API
   * Fetches all waitlist entries for the authenticated user
   */
  const refreshWaitlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get<{ success: boolean; waitlist: WaitlistEntry[] }>(
        `${API_BASE_URL}/waitlist/my`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setWaitlistEntries(response.data.waitlist);
      }
    } catch (err) {
      // Silently handle 404 (endpoint may not exist) and 401 (not authenticated)
      if (axios.isAxiosError(err) && (err.response?.status === 404 || err.response?.status === 401)) {
        setWaitlistEntries([]);
        return;
      }
      const errorMsg = axios.isAxiosError(err) 
        ? err.response?.data?.error || err.message 
        : 'Failed to fetch waitlist';
      setError(errorMsg);
      console.error('Error fetching waitlist:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Join waitlist with specified criteria
   * 
   * @param data - Waitlist join request data
   * @returns Promise with success status and entry data or error
   */
  const joinWaitlist = useCallback(async (data: JoinWaitlistRequest): Promise<{ success: boolean; entry?: WaitlistEntry; error?: string }> => {
    setError(null);
    
    try {
      const token = getAuthToken();
      
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      const response = await axios.post<{ success: boolean; entry: WaitlistEntry; message?: string }>(
        `${API_BASE_URL}/waitlist`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success && response.data.entry) {
        // Optimistic update: Add entry to state immediately
        setWaitlistEntries(prev => [response.data.entry, ...prev]);
        return { success: true, entry: response.data.entry };
      }

      return { success: false, error: 'Unknown error occurred' };
    } catch (err) {
      let errorMsg = 'Failed to join waitlist';
      
      if (axios.isAxiosError(err)) {
        // Check for duplicate entry error
        if (err.response?.status === 409) {
          errorMsg = 'You are already on this waitlist';
        } else {
          errorMsg = err.response?.data?.error || err.message || errorMsg;
        }
      }
      
      setError(errorMsg);
      console.error('Error joining waitlist:', err);
      
      return { success: false, error: errorMsg };
    }
  }, []);

  /**
   * Cancel waitlist entry by ID
   * 
   * @param waitlistId - ID of waitlist entry to cancel
   * @returns Promise with success status or error
   */
  const cancelWaitlist = useCallback(async (waitlistId: number): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    
    try {
      const token = getAuthToken();
      
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      const response = await axios.delete<{ success: boolean; message?: string }>(
        `${API_BASE_URL}/waitlist/${waitlistId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Optimistic update: Remove entry from state immediately
        setWaitlistEntries(prev => prev.filter(entry => entry.id !== waitlistId));
        return { success: true };
      }

      return { success: false, error: 'Unknown error occurred' };
    } catch (err) {
      const errorMsg = axios.isAxiosError(err) 
        ? err.response?.data?.error || err.message 
        : 'Failed to cancel waitlist';
      
      setError(errorMsg);
      console.error('Error cancelling waitlist:', err);
      
      return { success: false, error: errorMsg };
    }
  }, []);

  // Fetch waitlist entries on mount
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      refreshWaitlist();
    }
  }, [refreshWaitlist]);

  const value: WaitlistContextType = {
    waitlistEntries,
    joinWaitlist,
    cancelWaitlist,
    refreshWaitlist,
    loading,
    error,
  };

  return (
    <WaitlistContext.Provider value={value}>
      {children}
    </WaitlistContext.Provider>
  );
};

/**
 * useWaitlistContext Hook
 * 
 * Custom hook to access waitlist context.
 * Must be used within WaitlistProvider.
 * 
 * @throws Error if used outside WaitlistProvider
 * 
 * @example
 * ```tsx
 * const { waitlistEntries, joinWaitlist, loading } = useWaitlistContext();
 * 
 * const handleJoin = async () => {
 *   const result = await joinWaitlist({
 *     departmentId: 1,
 *     requestedDate: '2026-03-25',
 *   });
 *   if (result.success) {
 *     console.log('Joined waitlist:', result.entry);
 *   }
 * };
 * ```
 */
export const useWaitlistContext = (): WaitlistContextType => {
  const context = useContext(WaitlistContext);
  
  if (!context) {
    throw new Error('useWaitlistContext must be used within a WaitlistProvider');
  }
  
  return context;
};
