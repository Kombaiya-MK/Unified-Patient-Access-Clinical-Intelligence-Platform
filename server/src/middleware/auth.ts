import { Response, NextFunction } from 'express';
import { ApiError } from '../types';
import { AuthRequest, JwtPayload } from '../types/auth.types';
import { verifyToken, decodeToken } from '../utils/tokenGenerator';
import { 
  logTokenExpired, 
  logTokenInvalid 
} from '../utils/auditLogger';
import authService from '../services/authService';
import logger from '../utils/logger';

/**
 * JWT Authentication Middleware
 * 
 * Security Features (AC2):
 * - Verify JWT signature and expiry
 * - Check token blacklist for logout
 * - Validate session in Redis
 * - Attach user data to request
 * - Refresh session activity timestamp
 * - Audit log failed attempts
 * 
 * Flow:
 * 1. Extract token from Authorization header
 * 2. Check if token is blacklisted
 * 3. Verify JWT signature and expiry
 * 4. Validate session in Redis (if available)
 * 5. Attach user to req.user
 * 6. Refresh session TTL
 */
export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Step 1: Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.debug('Authentication failed: missing or invalid Authorization header');
      return next(new ApiError(401, 'Authentication required'));
    }

    const token = authHeader.split(' ')[1];

    if (!token || token.trim().length === 0) {
      logger.debug('Authentication failed: empty token');
      return next(new ApiError(401, 'Authentication required'));
    }

    // Get IP address and User-Agent for audit logging
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Step 2: Check if token is blacklisted (AC4)
    const isBlacklisted = await authService.isTokenBlacklisted(token);

    if (isBlacklisted) {
      logger.info('Authentication failed: token has been revoked', {
        ipAddress,
      });
      await logTokenInvalid(ipAddress, userAgent, 'Token has been revoked');
      return next(new ApiError(401, 'Token has been revoked'));
    }

    // Step 3: Verify JWT signature and expiry (AC3)
    const payload: JwtPayload | null = verifyToken(token);

    if (!payload) {
      // Token is invalid or expired
      const decoded = decodeToken(token);

      if (decoded) {
        // Token is expired
        logger.debug('Authentication failed: token expired', {
          userId: decoded.userId,
          expiredAt: new Date(decoded.exp * 1000).toISOString(),
        });
        await logTokenExpired(decoded.userId, ipAddress, userAgent);
        return next(new ApiError(401, 'Token has expired'));
      } else {
        // Token is invalid
        logger.debug('Authentication failed: invalid token');
        await logTokenInvalid(ipAddress, userAgent, 'Invalid token format or signature');
        return next(new ApiError(401, 'Invalid token'));
      }
    }

    // Step 4: Validate session in Redis (AC1)
    const sessionExists = await authService.validateSession(payload.userId);

    if (!sessionExists) {
      logger.info('Authentication failed: session not found or expired', {
        userId: payload.userId,
      });
      await logTokenInvalid(ipAddress, userAgent, 'Session has expired');
      return next(new ApiError(401, 'Session has expired'));
    }

    // Step 5: Attach user to request
    req.user = payload;

    // Step 6: Refresh session activity timestamp
    await authService.refreshSessionActivity(payload.userId);

    logger.debug('Authentication successful', {
      userId: payload.userId,
      role: payload.role,
    });

    next();
  } catch (error) {
    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Authentication middleware error', {
      error: errorMessage,
    });

    // If Redis is down, fall back to JWT-only authentication
    if (errorMessage.includes('Redis') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('Connection')) {
      logger.warn('Redis unavailable during auth — falling back to JWT-only authentication');
      // Re-verify JWT and attach user without Redis session checks
      const fallbackHeader = req.headers.authorization;
      const fallbackToken = fallbackHeader?.split(' ')[1];
      if (fallbackToken) {
        const fallbackPayload = verifyToken(fallbackToken);
        if (fallbackPayload) {
          req.user = fallbackPayload;
          return next();
        }
      }
      return next(new ApiError(401, 'Authentication failed'));
    }

    next(new ApiError(500, 'Authentication failed'));
  }
};

/**
 * Authorization Middleware Factory (Enhanced with RBAC)
 * Creates middleware to check user roles with hierarchy support
 * 
 * Features:
 * - Multi-role support: authorize('admin', 'staff')
 * - Role hierarchy: admin can access staff endpoints
 * - Special roles: '*' (public), '**' (any authenticated)
 * - Comprehensive error messages
 * - Audit logging for failures
 * 
 * Usage:
 *   router.get('/admin', authenticate, authorize('admin'), handler)
 *   router.get('/staff', authenticate, authorize('staff', 'admin'), handler)
 *   router.get('/public', authorize('*'), handler) // No auth required
 *   router.get('/any', authenticate, authorize('**'), handler) // Any authenticated user
 * 
 * @param allowedRoles - Array of roles that can access the route
 * @returns Express middleware function
 */
export const authorize = (...allowedRoles: Array<'patient' | 'staff' | 'admin' | 'doctor' | '*' | '**'>) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Import here to avoid circular dependency
      const { checkPermission } = await import('../utils/permissionChecker');
      const { isValidRole } = await import('../utils/roleHierarchy');
      const { logAuthorizationFailure } = await import('../middleware/roleValidator');

      // Handle public access (no authentication required)
      if (allowedRoles.includes('*' as any)) {
        logger.debug('Public endpoint, access granted');
        return next();
      }

      // Check if user is authenticated (should be set by authenticate middleware)
      if (!req.user) {
        logger.warn('Authorization failed: user not authenticated');
        return next(new ApiError(401, 'Authentication required'));
      }

      // Get IP and user agent for logging
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      // Validate role claim exists
      if (!req.user.role) {
        logger.warn('Authorization failed: missing role claim', {
          userId: req.user.userId,
        });
        return next(new ApiError(403, 'Invalid token: missing role claim'));
      }

      // Validate role claim value
      const roleValue = req.user.role as string;
      if (!isValidRole(roleValue) && roleValue !== '*' && roleValue !== '**') {
        logger.warn('Authorization failed: invalid role claim', {
          userId: req.user.userId,
          role: req.user.role,
        });
        return next(new ApiError(403, `Invalid role: ${req.user.role}`));
      }

      // Convert string roles to UserRole type
      const roles = allowedRoles.map(r => r as any);
      
      // Check permission using enhanced permission checker
      const { authorized, reason } = checkPermission(req.user.role as any, roles);

      if (authorized) {
        logger.debug('Authorization successful', {
          userId: req.user.userId,
          role: req.user.role,
          requiredRoles: allowedRoles,
        });
        return next();
      }

      // Authorization failed - log and return error
      logger.info('Authorization failed: insufficient permissions', {
        userId: req.user.userId,
        role: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path,
      });

      // Log to audit logs
      await logAuthorizationFailure(
        req.user.userId,
        req.path,
        req.user.role,
        allowedRoles as string[],
        ipAddress,
        userAgent,
      );

      // Return detailed error response
      _res.status(403).json({
        success: false,
        error: reason || 'Insufficient permissions',
        requiredRoles: allowedRoles,
        userRole: req.user.role,
        timestamp: new Date().toISOString(),
      });
      return;
    } catch (error) {
      logger.error('Authorization middleware error', { error });
      return next(new ApiError(500, 'Authorization check failed'));
    }
  };
};

// Backward compatibility exports
export const authenticateToken = authenticate;
export const authorizeRoles = authorize;

export default { 
  authenticate, 
  authorize,
  // Legacy aliases
  authenticateToken, 
  authorizeRoles 
};
