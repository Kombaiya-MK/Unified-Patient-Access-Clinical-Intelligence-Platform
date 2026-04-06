/**
 * User Management Types
 * 
 * Type definitions for admin user management pages and API interactions.
 * 
 * @module user.types
 * @task US_035 TASK_002
 */

/**
 * User record from the API
 */
export interface User {
  id: number;
  email: string;
  role: 'patient' | 'doctor' | 'staff' | 'admin';
  first_name: string;
  last_name: string;
  phone_number?: string;
  department_id?: number | null;
  department_name?: string | null;
  is_active: boolean;
  last_login_at?: string | null;
  created_at: string;
}

/**
 * Input for creating a new user
 */
export interface CreateUserInput {
  email: string;
  password: string;
  confirm_password: string;
  role: 'patient' | 'doctor' | 'staff' | 'admin';
  first_name: string;
  last_name: string;
  phone_number?: string;
  department_id?: number | null;
}

/**
 * Input for updating a user
 */
export interface UpdateUserInput {
  role?: 'patient' | 'doctor' | 'staff' | 'admin';
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  department_id?: number | null;
  password?: string;
}

/**
 * Department record for dropdown
 */
export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
}

/**
 * Pagination metadata
 */
export interface UserPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * API response for user list
 */
export interface UsersApiResponse {
  success: boolean;
  data: User[];
  pagination: UserPagination;
  timestamp: string;
}

/**
 * API response for create user
 */
export interface CreateUserApiResponse {
  success: boolean;
  data: {
    user_id: number;
    message: string;
  };
  timestamp: string;
}

/**
 * API response for departments
 */
export interface DepartmentsApiResponse {
  success: boolean;
  data: Department[];
  timestamp: string;
}
