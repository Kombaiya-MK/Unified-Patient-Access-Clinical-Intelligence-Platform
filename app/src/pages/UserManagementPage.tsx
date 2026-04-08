/**
 * UserManagement Page (SCR-013)
 * 
 * Admin page for managing user accounts with CRUD operations.
 * Features sortable table, search, filtering, pagination, and modals.
 * 
 * @module UserManagement
 * @task US_035 TASK_002
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUsers } from '../hooks/useUsers';
import { useDepartments } from '../hooks/useDepartments';
import { UserTable } from '../components/admin/UserTable';
import { CreateUserModal } from '../components/admin/CreateUserModal';
import { EditUserModal } from '../components/admin/EditUserModal';
import { DeactivateUserDialog } from '../components/admin/DeactivateUserDialog';
import type { User, CreateUserInput, UpdateUserInput } from '../types/user.types';

export const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();

  // Filters state
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modal state
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Hooks
  const {
    users,
    loading,
    error,
    pagination,
    refetch,
    createUser,
    updateUser,
    deactivateUser,
    creating,
    updating,
    deactivating,
  } = useUsers({
    page,
    sortBy,
    sortOrder,
    role: filterRole || undefined,
    status: filterStatus || undefined,
    search: debouncedSearch || undefined,
  });

  const { departments } = useDepartments();

  // Debounce search input
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchTerm]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCreateModalOpen(false);
        setEditModalOpen(false);
        setDeactivateDialogOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  // Handlers
  const handleSort = useCallback((column: string) => {
    setSortBy((prev) => {
      if (prev === column) {
        setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
        return column;
      }
      setSortOrder('asc');
      return column;
    });
    setPage(1);
  }, []);

  const handleCreateUser = async (data: CreateUserInput) => {
    try {
      const result = await createUser(data);
      showToast(result.message, 'success');
      setCreateModalOpen(false);
    } catch (err: any) {
      throw err; // Let modal handle displaying the error
    }
  };

  const handleUpdateUser = async (userId: number, data: UpdateUserInput) => {
    try {
      const result = await updateUser(userId, data);
      showToast(result.message, 'success');
      setEditModalOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      throw err;
    }
  };

  const handleDeactivateUser = async () => {
    if (!selectedUser) return;
    try {
      const result = await deactivateUser(selectedUser.id);
      showToast(result.message, 'success');
      setDeactivateDialogOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to deactivate user', 'error');
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const openDeactivateDialog = (user: User) => {
    setSelectedUser(user);
    setDeactivateDialogOpen(true);
  };

  // Styles
  const containerStyle: React.CSSProperties = {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  };

  const filtersStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
    flexWrap: 'wrap',
    alignItems: 'center',
  };

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.875rem',
  };

  return (
    <div>
      <div style={containerStyle}>
        {/* Toast */}
        {toast && (
          <div
            role="alert"
            aria-live="assertive"
            style={{
              position: 'fixed',
              top: '16px',
              right: '16px',
              padding: '12px 20px',
              borderRadius: '8px',
              backgroundColor: toast.type === 'success' ? '#dcfce7' : '#fef2f2',
              color: toast.type === 'success' ? '#166534' : '#dc2626',
              border: `1px solid ${toast.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
              fontSize: '0.875rem',
              fontWeight: 500,
              zIndex: 2000,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {toast.message}
          </div>
        )}

        {/* Header */}
        <div style={headerStyle}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#111827' }}>User Management</h1>
          <button
            onClick={() => setCreateModalOpen(true)}
            style={{
              padding: '10px 20px',
              fontSize: '0.875rem',
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
            aria-label="Create new user"
          >
            + Create User
          </button>
        </div>

        {/* Filters */}
        <div style={filtersStyle}>
          <input
            type="search"
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ ...inputStyle, flex: '1', minWidth: '200px' }}
            aria-label="Search users"
          />
          <select
            value={filterRole}
            onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
            style={inputStyle}
            aria-label="Filter by role"
          >
            <option value="">All Roles</option>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            style={inputStyle}
            aria-label="Filter by status"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Error State */}
        {error && (
          <div style={{ padding: '12px', backgroundColor: '#fef2f2', borderRadius: '8px', marginBottom: '16px', color: '#dc2626' }} role="alert">
            Error: {error}
            <button onClick={refetch} style={{ marginLeft: '12px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }} aria-busy="true">
            Loading users...
          </div>
        ) : (
          <>
            {/* Table */}
            <UserTable
              users={users}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              currentUserId={currentUser?.id ? Number(currentUser.id) : undefined}
              onEdit={openEditModal}
              onDeactivate={openDeactivateDialog}
            />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '20px',
                }}
                role="navigation"
                aria-label="Pagination"
              >
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: page === 1 ? '#f9fafb' : '#fff',
                    color: page === 1 ? '#9ca3af' : '#374151',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                  }}
                  aria-label="Previous page"
                >
                  Previous
                </button>
                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  Page {page} of {pagination.totalPages} ({pagination.total} total)
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: page === pagination.totalPages ? '#f9fafb' : '#fff',
                    color: page === pagination.totalPages ? '#9ca3af' : '#374151',
                    cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer',
                  }}
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Modals */}
        <CreateUserModal
          isOpen={isCreateModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateUser}
          departments={departments}
          submitting={creating}
        />

        <EditUserModal
          isOpen={isEditModalOpen}
          user={selectedUser}
          onClose={() => { setEditModalOpen(false); setSelectedUser(null); }}
          onSubmit={handleUpdateUser}
          departments={departments}
          submitting={updating}
        />

        <DeactivateUserDialog
          isOpen={isDeactivateDialogOpen}
          user={selectedUser}
          onConfirm={handleDeactivateUser}
          onCancel={() => { setDeactivateDialogOpen(false); setSelectedUser(null); }}
          submitting={deactivating}
        />
      </div>
    </div>
  );
};

export default UserManagementPage;
