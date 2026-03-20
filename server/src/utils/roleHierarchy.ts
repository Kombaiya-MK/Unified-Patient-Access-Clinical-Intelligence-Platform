import { UserRole, RoleHierarchyLevel } from '../types/rbac.types';
import logger from './logger';

/**
 * Role Hierarchy Utility
 * 
 * Implements role hierarchy where Admin > Staff > Patient
 * Admin can access everything, Staff can access Staff + Patient, Patient only Patient
 * 
 * Hierarchy Levels:
 * - ADMIN: 3 (highest)
 * - STAFF: 2 (middle)
 * - PATIENT: 1 (lowest)
 */

/**
 * Role hierarchy levels
 * Higher number = higher privilege
 */
export const roleHierarchy: RoleHierarchyLevel = {
  [UserRole.ADMIN]: 3,
  [UserRole.STAFF]: 2,
  [UserRole.PATIENT]: 1,
};

/**
 * Get the hierarchy level for a role
 * @param role - User role to check
 * @returns Hierarchy level (higher = more privilege), 0 if invalid
 */
export const getRoleLevel = (role: UserRole | string): number => {
  if (!role) {
    logger.warn('getRoleLevel called with empty role');
    return 0;
  }

  const level = roleHierarchy[role];
  
  if (level === undefined) {
    logger.warn('getRoleLevel called with invalid role', { role });
    return 0;
  }

  return level;
};

/**
 * Check if user role has higher or equal privilege than required role
 * Used for role hierarchy enforcement
 * 
 * @param userRole - Role of the current user
 * @param requiredRole - Role required for access
 * @returns true if user has sufficient privilege
 * 
 * @example
 * hasHigherOrEqualRole(UserRole.ADMIN, UserRole.STAFF) // true (admin > staff)
 * hasHigherOrEqualRole(UserRole.STAFF, UserRole.PATIENT) // true (staff > patient)
 * hasHigherOrEqualRole(UserRole.PATIENT, UserRole.STAFF) // false (patient < staff)
 */
export const hasHigherOrEqualRole = (
  userRole: UserRole,
  requiredRole: UserRole,
): boolean => {
  const userLevel = getRoleLevel(userRole);
  const requiredLevel = getRoleLevel(requiredRole);

  if (userLevel === 0 || requiredLevel === 0) {
    logger.warn('Invalid role in hierarchy check', { userRole, requiredRole });
    return false;
  }

  return userLevel >= requiredLevel;
};

/**
 * Check if user role can access endpoint requiring any of the specified roles
 * Considers role hierarchy
 * 
 * @param userRole - Role of the current user
 * @param requiredRoles - Array of roles that can access the resource
 * @returns true if user has access
 * 
 * @example
 * // Admin accessing staff endpoint
 * canAccessRole(UserRole.ADMIN, [UserRole.STAFF]) // true (admin > staff)
 * 
 * // Staff accessing staff or admin endpoint
 * canAccessRole(UserRole.STAFF, [UserRole.STAFF, UserRole.ADMIN]) // true (exact match)
 * 
 * // Patient accessing staff endpoint
 * canAccessRole(UserRole.PATIENT, [UserRole.STAFF]) // false (patient < staff)
 */
export const canAccessRole = (
  userRole: UserRole,
  requiredRoles: UserRole[],
): boolean => {
  if (!requiredRoles || requiredRoles.length === 0) {
    logger.debug('No required roles specified, access granted');
    return true;
  }

  // Check if user role exactly matches any required role
  if (requiredRoles.includes(userRole)) {
    return true;
  }

  // Check if user role has higher privilege than any required role
  const hasHigherPrivilege = requiredRoles.some((requiredRole) =>
    hasHigherOrEqualRole(userRole, requiredRole),
  );

  logger.debug('Role hierarchy check', {
    userRole,
    requiredRoles,
    hasAccess: hasHigherPrivilege,
  });

  return hasHigherPrivilege;
};

/**
 * Validate if a string is a valid UserRole
 * @param role - String to validate
 * @returns true if valid role, false otherwise
 */
export const isValidRole = (role: string): role is UserRole => {
  if (!role) {
    return false;
  }

  return Object.values(UserRole).includes(role as UserRole);
};

/**
 * Get all roles that a user can access (including their own role and lower)
 * Based on hierarchy
 * 
 * @param userRole - Role of the current user
 * @returns Array of accessible roles
 * 
 * @example
 * getAccessibleRoles(UserRole.ADMIN) // [ADMIN, STAFF, PATIENT]
 * getAccessibleRoles(UserRole.STAFF) // [STAFF, PATIENT]
 * getAccessibleRoles(UserRole.PATIENT) // [PATIENT]
 */
export const getAccessibleRoles = (userRole: UserRole): UserRole[] => {
  const allRoles = Object.values(UserRole);
  const userLevel = getRoleLevel(userRole);

  return allRoles.filter((role) => {
    const roleLevel = getRoleLevel(role);
    return roleLevel <= userLevel;
  });
};

/**
 * Get human-readable role name
 * @param role - UserRole enum value
 * @returns Formatted role name
 */
export const getRoleName = (role: UserRole): string => {
  const roleNames: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'Administrator',
    [UserRole.STAFF]: 'Staff Member',
    [UserRole.PATIENT]: 'Patient',
  };

  return roleNames[role] || 'Unknown Role';
};

/**
 * Get role description
 * @param role - UserRole enum value
 * @returns Role description
 */
export const getRoleDescription = (role: UserRole): string => {
  const roleDescriptions: Record<UserRole, string> = {
    [UserRole.ADMIN]:
      'Full system access including user management, system configuration, and all data',
    [UserRole.STAFF]:
      'Access to patient management, appointment scheduling, and clinical records',
    [UserRole.PATIENT]: 'Access to own profile, appointments, and medical records',
  };

  return roleDescriptions[role] || 'No description available';
};

/**
 * Check if role can manage another role (create, update, delete users)
 * Admin can manage all roles
 * Staff can manage patients
 * Patients cannot manage any roles
 * 
 * @param managerRole - Role of the user performing management
 * @param targetRole - Role of the user being managed
 * @returns true if management is allowed
 */
export const canManageRole = (
  managerRole: UserRole,
  targetRole: UserRole,
): boolean => {
  // Admin can manage all roles
  if (managerRole === UserRole.ADMIN) {
    return true;
  }

  // Staff can manage patients
  if (managerRole === UserRole.STAFF && targetRole === UserRole.PATIENT) {
    return true;
  }

  // Patients cannot manage any roles
  return false;
};

export default {
  roleHierarchy,
  getRoleLevel,
  hasHigherOrEqualRole,
  canAccessRole,
  isValidRole,
  getAccessibleRoles,
  getRoleName,
  getRoleDescription,
  canManageRole,
};
