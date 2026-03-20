/**
 * Rate Limiter Utility
 * 
 * Tracks API request timestamps to enforce rate limits for calendar providers.
 * Prevents exceeding Google Calendar (10 req/sec) and Microsoft Graph (2000 req/10min) limits.
 * 
 * Features:
 * - Sliding window rate limiting per provider
 * - Request timestamp tracking
 * - Delay calculation for rate-limited requests
 * - Automatic cleanup of expired timestamps
 * 
 * @module rateLimiter
 * @created 2026-03-20
 * @task US_017 TASK_005
 */

/**
 * Rate limit configuration per provider
 */
interface RateLimitConfig {
  maxRequests: number;  // Maximum requests allowed
  windowMs: number;     // Time window in milliseconds
}

/**
 * Rate limit configurations for calendar providers
 * 
 * Google Calendar: 10 requests per second
 * Microsoft Graph: ~2000 requests per 10 minutes (200 per minute to be conservative)
 */
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  google: { 
    maxRequests: 10, 
    windowMs: 1000  // 10 req/sec
  },
  outlook: { 
    maxRequests: 200, 
    windowMs: 60000  // 200 req/min (~2000 req/10min)
  },
};

/**
 * In-memory store of request timestamps per provider
 * Map<provider, timestamp[]>
 */
const lastRequestTimestamps: Map<string, number[]> = new Map();

/**
 * Check if a request can be made within rate limits
 * 
 * @param provider - Calendar provider ('google' | 'outlook')
 * @returns true if request can be made, false if rate limited
 */
export const canMakeRequest = (provider: 'google' | 'outlook'): boolean => {
  const config = RATE_LIMITS[provider];
  if (!config) {
    throw new Error(`Unknown provider: ${provider}`);
  }
  
  const now = Date.now();
  const timestamps = lastRequestTimestamps.get(provider) || [];
  
  // Remove timestamps outside the sliding window
  const recentTimestamps = timestamps.filter(ts => now - ts < config.windowMs);
  
  // Update the map with cleaned timestamps
  lastRequestTimestamps.set(provider, recentTimestamps);
  
  // Check if we've exceeded the rate limit
  if (recentTimestamps.length >= config.maxRequests) {
    return false;
  }
  
  return true;
};

/**
 * Record a request timestamp for a provider
 * Should be called after successfully making an API request
 * 
 * @param provider - Calendar provider ('google' | 'outlook')
 */
export const recordRequest = (provider: 'google' | 'outlook'): void => {
  const now = Date.now();
  const timestamps = lastRequestTimestamps.get(provider) || [];
  
  timestamps.push(now);
  lastRequestTimestamps.set(provider, timestamps);
};

/**
 * Calculate delay (in ms) until next request can be made
 * 
 * @param provider - Calendar provider ('google' | 'outlook')
 * @returns Delay in milliseconds (0 if no delay needed)
 */
export const getDelayUntilNextRequest = (provider: 'google' | 'outlook'): number => {
  const config = RATE_LIMITS[provider];
  if (!config) {
    throw new Error(`Unknown provider: ${provider}`);
  }
  
  const timestamps = lastRequestTimestamps.get(provider) || [];
  
  if (timestamps.length === 0) {
    return 0;  // No previous requests, no delay
  }
  
  const now = Date.now();
  
  // Filter to only timestamps within the window
  const recentTimestamps = timestamps.filter(ts => now - ts < config.windowMs);
  
  if (recentTimestamps.length < config.maxRequests) {
    return 0;  // Under rate limit, no delay needed
  }
  
  // Calculate when the oldest timestamp will expire from the window
  const oldestTimestamp = Math.min(...recentTimestamps);
  const timeSinceOldest = now - oldestTimestamp;
  const delay = Math.max(0, config.windowMs - timeSinceOldest + 100); // Add 100ms buffer
  
  return delay;
};

/**
 * Get current request count within the window
 * Useful for monitoring and debugging
 * 
 * @param provider - Calendar provider ('google' | 'outlook')
 * @returns Number of requests in current window
 */
export const getCurrentRequestCount = (provider: 'google' | 'outlook'): number => {
  const config = RATE_LIMITS[provider];
  if (!config) {
    throw new Error(`Unknown provider: ${provider}`);
  }
  
  const now = Date.now();
  const timestamps = lastRequestTimestamps.get(provider) || [];
  const recentTimestamps = timestamps.filter(ts => now - ts < config.windowMs);
  
  return recentTimestamps.length;
};

/**
 * Clear all rate limit tracking data
 * Useful for testing
 */
export const clearRateLimitData = (): void => {
  lastRequestTimestamps.clear();
};

/**
 * Get rate limit configuration for a provider
 * 
 * @param provider - Calendar provider ('google' | 'outlook')
 * @returns Rate limit configuration
 */
export const getRateLimitConfig = (provider: 'google' | 'outlook'): RateLimitConfig => {
  const config = RATE_LIMITS[provider];
  if (!config) {
    throw new Error(`Unknown provider: ${provider}`);
  }
  
  return { ...config };  // Return a copy to prevent external mutations
};
