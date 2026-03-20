import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClientManager from '../utils/redisClient';
import logger from '../utils/logger';
import { Request, Response } from 'express';

/**
 * Login-Specific Rate Limiter Middleware
 * 
 * Protects against brute force attacks on login endpoint
 * Limits: 5 failed login attempts per 15 minutes per IP address
 * 
 * Features:
 * - Stricter than global rate limiter (5 vs 100 requests)
 * - Only counts failed login attempts (not successful logins)
 * - Provides clear retry-after information
 * - Logs security events to audit logs
 * 
 * Combined with:
 * - Progressive delays (exponential backoff)
 * - Email-based tracking (detect distributed attacks)
 * - Account lockout (10 attempts per email in 1 hour)
 */

/**
 * Rate limit configuration
 */
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5; // 5 failed attempts per window

/**
 * Calculate minutes until reset
 */
const getMinutesUntilReset = (): number => {
  return Math.ceil(WINDOW_MS / 1000 / 60);
};

/**
 * Create rate limiter for login endpoint
 */
export const loginRateLimiter = rateLimit({
  // Time window: 15 minutes
  windowMs: WINDOW_MS,

  // Max failed attempts per window
  max: MAX_ATTEMPTS,

  // Error message when limit exceeded
  message: {
    success: false,
    error: `Too many login attempts. Please try again in ${getMinutesUntilReset()} minutes.`,
    retryAfter: Math.ceil(WINDOW_MS / 1000),
  },

  // Send standard RateLimit-* headers
  standardHeaders: true,

  // Don't send legacy headers
  legacyHeaders: false,

  // Only count failed requests (status >= 400)
  // Successful logins don't count toward limit
  skipSuccessfulRequests: true,

  // Key generator: use IP address
  keyGenerator: (req: Request) => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    return ip;
  },

  // Custom handler for rate limit exceeded
  handler: (req: Request, res: Response) => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const email = req.body?.email || 'unknown';

    logger.warn('Login rate limit exceeded', {
      ip,
      email,
      attempts: MAX_ATTEMPTS,
    });

    // Log to audit logs
    logLoginRateLimitExceeded(ip, email, MAX_ATTEMPTS);

    // Calculate reset time
    const resetTime = new Date(Date.now() + WINDOW_MS);
    const retryAfterSeconds = Math.ceil(WINDOW_MS / 1000);

    // Set Retry-After header (seconds until reset)
    res.set('Retry-After', String(retryAfterSeconds));

    res.status(429).json({
      success: false,
      error: `Too many login attempts. Please try again in ${getMinutesUntilReset()} minutes.`,
      retryAfter: retryAfterSeconds,
      resetTime: resetTime.toISOString(),
      timestamp: new Date().toISOString(),
    });
  },

  // Skip rate limiting for certain conditions
  skip: (req: Request) => {
    // Check if IP is whitelisted
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    return isWhitelisted(ip);
  },

  // Redis store configuration
  store: redisClientManager.isAvailable
    ? new RedisStore({
        // @ts-ignore - RedisStore expects different client type
        client: redisClientManager,
        prefix: 'ratelimit:login:',
      })
    : undefined, // Falls back to in-memory store if Redis unavailable
});

/**
 * Check if an IP is whitelisted
 * @param ip - IP address to check
 * @returns true if whitelisted, false otherwise
 */
const isWhitelisted = (ip: string): boolean => {
  // Whitelist configuration from environment
  const whitelist = process.env.RATE_LIMIT_WHITELIST || '';
  const whitelistedIPs = whitelist.split(',').map((ip) => ip.trim()).filter(Boolean);

  // Check exact match
  if (whitelistedIPs.includes(ip)) {
    return true;
  }

  // Check localhost (only in development)
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
    return process.env.NODE_ENV === 'development';
  }

  return false;
};

/**
 * Log login rate limit exceeded event to audit logs
 * @param ip - IP address that exceeded limit
 * @param email - Email attempted
 * @param limit - Rate limit threshold
 */
const logLoginRateLimitExceeded = async (
  ip: string,
  email: string,
  limit: number,
): Promise<void> => {
  try {
    // Import here to avoid circular dependency
    const { pool } = await import('../config/database');

    const query = `
      INSERT INTO audit_logs (
        user_id,
        action,
        ip_address,
        user_agent,
        table_name,
        record_id,
        old_values,
        new_values,
        created_at
      ) VALUES (
        NULL,
        'RATE_LIMIT_EXCEEDED',
        $1,
        'System',
        'users',
        NULL,
        NULL,
        $2,
        NOW()
      )
    `;

    const metadata = {
      endpoint: '/api/auth/login',
      email,
      limit,
      type: 'login',
      timestamp: new Date().toISOString(),
    };

    await pool.query(query, [ip, JSON.stringify(metadata)]);

    logger.info('Login rate limit logged to audit_logs', {
      ip,
      email,
      limit,
    });
  } catch (error) {
    logger.error('Error logging login rate limit exceeded', { ip, email, error });
  }
};

/**
 * Additional rate limiter for registration endpoint
 * Same configuration as login rate limiter
 */
export const registerRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_ATTEMPTS,
  message: {
    success: false,
    error: `Too many registration attempts. Please try again in ${getMinutesUntilReset()} minutes.`,
    retryAfter: Math.ceil(WINDOW_MS / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req: Request) => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    return ip;
  },
  skip: (req: Request) => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    return isWhitelisted(ip);
  },
  store: redisClientManager.isAvailable
    ? new RedisStore({
        // @ts-ignore
        client: redisClientManager,
        prefix: 'ratelimit:register:',
      })
    : undefined,
});

/**
 * Rate limiter for password reset endpoint
 * Stricter to prevent email enumeration
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 3, // Only 3 attempts every 15 minutes
  message: {
    success: false,
    error: `Too many password reset attempts. Please try again in ${getMinutesUntilReset()} minutes.`,
    retryAfter: Math.ceil(WINDOW_MS / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    return ip;
  },
  skip: (req: Request) => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    return isWhitelisted(ip);
  },
  store: redisClientManager.isAvailable
    ? new RedisStore({
        // @ts-ignore
        client: redisClientManager,
        prefix: 'ratelimit:password-reset:',
      })
    : undefined,
});

export default {
  loginRateLimiter,
  registerRateLimiter,
  passwordResetRateLimiter,
};
