/**
 * useUsers Hook
 * 
 * Custom React hook for admin user management CRUD operations.
 * Uses React Query for data fetching and caching.
 * 
 * @module useUsers
 * @task US_035 TASK_002
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type {
  User,
  CreateUserInput,
  UpdateUserInput,
  UserPagination,
  UsersApiResponse,
} from '../types/user.types';

interface UseUsersParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  role?: string;
  status?: string;
  search?: string;
}

interface UseUsersReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  pagination: UserPagination;
  refetch: () => void;
  createUser: (data: CreateUserInput) => Promise<{ success: boolean; message: string }>;
  updateUser: (userId: number, data: UpdateUserInput) => Promise<{ success: boolean; message: string }>;
  deactivateUser: (userId: number) => Promise<{ success: boolean; message: string }>;
  creating: boolean;
  updating: boolean;
  deactivating: boolean;
}

/**
 * Custom hook for user management with pagination, filtering, and CRUD
 */
export function useUsers(params: UseUsersParams = {}): UseUsersReturn {
  const {
    page = 1,
    limit = 20,
    sortBy = 'created_at',
    sortOrder = 'desc',
    role,
    status,
    search,
  } = params;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UserPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      queryParams.append('page', String(page));
      queryParams.append('limit', String(limit));
      queryParams.append('sortBy', sortBy);
      queryParams.append('sortOrder', sortOrder);
      if (role) queryParams.append('role', role);
      if (status) queryParams.append('status', status);
      if (search) queryParams.append('search', search);

      const response = await api.get<UsersApiResponse>(
        `/admin/users?${queryParams.toString()}`,
      );

      if (response.data.success) {
        setUsers(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch users';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, role, status, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const createUser = async (data: CreateUserInput) => {
    setCreating(true);
    try {
      const { confirm_password, ...payload } = data;
      const response = await api.post('/admin/users', payload);
      await fetchUsers();
      return { success: true, message: response.data.data?.message || 'User created successfully' };
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create user';
      throw new Error(message);
    } finally {
      setCreating(false);
    }
  };

  const updateUser = async (userId: number, data: UpdateUserInput) => {
    setUpdating(true);
    try {
      await api.put(`/admin/users/${userId}`, data);
      await fetchUsers();
      return { success: true, message: 'User updated successfully' };
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update user';
      throw new Error(message);
    } finally {
      setUpdating(false);
    }
  };

  const deactivateUser = async (userId: number) => {
    setDeactivating(true);
    try {
      await api.delete(`/admin/users/${userId}`);
      await fetchUsers();
      return { success: true, message: 'User deactivated successfully' };
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to deactivate user';
      throw new Error(message);
    } finally {
      setDeactivating(false);
    }
  };

  return {
    users,
    loading,
    error,
    pagination,
    refetch: fetchUsers,
    createUser,
    updateUser,
    deactivateUser,
    creating,
    updating,
    deactivating,
  };
}
