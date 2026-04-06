/**
 * LoginPage Component
 * 
 * Main login page (SCR-001) with brand section and login form.
 * Follows wireframe-SCR-001-login.html design with:
 * - Split layout: brand section (left) + form section (right)
 * - Mobile-first responsive design
 * - WCAG 2.2 AA accessibility compliance
 * - Role-based redirect after successful login
 * 
 * @module LoginPage
 * @created 2026-03-18
 * @task US_012 TASK_001
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';
import { handleApiError, logError } from '../utils/api/errorHandler';
import { ACTION_PROMPTS } from '../constants/errorMessages';
import type { LoginRequest } from '../types/auth.types';
import './LoginPage.css';

/**
 * LoginPage Component
 * 
 * Renders the login page with brand section and login form.
 * Redirects authenticated users to their role-specific dashboard.
 */
export function LoginPage() {
  const { login, isAuthenticated, user, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [lastCredentials, setLastCredentials] = useState<LoginRequest | null>(null);
  const [isRetryable, setIsRetryable] = useState(false);

  /**
   * Redirect authenticated users to their role-specific dashboard
   */
  useEffect(() => {
    if (isAuthenticated && !loading && user) {
      const roleDashboards: Record<string, string> = {
        patient: '/patient/dashboard',
        doctor: '/doctor/dashboard',
        staff: '/staff/dashboard',
        admin: '/admin/dashboard',
      };
      const target = roleDashboards[user.role] || '/patient/dashboard';
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, loading, user, navigate]);

  /**
   * Handle login form submission
   * @param credentials - Login credentials from form
   */
  const handleLogin = async (credentials: LoginRequest) => {
    // Clear any previous errors
    clearError();
    setIsRetryable(false);
    
    // Save credentials for potential retry
    setLastCredentials(credentials);
    
    try {
      await login(credentials);
      // Navigation is handled by useAuth hook on successful login
    } catch (error) {
      // Enhanced error handling
      const apiError = handleApiError(error);
      
      // Log error for debugging
      logError(apiError, { context: 'LoginPage' });
      
      // Set retry flag if error is retryable
      setIsRetryable(apiError.retryable);
      
      // Error is displayed in form via error prop from useAuth
      console.error('Login failed:', apiError.message);
    }
  };

  /**
   * Retry last login attempt
   */
  const handleRetry = () => {
    if (lastCredentials) {
      handleLogin(lastCredentials);
    }
  };

  // Don't render form if user is authenticated and redirecting
  if (isAuthenticated && !loading) {
    return null;
  }

  return (
    <div className="login-page">
      {/* Brand Section */}
      <div className="login-brand">
        <div className="login-brand__content">
          <div className="login-brand__logo">UPACI</div>
          <p className="login-brand__tagline">
            Unified Patient Access & Clinical Intelligence Platform
          </p>
          
          <div className="login-brand__illustration" aria-hidden="true">
            <svg
              width="220"
              height="170"
              viewBox="0 0 220 170"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Medical Cross Icon */}
              <rect x="85" y="40" width="50" height="90" rx="5" fill="rgba(255,255,255,0.3)" />
              <rect x="60" y="65" width="100" height="40" rx="5" fill="rgba(255,255,255,0.3)" />
              
              {/* Calendar Icon */}
              <rect x="20" y="100" width="60" height="60" rx="8" stroke="rgba(255,255,255,0.4)" strokeWidth="3" fill="none" />
              <line x1="30" y1="110" x2="70" y2="110" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
              <circle cx="35" cy="125" r="3" fill="rgba(255,255,255,0.4)" />
              <circle cx="50" cy="125" r="3" fill="rgba(255,255,255,0.4)" />
              <circle cx="65" cy="125" r="3" fill="rgba(255,255,255,0.4)" />
              
              {/* Queue/List Icon */}
              <rect x="140" y="100" width="60" height="60" rx="8" stroke="rgba(255,255,255,0.4)" strokeWidth="3" fill="none" />
              <line x1="150" y1="115" x2="190" y2="115" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
              <line x1="150" y1="130" x2="190" y2="130" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
              <line x1="150" y1="145" x2="190" y2="145" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
            </svg>
          </div>
          
          <ul className="login-brand__features">
            <li>Effortless Appointment Booking</li>
            <li>Real-Time Queue Management</li>
            <li>AI-Powered Patient Intake</li>
            <li>Comprehensive Health Records</li>
          </ul>
        </div>
      </div>

      {/* Form Section */}
      <div className="login-form-container">
        <div className="login-card">
          <h1 className="login-card__title">Welcome Back</h1>
          <p className="login-card__subtitle">
            Sign in to access your healthcare dashboard
          </p>

          {/* Login Form */}
          <LoginForm
            onSubmit={handleLogin}
            error={error}
            loading={loading}
          />

          {/* Retry Button for Network Errors */}
          {error && isRetryable && (
            <button
              type="button"
              className="btn btn--secondary btn--block retry-button"
              onClick={handleRetry}
              disabled={loading}
              aria-label="Retry login attempt"
            >
              {ACTION_PROMPTS.RETRY}
            </button>
          )}

          {/* Forgot Password Link */}
          <div className="login-card__footer">
            <Link
              to="/forgot-password"
              className="forgot-password-link"
              aria-label="Forgot your password? Click to reset"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Register Link (for future implementation) */}
          <div className="login-card__register">
            <span className="login-card__register-text">Don't have an account? </span>
            <Link
              to="/register"
              className="register-link"
              aria-label="Create a new account"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
