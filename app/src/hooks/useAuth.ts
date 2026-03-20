/**
 * useAuth Hook
 * 
 * Custom React hook for accessing authentication context.
 * Provides login, logout, and authentication status from AuthContext.
 * 
 * Usage:
 * ```tsx
 * const { login, logout, isAuthenticated, user, loading, error } = useAuth();
 * ```
 * 
 * @module useAuth
 * @created 2026-03-18
 * @task US_012 TASK_001, TASK_003
 */

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import type { AuthContextType } from '../context/AuthContext';

/**
 * Authentication hook
 * 
 * Accesses AuthContext and provides authentication state and operations.
 * Must be used within AuthProvider.
 * 
 * @throws Error if used outside of AuthProvider
 * @returns Authentication context with user, login, logout, etc.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
