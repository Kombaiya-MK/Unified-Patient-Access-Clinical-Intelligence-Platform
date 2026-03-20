import { Request } from 'express';

/**
 * JWT Payload Structure
 * Contains user identification and authorization data
 * Embedded in every JWT token for 15-minute sessions
 */
export interface JwtPayload {
  userId: number;
  email: string;
  role: 'patient' | 'staff' | 'admin';
  iat: number; // Issued at timestamp
  exp: number; // Expiry timestamp (15 minutes from iat)
}

/**
 * Login Request Body
 * Credentials submitted by user for authentication
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login Response
 * Returned after successful authentication
 */
export interface LoginResponse {
  success: boolean;
  token: string;
  expiresIn: number; // Seconds until expiry (900 for 15 minutes)
  user: {
    id: number;
    email: string;
    role: 'patient' | 'staff' | 'admin';
    firstName?: string;
    lastName?: string;
  };
}

/**
 * Session Data Stored in Redis
 * TTL: 900 seconds (15 minutes)
 * Key pattern: session:{userId}
 */
export interface AuthSession {
  userId: number;
  email: string;
  role: 'patient' | 'staff' | 'admin';
  createdAt: number; // Unix timestamp
  lastActivity: number; // Unix timestamp
  deviceInfo?: string; // User-Agent for tracking
  ipAddress?: string; // IP address for security
}

/**
 * Extended Express Request with Authenticated User
 * User data attached by authenticate middleware
 */
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * Logout Request (requires authenticated user)
 */
export interface LogoutRequest extends AuthRequest {
  user: JwtPayload; // Required for logout
}

/**
 * Token Blacklist Entry
 * Stored in Redis with TTL matching token's remaining lifetime
 * Key pattern: blacklist:{tokenHash}
 */
export interface TokenBlacklist {
  tokenHash: string; // SHA-256 hash of JWT token
  userId: number;
  revokedAt: number; // Unix timestamp
  expiresAt: number; // Original expiry of token
}

/**
 * Audit Log Entry for Authentication Events
 * Logged to database audit_logs table
 */
export interface AuthAuditLog {
  userId: number | null; // null for failed login attempts
  action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'TOKEN_EXPIRED' | 'TOKEN_INVALID';
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * User Record from Database (users table)
 * Simplified for authentication purposes
 */
export interface UserRecord {
  id: number;
  email: string;
  password_hash: string;
  role: 'patient' | 'staff' | 'admin';
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
