/**
 * useDepartmentManagement Hook
 *
 * Custom React hook for department CRUD operations with pagination.
 *
 * @module useDepartmentManagement
 * @task US_036 TASK_004
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type {
  DepartmentManaged,
  CreateDepartmentInput,
  UpdateDepartmentInput,
  DepartmentPagination,
} from '../types/department.types';

interface UseDepartmentManagementParams {
  page?: number;
  limit?: number;
  status?: string;
}

interface UseDepartmentManagementReturn {
  departments: DepartmentManaged[];
  loading: boolean;
  error: string | null;
  pagination: DepartmentPagination;
  refetch: () => void;
  createDepartment: (data: CreateDepartmentInput) => Promise<{ success: boolean; message: string }>;
  updateDepartment: (id: number, data: UpdateDepartmentInput) => Promise<{ success: boolean; message: string }>;
  deactivateDepartment: (id: number) => Promise<{ success: boolean; message: string }>;
  creating: boolean;
  updating: boolean;
  deactivating: boolean;
}

export function useDepartmentManagement(
  params: UseDepartmentManagementParams = {},
): UseDepartmentManagementReturn {
  const { page = 1, limit = 20, status } = params;

  const [departments, setDepartments] = useState<DepartmentManaged[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<DepartmentPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams: Record<string, string | number> = { page, limit };
      if (status) queryParams.status = status;

      const response = await api.get('/admin/departments/manage', { params: queryParams });
      if (response.data.success) {
        setDepartments(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  }, [page, limit, status]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    const interval = setInterval(fetchDepartments, 10000);
    return () => clearInterval(interval);
  }, [fetchDepartments]);

  const createDepartment = useCallback(async (data: CreateDepartmentInput) => {
    try {
      setCreating(true);
      const response = await api.post('/admin/departments/manage', data);
      if (response.data.success) {
        await fetchDepartments();
        return { success: true, message: 'Department created successfully' };
      }
      return { success: false, message: 'Failed to create department' };
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create department';
      return { success: false, message };
    } finally {
      setCreating(false);
    }
  }, [fetchDepartments]);

  const updateDepartment = useCallback(async (id: number, data: UpdateDepartmentInput) => {
    try {
      setUpdating(true);
      const response = await api.put(`/admin/departments/manage/${id}`, data);
      if (response.data.success) {
        await fetchDepartments();
        return { success: true, message: 'Department updated successfully' };
      }
      return { success: false, message: 'Failed to update department' };
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update department';
      return { success: false, message };
    } finally {
      setUpdating(false);
    }
  }, [fetchDepartments]);

  const deactivateDepartment = useCallback(async (id: number) => {
    try {
      setDeactivating(true);
      const response = await api.patch(`/admin/departments/manage/${id}/deactivate`);
      if (response.data.success) {
        await fetchDepartments();
        return { success: true, message: 'Department deactivated successfully' };
      }
      return { success: false, message: 'Failed to deactivate department' };
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to deactivate department';
      return { success: false, message };
    } finally {
      setDeactivating(false);
    }
  }, [fetchDepartments]);

  return {
    departments,
    loading,
    error,
    pagination,
    refetch: fetchDepartments,
    createDepartment,
    updateDepartment,
    deactivateDepartment,
    creating,
    updating,
    deactivating,
  };
}
