/**
 * useAuditLogs Custom Hook
 * 
 * File: app/src/hooks/useAuditLogs.ts
 * Task: US_011 TASK_004 - Frontend Admin Audit Log Viewer (Custom Hook)
 * 
 * Purpose: Custom React hook for fetching and managing audit log data
 * 
 * Features:
 * - Fetch paginated audit logs with filters
 * - Automatic refetch when filters change
 * - Loading and error states
 * - Filter options (action types, resource types, users)
 */

import { useState, useEffect } from 'react';
import api from '../services/api';
import type { AuditLog, FilterParams, UserOption } from '../types/audit.types';

interface UseAuditLogsReturn {
  logs: AuditLog[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filters: FilterParams;
  setFilters: (filters: FilterParams) => void;
  refetch: () => void;
  actionTypes: string[];
  resourceTypes: string[];
  searchUsers: (query: string) => Promise<UserOption[]>;
}

/**
 * Custom hook for fetching audit logs with filters and pagination
 * @param initialFilters - Initial filter values
 * @returns Audit log data, loading state, error state, and filter functions
 */
export const useAuditLogs = (initialFilters: FilterParams = {}): UseAuditLogsReturn => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [filters, setFilters] = useState<FilterParams>(initialFilters);
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [resourceTypes, setResourceTypes] = useState<string[]>([]);

  /**
   * Fetch audit logs from API
   */
  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query string
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.user_id) params.append('user_id', filters.user_id.toString());
      if (filters.action_type) params.append('action_type', filters.action_type);
      if (filters.resource_type) params.append('resource_type', filters.resource_type);
      if (filters.resource_id) params.append('resource_id', filters.resource_id);
      if (filters.order_by) params.append('order_by', filters.order_by);
      if (filters.order_dir) params.append('order_dir', filters.order_dir);
      
      const response = await api.get(`/admin/audit-logs?${params.toString()}`);
      
      if (response.data.success) {
        setLogs(response.data.data);
        setTotal(response.data.total);
        setPage(response.data.page);
        setPageSize(response.data.pageSize);
        setTotalPages(response.data.totalPages);
      } else {
        setError('Failed to fetch audit logs');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch distinct action types for filter
   */
  const fetchActionTypes = async () => {
    try {
      const response = await api.get('/admin/audit-logs/actions');
      if (response.data.success) {
        setActionTypes(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch action types:', err);
    }
  };

  /**
   * Fetch distinct resource types for filter
   */
  const fetchResourceTypes = async () => {
    try {
      const response = await api.get('/admin/audit-logs/resources');
      if (response.data.success) {
        setResourceTypes(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch resource types:', err);
    }
  };

  /**
   * Search users for autocomplete
   * @param query - Search term
   * @returns Array of matching users
   */
  const searchUsers = async (query: string): Promise<UserOption[]> => {
    try {
      if (!query || query.length < 2) {
        return [];
      }
      
      const response = await api.get(`/admin/audit-logs/users/search?q=${encodeURIComponent(query)}`);
      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (err) {
      console.error('Failed to search users:', err);
      return [];
    }
  };

  /**
   * Effect: Fetch audit logs when filters change
   */
  useEffect(() => {
    fetchAuditLogs();
  }, [filters]);

  /**
   * Effect: Fetch filter options on mount
   */
  useEffect(() => {
    fetchActionTypes();
    fetchResourceTypes();
  }, []);

  /**
   * Refetch current filters
   */
  const refetch = () => {
    fetchAuditLogs();
  };

  return {
    logs,
    loading,
    error,
    total,
    page,
    pageSize,
    totalPages,
    filters,
    setFilters,
    refetch,
    actionTypes,
    resourceTypes,
    searchUsers,
  };
};

export default useAuditLogs;
