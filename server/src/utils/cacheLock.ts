/**
 * Distributed Cache Lock (Redis SETNX)
 *
 * Prevents cache stampedes by ensuring only one caller regenerates
 * a cache entry while all others wait for the populated value.
 *
 * @module cacheLock
 * @task US_004 TASK_002
 */

import redisClient from './redisClient';
import logger from './logger';
import { generateLockKey } from './cacheKey';

const DEFAULT_LOCK_TIMEOUT_MS = 10_000;

/**
 * Attempt to acquire a distributed lock for the given cache key.
 *
 * Uses Redis SET NX PX atomically so the lock auto-expires even
 * if the holder crashes.
 *
 * @param cacheKey - The cache key to protect
 * @param timeoutMs - Lock auto-expiry in milliseconds (default 10 s)
 * @returns `true` if lock acquired, `false` otherwise
 */
export async function acquireLock(
  cacheKey: string,
  timeoutMs: number = DEFAULT_LOCK_TIMEOUT_MS,
): Promise<boolean> {
  if (!redisClient.isAvailable) return true; // no Redis → skip locking

  const lockKey = generateLockKey(cacheKey);
  try {
    const client = redisClient.getClient();
    if (!client) return true;

    const result = await client.set(lockKey, '1', 'PX', timeoutMs, 'NX');
    return result === 'OK';
  } catch (err) {
    logger.warn('acquireLock failed – proceeding without lock', { lockKey, err });
    return true; // degrade gracefully
  }
}

/**
 * Release a previously acquired lock.
 *
 * @param cacheKey - The cache key whose lock to release
 */
export async function releaseLock(cacheKey: string): Promise<void> {
  if (!redisClient.isAvailable) return;

  const lockKey = generateLockKey(cacheKey);
  try {
    const client = redisClient.getClient();
    if (!client) return;

    await client.del(lockKey);
  } catch (err) {
    logger.warn('releaseLock failed', { lockKey, err });
  }
}
