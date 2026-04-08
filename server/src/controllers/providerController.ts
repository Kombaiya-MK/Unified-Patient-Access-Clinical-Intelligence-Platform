/**
 * Provider Management Controller
 *
 * HTTP handlers for admin provider CRUD and scheduling operations.
 * All endpoints require admin authentication.
 *
 * @module providerController
 * @task US_036 TASK_003
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.types';
import { ApiError } from '../types';
import {
  createProviderSchema,
  updateProviderSchema,
  updateScheduleSchema,
  blockedTimeSchema,
  listProvidersQuerySchema,
} from '../validators/provider.validator';
import * as providerService from '../services/providerService';

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

function parseParamId(req: AuthRequest): number {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  return parseInt(raw, 10);
}

/**
 * GET /api/admin/providers
 */
export const getProviders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { error, value } = listProvidersQuerySchema.validate(req.query, {
      stripUnknown: true,
    });
    if (error) {
      return next(new ApiError(400, error.details[0].message));
    }

    const result = await providerService.getAllProviders(value);

    res.status(200).json({
      success: true,
      data: result.providers,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/providers/:id
 */
export const getProvider = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const providerId = parseParamId(req);
    if (isNaN(providerId)) {
      return next(new ApiError(400, 'Invalid provider ID'));
    }

    const provider = await providerService.getProviderById(providerId);

    res.status(200).json({
      success: true,
      data: provider,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/providers
 */
export const createProvider = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { error, value } = createProviderSchema.validate(req.body, {
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

    const provider = await providerService.createProvider(value, adminId, ipAddress, userAgent);

    res.status(201).json({
      success: true,
      data: provider,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/providers/:id
 */
export const updateProvider = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const providerId = parseParamId(req);
    if (isNaN(providerId)) {
      return next(new ApiError(400, 'Invalid provider ID'));
    }

    const { error, value } = updateProviderSchema.validate(req.body, {
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

    const provider = await providerService.updateProvider(
      providerId,
      value,
      adminId,
      ipAddress,
      userAgent,
    );

    res.status(200).json({
      success: true,
      data: provider,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/providers/:id
 */
export const deleteProvider = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const providerId = parseParamId(req);
    if (isNaN(providerId)) {
      return next(new ApiError(400, 'Invalid provider ID'));
    }

    const adminId = req.user!.userId;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    const result = await providerService.deleteProvider(
      providerId,
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

/**
 * GET /api/admin/providers/:id/schedule
 */
export const getProviderSchedule = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const providerId = parseParamId(req);
    if (isNaN(providerId)) {
      return next(new ApiError(400, 'Invalid provider ID'));
    }

    const schedule = await providerService.getProviderSchedule(providerId);

    res.status(200).json({
      success: true,
      data: schedule,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/providers/:id/schedule
 */
export const updateProviderSchedule = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const providerId = parseParamId(req);
    if (isNaN(providerId)) {
      return next(new ApiError(400, 'Invalid provider ID'));
    }

    const { error, value } = updateScheduleSchema.validate(req.body, {
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

    const schedule = await providerService.updateProviderSchedule(
      providerId,
      value.schedule,
      adminId,
      ipAddress,
      userAgent,
    );

    res.status(200).json({
      success: true,
      data: schedule,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/providers/:id/blocked-times
 */
export const createBlockedTime = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const providerId = parseParamId(req);
    if (isNaN(providerId)) {
      return next(new ApiError(400, 'Invalid provider ID'));
    }

    const { error, value } = blockedTimeSchema.validate(req.body, {
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

    const blockedTime = await providerService.createBlockedTime(
      providerId,
      { ...value, blocked_date: value.blocked_date.toISOString().split('T')[0] },
      adminId,
      ipAddress,
      userAgent,
    );

    res.status(201).json({
      success: true,
      data: blockedTime,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/providers/:id/appointments
 */
export const getProviderAppointments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const providerId = parseParamId(req);
    if (isNaN(providerId)) {
      return next(new ApiError(400, 'Invalid provider ID'));
    }

    const appointments = await providerService.getProviderAppointments(providerId);

    res.status(200).json({
      success: true,
      data: appointments,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};
