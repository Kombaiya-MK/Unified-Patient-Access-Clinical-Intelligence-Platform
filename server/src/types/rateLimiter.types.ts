/**
 * Rate Limiting Type Definitions
 * 
 * Types for rate limiting and brute force protection
 */

/**
 * Rate Limit Options Configuration
 */
export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum requests per window
  message: string; // Error message when limit exceeded
  standardHeaders: boolean; // Send RateLimit-* headers
  legacyHeaders: boolean; // Send X-RateLimit-* headers
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator?: (req: any) => string; // Function to determine key (default: IP)
}

/**
 * Brute Force Attack Record
 * Tracks failed login attempts per email address
 */
export interface BruteForceRecord {
  email: string; // Email being targeted
  ipAddresses: string[]; // List of IPs attempting login
  failedAttempts: number; // Total failed attempts
  lastAttempt: Date; // Timestamp of last attempt
  isLocked: boolean; // Whether account is locked
  lockUntil?: Date; // When account will be unlocked
}

/**
 * Rate Limit Information
 * Current state of rate limiting for a client
 */
export interface RateLimitInfo {
  limit: number; // Maximum allowed requests
  current: number; // Current request count
  remaining: number; // Remaining requests in window
  resetTime: Date; // When the limit resets
}

/**
 * Progressive Delay Configuration
 */
export interface ProgressiveDelayConfig {
  baseDelayMs: number; // Base delay in milliseconds
  maxDelayMs: number; // Maximum delay cap
  exponentialFactor: number; // Exponential growth factor
}

/**
 * Whitelist Configuration
 */
export interface WhitelistConfig {
  ips: string[]; // List of whitelisted IP addresses
  cidrs: string[]; // List of CIDR ranges
}

/**
 * Rate Limit Exceeded Event
 * Logged to audit logs
 */
export interface RateLimitExceededEvent {
  ip: string; // IP address that exceeded limit
  endpoint: string; // Endpoint being rate limited
  limit: number; // Rate limit threshold
  current: number; // Current request count
  timestamp: Date; // When limit was exceeded
  userAgent?: string; // User agent string
}

/**
 * Distributed Attack Detection Result
 */
export interface DistributedAttackDetection {
  email: string; // Email being targeted
  uniqueIPs: number; // Number of unique IPs
  totalAttempts: number; // Total failed attempts
  timeWindow: string; // Time window for detection
  isDistributed: boolean; // Whether this is a distributed attack
  ipAddresses: string[]; // List of attacking IPs
}
