/**
 * Performance Logger Middleware
 *
 * Logs request duration and cache-hit status for every response.
 *
 * @module performanceLogger
 * @task US_004 TASK_002
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const performanceLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const cacheStatus = res.getHeader('X-Cache') || 'N/A';

    logger.debug(
      `${req.method} ${req.originalUrl} – ${res.statusCode} – ${duration}ms [cache: ${cacheStatus}]`,
    );
  });

  next();
};
