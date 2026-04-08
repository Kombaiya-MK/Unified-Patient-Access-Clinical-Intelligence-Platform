/**
 * Authentication Service
 * 
 * Handles all authentication-related API calls including login, logout,
 * token management, and session persistence. Uses centralized axios instance
 * with interceptors and tokenStorage utilities.
 * 
 * Token storage strategy:
 * - Remember Me = true: localStorage (7 days)
 * - Remember Me = false: sessionStorage (15 minutes, session-based)
 * 
 * @module authService
 * @created 2026-03-18
 * @task US_012 TASK_001, TASK_003
 */

import { AxiosError } from 'axios';
import axiosInstance from '../utils/api/axiosInstance';
import {
  saveToken,
  getToken,
  saveUser,
  getUser,
  clearAllStorage,
  getRememberMe,
} from '../utils/storage/tokenStorage';
import type { LoginRequest, LoginResponse, AuthUser, ApiErrorResponse } from '../types/auth.types';

/**
 * Login user with email and password
 * 
 * @param credentials - Login credentials (email, password, rememberMe)
 * @returns Promise<LoginResponse> - Authentication token and user data
 * @throws ApiErrorResponse - Error response from API
 * 
 * Error scenarios:
 * - 401: Invalid credentials
 * - 503: Backend unavailable
 * - Network timeout: After 30 seconds
 */
export const authService = {
  /**
   * Authenticate user with credentials
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await axiosInstance.post<LoginResponse>('/auth/login', credentials);
      
      if (response.data.success && response.data.token) {
        // Store token using tokenStorage utility
        saveToken(response.data.token, credentials.rememberMe);
        
        // Backend returns user data nested: { success, token, user: { id, email, role, firstName, lastName } }
        const respData = response.data;
        const nested = respData.user;
        const user: AuthUser = {
          id: nested?.id ?? respData.userId ?? 0,
          email: nested?.email ?? respData.email ?? '',
          role: nested?.role ?? respData.role ?? 'patient',
          name: nested?.firstName
            ? `${nested.firstName} ${nested.lastName ?? ''}`.trim()
            : respData.name,
        };
        saveUser(user, credentials.rememberMe);
      }
      
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        // Handle specific error scenarios
        if (error.code === 'ECONNABORTED') {
          throw {
            success: false,
            message: 'Request timed out. Please check your connection and try again.',
            statusCode: 408,
          } as ApiErrorResponse;
        }
        
        if (error.response) {
          // Server responded with error status
          throw {
            success: false,
            message: error.response.data.message || 'Invalid email or password',
            statusCode: error.response.status,
            errors: error.response.data.errors,
          } as ApiErrorResponse;
        }
        
        if (error.request) {
          // Request made but no response (backend unavailable)
          throw {
            success: false,
            message: 'Service temporarily unavailable. Please try again.',
            statusCode: 503,
          } as ApiErrorResponse;
        }
      }
      
      // Unknown error
      throw {
        success: false,
        message: 'An unexpected error occurred. Please try again.',
        statusCode: 500,
      } as ApiErrorResponse;
    }
  },

  /**
   * Logout user and clear stored data
   */
  async logout(): Promise<void> {
    try {
      const token = getToken();
      if (token) {
        // Call logout endpoint (optional, for server-side session invalidation)
        await axiosInstance.post('/auth/logout');
      }
    } catch (error) {
      // Silently fail - still clear local storage
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear stored data on logout
      clearAllStorage();
    }
  },

  /**
   * Refresh authentication token
   * @returns New JWT token
   */
  async refreshToken(): Promise<string> {
    try {
      const response = await axiosInstance.post<{ token: string }>('/auth/refresh');
      const { token } = response.data;
      
      // Store new token with same rememberMe preference
      const rememberMe = getRememberMe();
      saveToken(token, rememberMe);
      
      return token;
    } catch (error) {
      // Token refresh failed - clear storage and re-throw
      clearAllStorage();
      throw error;
    }
  },

  /**
   * Get stored authentication token
   * @returns Token string or null if not found
   */
  getToken,

  /**
   * Get stored user data
   * @returns AuthUser object or null if not found
   */
  getUser,

  /**
   * Check if user is authenticated (has valid token)
   * @returns Boolean indicating authentication status
   */
  isAuthenticated(): boolean {
    return !!getToken();
  },

  /**
   * Clear all stored authentication data
   */
  clearStorage: clearAllStorage,
};
