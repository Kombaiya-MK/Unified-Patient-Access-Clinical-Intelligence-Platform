/**
 * Department Management Controller
 *
 * HTTP handlers for admin department CRUD operations.
 * All endpoints require admin authentication.
 *
 * @module departmentController
 * @task US_036 TASK_002
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.types';
import { ApiError } from '../types';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  listDepartmentsQuerySchema,
} from '../validators/department.validator';
import * as departmentService from '../services/departmentService';

function getClientIp(req: AuthRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (Array.isArray(fwd)) return fwd[0] || 'unknown';
  if (typeof fwd === 'string') return fwd;
  const ip = req.ip;
  if (Array.isArray(ip)) return ip[0] || 'unknown';
  return ip || 'unknown';
}

function getUserAgent(req: AuthRequest): string {
  const ua = req.headers['user-agent'];
  if (Array.isArray(ua)) return ua[0] || 'unknown';
  return ua || 'unknown';
}

/**
 * GET /api/admin/departments/manage
 */
export const listDepartments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { error, value } = listDepartmentsQuerySchema.validate(req.query, {
      stripUnknown: true,
    });
    if (error) {
      return next(new ApiError(400, error.details[0].message));
    }

    const result = await departmentService.getAllDepartments(value);

    res.status(200).json({
      success: true,
      data: result.departments,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/departments/manage/:id
 */
export const getDepartment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const departmentId = parseInt(id, 10);
    if (isNaN(departmentId)) {
      return next(new ApiError(400, 'Invalid department ID'));
    }

    const department = await departmentService.getDepartmentById(departmentId);

    res.status(200).json({
      success: true,
      data: department,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/departments/manage
 */
export const createDepartment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { error, value } = createDepartmentSchema.validate(req.body, {
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

    const department = await departmentService.createDepartment(value, adminId, ipAddress, userAgent);

    res.status(201).json({
      success: true,
      data: department,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/departments/manage/:id
 */
export const updateDepartment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const departmentId = parseInt(id, 10);
    if (isNaN(departmentId)) {
      return next(new ApiError(400, 'Invalid department ID'));
    }

    const { error, value } = updateDepartmentSchema.validate(req.body, {
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

    const department = await departmentService.updateDepartment(
      departmentId,
      value,
      adminId,
      ipAddress,
      userAgent,
    );

    res.status(200).json({
      success: true,
      data: department,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/departments/manage/:id/deactivate
 */
export const deactivateDepartment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const departmentId = parseInt(id, 10);
    if (isNaN(departmentId)) {
      return next(new ApiError(400, 'Invalid department ID'));
    }

    const adminId = req.user!.userId;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    const result = await departmentService.deactivateDepartment(
      departmentId,
      adminId,
      ipAddress,
      userAgent,
    );

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};
