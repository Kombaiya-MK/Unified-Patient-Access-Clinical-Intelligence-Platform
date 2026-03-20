/**
 * Request Context Utilities
 * 
 * File: server/src/utils/requestContext.ts
 * Purpose: Extract audit context from Express requests
 * Task: US_011 TASK_001 - Immutable Audit Logging Service
 * 
 * Features:
 * - Extract user information from req.user (populated by authenticate middleware)
 * - Extract IP address (handles proxies via X-Forwarded-For)
 * - Extract User-Agent header
 * - Build comprehensive audit context
 */

import { Request } from 'express';
import { AuditContext } from '../types/audit.types';

/**
 * Authenticated Request Interface
 * Extends Express Request with user information
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
 * Extract Audit Context from Request
 * 
 * @param req - Express request object
 * @returns AuditContext with user information and request metadata
 * 
 * @example
 * ```typescript
 * const context = extractAuditContext(req);
 * // { userId: 123, userRole: 'patient', ip: '192.168.1.100', userAgent: 'Mozilla/5.0...' }
 * ```
 */
export function extractAuditContext(req: AuthRequest): AuditContext {
  // Extract user ID (check both userId and id fields)
  const userId = req.user?.userId || req.user?.id || null;
  
  // Extract user role
  const userRole = req.user?.role || null;
  
  // Extract IP address (handle proxy forwarding)
  const ip = extractIPAddress(req);
  
  // Extract User-Agent
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // Extract request method and path
  const method = req.method;
  const path = req.path || req.url;
  
  return {
    userId,
    userRole,
    ip,
    userAgent,
    method,
    path,
  };
}

/**
 * Extract IP Address from Request
 * Handles X-Forwarded-For header for proxied requests
 * 
 * @param req - Express request object
 * @returns IP address string
 * 
 * Priority:
 * 1. X-Forwarded-For header (first IP if multiple)
 * 2. req.ip (Express built-in)
 * 3. req.connection.remoteAddress (legacy)
 * 4. 'unknown'
 */
export function extractIPAddress(req: Request): string {
  // Check X-Forwarded-For header (proxied requests)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For can be a comma-separated list
    // Take the first IP (client's IP)
    const ips = Array.isArray(forwardedFor) 
      ? forwardedFor[0] 
      : forwardedFor.split(',')[0];
    return ips.trim();
  }
  
  // Use Express built-in IP
  if (req.ip) {
    return req.ip;
  }
  
  // Fallback to legacy method
  const socket = (req as any).connection || (req as any).socket;
  if (socket && socket.remoteAddress) {
    return socket.remoteAddress;
  }
  
  return 'unknown';
}

/**
 * Extract User Agent from Request
 * 
 * @param req - Express request object
 * @returns User-Agent string or 'unknown'
 */
export function extractUserAgent(req: Request): string {
  return req.headers['user-agent'] || 'unknown';
}

/**
 * Check if Request is Authenticated
 * 
 * @param req - Express request object
 * @returns True if user is authenticated
 */
export function isAuthenticated(req: AuthRequest): boolean {
  return !!(req.user && (req.user.userId || req.user.id));
}

/**
 * Get User ID from Request
 * 
 * @param req - Express request object
 * @returns User ID or null
 */
export function getUserId(req: AuthRequest): number | null {
  return req.user?.userId || req.user?.id || null;
}

/**
 * Get User Role from Request
 * 
 * @param req - Express request object
 * @returns User role or null
 */
export function getUserRole(req: AuthRequest): string | null {
  return req.user?.role || null;
}

/**
 * Build Request Summary
 * Create a summary object for audit logging
 * 
 * @param req - Express request object
 * @param statusCode - Response status code
 * @param duration - Request duration in milliseconds
 * @returns Request summary object
 */
export function buildRequestSummary(
  req: Request,
  statusCode?: number,
  duration?: number,
): Record<string, any> {
  return {
    method: req.method,
    path: req.path || req.url,
    statusCode,
    duration,
    query: req.query || {},
    params: req.params || {},
    timestamp: new Date().toISOString(),
  };
}

export default {
  extractAuditContext,
  extractIPAddress,
  extractUserAgent,
  isAuthenticated,
  getUserId,
  getUserRole,
  buildRequestSummary,
};
