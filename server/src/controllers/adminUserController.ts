/**
 * Admin User Management Controller
 * 
 * HTTP request handlers for admin user CRUD operations.
 * All endpoints require admin authentication.
 * 
 * @module adminUserController
 * @task US_035 TASK_001
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.types';
import { ApiError } from '../types';
import {
  createUserSchema,
  updateUserSchema,
  listUsersQuerySchema,
} from '../validators/userManagement.validator';
import * as userManagementService from '../services/userManagementService';

/** Extract client IP from request headers */
function getClientIp(req: AuthRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (Array.isArray(fwd)) return fwd[0] || 'unknown';
  if (typeof fwd === 'string') return fwd;
  const ip = req.ip;
  if (Array.isArray(ip)) return ip[0] || 'unknown';
  return ip || 'unknown';
}

/** Extract user-agent string from request headers */
function getUserAgent(req: AuthRequest): string {
  const ua = req.headers['user-agent'];
  if (Array.isArray(ua)) return ua[0] || 'unknown';
  return ua || 'unknown';
}

/**
 * GET /api/admin/users
 * Get paginated list of users with optional filters
 */
export const getUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { error, value } = listUsersQuerySchema.validate(req.query, {
      stripUnknown: true,
    });

    if (error) {
      return next(new ApiError(400, error.details[0].message));
    }

    const result = await userManagementService.getAllUsers(value);

    res.status(200).json({
      success: true,
      data: result.users,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/users
 * Create a new user account
 */
export const createUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { error, value } = createUserSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((d) => d.message);
      return next(new ApiError(400, messages.join('; ')));
    }

    const adminId = req.user!.userId;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    const result = await userManagementService.createUser(value, adminId, ipAddress, userAgent);

    res.status(201).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    if (err instanceof ApiError) {
      return next(err);
    }
    // Handle PostgreSQL unique constraint violation
    if ((err as any)?.code === '23505') {
      return next(new ApiError(409, 'User with this email already exists'));
    }
    next(err);
  }
};

/**
 * PUT /api/admin/users/:id
 * Update user role, department, or profile fields
 */
export const updateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = parseInt(idParam, 10);
    if (isNaN(userId) || userId <= 0) {
      return next(new ApiError(400, 'Invalid user ID'));
    }

    const { error, value } = updateUserSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((d) => d.message);
      return next(new ApiError(400, messages.join('; ')));
    }

    const adminId = req.user!.userId;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    const result = await userManagementService.updateUser(userId, value, adminId, ipAddress, userAgent);

    res.status(200).json({
      success: true,
      data: result,
      message: 'User updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/users/:id
 * Deactivate a user account (soft delete)
 */
export const deactivateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = parseInt(idParam, 10);
    if (isNaN(userId) || userId <= 0) {
      return next(new ApiError(400, 'Invalid user ID'));
    }

    const adminId = req.user!.userId;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    const result = await userManagementService.deactivateUser(userId, adminId, ipAddress, userAgent);

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/departments
 * Get active departments for dropdown
 */
export const getDepartments = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const departments = await userManagementService.getDepartments();

    res.status(200).json({
      success: true,
      data: departments,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};
