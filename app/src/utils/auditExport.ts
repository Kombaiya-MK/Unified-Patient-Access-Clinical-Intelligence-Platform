/**
 * Audit Log Export Utility
 * 
 * File: app/src/utils/auditExport.ts
 * Task: US_011 TASK_004 - Frontend Admin Audit Log Viewer (Export)
 * 
 * Purpose: Export audit logs as CSV or JSON for compliance reporting
 * 
 * Features:
 * - Export to CSV format
 * - Export to JSON format
 * - Download as file
 * - Preserve current filters in export
 */

import type { FilterParams, ExportFormat } from '../types/audit.types';
import api from '../services/api';

/**
 * Build export URL with filters
 * @param filters - Current filter parameters
 * @param format - Export format (csv or json)
 * @returns Export URL
 */
function buildExportUrl(filters: FilterParams, format: ExportFormat): string {
  const params = new URLSearchParams();
  
  params.append('format', format);
  
  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);
  if (filters.user_id) params.append('user_id', filters.user_id.toString());
  if (filters.action_type) params.append('action_type', filters.action_type);
  if (filters.resource_type) params.append('resource_type', filters.resource_type);
  if (filters.resource_id) params.append('resource_id', filters.resource_id);
  if (filters.order_by) params.append('order_by', filters.order_by);
  if (filters.order_dir) params.append('order_dir', filters.order_dir);
  
  return `/admin/audit-logs/export?${params.toString()}`;
}

/**
 * Export audit logs to CSV
 * @param filters - Current filter parameters
 * @returns Promise that resolves when export is complete
 */
export async function exportToCSV(filters: FilterParams): Promise<void> {
  try {
    const url = buildExportUrl(filters, 'csv');
    
    // Use api client but handle blob response
    const response = await api.get(url, {
      responseType: 'blob',
    });
    
    // Create download link
    const blob = new Blob([response.data], { type: 'text/csv' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `audit-logs-${new Date().toISOString()}.csv`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    
    console.log('CSV export successful');
  } catch (error) {
    console.error('Failed to export audit logs to CSV:', error);
    throw new Error('Failed to export audit logs to CSV');
  }
}

/**
 * Export audit logs to JSON
 * @param filters - Current filter parameters
 * @returns Promise that resolves when export is complete
 */
export async function exportToJSON(filters: FilterParams): Promise<void> {
  try {
    const url = buildExportUrl(filters, 'json');
    
    // Use api client but handle blob response
    const response = await api.get(url, {
      responseType: 'blob',
    });
    
    // Create download link
    const blob = new Blob([response.data], { type: 'application/json' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `audit-logs-${new Date().toISOString()}.json`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    
    console.log('JSON export successful');
  } catch (error) {
    console.error('Failed to export audit logs to JSON:', error);
    throw new Error('Failed to export audit logs to JSON');
  }
}

/**
 * Export audit logs in specified format
 * @param filters - Current filter parameters
 * @param format - Export format
 * @returns Promise that resolves when export is complete
 */
export async function exportAuditLogs(filters: FilterParams, format: ExportFormat): Promise<void> {
  if (format === 'csv') {
    return exportToCSV(filters);
  } else {
    return exportToJSON(filters);
  }
}

export default {
  exportToCSV,
  exportToJSON,
  exportAuditLogs,
};
