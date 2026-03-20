/**
 * Token Storage Utilities
 * 
 * Centralized localStorage/sessionStorage management for authentication tokens.
 * Handles token storage, retrieval, expiry checking, and user data persistence.
 * 
 * Storage strategy:
 * - rememberMe = true: localStorage with 7-day expiry
 * - rememberMe = false: sessionStorage with 15-minute expiry
 * 
 * @module tokenStorage
 * @created 2026-03-18
 * @task US_012 TASK_003
 */

import type { AuthUser } from '../../types/auth.types';

/**
 * Storage keys for authentication data
 */
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'auth_user',
  EXPIRY: 'auth_token_expiry',
  REMEMBER_ME: 'auth_remember_me',
} as const;

/**
 * Token expiry durations (in seconds)
 */
export const TOKEN_EXPIRY = {
  REMEMBER_ME: 7 * 24 * 60 * 60, // 7 days
  SESSION: 15 * 60,               // 15 minutes
} as const;

/**
 * Save authentication token to storage
 * 
 * @param token - JWT token from authentication
 * @param rememberMe - Whether to store in localStorage (true) or sessionStorage (false)
 * @param expiresIn - Token expiry duration in seconds (optional, defaults based on rememberMe)
 */
export function saveToken(
  token: string,
  rememberMe: boolean = false,
  expiresIn?: number
): void {
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(STORAGE_KEYS.TOKEN, token);

  // Calculate expiry timestamp
  const expiry = expiresIn || (rememberMe ? TOKEN_EXPIRY.REMEMBER_ME : TOKEN_EXPIRY.SESSION);
  const expiryTimestamp = Date.now() + expiry * 1000;
  storage.setItem(STORAGE_KEYS.EXPIRY, expiryTimestamp.toString());

  // Store remember me preference
  localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, rememberMe.toString());
}

/**
 * Get authentication token from storage
 * Checks expiry and returns null if expired
 * 
 * @returns Token string or null if not found/expired
 */
export function getToken(): string | null {
  // Check both storages (localStorage first for remember me, then sessionStorage)
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN) || sessionStorage.getItem(STORAGE_KEYS.TOKEN);
  
  if (!token) {
    return null;
  }

  // Check if token is expired
  const expiryStr = localStorage.getItem(STORAGE_KEYS.EXPIRY) || sessionStorage.getItem(STORAGE_KEYS.EXPIRY);
  if (expiryStr) {
    const expiry = parseInt(expiryStr, 10);
    if (Date.now() > expiry) {
      // Token expired - clear storage
      removeToken();
      return null;
    }
  }

  return token;
}

/**
 * Remove authentication token from storage
 */
export function removeToken(): void {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.EXPIRY);
  sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.EXPIRY);
}

/**
 * Save user data to storage
 * 
 * @param user - Authenticated user data
 * @param rememberMe - Whether to store in localStorage or sessionStorage
 */
export function saveUser(user: AuthUser, rememberMe: boolean = false): void {
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

/**
 * Get user data from storage
 * 
 * @returns AuthUser object or null if not found
 */
export function getUser(): AuthUser | null {
  const userStr = localStorage.getItem(STORAGE_KEYS.USER) || sessionStorage.getItem(STORAGE_KEYS.USER);
  
  if (!userStr) {
    return null;
  }

  try {
    return JSON.parse(userStr) as AuthUser;
  } catch (error) {
    console.error('Failed to parse stored user data:', error);
    removeUser();
    return null;
  }
}

/**
 * Remove user data from storage
 */
export function removeUser(): void {
  localStorage.removeItem(STORAGE_KEYS.USER);
  sessionStorage.removeItem(STORAGE_KEYS.USER);
}

/**
 * Get remember me preference
 * 
 * @returns Boolean indicating if remember me was checked
 */
export function getRememberMe(): boolean {
  const rememberMeStr = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
  return rememberMeStr === 'true';
}

/**
 * Clear all authentication data from storage
 */
export function clearAllStorage(): void {
  removeToken();
  removeUser();
  localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
}

/**
 * Check if token is expired
 * 
 * @returns Boolean indicating if token is expired
 */
export function isTokenExpired(): boolean {
  const expiryStr = localStorage.getItem(STORAGE_KEYS.EXPIRY) || sessionStorage.getItem(STORAGE_KEYS.EXPIRY);
  
  if (!expiryStr) {
    return true; // No expiry = treat as expired
  }

  const expiry = parseInt(expiryStr, 10);
  return Date.now() > expiry;
}

/**
 * Get time remaining until token expires (in seconds)
 * 
 * @returns Seconds until expiry, or 0 if expired/not found
 */
export function getTimeUntilExpiry(): number {
  const expiryStr = localStorage.getItem(STORAGE_KEYS.EXPIRY) || sessionStorage.getItem(STORAGE_KEYS.EXPIRY);
  
  if (!expiryStr) {
    return 0;
  }

  const expiry = parseInt(expiryStr, 10);
  const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
  return remaining;
}
