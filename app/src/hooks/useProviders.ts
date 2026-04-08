/**
 * useProviders Hook
 *
 * Custom React hook for provider management CRUD and scheduling operations.
 *
 * @module useProviders
 * @task US_036 TASK_004
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type {
  Provider,
  CreateProviderInput,
  UpdateProviderInput,
  ProviderScheduleData,
  ProviderAppointment,
  ScheduleEntry,
  ProviderPagination,
} from '../types/provider.types';

interface UseProvidersParams {
  page?: number;
  limit?: number;
  department_id?: number;
  specialty?: string;
  status?: string;
}

interface UseProvidersReturn {
  providers: Provider[];
  loading: boolean;
  error: string | null;
  pagination: ProviderPagination;
  refetch: () => void;
  createProvider: (data: CreateProviderInput) => Promise<{ success: boolean; message: string }>;
  updateProvider: (id: number, data: UpdateProviderInput) => Promise<{ success: boolean; message: string }>;
  deleteProvider: (id: number) => Promise<{ success: boolean; message: string }>;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
}

export function useProviders(params: UseProvidersParams = {}): UseProvidersReturn {
  const { page = 1, limit = 20, department_id, specialty, status } = params;

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<ProviderPagination>({
    page: 1, limit: 20, total: 0, totalPages: 0,
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams: Record<string, string | number> = { page, limit };
      if (department_id) queryParams.department_id = department_id;
      if (specialty) queryParams.specialty = specialty;
      if (status) queryParams.status = status;

      const response = await api.get('/admin/providers', { params: queryParams });
      if (response.data.success) {
        setProviders(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch providers');
    } finally {
      setLoading(false);
    }
  }, [page, limit, department_id, specialty, status]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  useEffect(() => {
    const interval = setInterval(fetchProviders, 10000);
    return () => clearInterval(interval);
  }, [fetchProviders]);

  const createProvider = useCallback(async (data: CreateProviderInput) => {
    try {
      setCreating(true);
      const response = await api.post('/admin/providers', data);
      if (response.data.success) {
        await fetchProviders();
        return { success: true, message: 'Provider created successfully' };
      }
      return { success: false, message: 'Failed to create provider' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Failed to create provider' };
    } finally {
      setCreating(false);
    }
  }, [fetchProviders]);

  const updateProvider = useCallback(async (id: number, data: UpdateProviderInput) => {
    try {
      setUpdating(true);
      const response = await api.put(`/admin/providers/${id}`, data);
      if (response.data.success) {
        await fetchProviders();
        return { success: true, message: 'Provider updated successfully' };
      }
      return { success: false, message: 'Failed to update provider' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Failed to update provider' };
    } finally {
      setUpdating(false);
    }
  }, [fetchProviders]);

  const deleteProvider = useCallback(async (id: number) => {
    try {
      setDeleting(true);
      const response = await api.delete(`/admin/providers/${id}`);
      if (response.data.success) {
        await fetchProviders();
        return { success: true, message: 'Provider deleted successfully' };
      }
      return { success: false, message: 'Failed to delete provider' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Failed to delete provider' };
    } finally {
      setDeleting(false);
    }
  }, [fetchProviders]);

  return {
    providers, loading, error, pagination,
    refetch: fetchProviders,
    createProvider, updateProvider, deleteProvider,
    creating, updating, deleting,
  };
}

export function useProviderSchedule(providerId: number | null) {
  const [schedule, setSchedule] = useState<ProviderScheduleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    if (!providerId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/admin/providers/${providerId}/schedule`);
      if (response.data.success) {
        setSchedule(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch schedule');
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const updateSchedule = useCallback(async (entries: ScheduleEntry[]) => {
    if (!providerId) return { success: false, message: 'No provider selected' };
    try {
      const response = await api.post(`/admin/providers/${providerId}/schedule`, { schedule: entries });
      if (response.data.success) {
        setSchedule(response.data.data);
        return { success: true, message: 'Schedule updated successfully' };
      }
      return { success: false, message: 'Failed to update schedule' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Failed to update schedule' };
    }
  }, [providerId]);

  const createBlockedTime = useCallback(async (data: { blocked_date: string; start_time: string; end_time: string; reason: string }) => {
    if (!providerId) return { success: false, message: 'No provider selected' };
    try {
      const response = await api.post(`/admin/providers/${providerId}/blocked-times`, data);
      if (response.data.success) {
        await fetchSchedule();
        return { success: true, message: 'Blocked time created successfully' };
      }
      return { success: false, message: 'Failed to create blocked time' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Failed to create blocked time' };
    }
  }, [providerId, fetchSchedule]);

  return { schedule, loading, error, refetch: fetchSchedule, updateSchedule, createBlockedTime };
}

export function useProviderAppointments(providerId: number | null) {
  const [appointments, setAppointments] = useState<ProviderAppointment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAppointments = useCallback(async () => {
    if (!providerId) return;
    try {
      setLoading(true);
      const response = await api.get(`/admin/providers/${providerId}/appointments`);
      if (response.data.success) {
        setAppointments(response.data.data);
      }
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return { appointments, loading, refetch: fetchAppointments };
}
