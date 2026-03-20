/**
 * ProtectedRoute Component
 * 
 * Route guard that redirects unauthenticated users to login page.
 * Optionally restricts access based on user roles.
 * 
 * Usage:
 * ```tsx
 * // Basic protection (requires authentication)
 * <Route path="/dashboard" element={
 *   <ProtectedRoute>
 *     <Dashboard />
 *   </ProtectedRoute>
 * } />
 * 
 * // Role-based protection
 * <Route path="/admin" element={
 *   <ProtectedRoute allowedRoles={['admin']}>
 *     <AdminPanel />
 *   </ProtectedRoute>
 * } />
 * 
 * // Multiple roles allowed
 * <Route path="/staff" element={
 *   <ProtectedRoute allowedRoles={['staff', 'admin']}>
 *     <StaffDashboard />
 *   </ProtectedRoute>
 * } />
 * ```
 * 
 * @module ProtectedRoute
 * @created 2026-03-18
 * @task US_012 TASK_003
 */

import React from 'react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { UserRole } from '../../types/auth.types';

/**
 * ProtectedRoute Props
 */
interface ProtectedRouteProps {
  /** Child components to render if authorized */
  children: ReactNode;
  /** Optional array of roles that are allowed to access this route */
  allowedRoles?: UserRole[];
  /** Optional redirect path for unauthorized access (default: /login) */
  redirectTo?: string;
}

/**
 * ProtectedRoute Component
 * 
 * Guards routes by checking authentication and optionally user roles.
 * Redirects to login if not authenticated or to unauthorized page if role mismatch.
 * Shows loading spinner while checking authentication.
 * 
 * @param props - ProtectedRoute props
 * @returns Protected route component or redirect
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/login',
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <LoadingSpinner size="large" message="Checking authentication..." />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access if allowedRoles is specified
  if (allowedRoles && allowedRoles.length > 0) {
    if (!user?.role || !allowedRoles.includes(user.role)) {
      // User doesn't have required role - redirect to unauthorized page
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // User is authenticated and authorized - render children
  return <>{children}</>;
};

/**
 * Unauthorized Page Component
 * Displayed when user tries to access a route they don't have permission for
 */
export const UnauthorizedPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>403</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Unauthorized Access</h2>
      <p style={{ marginBottom: '2rem', maxWidth: '500px' }}>
        You do not have permission to access this page. Your current role is: <strong>{user?.role}</strong>
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => window.history.back()}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: '#0066CC',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Go Back
        </button>
        <button
          onClick={logout}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: '#C53030',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};
