/**
 * useDepartments Hook
 * 
 * Custom React hook for fetching department list for dropdown selection.
 * 
 * @module useDepartments
 * @task US_035 TASK_002
 */

import { useState, useEffect } from 'react';
import api from '../services/api';
import type { Department, DepartmentsApiResponse } from '../types/user.types';

interface UseDepartmentsReturn {
  departments: Department[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook for fetching active departments
 */
export function useDepartments(): UseDepartmentsReturn {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        const response = await api.get<DepartmentsApiResponse>('/admin/departments');
        if (response.data.success) {
          setDepartments(response.data.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch departments');
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  return { departments, loading, error };
}
