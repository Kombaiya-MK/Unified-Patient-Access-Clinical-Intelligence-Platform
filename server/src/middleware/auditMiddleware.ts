/**
 * Audit Middleware
 * 
 * File: server/src/middleware/auditMiddleware.ts
 * Purpose: Automatically log all API requests to audit_logs table
 * Task: US_011 TASK_001 - Immutable Audit Logging Service
 * 
 * Features:
 * - Automatic audit logging for all protected routes
 * - Captures request metadata (method, path, query, params)
 * - Records response status code and request duration
 * - Extracts resource type and ID from URL
 * - Skips public endpoints (configurable)
 * - Non-blocking (doesn't fail request if audit fails)
 * - PII redaction applied automatically
 * 
 * Usage:
 * ```typescript
 * // Apply to all routes after authentication
 * app.use(authenticate, auditMiddleware, ...routes);
 * 
 * // Or apply to specific route groups
 * router.use(authenticate, auditMiddleware);
 * ```
 */

import { Request, Response, NextFunction } from 'express';
import { extractAuditContext, isAuthenticated } from '../utils/requestContext';
import { mapHttpMethodToAction, extractResourceInfo, extractTableName } from '../utils/actionMapper';
import { logAuditEntry, redactPII } from '../utils/auditLogger';
import { AuditDetails } from '../types/audit.types';
import logger from '../utils/logger';

/**
 * Authenticated Request Interface
 */
interface AuthRequest extends Request {
  user?: {
    userId: number;
    id?: number;
    email?: string;
    role: string;
  };
}

/**
 * Audit Middleware Configuration
 */
interface AuditMiddlewareConfig {
  skipPublicEndpoints?: boolean; // Skip unauthenticated requests
  skipSuccessfulReads?: boolean; // Skip successful GET requests (reduce noise)
  captureRequestBody?: boolean; // Capture request body in audit log
  captureResponseBody?: boolean; // Capture response body in audit log
  maxBodySize?: number; // Max body size to capture (bytes)
}

/**
 * Default Configuration
 */
const defaultConfig: AuditMiddlewareConfig = {
  skipPublicEndpoints: true,
  skipSuccessfulReads: false,
  captureRequestBody: true,
  captureResponseBody: false,
  maxBodySize: 10240, // 10KB
};

/**
 * Audit Middleware Factory
 * Creates configured audit middleware
 * 
 * @param config - Middleware configuration
 * @returns Express middleware function
 */
export function createAuditMiddleware(
  config: AuditMiddlewareConfig = defaultConfig,
) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const startTime = Date.now();
    
    // Extract context
    const context = extractAuditContext(req);
    
    // Skip public endpoints if configured
    if (config.skipPublicEndpoints && !isAuthenticated(req)) {
      return next();
    }
    
    // Skip health check and metrics endpoints
    if (shouldSkipPath(req.path)) {
      return next();
    }
    
    // Capture original res.json to intercept response
    const originalJson = res.json.bind(res);
    let responseBody: any = null;
    
    res.json = function (body: any) {
      responseBody = body;
      return originalJson(body);
    };
    
    // Log audit entry after response finishes
    res.on('finish', async () => {
      try {
        // Skip successful reads if configured
        if (config.skipSuccessfulReads && 
            req.method === 'GET' && 
            res.statusCode >= 200 && 
            res.statusCode < 300) {
          return;
        }
        
        const duration = Date.now() - startTime;
        
        // Map HTTP method to audit action
        const action = mapHttpMethodToAction(req.method, req.path);
        
        // Extract resource information
        const { resourceType, resourceId } = extractResourceInfo(req.path, req.params);
        const tableName = extractTableName(resourceType);
        
        // Build audit details
        const details: AuditDetails = {
          method: req.method,
          path: req.path,
          status_code: res.statusCode,
          duration,
          query: Object.keys(req.query).length > 0 ? req.query : undefined,
        };
        
        // Capture request body if configured
        if (config.captureRequestBody && req.body) {
          const bodySize = JSON.stringify(req.body).length;
          if (bodySize <= (config.maxBodySize || defaultConfig.maxBodySize!)) {
            details.request_body = redactPII(req.body);
          } else {
            details.request_body = { _truncated: true, size: bodySize };
          }
        }
        
        // Capture response body if configured (rarely used due to size)
        if (config.captureResponseBody && responseBody) {
          const responseSize = JSON.stringify(responseBody).length;
          if (responseSize <= (config.maxBodySize || defaultConfig.maxBodySize!)) {
            details.metadata = { response: redactPII(responseBody) };
          }
        }
        
        // Add error message for failed requests
        if (res.statusCode >= 400) {
          if (responseBody && responseBody.error) {
            details.error_message = String(responseBody.error);
          } else {
            details.error_message = `HTTP ${res.statusCode}`;
          }
        }
        
        // Log audit entry
        await logAuditEntry({
          user_id: context.userId,
          action,
          table_name: tableName,
          record_id: resourceId,
          old_values: null,
          new_values: details,
          ip_address: context.ip,
          user_agent: context.userAgent,
        });
        
        logger.debug('Request audited', {
          action,
          tableName,
          resourceId,
          userId: context.userId,
          statusCode: res.statusCode,
          duration,
        });
      } catch (error) {
        // Don't fail the response if audit logging fails
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to log audit entry in middleware', {
          error: errorMessage,
          path: req.path,
          method: req.method,
          userId: context.userId,
        });
        
        // Note: We don't throw here because the request already completed
        // The error will be logged to audit_error_logs via logAuditEntry
      }
    });
    
    next();
  };
}

/**
 * Default Audit Middleware
 * Pre-configured with default settings
 */
export const auditMiddleware = createAuditMiddleware(defaultConfig);

/**
 * Should Skip Path
 * Determine if path should be skipped from auditing
 * 
 * @param path - Request path
 * @returns True if should skip
 */
function shouldSkipPath(path: string): boolean {
  const skipPaths = [
    '/health',
    '/metrics',
    '/api/health',
    '/api/metrics',
    '/api/status',
    '/_health',
    '/_status',
  ];
  
  return skipPaths.some(skipPath => path.startsWith(skipPath));
}

/**
 * Selective Audit Middleware
 * Only audit specific actions (for fine-grained control)
 * 
 * @param actions - Array of actions to audit
 * @returns Express middleware
 */
export function selectiveAuditMiddleware(actions: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const action = mapHttpMethodToAction(req.method, req.path);
    
    if (!actions.includes(action)) {
      return next();
    }
    
    return auditMiddleware(req, res, next);
  };
}

export default auditMiddleware;
