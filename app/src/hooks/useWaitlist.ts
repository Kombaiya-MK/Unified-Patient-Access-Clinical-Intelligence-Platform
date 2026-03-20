/**
 * useWaitlist Hook
 * 
 * Custom hook for waitlist API integration and state management.
 * Provides methods to join waitlist, cancel waitlist, and fetch entries.
 * Uses WaitlistContext for global state management.
 * 
 * Features:
 * - Join waitlist with department/provider/date criteria
 * - Cancel waitlist entry with confirmation
 * - Fetch active waitlist entries
 * - Loading and error states
 * - Optimistic UI updates
 * - Toast notifications for feedback
 * 
 * @module useWaitlist
 * @created 2026-03-19
 * @task US_015 TASK_003
 */

import { useState, useCallback } from 'react';
import { useWaitlistContext } from '../context/WaitlistContext';
import type { JoinWaitlistRequest, WaitlistEntry } from '../context/WaitlistContext';

/**
 * Join waitlist result
 */
export interface JoinWaitlistResult {
  /** Whether join operation was successful */
  success: boolean;
  /** Created waitlist entry (on success) */
  entry?: WaitlistEntry;
  /** Error message (on failure) */
  error?: string;
  /** Whether duplicate entry error occurred */
  isDuplicate?: boolean;
}

/**
 * Cancel waitlist result
 */
export interface CancelWaitlistResult {
  /** Whether cancel operation was successful */
  success: boolean;
  /** Error message (on failure) */
  error?: string;
}

/**
 * useWaitlist Hook Return Type
 */
export interface UseWaitlistReturn {
  /** Active waitlist entries */
  entries: WaitlistEntry[];
  /** Join waitlist with criteria */
  join: (data: JoinWaitlistRequest) => Promise<JoinWaitlistResult>;
  /** Cancel waitlist entry */
  cancel: (waitlistId: number) => Promise<CancelWaitlistResult>;
  /** Refresh waitlist entries */
  refresh: () => Promise<void>;
  /** Whether operation is in progress */
  loading: boolean;
  /** Error from last operation */
  error: string | null;
}

/**
 * useWaitlist Hook
 * 
 * Provides waitlist operations with state management and error handling.
 * Must be used within WaitlistProvider component tree.
 * 
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const { entries, join, cancel, loading } = useWaitlist();
 * 
 *   const handleJoinWaitlist = async () => {
 *     const result = await join({
 *       departmentId: 1,
 *       providerId: 5,
 *       requestedDate: '2026-03-25',
 *     });
 * 
 *     if (result.success) {
 *       toast.success('Added to waitlist!');
 *     } else if (result.isDuplicate) {
 *       toast.warning('You are already on this waitlist');
 *     } else {
 *       toast.error(result.error);
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       {loading && <Spinner />}
 *       <button onClick={handleJoinWaitlist}>Join Waitlist</button>
 *       {entries.map(entry => (
 *         <div key={entry.id}>
 *           {entry.departmentName} - {entry.requestedDate}
 *           <button onClick={() => cancel(entry.id)}>Cancel</button>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * };
 * ```
 */
export const useWaitlist = (): UseWaitlistReturn => {
  const {
    waitlistEntries,
    joinWaitlist,
    cancelWaitlist,
    refreshWaitlist,
    loading: contextLoading,
    error: contextError,
  } = useWaitlistContext();

  const [operationLoading, setOperationLoading] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);

  /**
   * Join waitlist with specified criteria
   * 
   * @param data - Waitlist join request data
   * @returns Promise with success status, entry, and error details
   */
  const join = useCallback(
    async (data: JoinWaitlistRequest): Promise<JoinWaitlistResult> => {
      setOperationLoading(true);
      setOperationError(null);

      try {
        const result = await joinWaitlist(data);

        if (result.success) {
          return {
            success: true,
            entry: result.entry,
          };
        }

        // Check for duplicate entry error
        const isDuplicate = result.error?.toLowerCase().includes('already on') || false;

        setOperationError(result.error || 'Failed to join waitlist');

        return {
          success: false,
          error: result.error,
          isDuplicate,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
        setOperationError(errorMsg);

        return {
          success: false,
          error: errorMsg,
        };
      } finally {
        setOperationLoading(false);
      }
    },
    [joinWaitlist]
  );

  /**
   * Cancel waitlist entry by ID
   * 
   * @param waitlistId - ID of waitlist entry to cancel
   * @returns Promise with success status and error details
   */
  const cancel = useCallback(
    async (waitlistId: number): Promise<CancelWaitlistResult> => {
      setOperationLoading(true);
      setOperationError(null);

      try {
        const result = await cancelWaitlist(waitlistId);

        if (result.success) {
          return {
            success: true,
          };
        }

        setOperationError(result.error || 'Failed to cancel waitlist');

        return {
          success: false,
          error: result.error,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
        setOperationError(errorMsg);

        return {
          success: false,
          error: errorMsg,
        };
      } finally {
        setOperationLoading(false);
      }
    },
    [cancelWaitlist]
  );

  /**
   * Refresh waitlist entries from API
   */
  const refresh = useCallback(async () => {
    await refreshWaitlist();
  }, [refreshWaitlist]);

  return {
    entries: waitlistEntries,
    join,
    cancel,
    refresh,
    loading: contextLoading || operationLoading,
    error: operationError || contextError,
  };
};

/**
 * Filter active waitlist entries (status: waiting or contacted)
 * 
 * @param entries - All waitlist entries
 * @returns Active waitlist entries only
 */
export const filterActiveEntries = (entries: WaitlistEntry[]): WaitlistEntry[] => {
  return entries.filter(entry => 
    entry.status === 'waiting' || entry.status === 'contacted'
  );
};

/**
 * Check if user is already on waitlist for specific criteria
 * 
 * @param entries - All waitlist entries
 * @param departmentId - Department ID to check
 * @param requestedDate - Requested date to check
 * @param providerId - Optional provider ID to check
 * @returns True if user is already on waitlist with matching criteria
 */
export const isOnWaitlist = (
  entries: WaitlistEntry[],
  departmentId: number,
  requestedDate: string,
  providerId?: number | null
): boolean => {
  return entries.some(entry => 
    entry.status === 'waiting' &&
    entry.departmentId === departmentId &&
    entry.requestedDate === requestedDate &&
    (providerId === undefined || providerId === null || entry.providerId === providerId)
  );
};

export default useWaitlist;
