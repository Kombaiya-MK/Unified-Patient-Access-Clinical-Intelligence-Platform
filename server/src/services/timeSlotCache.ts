/**
 * Time Slot Cache Service
 *
 * Implements cache-aside pattern with distributed locking for
 * time slot availability queries.
 *
 * Flow:
 * 1. Check Redis for cached data
 * 2. On HIT  → return immediately
 * 3. On MISS → acquire lock → query DB → cache with 5-min TTL → release lock
 * 4. On lock contention → wait 100 ms then retry cache lookup
 * 5. On Redis failure → fall through to database directly
 *
 * @module timeSlotCache
 * @task US_004 TASK_002
 */

import redisClient from '../utils/redisClient';
import logger from '../utils/logger';
import { generateTimeslotKey } from '../utils/cacheKey';
import { acquireLock, releaseLock } from '../utils/cacheLock';
import { getAvailableTimeSlots } from './timeSlotService';
import type { TimeSlot, TimeSlotQuery, CachedResult } from '../types/timeSlot.types';

const CACHE_TTL_SECONDS = 300; // 5 minutes
const LOCK_RETRY_DELAY_MS = 100;
const MAX_LOCK_RETRIES = 30; // 3 s total wait

/**
 * Get time slots, preferring Redis cache and falling back to database.
 *
 * @param query - Date / provider / department filters
 * @returns Wrapped result with cache metadata
 */
export async function getCachedTimeSlots(
  query: TimeSlotQuery,
): Promise<CachedResult<TimeSlot[]>> {
  const start = Date.now();
  const cacheKey = generateTimeslotKey(query.date, query.providerId, query.departmentId);

  // ── 1. Try cache ──────────────────────────────────────────
  if (redisClient.isAvailable) {
    try {
      const raw = await redisClient.get(cacheKey);
      if (raw !== null) {
        logger.debug(`Cache HIT: ${cacheKey}`);
        return { data: JSON.parse(raw), cached: true, responseTimeMs: Date.now() - start };
      }
      logger.debug(`Cache MISS: ${cacheKey}, querying database...`);
    } catch {
      logger.warn('Cache read failed – falling back to DB');
    }
  }

  // ── 2. Acquire lock (stampede prevention) ─────────────────
  const gotLock = await acquireLock(cacheKey);

  if (!gotLock) {
    // Another caller is populating the cache; wait and retry the read
    for (let i = 0; i < MAX_LOCK_RETRIES; i++) {
      await delay(LOCK_RETRY_DELAY_MS);
      if (redisClient.isAvailable) {
        try {
          const raw = await redisClient.get(cacheKey);
          if (raw !== null) {
            logger.debug(`Cache HIT (after lock wait): ${cacheKey}`);
            return { data: JSON.parse(raw), cached: true, responseTimeMs: Date.now() - start };
          }
        } catch {
          break; // Redis error → fall through to DB
        }
      }
    }
  }

  // ── 3. Query database ─────────────────────────────────────
  try {
    const slots = await getAvailableTimeSlots(query);

    // ── 4. Populate cache ───────────────────────────────────
    if (redisClient.isAvailable) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(slots), { ttl: CACHE_TTL_SECONDS });
        logger.debug(`Cached ${slots.length} slots → ${cacheKey} (TTL ${CACHE_TTL_SECONDS}s)`);
      } catch {
        logger.warn('Cache write failed – data served from DB');
      }
    }

    return { data: slots, cached: false, responseTimeMs: Date.now() - start };
  } finally {
    if (gotLock) {
      await releaseLock(cacheKey);
    }
  }
}

/**
 * Invalidate cached time slots matching the given query.
 */
export async function invalidateTimeSlotCache(
  query: Partial<TimeSlotQuery>,
): Promise<void> {
  if (!redisClient.isAvailable) return;

  const key = generateTimeslotKey(
    query.date || '*',
    query.providerId,
    query.departmentId,
  );

  try {
    await redisClient.del(key);
    logger.debug(`Invalidated cache key: ${key}`);
  } catch (err) {
    logger.warn('timeSlotCache invalidation failed', { key, err });
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
