/**
 * Authentication Types
 * 
 * Type definitions for authentication-related data structures
 * including login requests, responses, user roles, and session management.
 * 
 * @module auth.types
 * @created 2026-03-18
 * @task US_012 TASK_001
 */

/**
 * User roles in the system
 */
export type UserRole = 'patient' | 'doctor' | 'staff' | 'admin';

/**
 * User role constants
 */
export const USER_ROLES = {
  PATIENT: 'patient' as UserRole,
  STAFF: 'staff' as UserRole,
  ADMIN: 'admin' as UserRole,
} as const;

/**
 * Login request payload
 */
export interface LoginRequest {
  /** User's email address */
  email: string;
  /** User's password */
  password: string;
  /** Whether to extend session to 7 days (default: 15 minutes) */
  rememberMe: boolean;
}

/**
 * Login response from API
 */
export interface LoginResponse {
  /** Authentication success status */
  success: boolean;
  /** JWT authentication token */
  token: string;
  /** Nested user object from backend */
  user?: {
    id: number;
    email: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
  };
  /** User ID (flat format fallback) */
  userId?: number;
  /** User's role (flat format fallback) */
  role?: UserRole;
  /** User's email (flat format fallback) */
  email?: string;
  /** User's full name (flat format fallback) */
  name?: string;
  /** Token expiry in seconds */
  expiresIn?: number;
  /** Error message (if success is false) */
  message?: string;
}

/**
 * Authenticated user context
 */
export interface AuthUser {
  /** User ID */
  id: number;
  /** User's email */
  email: string;
  /** User's role */
  role: UserRole;
  /** User's full name (optional) */
  name?: string;
}

/**
 * Authentication state
 */
export interface AuthState {
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Currently logged-in user (null if not authenticated) */
  user: AuthUser | null;
  /** Whether authentication is being checked/performed */
  loading: boolean;
  /** Error message from last auth operation */
  error: string | null;
}

/**
 * Token storage options
 */
export interface TokenStorage {
  /** Storage key for JWT token */
  TOKEN_KEY: string;
  /** Storage key for user data */
  USER_KEY: string;
  /** Storage key for remember me preference */
  REMEMBER_ME_KEY: string;
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  /** Error status */
  success: false;
  /** Error message */
  message: string;
  /** HTTP status code */
  statusCode?: number;
  /** Additional error details */
  errors?: Record<string, string[]>;
}
