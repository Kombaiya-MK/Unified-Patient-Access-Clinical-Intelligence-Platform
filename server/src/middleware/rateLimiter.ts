import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClientManager from '../utils/redisClient';
import logger from '../utils/logger';
import { Request, Response } from 'express';

/**
 * Global Rate Limiter Middleware
 * 
 * Applied to all API endpoints to prevent abuse
 * Limits: 100 requests per 15 minutes per IP address
 * 
 * Standards:
 * - Uses Redis for distributed rate limiting (scales across servers)
 * - Sends standard RateLimit-* headers (RFC draft)
 * - Graceful fallback if Redis unavailable (in-memory store)
 * 
 * Headers sent:
 * - RateLimit-Limit: Maximum requests allowed
 * - RateLimit-Remaining: Requests remaining
 * - RateLimit-Reset: Unix timestamp when limit resets
 * - Retry-After: Seconds until limit resets (when exceeded)
 */

/**
 * Rate limit configuration
 */
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // 100 requests per window

/**
 * Create rate limiter with Redis store
 */
export const globalRateLimiter = rateLimit({
  // Time window: 15 minutes
  windowMs: WINDOW_MS,

  // Max requests per window
  max: MAX_REQUESTS,

  // Error message when limit exceeded
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again later.',
    retryAfter: Math.ceil(WINDOW_MS / 1000),
  },

  // Send standard RateLimit-* headers (RFC draft)
  standardHeaders: true,

  // Don't send legacy X-RateLimit-* headers
  legacyHeaders: false,

  // Key generator: use IP address
  keyGenerator: (req: Request) => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    return ip;
  },

  // Custom handler for rate limit exceeded
  handler: (req: Request, res: Response) => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    
    logger.warn('Global rate limit exceeded', {
      ip,
      path: req.path,
      method: req.method,
    });

    // Log to audit logs
    logRateLimitExceeded(ip, req.path, MAX_REQUESTS);

    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP. Please try again later.',
      retryAfter: Math.ceil(WINDOW_MS / 1000), // seconds
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
        prefix: 'ratelimit:global:',
      })
    : undefined, // Falls back to in-memory store if Redis unavailable
});

/**
 * Check if an IP is whitelisted
 * Whitelisted IPs bypass rate limiting
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

  // Check localhost
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
    // Only whitelist localhost in development
    return process.env.NODE_ENV === 'development';
  }

  return false;
};

/**
 * Log rate limit exceeded event to audit logs
 * @param ip - IP address that exceeded limit
 * @param endpoint - Endpoint being accessed
 * @param limit - Rate limit threshold
 */
const logRateLimitExceeded = async (
  ip: string,
  endpoint: string,
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
        NULL,
        NULL,
        NULL,
        $2,
        NOW()
      )
    `;

    const metadata = {
      endpoint,
      limit,
      type: 'global',
      timestamp: new Date().toISOString(),
    };

    await pool.query(query, [ip, JSON.stringify(metadata)]);
  } catch (error) {
    logger.error('Error logging rate limit exceeded', { ip, endpoint, error });
  }
};

export default globalRateLimiter;
