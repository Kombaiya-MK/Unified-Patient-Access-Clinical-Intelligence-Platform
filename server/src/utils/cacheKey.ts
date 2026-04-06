/**
 * Cache Key Generation Utilities
 *
 * Deterministic key builders for Redis cache entries.
 * Format: `{domain}:{param1}:{param2}:...`
 *
 * @module cacheKey
 * @task US_004 TASK_002
 */

/**
 * Generate a deterministic cache key for time slot queries.
 *
 * @param date       - Slot date  (YYYY-MM-DD)
 * @param providerId - Provider UUID or 'all'
 * @param deptId     - Department UUID or 'all'
 * @returns Cache key string e.g. `timeslots:2026-04-01:abc-123:dept-456`
 */
export function generateTimeslotKey(
  date: string,
  providerId?: string,
  deptId?: string,
): string {
  return `timeslots:${date}:${providerId || 'all'}:${deptId || 'all'}`;
}

/**
 * Generate a lock key for a given cache key.
 *
 * @param cacheKey - The cache key to lock
 * @returns Lock key string e.g. `lock:timeslots:2026-04-01:abc-123:dept-456`
 */
export function generateLockKey(cacheKey: string): string {
  return `lock:${cacheKey}`;
}
