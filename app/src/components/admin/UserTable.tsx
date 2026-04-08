/**
 * UserTable Component
 * 
 * Displays user list in sortable table format (desktop) or cards (mobile).
 * Supports sorting by column header click and action buttons per row.
 * Uses responsive design system for WCAG 2.2 AA compliant touch targets.
 * 
 * @module UserTable
 * @task US_035 TASK_002, BUG_USERTABLE_MOBILE_A11Y
 */

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { StatusBadge } from './StatusBadge';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { TableScrollContainer } from '../Tables/TableScrollContainer';
import type { User } from '../../types/user.types';
import '../../styles/responsive-table.css';

interface UserTableProps {
  users: User[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (column: string) => void;
  currentUserId: number | undefined;
  onEdit: (user: User) => void;
  onDeactivate: (user: User) => void;
}

const SORTABLE_COLUMNS = ['email', 'role', 'last_login_at'];

function SortIndicator({ column, sortBy, sortOrder }: { column: string; sortBy: string; sortOrder: string }) {
  if (sortBy !== column) return <span style={{ opacity: 0.3, marginLeft: '4px' }}>↕</span>;
  return <span style={{ marginLeft: '4px' }}>{sortOrder === 'asc' ? '↑' : '↓'}</span>;
}

function formatLastLogin(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Never';
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  sortBy,
  sortOrder,
  onSort,
  currentUserId,
  onEdit,
  onDeactivate,
}) => {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';

  if (users.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
        No users found matching the filters.
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="rt-container--cards">
        {users.map((user) => {
          const isSelf = user.id === currentUserId;
          return (
            <div className="table-card" key={user.id}>
              <dl className="table-card__fields">
                <div className="table-card__field">
                  <dt className="table-card__label">Email</dt>
                  <dd className="table-card__value">{user.email}</dd>
                </div>
                <div className="table-card__field">
                  <dt className="table-card__label">Role</dt>
                  <dd className="table-card__value" style={{ textTransform: 'capitalize' }}>{user.role}</dd>
                </div>
                <div className="table-card__field">
                  <dt className="table-card__label">Department</dt>
                  <dd className="table-card__value">{user.department_name || '—'}</dd>
                </div>
                <div className="table-card__field">
                  <dt className="table-card__label">Status</dt>
                  <dd className="table-card__value"><StatusBadge isActive={user.is_active} /></dd>
                </div>
                <div className="table-card__field">
                  <dt className="table-card__label">Last Login</dt>
                  <dd className="table-card__value">{formatLastLogin(user.last_login_at)}</dd>
                </div>
              </dl>
              <div className="table-card__actions">
                <button
                  onClick={() => onEdit(user)}
                  style={{
                    flex: 1,
                    minHeight: '44px',
                    padding: '12px 16px',
                    fontSize: '1rem',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                  aria-label={`Edit user ${user.email}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeactivate(user)}
                  disabled={isSelf || !user.is_active}
                  style={{
                    flex: 1,
                    minHeight: '44px',
                    padding: '12px 16px',
                    fontSize: '1rem',
                    backgroundColor: isSelf || !user.is_active ? '#f9fafb' : '#fef2f2',
                    color: isSelf || !user.is_active ? '#9ca3af' : '#dc2626',
                    border: `1px solid ${isSelf || !user.is_active ? '#e5e7eb' : '#fecaca'}`,
                    borderRadius: '4px',
                    cursor: isSelf || !user.is_active ? 'not-allowed' : 'pointer',
                    opacity: isSelf || !user.is_active ? 0.6 : 1,
                  }}
                  aria-label={isSelf ? 'Cannot deactivate your own account' : `Deactivate user ${user.email}`}
                >
                  Deactivate
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <TableScrollContainer>
      <table
        style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}
        role="grid"
        aria-label="User management table"
      >
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
            {[
              { key: 'email', label: 'Email' },
              { key: 'role', label: 'Role' },
              { key: 'department', label: 'Department' },
              { key: 'status', label: 'Status' },
              { key: 'last_login_at', label: 'Last Login' },
              { key: 'actions', label: 'Actions' },
            ].map(({ key, label }) => {
              const isSortable = SORTABLE_COLUMNS.includes(key);
              return (
                <th
                  key={key}
                  style={{
                    padding: '12px 8px',
                    fontWeight: 600,
                    color: '#374151',
                    cursor: isSortable ? 'pointer' : 'default',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={isSortable ? () => onSort(key) : undefined}
                  onKeyDown={isSortable ? (e) => { if (e.key === 'Enter') onSort(key); } : undefined}
                  tabIndex={isSortable ? 0 : undefined}
                  aria-sort={sortBy === key ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                  role={isSortable ? 'columnheader' : undefined}
                >
                  {label}
                  {isSortable && <SortIndicator column={key} sortBy={sortBy} sortOrder={sortOrder} />}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            return (
              <tr
                key={user.id}
                style={{ borderBottom: '1px solid #f3f4f6' }}
                role="row"
              >
                <td style={{ padding: '10px 8px' }}>{user.email}</td>
                <td style={{ padding: '10px 8px', textTransform: 'capitalize' }}>{user.role}</td>
                <td style={{ padding: '10px 8px' }}>{user.department_name || '—'}</td>
                <td style={{ padding: '10px 8px' }}>
                  <StatusBadge isActive={user.is_active} />
                </td>
                <td style={{ padding: '10px 8px' }}>
                  {formatLastLogin(user.last_login_at)}
                </td>
                <td style={{ padding: '10px 8px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => onEdit(user)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                      aria-label={`Edit user ${user.email}`}
                      title="Edit user"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => onDeactivate(user)}
                      disabled={isSelf || !user.is_active}
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        backgroundColor: isSelf || !user.is_active ? '#f9fafb' : '#fef2f2',
                        color: isSelf || !user.is_active ? '#9ca3af' : '#dc2626',
                        border: `1px solid ${isSelf || !user.is_active ? '#e5e7eb' : '#fecaca'}`,
                        borderRadius: '4px',
                        cursor: isSelf || !user.is_active ? 'not-allowed' : 'pointer',
                        opacity: isSelf || !user.is_active ? 0.6 : 1,
                      }}
                      aria-label={
                        isSelf
                          ? 'Cannot deactivate your own account'
                          : `Deactivate user ${user.email}`
                      }
                      title={isSelf ? 'Cannot deactivate your own account' : 'Deactivate user'}
                    >
                      🚫 Deactivate
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableScrollContainer>
  );
};
