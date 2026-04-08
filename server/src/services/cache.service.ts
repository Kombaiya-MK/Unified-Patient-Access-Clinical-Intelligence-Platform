import redisClient from '../utils/redisClient';
import logger from '../utils/logger';
import { cacheHits, cacheMisses } from '../utils/metricsRegistry';

/**
 * Application-level caching service that wraps the Redis client singleton.
 *
 * Features:
 * - Type-safe get/set with automatic JSON serialisation
 * - Prometheus cache-hit / cache-miss counters
 * - Graceful fallback: cache failures never propagate to callers
 * - Pattern-based invalidation
 *
 * Standard TTLs (seconds):
 *   Provider schedules  → 300  (5 min)
 *   Patient profiles    → 60   (1 min)
 *   Appointment slots   → 120  (2 min)
 */

/** Default TTLs in seconds, keyed by cache domain. */
export const CACHE_TTLS = {
  providerSchedule: 300,
  patientProfile: 60,
  appointmentSlots: 120,
} as const;

class CacheService {
  /**
   * Retrieve a cached value. Returns `null` on miss or if Redis is down.
   */
  async get<T>(key: string): Promise<T | null> {
    if (!redisClient.isAvailable) return null;

    try {
      const raw = await redisClient.get(key);
      if (raw === null) {
        cacheMisses.inc({ cache_key_type: this.keyType(key) });
        return null;
      }
      cacheHits.inc({ cache_key_type: this.keyType(key) });
      return JSON.parse(raw) as T;
    } catch (err) {
      logger.warn('CacheService.get failed – fallback to DB', { key, err });
      return null;
    }
  }

  /**
   * Store a value in the cache with a mandatory TTL (seconds).
   */
  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!redisClient.isAvailable) return;

    try {
      await redisClient.set(key, JSON.stringify(value), { ttl: ttlSeconds });
    } catch (err) {
      logger.warn('CacheService.set failed', { key, err });
    }
  }

  /**
   * Delete a single key from the cache.
   */
  async invalidate(key: string): Promise<void> {
    if (!redisClient.isAvailable) return;

    try {
      await redisClient.del(key);
    } catch (err) {
      logger.warn('CacheService.invalidate failed', { key, err });
    }
  }

  /**
   * Extract a short label from the cache key for Prometheus labels.
   * e.g. "schedule:provider:5:date:2026-04-01" → "schedule"
   */
  private keyType(key: string): string {
    const idx = key.indexOf(':');
    return idx > 0 ? key.substring(0, idx) : 'other';
  }
}

export const cacheService = new CacheService();
export default cacheService;
