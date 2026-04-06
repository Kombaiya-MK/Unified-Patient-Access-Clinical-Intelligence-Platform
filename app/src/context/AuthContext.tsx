/**
 * Authentication Context
 * 
 * Global authentication state management using React Context API.
 * Provides authentication state, login, logout, and user data to all components.
 * 
 * Usage:
 * ```tsx
 * import { AuthProvider } from './context/AuthContext';
 * 
 * // Wrap app with AuthProvider
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * 
 * // Use auth in components via useAuth hook
 * const { user, isAuthenticated, login, logout } = useAuth();
 * ```
 * 
 * @module AuthContext
 * @created 2026-03-18
 * @task US_012 TASK_003
 */

import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import type { LoginRequest, AuthUser, UserRole } from '../types/auth.types';

/**
 * Role-specific dashboard routes
 * Maps user roles to their respective dashboard paths
 */
const ROLE_DASHBOARDS: Record<UserRole, string> = {
  patient: '/patient/dashboard',  // SCR-002
  doctor: '/doctor/dashboard',    // SCR-005
  staff: '/staff/dashboard',      // SCR-003
  admin: '/admin/dashboard',      // SCR-004
};

/**
 * Authentication context type
 */
export interface AuthContextType {
  /** Currently logged-in user (null if not authenticated) */
  user: AuthUser | null;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Whether authentication is being checked/performed */
  loading: boolean;
  /** Error message from last auth operation */
  error: string | null;
  /** Login with credentials */
  login: (credentials: LoginRequest) => Promise<void>;
  /** Logout current user */
  logout: () => Promise<void>;
  /** Clear error message */
  clearError: () => void;
}

/**
 * Authentication context
 * Provides global auth state to all components
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 * 
 * Wraps the application and provides authentication context.
 * Automatically restores authentication state from storage on mount.
 * Handles role-based redirects after login.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize authentication state on mount
   * Restores user session from storage if token exists
   */
  useEffect(() => {
    const initAuth = () => {
      try {
        const token = authService.getToken();
        const savedUser = authService.getUser();
        
        if (token && savedUser) {
          setUser(savedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Failed to restore authentication:', error);
        authService.clearStorage();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Login user with credentials
   * On success, updates context and redirects to role-specific dashboard
   */
  const login = useCallback(async (credentials: LoginRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.login(credentials);
      
      if (response.success) {
        const user = authService.getUser();
        
        if (user) {
          setUser(user);
          setIsAuthenticated(true);

          // Redirect to role-specific dashboard
          const dashboardPath = ROLE_DASHBOARDS[user.role] || '/dashboard';
          navigate(dashboardPath, { replace: true });
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      setError(errorMessage);
      throw error; // Re-throw for component-level error handling
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  /**
   * Logout current user
   * Clears authentication state and redirects to login page
   */
  const logout = useCallback(async () => {
    setLoading(true);

    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      setLoading(false);

      // Redirect to login page
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
