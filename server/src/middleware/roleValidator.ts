import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.types';
import { isValidRole } from '../utils/roleHierarchy';
import { pool } from '../config/database';
import logger from '../utils/logger';
import { ApiError } from '../types';

/**
 * Role Validator Middleware
 * 
 * Validates that JWT token contains a valid role claim
 * Logs security events for invalid or missing role claims
 * 
 * Should run after authenticate middleware
 * Should run before authorize middleware
 */

/**
 * Validate role claim in JWT token
 * Checks if role claim exists and has a valid value
 * 
 * @middleware
 * @example
 * router.get('/protected', authenticate, validateRoleClaim, authorize(UserRole.ADMIN), handler)
 */
export const validateRoleClaim = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Check if user is authenticated (set by authenticate middleware)
    if (!req.user) {
      // If not authenticated, let authenticate middleware handle it
      logger.debug('No user in request, skipping role validation');
      return next();
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Check if role claim exists
    if (!req.user.role) {
      logger.warn('JWT token missing role claim', {
        userId: req.user.userId,
        email: req.user.email,
        ipAddress,
      });

      // Log security event to audit logs
      await logSecurityEvent(
        'MISSING_ROLE_CLAIM',
        req.user.userId,
        ipAddress,
        userAgent,
        {
          email: req.user.email,
          path: req.path,
          method: req.method,
        },
      );

      return next(new ApiError(403, 'Invalid token: missing role claim'));
    }

    // Validate role value
    if (!isValidRole(req.user.role)) {
      logger.warn('JWT token has invalid role value', {
        userId: req.user.userId,
        email: req.user.email,
        role: req.user.role,
        ipAddress,
      });

      // Log security event
      await logSecurityEvent(
        'INVALID_ROLE_CLAIM',
        req.user.userId,
        ipAddress,
        userAgent,
        {
          email: req.user.email,
          invalidRole: req.user.role,
          path: req.path,
          method: req.method,
        },
      );

      return next(new ApiError(403, `Invalid role: ${req.user.role}`));
    }

    // Role claim is valid
    logger.debug('Role claim validated', {
      userId: req.user.userId,
      role: req.user.role,
    });

    next();
  } catch (error) {
    logger.error('Error validating role claim', { error });
    next(new ApiError(500, 'Internal server error'));
  }
};

/**
 * Log security event to audit logs
 * Used for tracking suspicious activity
 * 
 * @param action - Security event type
 * @param userId - User ID (if available)
 * @param ipAddress - IP address
 * @param userAgent - User agent string
 * @param metadata - Additional event data
 */
const logSecurityEvent = async (
  action: string,
  userId: number | null,
  ipAddress: string,
  userAgent: string,
  metadata: Record<string, any>,
): Promise<void> => {
  try {
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
        $1,
        $2,
        $3,
        $4,
        'users',
        $5,
        NULL,
        $6,
        NOW()
      )
    `;

    const values = [
      userId,
      action,
      ipAddress,
      userAgent,
      userId, // record_id
      JSON.stringify({
        ...metadata,
        timestamp: new Date().toISOString(),
      }),
    ];

    await pool.query(query, values);

    logger.info('Security event logged', {
      action,
      userId,
      ipAddress,
    });
  } catch (error) {
    // Don't throw - audit logging failure should not block request
    logger.error('Failed to log security event to database', {
      action,
      userId,
      error,
    });
  }
};

/**
 * Log authorization failure to audit logs
 * Used by authorize middleware
 * 
 * @param userId - User ID
 * @param path - Request path
 * @param userRole - User's role
 * @param requiredRoles - Required roles for the endpoint
 * @param ipAddress - IP address
 * @param userAgent - User agent string
 */
export const logAuthorizationFailure = async (
  userId: number,
  path: string,
  userRole: string,
  requiredRoles: string[],
  ipAddress: string,
  userAgent: string = 'unknown',
): Promise<void> => {
  await logSecurityEvent(
    'AUTHORIZATION_FAILED',
    userId,
    ipAddress,
    userAgent,
    {
      path,
      userRole,
      requiredRoles,
      method: 'GET/POST/PUT/DELETE', // Can be enhanced to include actual method
    },
  );
};

export default {
  validateRoleClaim,
  logAuthorizationFailure,
};
