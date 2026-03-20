/**
 * Centralized Permission Configuration
 * Defines role-based access control for all API endpoints
 * 
 * File: server/src/config/permissions.ts
 * Purpose: Central permission matrix for route authorization
 * Task: US_010 TASK_001 - RBAC Middleware Enhancement
 * 
 * Features:
 * - Pattern-based route matching (wildcards, path parameters)
 * - Method-specific permissions (GET, POST, PUT, DELETE)
 * - Role hierarchy enforcement (admin inherits staff/patient)
 * - Resource-based permissions (ownership checks)
 * - Special access patterns (public, any-authenticated)
 * 
 * Usage:
 *   import { getRequiredRoles, applyDynamicAuthorization } from './config/permissions';
 *   
 *   // Check permissions programmatically
 *   const roles = getRequiredRoles('/api/admin/users', 'GET'); // Returns [admin]
 *   
 *   // Apply to all routes dynamically
 *   app.use(applyDynamicAuthorization);
 */

import { UserRole, PermissionMatrix, SpecialRoles } from '../types/rbac.types';
import { Request, Response, NextFunction } from 'express';
import { authorize } from '../middleware/auth';

/**
 * Permission Matrix
 * Maps endpoint patterns to allowed roles by HTTP method
 * 
 * Pattern Matching Rules:
 * - Exact: '/api/admin/users' matches only that path
 * - Wildcard: '/api/admin/*' matches /api/admin/anything
 * - Glob: '/api/admin/**' matches /api/admin/users/123/profile
 * - Parameter: '/api/patients/:id' matches /api/patients/123
 * 
 * Special Roles:
 * - SpecialRoles.PUBLIC ('*'): No authentication required
 * - SpecialRoles.ANY_AUTHENTICATED ('**'): Any logged-in user
 */
export const permissionMatrix: PermissionMatrix = {
  // ==================== Public Endpoints ====================
  '/api/health': [
    { method: 'GET', roles: [SpecialRoles.PUBLIC] },
  ],
  '/api/auth/login': [
    { method: 'POST', roles: [SpecialRoles.PUBLIC] },
  ],
  '/api/auth/register': [
    { method: 'POST', roles: [SpecialRoles.PUBLIC] },
  ],
  '/api/auth/forgot-password': [
    { method: 'POST', roles: [SpecialRoles.PUBLIC] },
  ],
  '/api/auth/reset-password': [
    { method: 'POST', roles: [SpecialRoles.PUBLIC] },
  ],

  // ==================== Authenticated Endpoints ====================
  '/api/auth/logout': [
    { method: 'POST', roles: [SpecialRoles.ANY_AUTHENTICATED] },
  ],
  '/api/auth/me': [
    { method: 'GET', roles: [SpecialRoles.ANY_AUTHENTICATED] },
  ],
  '/api/auth/verify': [
    { method: 'POST', roles: [SpecialRoles.ANY_AUTHENTICATED] },
  ],
  '/api/auth/refresh': [
    { method: 'POST', roles: [SpecialRoles.ANY_AUTHENTICATED] },
  ],

  // ==================== Admin Endpoints ====================
  '/api/admin/*': [
    { method: 'GET', roles: [UserRole.ADMIN] },
    { method: 'POST', roles: [UserRole.ADMIN] },
    { method: 'PUT', roles: [UserRole.ADMIN] },
    { method: 'DELETE', roles: [UserRole.ADMIN] },
  ],
  '/api/users': [
    { method: 'GET', roles: [UserRole.ADMIN] }, // List all users
    { method: 'POST', roles: [UserRole.ADMIN] }, // Create user
  ],
  '/api/users/:id': [
    { method: 'GET', roles: [UserRole.ADMIN, UserRole.STAFF] }, // View user (staff can view for clinical context)
    { method: 'PUT', roles: [UserRole.ADMIN] }, // Update user
    { method: 'DELETE', roles: [UserRole.ADMIN] }, // Delete user
  ],
  '/api/audit-logs': [
    { method: 'GET', roles: [UserRole.ADMIN] }, // View audit logs
  ],
  '/api/system/settings': [
    { method: 'GET', roles: [UserRole.ADMIN] },
    { method: 'PUT', roles: [UserRole.ADMIN] },
  ],

  // ==================== Staff Endpoints ====================
  '/api/staff/dashboard': [
    { method: 'GET', roles: [UserRole.STAFF, UserRole.ADMIN] },
  ],
  '/api/staff/queue': [
    { method: 'GET', roles: [UserRole.STAFF, UserRole.ADMIN] }, // View queue
    { method: 'POST', roles: [UserRole.STAFF, UserRole.ADMIN] }, // Manage queue
  ],
  '/api/appointments': [
    { method: 'GET', roles: [UserRole.STAFF, UserRole.ADMIN, UserRole.PATIENT] }, // List (filtered by role)
    { method: 'POST', roles: [UserRole.STAFF, UserRole.ADMIN, UserRole.PATIENT] }, // Book appointment
  ],
  '/api/appointments/:id': [
    { method: 'GET', roles: [UserRole.STAFF, UserRole.ADMIN, UserRole.PATIENT] }, // View appointment
    { method: 'PUT', roles: [UserRole.STAFF, UserRole.ADMIN] }, // Update appointment
    { method: 'DELETE', roles: [UserRole.STAFF, UserRole.ADMIN] }, // Cancel appointment
  ],
  '/api/patients': [
    { method: 'GET', roles: [UserRole.STAFF, UserRole.ADMIN] }, // List all patients
    { method: 'POST', roles: [UserRole.STAFF, UserRole.ADMIN] }, // Create patient
  ],
  '/api/patients/:id': [
    { method: 'GET', roles: [UserRole.STAFF, UserRole.ADMIN, UserRole.PATIENT] }, // View patient (own profile for patients)
    { method: 'PUT', roles: [UserRole.STAFF, UserRole.ADMIN, UserRole.PATIENT] }, // Update patient (own profile for patients)
  ],
  '/api/patients/:id/clinical-records': [
    { method: 'GET', roles: [UserRole.STAFF, UserRole.ADMIN, UserRole.PATIENT] }, // View records
    { method: 'POST', roles: [UserRole.STAFF, UserRole.ADMIN] }, // Create record
  ],
  '/api/patients/:id/medications': [
    { method: 'GET', roles: [UserRole.STAFF, UserRole.ADMIN, UserRole.PATIENT] }, // View medications
    { method: 'POST', roles: [UserRole.STAFF, UserRole.ADMIN] }, // Add medication
    { method: 'DELETE', roles: [UserRole.STAFF, UserRole.ADMIN] }, // Remove medication
  ],
  '/api/patients/:id/allergies': [
    { method: 'GET', roles: [UserRole.STAFF, UserRole.ADMIN, UserRole.PATIENT] }, // View allergies
    { method: 'POST', roles: [UserRole.STAFF, UserRole.ADMIN] }, // Add allergy
    { method: 'DELETE', roles: [UserRole.STAFF, UserRole.ADMIN] }, // Remove allergy
  ],
  '/api/clinical/ai-insights': [
    { method: 'POST', roles: [UserRole.STAFF, UserRole.ADMIN] }, // Get AI insights
  ],
  '/api/clinical/drug-interactions': [
    { method: 'POST', roles: [UserRole.STAFF, UserRole.ADMIN] }, // Check drug interactions
  ],

  // ==================== Patient Endpoints ====================
  '/api/patient/dashboard': [
    { method: 'GET', roles: [UserRole.PATIENT] },
  ],
  '/api/patient/profile': [
    { method: 'GET', roles: [UserRole.PATIENT] },
    { method: 'PUT', roles: [UserRole.PATIENT] },
  ],
  '/api/patient/appointments': [
    { method: 'GET', roles: [UserRole.PATIENT] }, // Own appointments only
    { method: 'POST', roles: [UserRole.PATIENT] }, // Book appointment
  ],
  '/api/patient/appointments/:id': [
    { method: 'GET', roles: [UserRole.PATIENT] }, // View own appointment
    { method: 'DELETE', roles: [UserRole.PATIENT] }, // Cancel own appointment
  ],
  '/api/patient/medical-history': [
    { method: 'GET', roles: [UserRole.PATIENT] }, // View own medical history
  ],
  '/api/patient/prescriptions': [
    { method: 'GET', roles: [UserRole.PATIENT] }, // View own prescriptions
  ],
  '/api/patient/notifications': [
    { method: 'GET', roles: [UserRole.PATIENT] },
    { method: 'PUT', roles: [UserRole.PATIENT] }, // Mark as read
  ],

  // ==================== Notification Endpoints ====================
  '/api/notifications': [
    { method: 'GET', roles: [SpecialRoles.ANY_AUTHENTICATED] }, // Own notifications
    { method: 'PUT', roles: [SpecialRoles.ANY_AUTHENTICATED] }, // Mark as read
  ],
  '/api/notifications/:id': [
    { method: 'GET', roles: [SpecialRoles.ANY_AUTHENTICATED] },
    { method: 'DELETE', roles: [SpecialRoles.ANY_AUTHENTICATED] },
  ],
};

/**
 * Get Required Roles for Endpoint
 * Matches request path and method against permission matrix
 * 
 * @param path - Request path (e.g., '/api/admin/users')
 * @param method - HTTP method (e.g., 'GET')
 * @returns Array of required roles or undefined if no match
 * 
 * @example
 * ```typescript
 * const roles = getRequiredRoles('/api/admin/users', 'GET');
 * // Returns [UserRole.ADMIN]
 * 
 * const roles = getRequiredRoles('/api/appointments/123', 'GET');
 * // Returns [UserRole.STAFF, UserRole.ADMIN, UserRole.PATIENT]
 * ```
 */
export function getRequiredRoles(path: string, method: string): string[] | undefined {
  // Exact match first
  const exactMatch = permissionMatrix[path];
  if (exactMatch) {
    const rule = exactMatch.find(r => r.method === method);
    if (rule) return rule.roles;
  }

  // Pattern matching (wildcard and parameters)
  for (const [pattern, rules] of Object.entries(permissionMatrix)) {
    if (matchesPattern(path, pattern)) {
      const rule = rules.find(r => r.method === method);
      if (rule) return rule.roles;
    }
  }

  return undefined;
}

/**
 * Match Path Against Pattern
 * Supports wildcards (*) and path parameters (:id)
 * 
 * @param path - Actual request path
 * @param pattern - Pattern from permission matrix
 * @returns True if path matches pattern
 * 
 * @example
 * ```typescript
 * matchesPattern('/api/admin/users', '/api/admin/*') // true
 * matchesPattern('/api/patients/123', '/api/patients/:id') // true
 * matchesPattern('/api/patients/123/records', '/api/patients/:id/*') // true
 * ```
 */
function matchesPattern(path: string, pattern: string): boolean {
  // Exact match
  if (path === pattern) return true;

  // Wildcard match (*)
  if (pattern.includes('*')) {
    const regexPattern = pattern
      .replace(/\*/g, '.*') // Convert * to regex .*
      .replace(/:\w+/g, '[^/]+'); // Convert :id to regex [^/]+
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  // Parameter match (:id)
  if (pattern.includes(':')) {
    const regexPattern = pattern.replace(/:\w+/g, '[^/]+');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  return false;
}

/**
 * Check Endpoint Permission
 * Checks if user has permission for specific endpoint
 * 
 * @param path - Request path
 * @param method - HTTP method
 * @param userRole - User's role
 * @returns True if user has permission
 * 
 * @example
 * ```typescript
 * hasPermission('/api/admin/users', 'GET', UserRole.ADMIN) // true
 * hasPermission('/api/admin/users', 'GET', UserRole.STAFF) // false
 * hasPermission('/api/appointments', 'GET', UserRole.PATIENT) // true
 * ```
 */
export function hasPermission(path: string, method: string, userRole: string): boolean {
  const requiredRoles = getRequiredRoles(path, method);
  
  // If no permission defined, deny access (whitelist approach)
  if (!requiredRoles) return false;

  // Check if user role is in required roles
  return requiredRoles.includes(userRole) || 
         requiredRoles.includes(SpecialRoles.ANY_AUTHENTICATED) ||
         requiredRoles.includes(SpecialRoles.PUBLIC);
}

/**
 * Apply Dynamic Authorization Middleware
 * Automatically applies authorization based on permission matrix
 * 
 * Usage:
 * ```typescript
 * // In app.ts or server.ts
 * app.use(applyDynamicAuthorization);
 * 
 * // Now all routes are automatically protected based on permission matrix
 * // No need to manually add authorize() middleware to each route
 * ```
 * 
 * Note: This should be applied after authenticate middleware
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export function applyDynamicAuthorization(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const roles = getRequiredRoles(req.path, req.method);

  // If no permission defined for this route, continue
  // (Route-specific authorization will handle it)
  if (!roles) {
    return next();
  }

  // Apply authorization middleware dynamically
  const authMiddleware = authorize(...(roles as any));
  authMiddleware(req, res, next);
}

/**
 * Get Permission Summary
 * Returns human-readable summary of permissions for path
 * 
 * @param path - Request path
 * @returns Object with method permissions
 * 
 * @example
 * ```typescript
 * const summary = getPermissionSummary('/api/appointments/:id');
 * // Returns:
 * // {
 * //   GET: ['staff', 'admin', 'patient'],
 * //   PUT: ['staff', 'admin'],
 * //   DELETE: ['staff', 'admin']
 * // }
 * ```
 */
export function getPermissionSummary(path: string): Record<string, string[]> {
  const summary: Record<string, string[]> = {};

  // Find matching pattern
  let matchingRules = permissionMatrix[path];
  if (!matchingRules) {
    for (const [pattern, rules] of Object.entries(permissionMatrix)) {
      if (matchesPattern(path, pattern)) {
        matchingRules = rules;
        break;
      }
    }
  }

  // Build summary
  if (matchingRules) {
    for (const rule of matchingRules) {
      summary[rule.method] = rule.roles;
    }
  }

  return summary;
}

/**
 * List All Permissions
 * Returns all permissions in the matrix (for admin UI)
 * 
 * @returns Array of permission entries
 * 
 * @example
 * ```typescript
 * const allPermissions = listAllPermissions();
 * // Returns array of { path, method, roles }
 * ```
 */
export function listAllPermissions(): Array<{
  path: string;
  method: string;
  roles: string[];
}> {
  const permissions: Array<{ path: string; method: string; roles: string[] }> = [];

  for (const [path, rules] of Object.entries(permissionMatrix)) {
    for (const rule of rules) {
      permissions.push({
        path,
        method: rule.method,
        roles: rule.roles,
      });
    }
  }

  return permissions;
}

/**
 * Validate Permission Matrix
 * Checks for common configuration errors
 * 
 * @returns Array of validation errors (empty if valid)
 * 
 * @example
 * ```typescript
 * const errors = validatePermissionMatrix();
 * if (errors.length > 0) {
 *   console.error('Permission matrix validation failed:', errors);
 * }
 * ```
 */
export function validatePermissionMatrix(): string[] {
  const errors: string[] = [];

  for (const [path, rules] of Object.entries(permissionMatrix)) {
    // Check for duplicate methods
    const methods = rules.map(r => r.method);
    const duplicates = methods.filter((m, i) => methods.indexOf(m) !== i);
    if (duplicates.length > 0) {
      errors.push(`Duplicate methods for ${path}: ${duplicates.join(', ')}`);
    }

    // Check for empty roles
    for (const rule of rules) {
      if (!rule.roles || rule.roles.length === 0) {
        errors.push(`Empty roles for ${path} ${rule.method}`);
      }
    }

    // Check for invalid roles
    const validRoles = [...Object.values(UserRole), SpecialRoles.PUBLIC, SpecialRoles.ANY_AUTHENTICATED];
    for (const rule of rules) {
      for (const role of rule.roles) {
        if (!validRoles.includes(role as any)) {
          errors.push(`Invalid role '${role}' for ${path} ${rule.method}`);
        }
      }
    }
  }

  return errors;
}

/**
 * Export Permission Matrix for Documentation
 * Generates markdown table of all permissions
 * 
 * @returns Markdown string
 * 
 * @example
 * ```typescript
 * const markdown = exportPermissionMatrixMarkdown();
 * fs.writeFileSync('PERMISSIONS.md', markdown);
 * ```
 */
export function exportPermissionMatrixMarkdown(): string {
  const lines = [
    '# API Permission Matrix',
    '',
    'This document lists all API endpoints and their required roles.',
    '',
    '| Endpoint | Method | Required Roles |',
    '|----------|--------|----------------|',
  ];

  const permissions = listAllPermissions();
  permissions.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

  for (const permission of permissions) {
    const roles = permission.roles.join(', ');
    lines.push(`| ${permission.path} | ${permission.method} | ${roles} |`);
  }

  lines.push('');
  lines.push('## Legend');
  lines.push('');
  lines.push('- `*`: Public access (no authentication required)');
  lines.push('- `**`: Any authenticated user');
  lines.push('- `admin`: Administrator role only');
  lines.push('- `staff`: Staff role (nurses inherit from admin)');
  lines.push('- `patient`: Patient role');
  lines.push('');
  lines.push('## Role Hierarchy');
  lines.push('');
  lines.push('```');
  lines.push('admin (level 3) → Can access admin, staff, and patient endpoints');
  lines.push('staff (level 2) → Can access staff and patient endpoints');
  lines.push('patient (level 1) → Can access patient endpoints only');
  lines.push('```');

  return lines.join('\n');
}
