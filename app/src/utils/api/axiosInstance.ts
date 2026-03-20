/**
 * Axios Instance with Interceptors
 * 
 * Centralized axios instance for all API calls with automatic:
 * - Authorization header injection (Bearer token)
 * - 401 Unauthorized handling (auto-logout and redirect)
 * - Timeout configuration (30 seconds)
 * - Base URL configuration
 * 
 * @module axiosInstance
 * @created 2026-03-18
 * @task US_012 TASK_003
 */

import axios from 'axios';
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { getToken, clearAllStorage } from '../storage/tokenStorage';

/**
 * API base URL from environment variables
 * Fallback to /api for relative requests
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Create axios instance with default configuration
 */
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds (per TASK_002 edge case requirement)
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Automatically attaches Authorization header with Bearer token
 * if token exists in storage
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles 401 Unauthorized responses by:
 * 1. Clearing all authentication data from storage
 * 2. Redirecting to login page
 * 
 * This ensures users are automatically logged out when:
 * - Token expires
 * - Token is invalid/tampered
 * - Backend returns 401 for any reason
 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Pass through successful responses
    return response;
  },
  (error: AxiosError) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear authentication data
      clearAllStorage();
      
      // Redirect to login page (only if not already on login page)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
