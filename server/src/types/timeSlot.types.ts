/**
 * Time Slot Caching Types
 *
 * TypeScript interfaces for time slot availability caching,
 * query parameters, and cache statistics tracking.
 *
 * @module timeSlot.types
 * @task US_004 TASK_002
 */

/**
 * Time slot retrieved from database / cache
 */
export interface TimeSlot {
  id: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  providerId: string;
  departmentId: string;
  providerName?: string;
  departmentName?: string;
}

/**
 * Query parameters for time slot lookup
 */
export interface TimeSlotQuery {
  date: string;
  providerId?: string;
  departmentId?: string;
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  missRate: number;
  lockWaits: number;
  totalRequests: number;
}

/**
 * Result wrapper indicating cache status
 */
export interface CachedResult<T> {
  data: T;
  cached: boolean;
  responseTimeMs: number;
}
