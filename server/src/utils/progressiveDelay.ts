import { Request, Response, NextFunction } from 'express';
import redisClientManager from './redisClient';
import logger from './logger';
import { ProgressiveDelayConfig } from '../types/rateLimiter.types';

/**
 * Progressive Delay Utility
 * 
 * Implements exponential backoff delays for repeated failed login attempts
 * Delays increase exponentially: 0s, 1s, 2s, 4s, 8s, 16s, ...
 * 
 * Purpose:
 * - Slow down brute force attacks
 * - Add friction for automated attacks
 * - User-friendly for legitimate users (first few attempts fast)
 * 
 * Formula: delay = min(2^(attempts-1) * 1000ms, maxDelay)
 */

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ProgressiveDelayConfig = {
  baseDelayMs: 1000, // 1 second base delay
  maxDelayMs: 30000, // 30 seconds maximum delay
  exponentialFactor: 2, // Double each time
};

/**
 * Redis key prefix for failed attempts tracking
 */
const FAILED_ATTEMPTS_PREFIX = 'failed_attempts:';

/**
 * TTL for failed attempts counter (15 minutes = 900 seconds)
 */
const FAILED_ATTEMPTS_TTL = 900;

/**
 * Get failed attempts count for an IP address
 * @param ip - IP address to check
 * @returns Number of failed attempts
 */
export const getFailedAttempts = async (ip: string): Promise<number> => {
  try {
    if (!redisClientManager.isAvailable) {
      logger.warn('Redis unavailable - cannot track failed attempts');
      return 0;
    }

    const key = `${FAILED_ATTEMPTS_PREFIX}${ip}`;
    const attempts = await redisClientManager.get(key);

    return attempts ? parseInt(attempts, 10) : 0;
  } catch (error) {
    logger.error('Error getting failed attempts', { ip, error });
    return 0;
  }
};

/**
 * Increment failed attempts counter for an IP address
 * Sets TTL to 15 minutes
 * @param ip - IP address
 * @returns New failed attempts count
 */
export const incrementFailedAttempts = async (ip: string): Promise<number> => {
  try {
    if (!redisClientManager.isAvailable) {
      logger.warn('Redis unavailable - cannot increment failed attempts');
      return 0;
    }

    const key = `${FAILED_ATTEMPTS_PREFIX}${ip}`;
    
    // Get current count
    const currentAttempts = await getFailedAttempts(ip);
    const newAttempts = currentAttempts + 1;

    // Set new count with TTL
    await redisClientManager.set(key, String(newAttempts), {
      ttl: FAILED_ATTEMPTS_TTL,
      namespace: '',
    });

    logger.info('Failed attempt incremented', {
      ip,
      attempts: newAttempts,
    });

    return newAttempts;
  } catch (error) {
    logger.error('Error incrementing failed attempts', { ip, error });
    return 0;
  }
};

/**
 * Reset failed attempts counter for an IP address
 * Called on successful login
 * @param ip - IP address to reset
 */
export const resetFailedAttempts = async (ip: string): Promise<void> => {
  try {
    if (!redisClientManager.isAvailable) {
      return;
    }

    const key = `${FAILED_ATTEMPTS_PREFIX}${ip}`;
    await redisClientManager.del(key);

    logger.info('Failed attempts reset', { ip });
  } catch (error) {
    logger.error('Error resetting failed attempts', { ip, error });
  }
};

/**
 * Calculate delay based on failed attempts count
 * Implements exponential backoff with cap
 * @param attempts - Number of failed attempts
 * @param config - Optional configuration
 * @returns Delay in milliseconds
 */
export const calculateDelay = (
  attempts: number,
  config: ProgressiveDelayConfig = DEFAULT_CONFIG,
): number => {
  if (attempts === 0) {
    return 0;
  }

  // Exponential backoff: 2^(attempts-1) * baseDelay
  const delay = Math.pow(config.exponentialFactor, attempts - 1) * config.baseDelayMs;

  // Cap at maximum delay
  return Math.min(delay, config.maxDelayMs);
};

/**
 * Calculate delay for an IP address based on its failed attempts
 * @param ip - IP address
 * @param config - Optional configuration
 * @returns Delay in milliseconds
 */
export const calculateDelayForIP = async (
  ip: string,
  config: ProgressiveDelayConfig = DEFAULT_CONFIG,
): Promise<number> => {
  const attempts = await getFailedAttempts(ip);
  return calculateDelay(attempts, config);
};

/**
 * Apply progressive delay before processing request
 * Express middleware that delays requests based on failed attempts
 * 
 * Usage:
 *   router.post('/login', applyProgressiveDelay, authController.login)
 * 
 * Delay schedule:
 *   Attempt 1: 0ms (instant)
 *   Attempt 2: 1000ms (1 second)
 *   Attempt 3: 2000ms (2 seconds)
 *   Attempt 4: 4000ms (4 seconds)
 *   Attempt 5: 8000ms (8 seconds)
 *   Attempt 6+: Rate limited (429)
 */
export const applyProgressiveDelay = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Get IP address
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';

    // Calculate delay
    const delay = await calculateDelayForIP(ip);

    if (delay > 0) {
      logger.info('Applying progressive delay', {
        ip,
        delayMs: delay,
      });

      // Wait for the delay
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    next();
  } catch (error) {
    // Don't block request on error
    logger.error('Error applying progressive delay', { error });
    next();
  }
};

/**
 * Get delay information for debugging
 * @param ip - IP address
 * @returns Object with attempt count and calculated delay
 */
export const getDelayInfo = async (ip: string) => {
  const attempts = await getFailedAttempts(ip);
  const delay = calculateDelay(attempts);

  return {
    ip,
    attempts,
    delayMs: delay,
    delaySeconds: delay / 1000,
    nextAttemptDelay: calculateDelay(attempts + 1),
  };
};

export default {
  getFailedAttempts,
  incrementFailedAttempts,
  resetFailedAttempts,
  calculateDelay,
  calculateDelayForIP,
  applyProgressiveDelay,
  getDelayInfo,
};
