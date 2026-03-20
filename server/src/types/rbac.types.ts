/**
 * Role-Based Access Control (RBAC) Type Definitions
 * 
 * Defines roles, permissions, and authorization structures
 */

/**
 * User Role Enum
 * Defines the three core roles in the system
 */
export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  PATIENT = 'patient',
}

/**
 * Role Configuration for Endpoints
 * Defines which roles can access an endpoint
 */
export interface RoleConfig {
  allowedRoles: UserRole[]; // Roles that can access this resource
  requireAll?: boolean; // If true, user must have all roles (default: false = any role)
  resourceBased?: boolean; // If true, check resource ownership
}

/**
 * Permission Matrix Structure
 * Maps endpoints to required roles per HTTP method
 */
export interface PermissionMatrix {
  [endpoint: string]: PermissionRule[];
}

/**
 * Permission Rule for Specific Endpoint + Method
 */
export interface PermissionRule {
  method: string; // HTTP method (GET, POST, PUT, DELETE, etc.)
  roles: string[]; // Required roles (UserRole values or SpecialRoles)
}

/**
 * Resource Permission
 * Used for resource-based authorization (e.g., patient accessing own records)
 */
export interface ResourcePermission {
  resourceType: string; // Type of resource (e.g., 'patient', 'appointment')
  resourceId: string | number; // ID of the resource
  ownerId: number; // User ID of the resource owner
}

/**
 * Authorization Result
 * Returned by permission checking functions
 */
export interface AuthorizationResult {
  authorized: boolean; // Whether access is granted
  reason?: string; // Reason for denial (if not authorized)
}

/**
 * Authorization Error Class
 * Custom error for authorization failures
 */
export class AuthorizationError extends Error {
  statusCode: number;
  requiredRoles: UserRole[];
  userRole?: UserRole;

  constructor(
    message: string,
    requiredRoles: UserRole[],
    userRole?: UserRole,
    statusCode: number = 403,
  ) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = statusCode;
    this.requiredRoles = requiredRoles;
    this.userRole = userRole;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Role Hierarchy Level
 * Used for determining role superiority
 */
export interface RoleHierarchyLevel {
  [key: string]: number;
}

/**
 * Authorization Context
 * Complete context for authorization decisions
 */
export interface AuthorizationContext {
  userId: number;
  userRole: UserRole;
  requestPath: string;
  requestMethod: string;
  ipAddress: string;
  resource?: ResourcePermission;
}

/**
 * Special Role Values
 * Used for special authorization cases
 */
export const SpecialRoles = {
  PUBLIC: '*', // Public access, no authentication required
  ANY_AUTHENTICATED: '**', // Any authenticated user, regardless of role
} as const;

/**
 * Type guard to check if a string is a valid UserRole
 */
export function isUserRole(role: any): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}

/**
 * Type guard to check if a role is a special role
 */
export function isSpecialRole(role: string): boolean {
  return Object.values(SpecialRoles).includes(role as any);
}
