/**
 * Audit Log Table Component
 * 
 * File: app/src/components/AuditLogTable.tsx
 * Task: US_011 TASK_004 - Frontend Admin Audit Log Viewer (Table)
 * 
 * Purpose: Display audit logs in a sortable table
 * 
 * Features:
 * - Sortable columns (click header to sort)
 * - Loading and empty states
 * - Formatted timestamp display
 * - User email and role display
 * - Resource identification
 * - IP address display
 * - WCAG 2.2 AA accessible
 */

import React from 'react';
import { format } from 'date-fns';
import type { AuditLog, FilterParams } from '../types/audit.types';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { TableScrollContainer } from './Tables/TableScrollContainer';
import '../styles/responsive-table.css';

interface AuditLogTableProps {
  logs: AuditLog[];
  loading: boolean;
  filters: FilterParams;
  onSortChange: (column: string) => void;
}

const AuditLogTable: React.FC<AuditLogTableProps> = ({
  logs,
  loading,
  filters,
  onSortChange,
}) => {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';
  /**
   * Get sort indicator for column header
   */
  const getSortIndicator = (column: string): string => {
    if (filters.order_by !== column) {
      return '⇅'; // Both directions
    }
    return filters.order_dir === 'ASC' ? '▲' : '▼';
  };

  /**
   * Handle column header click for sorting
   */
  const handleSort = (column: string) => {
    onSortChange(column);
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: string): string => {
    try {
      return format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss');
    } catch {
      return timestamp;
    }
  };

  /**
   * Format resource identifier
   */
  const formatResource = (tableName: string, recordId: number | null): string => {
    if (!tableName) return 'N/A';
    if (!recordId) return tableName;
    return `${tableName} #${recordId}`;
  };

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <div className="audit-log-table-container" role="status" aria-live="polite">
        <div className="loading-state">
          <div className="spinner" aria-label="Loading audit logs"></div>
          <p>Loading audit logs...</p>
        </div>
      </div>
    );
  }

  /**
   * Render empty state
   */
  if (logs.length === 0) {
    return (
      <div className="audit-log-table-container" role="status" aria-live="polite">
        <div className="empty-state">
          <svg
            className="empty-icon"
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3>No Audit Logs Found</h3>
          <p>No audit logs match your current filters. Try adjusting your search criteria.</p>
        </div>
      </div>
    );
  }

  /**
   * Render table
   */
  return (
    <div className="audit-log-table-container">
      {/* Mobile card layout */}
      {isMobile ? (
        <div className="rt-container rt-container--cards" role="list" aria-label="Audit log entries">
          {logs.map((log) => (
            <div className="table-card" key={log.id} role="listitem">
              <dl className="table-card__fields">
                <div className="table-card__field">
                  <dt className="table-card__label">Timestamp</dt>
                  <dd className="table-card__value">{formatTimestamp(log.timestamp)}</dd>
                </div>
                <div className="table-card__field">
                  <dt className="table-card__label">User</dt>
                  <dd className="table-card__value">
                    {log.user_email || (log.user_id ? `User #${log.user_id}` : 'System')}
                  </dd>
                </div>
                <div className="table-card__field">
                  <dt className="table-card__label">Role</dt>
                  <dd className="table-card__value">
                    <span className={`role-badge role-${log.user_role?.toLowerCase() || 'unknown'}`}>
                      {log.user_role || 'N/A'}
                    </span>
                  </dd>
                </div>
                <div className="table-card__field">
                  <dt className="table-card__label">Action</dt>
                  <dd className="table-card__value">{log.action}</dd>
                </div>
                <div className="table-card__field">
                  <dt className="table-card__label">Resource</dt>
                  <dd className="table-card__value">{formatResource(log.table_name, log.record_id)}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      ) : (
      /* Desktop/Tablet table layout */
      <TableScrollContainer>
      <div className="table-wrapper">
        <table className="audit-log-table" aria-label="Audit log entries">
          <thead>
            <tr>
              <th scope="col">
                <button
                  className="sort-header"
                  onClick={() => handleSort('timestamp')}
                  aria-label="Sort by timestamp"
                >
                  Timestamp <span className="sort-icon" aria-hidden="true">{getSortIndicator('timestamp')}</span>
                </button>
              </th>
              <th scope="col">
                <button
                  className="sort-header"
                  onClick={() => handleSort('user_id')}
                  aria-label="Sort by user"
                >
                  User <span className="sort-icon" aria-hidden="true">{getSortIndicator('user_id')}</span>
                </button>
              </th>
              <th scope="col">Role</th>
              <th scope="col">
                <button
                  className="sort-header"
                  onClick={() => handleSort('action')}
                  aria-label="Sort by action"
                >
                  Action <span className="sort-icon" aria-hidden="true">{getSortIndicator('action')}</span>
                </button>
              </th>
              <th scope="col">
                <button
                  className="sort-header"
                  onClick={() => handleSort('table_name')}
                  aria-label="Sort by resource"
                >
                  Resource <span className="sort-icon" aria-hidden="true">{getSortIndicator('table_name')}</span>
                </button>
              </th>
              <th scope="col">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{formatTimestamp(log.timestamp)}</td>
                <td>
                  {log.user_email || (log.user_id ? `User #${log.user_id}` : 'System')}
                </td>
                <td>
                  <span className={`role-badge role-${log.user_role?.toLowerCase() || 'unknown'}`}>
                    {log.user_role || 'N/A'}
                  </span>
                </td>
                <td>{log.action}</td>
                <td>{formatResource(log.table_name, log.record_id)}</td>
                <td>{log.ip_address || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </TableScrollContainer>
      )}

      <style>{`
        .audit-log-table-container {
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .loading-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
        }

        .spinner {
          border: 4px solid #f3f4f6;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .empty-icon {
          width: 64px;
          height: 64px;
          color: #9ca3af;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .audit-log-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .audit-log-table thead {
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .audit-log-table th {
          padding: 0.75rem 1rem;
          text-align: left;
          font-weight: 600;
          color: #374151;
          white-space: nowrap;
        }

        .sort-header {
          background: none;
          border: none;
          padding: 0;
          font: inherit;
          color: inherit;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-weight: 600;
          transition: color 0.15s;
        }

        .sort-header:hover {
          color: #3b82f6;
        }

        .sort-header:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .sort-icon {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .audit-log-table tbody tr {
          border-bottom: 1px solid #e5e7eb;
          transition: background-color 0.15s;
        }

        .audit-log-table tbody tr:hover {
          background-color: #f9fafb;
        }

        .audit-log-table td {
          padding: 0.75rem 1rem;
          color: #6b7280;
        }

        .role-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .role-admin {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .role-staff {
          background-color: #dbeafe;
          color: #1e40af;
        }

        .role-patient {
          background-color: #d1fae5;
          color: #065f46;
        }

        .role-unknown {
          background-color: #f3f4f6;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .audit-log-table {
            font-size: 0.75rem;
          }

          .audit-log-table th,
          .audit-log-table td {
            padding: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AuditLogTable;
