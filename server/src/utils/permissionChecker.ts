import {
  UserRole,
  AuthorizationResult,
  ResourcePermission,
  RoleConfig,
  SpecialRoles,
  isSpecialRole,
} from '../types/rbac.types';
import { canAccessRole, isValidRole } from './roleHierarchy';
import logger from './logger';

/**
 * Permission Checker Utility
 * 
 * Centralized permission validation logic
 * Handles role-based and resource-based authorization
 */

/**
 * Check if user has permission based on roles
 * Considers role hierarchy (admin > staff > patient)
 * 
 * @param userRole - Role of the current user
 * @param requiredRoles - Array of roles that can access the resource
 * @returns Authorization result with access decision and reason
 * 
 * @example
 * checkPermission(UserRole.ADMIN, [UserRole.STAFF]) 
 * // { authorized: true } - admin has higher privilege
 * 
 * checkPermission(UserRole.PATIENT, [UserRole.STAFF])
 * // { authorized: false, reason: "Insufficient permissions..." }
 */
export const checkPermission = (
  userRole: UserRole,
  requiredRoles: (UserRole | string)[],
): AuthorizationResult => {
  // Convert all roles to proper type
  const roles = requiredRoles.map((r) => r as UserRole | string);

  // Handle empty role array (no restrictions)
  if (roles.length === 0) {
    logger.debug('No role restrictions, access granted');
    return { authorized: true };
  }

  // Handle special roles
  if (roles.includes(SpecialRoles.PUBLIC)) {
    logger.debug('Public access allowed');
    return { authorized: true };
  }

  if (roles.includes(SpecialRoles.ANY_AUTHENTICATED)) {
    logger.debug('Any authenticated user allowed');
    return { authorized: true };
  }

  // Validate user role
  if (!isValidRole(userRole)) {
    logger.warn('Invalid user role', { userRole });
    return {
      authorized: false,
      reason: `Invalid user role: ${userRole}`,
    };
  }

  // Filter out special roles and get actual UserRoles
  const actualRoles = roles.filter(
    (r) => !isSpecialRole(r as string),
  ) as UserRole[];

  // Check if user can access any of the required roles
  if (canAccessRole(userRole, actualRoles)) {
    logger.debug('Permission granted', {
      userRole,
      requiredRoles: actualRoles,
    });
    return { authorized: true };
  }

  // Access denied
  logger.info('Permission denied', {
    userRole,
    requiredRoles: actualRoles,
  });

  return {
    authorized: false,
    reason: `Insufficient permissions. Required role${actualRoles.length > 1 ? 's' : ''}: ${actualRoles.join(', ')}`,
  };
};

/**
 * Check if user owns the resource
 * Used for resource-based authorization
 * 
 * @param userId - ID of the current user
 * @param resource - Resource permission info
 * @returns true if user owns the resource
 */
export const checkResourceOwnership = (
  userId: number,
  resource: ResourcePermission,
): boolean => {
  const isOwner = userId === resource.ownerId;

  logger.debug('Ownership check', {
    userId,
    ownerId: resource.ownerId,
    resourceType: resource.resourceType,
    resourceId: resource.resourceId,
    isOwner,
  });

  return isOwner;
};

/**
 * Comprehensive authorization check
 * Checks both role-based and resource-based permissions
 * 
 * @param user - User info (id and role)
 * @param config - Role configuration
 * @param resource - Optional resource permission info
 * @returns Authorization result
 * 
 * @example
 * // Role-based only
 * isAuthorized({ id: 1, role: UserRole.STAFF }, { allowedRoles: [UserRole.STAFF, UserRole.ADMIN] })
 * // { authorized: true }
 * 
 * // Resource-based
 * isAuthorized(
 *   { id: 1, role: UserRole.PATIENT },
 *   { allowedRoles: [UserRole.PATIENT], resourceBased: true },
 *   { resourceType: 'patient', resourceId: 1, ownerId: 1 }
 * )
 * // { authorized: true } - patient can access their own record
 */
export const isAuthorized = (
  user: { id: number; role: UserRole },
  config: RoleConfig,
  resource?: ResourcePermission,
): AuthorizationResult => {
  // First check role-based permissions
  const roleCheck = checkPermission(user.role, config.allowedRoles);

  if (!roleCheck.authorized) {
    return roleCheck;
  }

  // If resource-based authorization is required
  if (config.resourceBased && resource) {
    // Admin and staff typically have access to all resources
    // Only check ownership for patient role
    if (user.role === UserRole.PATIENT) {
      const isOwner = checkResourceOwnership(user.id, resource);

      if (!isOwner) {
        logger.info('Resource access denied: not owner', {
          userId: user.id,
          userRole: user.role,
          resource,
        });

        return {
          authorized: false,
          reason: 'Access denied: you do not have permission to access this resource',
        };
      }
    }

    logger.debug('Resource access granted', {
      userId: user.id,
      userRole: user.role,
      resource,
    });
  }

  return { authorized: true };
};

/**
 * Check if user can perform action on specific resource type
 * More granular than general authorization
 * 
 * @param userRole - Role of the current user
 * @param action - Action to perform (e.g., 'read', 'write', 'delete')
 * @param resourceType - Type of resource (e.g., 'patient', 'appointment')
 * @returns Authorization result
 */
export const canPerformAction = (
  userRole: UserRole,
  action: string,
  resourceType: string,
): AuthorizationResult => {
  // Define action permissions per role and resource type
  const actionPermissions: Record<
    UserRole,
    Record<string, Record<string, boolean>>
  > = {
    [UserRole.ADMIN]: {
      patient: { read: true, write: true, delete: true },
      appointment: { read: true, write: true, delete: true },
      user: { read: true, write: true, delete: true },
    },
    [UserRole.STAFF]: {
      patient: { read: true, write: true, delete: false },
      appointment: { read: true, write: true, delete: false },
      user: { read: false, write: false, delete: false },
    },
    [UserRole.PATIENT]: {
      patient: { read: true, write: false, delete: false }, // Can read own data only
      appointment: { read: true, write: true, delete: false }, // Can manage own appointments
      user: { read: false, write: false, delete: false },
    },
  };

  const rolePermissions = actionPermissions[userRole];

  if (!rolePermissions) {
    return {
      authorized: false,
      reason: `Unknown role: ${userRole}`,
    };
  }

  const resourcePermissions = rolePermissions[resourceType];

  if (!resourcePermissions) {
    return {
      authorized: false,
      reason: `Unknown resource type: ${resourceType}`,
    };
  }

  const allowed = resourcePermissions[action];

  if (!allowed) {
    return {
      authorized: false,
      reason: `${userRole} cannot perform ${action} on ${resourceType}`,
    };
  }

  return { authorized: true };
};

/**
 * Create resource permission object from request parameters
 * Helper function to extract resource info from requests
 * 
 * @param resourceType - Type of resource
 * @param resourceId - ID of resource (from params or body)
 * @param ownerId - ID of resource owner
 * @returns ResourcePermission object
 */
export const createResourcePermission = (
  resourceType: string,
  resourceId: string | number,
  ownerId: number,
): ResourcePermission => {
  return {
    resourceType,
    resourceId,
    ownerId,
  };
};

export default {
  checkPermission,
  checkResourceOwnership,
  isAuthorized,
  canPerformAction,
  createResourcePermission,
};
