/**
 * Audit Logs Page Component
 * 
 * File: app/src/pages/AuditLogsPage.tsx
 * Task: US_011 TASK_004 - Frontend Admin Audit Log Viewer (Main Page)
 * 
 * Purpose: Admin-only audit log viewer page
 * 
 * Features:
 * - Filterable audit log display
 * - Pagination
 * - Sorting
 * - CSV/JSON export
 * - Real-time updates (optional polling)
 * - WCAG 2.2 AA accessible
 * - Admin-only access (RBAC protected)
 */

import React, { useState } from 'react';
import { useAuditLogs } from '../hooks/useAuditLogs';
import AuditLogFilters from '../components/AuditLogFilters';
import AuditLogTable from '../components/AuditLogTable';
import AuditLogPagination from '../components/AuditLogPagination';
import { exportAuditLogs } from '../utils/auditExport';
import type { FilterParams, ExportFormat } from '../types/audit.types';

const AuditLogsPage: React.FC = () => {
  const [exporting, setExporting] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const {
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
  } = useAuditLogs({
    page: 1,
    pageSize: 20,
    order_by: 'timestamp',
    order_dir: 'DESC',
  });

  /**
   * Handle filter changes
   */
  const handleFiltersChange = (newFilters: FilterParams) => {
    setFilters(newFilters);
  };

  /**
   * Handle page change
   */
  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  /**
   * Handle sort column change
   */
  const handleSortChange = (column: string) => {
    const newDir = filters.order_by === column && filters.order_dir === 'DESC' ? 'ASC' : 'DESC';
    setFilters({
      ...filters,
      order_by: column,
      order_dir: newDir,
    });
  };

  /**
   * Handle export
   */
  const handleExport = async (format: ExportFormat) => {
    try {
      setExporting(true);
      setExportError(null);
      
      await exportAuditLogs(filters, format);
      
      console.log(`Exported audit logs as ${format.toUpperCase()}`);
    } catch (err: any) {
      setExportError(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="audit-logs-page">
      {/* Page Header */}
      <header className="page-header">
        <div className="header-content">
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-description">
            View and analyze system audit logs for compliance and security monitoring
          </p>
        </div>
        
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={loading}
            aria-label="Refresh audit logs"
          >
            <svg
              className="btn-icon"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
          
          <div className="export-buttons">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleExport('csv')}
              disabled={exporting || loading}
              aria-label="Export audit logs as CSV"
            >
              <svg
                className="btn-icon"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export CSV
            </button>
            
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleExport('json')}
              disabled={exporting || loading}
              aria-label="Export audit logs as JSON"
            >
              <svg
                className="btn-icon"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export JSON
            </button>
          </div>
        </div>
      </header>

      {/* Error Messages */}
      {error && (
        <div className="alert alert-error" role="alert">
          <svg
            className="alert-icon"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </div>
      )}

      {exportError && (
        <div className="alert alert-error" role="alert">
          <svg
            className="alert-icon"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {exportError}
        </div>
      )}

      {/* Main Content */}
      <main className="page-content">
        {/* Filters */}
        <AuditLogFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          actionTypes={actionTypes}
          resourceTypes={resourceTypes}
          onUserSearch={searchUsers}
        />

        {/* Table */}
        <AuditLogTable
          logs={logs}
          loading={loading}
          filters={filters}
          onSortChange={handleSortChange}
        />

        {/* Pagination */}
        {!loading && logs.length > 0 && (
          <AuditLogPagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        )}
      </main>

      <style>{`
        .audit-logs-page {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-content {
          flex: 1;
          min-width: 200px;
        }

        .page-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.5rem;
        }

        .page-description {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .export-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.15s, opacity 0.15s;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background-color: #3b82f6;
          color: #fff;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #2563eb;
        }

        .btn-primary:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }

        .btn-secondary {
          background-color: #fff;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #f9fafb;
        }

        .btn-secondary:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.2);
        }

        .btn-icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1.5rem;
        }

        .alert-error {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .alert-icon {
          width: 1.25rem;
          height: 1.25rem;
          flex-shrink: 0;
        }

        .page-content {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        @media (max-width: 768px) {
          .audit-logs-page {
            padding: 1rem;
          }

          .page-header {
            flex-direction: column;
          }

          .header-actions {
            width: 100%;
            flex-direction: column;
          }

          .export-buttons {
            width: 100%;
            flex-direction: column;
          }

          .btn {
            width: 100%;
            justify-content: center;
          }

          .page-title {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AuditLogsPage;
