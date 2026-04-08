import crypto from 'crypto';
import { pool } from '../config/database';
import { comparePassword } from '../utils/passwordHash';
import { signToken, decodeToken } from '../utils/tokenGenerator';
import { logLogin, logLoginFailed, logLogout } from '../utils/auditLogger';
import logger from '../utils/logger';
import redisClientManager from '../utils/redisClient';
import { LoginResponse, AuthSession, UserRecord } from '../types/auth.types';
import { ApiError } from '../types';
import { 
  incrementFailedAttempts, 
  resetFailedAttempts 
} from '../utils/progressiveDelay';
import { 
  trackFailedLogin, 
  checkAccountLocked, 
  resetFailedLogins 
} from '../utils/bruteForceDetection';

/**
 * Authentication Service
 * 
 * Business Logic:
 * - User authentication with bcrypt password validation
 * - JWT token generation with 15-minute expiry
 * - Session management in Redis
 * - Token blacklisting for logout
 * - Audit logging for HIPAA compliance
 * 
 * Security Features:
 * - Constant-time password comparison (bcrypt)
 * - Secure session storage with TTL
 * - Token revocation on logout
 * - Failed attempt logging
 * - Redis failover to database queries
 */

/**
 * Session TTL in seconds (15 minutes)
 * Matches JWT token expiry
 */
const SESSION_TTL_SECONDS = 900;

/**
 * Authenticate user and generate JWT token
 * @param email - User email address
 * @param password - Plain-text password
 * @param ipAddress - IP address for audit logging
 * @param userAgent - User-Agent for audit logging
 * @returns LoginResponse with token and user data
 * @throws ApiError(401) if credentials invalid or user inactive
 * @throws ApiError(503) if database/Redis unavailable
 */
export const login = async (
  email: string,
  password: string,
  ipAddress: string,
  userAgent: string,
): Promise<LoginResponse> => {
  try {
    // Step 0: Check if account is locked due to brute force detection
    const isLocked = await checkAccountLocked(email);
    if (isLocked) {
      await logLoginFailed(
        email, 
        ipAddress, 
        userAgent, 
        'Account temporarily locked due to too many failed attempts'
      );
      throw new ApiError(
        429, 
        'Account temporarily locked due to too many failed attempts. Please try again in 1 hour.'
      );
    }

    // Step 1: Query user from database
    const query = `
      SELECT 
        id,
        email,
        password_hash,
        role,
        first_name,
        last_name,
        is_active,
        created_at,
        updated_at
      FROM users
      WHERE email = $1
    `;

    const result = await pool.query<UserRecord>(query, [email.toLowerCase().trim()]);

    // Step 2: Check if user exists
    if (result.rows.length === 0) {
      // Log failed attempt (invalid email)
      await logLoginFailed(email, ipAddress, userAgent, 'Invalid email or password');
      // Track failed login for brute force detection
      await trackFailedLogin(email, ipAddress);
      await incrementFailedAttempts(ipAddress);
      throw new ApiError(401, 'Invalid email or password');
    }

    const user = result.rows[0];

    // Step 3: Check if user is active
    if (!user.is_active) {
      await logLoginFailed(email, ipAddress, userAgent, 'Account is inactive');
      await trackFailedLogin(email, ipAddress);
      await incrementFailedAttempts(ipAddress);
      throw new ApiError(401, 'Account is inactive');
    }

    // Step 4: Validate password
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      // Log failed attempt (invalid password)
      await logLoginFailed(email, ipAddress, userAgent, 'Invalid email or password');
      // Track failed login for brute force detection and progressive delay
      await trackFailedLogin(email, ipAddress);
      await incrementFailedAttempts(ipAddress);
      throw new ApiError(401, 'Invalid email or password');
    }

    // Step 5: Generate JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Step 6: Create session in Redis (if available)
    try {
      if (redisClientManager.isAvailable) {
        const sessionData: AuthSession = {
          userId: user.id,
          email: user.email,
          role: user.role,
          createdAt: Date.now(),
          lastActivity: Date.now(),
          deviceInfo: userAgent,
          ipAddress,
        };

        await redisClientManager.set(
          `session:${user.id}`,
          JSON.stringify(sessionData),
          {
            ttl: SESSION_TTL_SECONDS,
            namespace: '',
          },
        );

        logger.info('Session created in Redis', {
          userId: user.id,
          ttl: SESSION_TTL_SECONDS,
        });
      } else {
        logger.warn('Redis unavailable - session not stored (will rely on JWT only)');
      }
    } catch (redisError) {
      // Redis failure should not block authentication
      logger.error('Failed to create session in Redis', redisError);
      // Continue with JWT-only authentication
    }

    // Step 7: Reset failed attempts on successful login
    await resetFailedLogins(email);
    await resetFailedAttempts(ipAddress);

    logger.info('Failed login counters reset after successful login', {
      email,
      ipAddress,
    });

    // Step 8: Log successful login
    await logLogin(user.id, ipAddress, userAgent);

    // Step 9: Return response
    return {
      success: true,
      token,
      expiresIn: SESSION_TTL_SECONDS,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    };
  } catch (error) {
    // Re-throw ApiError
    if (error instanceof ApiError) {
      throw error;
    }

    // Log unexpected error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Login error', {
      email,
      error: errorMessage,
    });

    throw new ApiError(503, 'Authentication service unavailable');
  }
};

/**
 * Logout user and invalidate token
 * @param userId - User ID from authenticated token
 * @param token - JWT token to blacklist
 * @param ipAddress - IP address for audit logging
 * @param userAgent - User-Agent for audit logging
 * @returns Promise<void>
 * @throws ApiError(503) if Redis unavailable
 */
export const logout = async (
  userId: number,
  token: string,
  ipAddress: string,
  userAgent: string,
): Promise<void> => {
  try {
    // Step 1: Delete session from Redis (if available)
    try {
      if (redisClientManager.isAvailable) {
        await redisClientManager.del(`session:${userId}`);
        logger.info('Session deleted from Redis', { userId });
      }
    } catch (redisError) {
      logger.error('Failed to delete session from Redis', redisError);
    }

    // Step 2: Add token to blacklist
    try {
      if (redisClientManager.isAvailable) {
        // Hash token for storage (don't store raw token)
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Decode token to get remaining TTL
        const decoded = decodeToken(token);
        const now = Math.floor(Date.now() / 1000);
        const ttl = decoded ? decoded.exp - now : SESSION_TTL_SECONDS;

        // Only blacklist if token is still valid
        if (ttl > 0) {
          await redisClientManager.set(`blacklist:${tokenHash}`, '1', {
            ttl,
            namespace: '',
          });

          logger.info('Token blacklisted', {
            userId,
            ttl,
          });
        }
      } else {
        logger.warn('Redis unavailable - token not blacklisted (will expire naturally via JWT TTL)');
      }
    } catch (redisError) {
      logger.warn('Failed to blacklist token in Redis - token will expire naturally', redisError);
    }

    // Step 3: Log logout
    await logLogout(userId, ipAddress, userAgent);

    logger.info('User logged out successfully', { userId });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Logout error', {
      userId,
      error: errorMessage,
    });

    // Don't throw 503 for Redis-only failures — logout should succeed
    // since the client will clear the token. The JWT will expire naturally.
    logger.warn('Logout completed with warnings (Redis unavailable)', { userId });
  }
};

/**
 * Validate if session exists in Redis
 * @param userId - User ID to check
 * @returns true if session exists, false otherwise
 */
export const validateSession = async (userId: number): Promise<boolean> => {
  try {
    if (!redisClientManager.isAvailable) {
      // If Redis is down, allow JWT-only authentication
      logger.warn('Redis unavailable - skipping session validation');
      return true;
    }

    const sessionData = await redisClientManager.get(`session:${userId}`);

    return sessionData !== null;
  } catch (error) {
    logger.error('Session validation error', { userId, error });
    // On error, allow JWT-only authentication
    return true;
  }
};

/**
 * Check if token is blacklisted
 * @param token - JWT token to check
 * @returns true if blacklisted, false otherwise
 */
export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  try {
    if (!redisClientManager.isAvailable) {
      // If Redis is down, cannot check blacklist
      logger.warn('Redis unavailable - skipping blacklist check');
      return false;
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const blacklisted = await redisClientManager.get(`blacklist:${tokenHash}`);

    return blacklisted !== null;
  } catch (error) {
    logger.error('Blacklist check error', { error });
    // On error, assume not blacklisted (fail open for availability)
    return false;
  }
};

/**
 * Refresh session activity timestamp
 * Extends session TTL on each request
 * @param userId - User ID
 * @returns Promise<void>
 */
export const refreshSessionActivity = async (userId: number): Promise<void> => {
  try {
    if (!redisClientManager.isAvailable) {
      return;
    }

    const sessionDataRaw = await redisClientManager.get(`session:${userId}`);

    if (!sessionDataRaw) {
      return;
    }

    const sessionData: AuthSession = JSON.parse(sessionDataRaw);
    sessionData.lastActivity = Date.now();

    // Update session with refreshed TTL
    await redisClientManager.set(
      `session:${userId}`,
      JSON.stringify(sessionData),
      {
        ttl: SESSION_TTL_SECONDS,
        namespace: '',
      },
    );

    logger.debug('Session activity refreshed', { userId });
  } catch (error) {
    logger.debug('Failed to refresh session activity', { userId, error });
    // Don't throw - this is a non-critical operation
  }
};

export default {
  login,
  logout,
  validateSession,
  isTokenBlacklisted,
  refreshSessionActivity,
};
