import { Request, Response, NextFunction } from 'express';
import { AuthRequest, LoginRequest } from '../types/auth.types';
import { ApiError, ApiResponse } from '../types';
import authService from '../services/authService';
import logger from '../utils/logger';

/**
 * Authentication Controller
 * 
 * Handles HTTP requests for authentication endpoints:
 * - POST /api/auth/login - User login
 * - POST /api/auth/logout - User logout
 * 
 * Validation, business logic, and response formatting
 */

/**
 * POST /api/auth/login
 * Authenticate user and generate JWT token
 * 
 * Request Body:
 *   { email: string, password: string }
 * 
 * Response (200):
 *   {
 *     success: true,
 *     token: string,
 *     expiresIn: number,
 *     user: { id, email, role, firstName, lastName }
 *   }
 * 
 * Errors:
 *   400 - Invalid request body
 *   401 - Invalid credentials or inactive account
 *   503 - Authentication service unavailable
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Step 1: Validate request body
    const { email, password } = req.body as LoginRequest;

    if (!email || !password) {
      logger.debug('Login failed: missing email or password');
      return next(new ApiError(400, 'Email and password are required'));
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logger.debug('Login failed: invalid email format', { email });
      return next(new ApiError(400, 'Invalid email format'));
    }

    // Validate password length
    if (password.length < 1) {
      logger.debug('Login failed: empty password');
      return next(new ApiError(400, 'Password cannot be empty'));
    }

    // Step 2: Get IP address and User-Agent for audit logging
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Step 3: Call auth service
    const result = await authService.login(email, password, ipAddress, userAgent);

    // Step 4: Send response
    logger.info('Login successful', {
      userId: result.user.id,
      role: result.user.role,
      email: result.user.email,
    });

    res.status(200).json(result);
  } catch (error) {
    // Pass error to error handler middleware
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Logout user and invalidate token
 * 
 * Requires: Authentication (JWT token in Authorization header)
 * 
 * Response (200):
 *   {
 *     success: true,
 *     message: "Logged out successfully"
 *   }
 * 
 * Errors:
 *   401 - Not authenticated
 *   503 - Logout service unavailable (Redis down)
 */
export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Step 1: Verify user is authenticated (set by authenticate middleware)
    if (!req.user) {
      logger.warn('Logout failed: user not authenticated');
      return next(new ApiError(401, 'Authentication required'));
    }

    // Step 2: Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      logger.warn('Logout failed: missing token');
      return next(new ApiError(401, 'Token required for logout'));
    }

    // Step 3: Get IP address and User-Agent for audit logging
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Step 4: Call auth service
    await authService.logout(req.user.userId, token, ipAddress, userAgent);

    // Step 5: Send response
    logger.info('Logout successful', {
      userId: req.user.userId,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    // Pass error to error handler middleware
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated user info
 * 
 * Requires: Authentication (JWT token in Authorization header)
 * 
 * Response (200):
 *   {
 *     success: true,
 *     data: { userId, email, role, iat, exp }
 *   }
 * 
 * Errors:
 *   401 - Not authenticated
 */
export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // User data is already attached by authenticate middleware
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const response: ApiResponse = {
      success: true,
      data: {
        userId: req.user.userId,
        email: req.user.email,
        role: req.user.role,
        iat: req.user.iat,
        exp: req.user.exp,
      },
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/verify
 * Verify if current token is valid
 * 
 * Requires: Authentication (JWT token in Authorization header)
 * 
 * Response (200):
 *   {
 *     success: true,
 *     message: "Token is valid",
 *     expiresAt: ISO timestamp
 *   }
 * 
 * Errors:
 *   401 - Invalid or expired token
 */
export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // If we reach this point, token is valid (authenticate middleware passed)
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const expiresAt = new Date(req.user.exp * 1000).toISOString();
    const remainingSeconds = req.user.exp - Math.floor(Date.now() / 1000);

    const response: ApiResponse = {
      success: true,
      message: 'Token is valid',
      data: {
        expiresAt,
        remainingSeconds: Math.max(0, remainingSeconds),
        userId: req.user.userId,
        role: req.user.role,
      },
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export default {
  login,
  logout,
  getCurrentUser,
  verifyToken,
};
