/**
 * DepartmentProviderManagement Page
 *
 * Admin page for managing departments and providers (SCR-014).
 * Two-section layout: Departments table + Providers table with modals.
 * Polling every 10s for real-time updates (NFR-REL01).
 *
 * @module DepartmentProviderManagement
 * @task US_036 TASK_004
 */

import React, { useState, useEffect } from 'react';
import { DepartmentTable } from '../components/admin/DepartmentTable';
import { DepartmentModal } from '../components/admin/DepartmentModal';
import { ProviderTable } from '../components/admin/ProviderTable';
import { ProviderModal } from '../components/admin/ProviderModal';
import { ProviderScheduleEditor } from '../components/admin/ProviderScheduleEditor';
import { AppointmentReassignmentModal } from '../components/admin/AppointmentReassignmentModal';
import { useDepartmentManagement } from '../hooks/useDepartmentManagement';
import { useProviders } from '../hooks/useProviders';
import { useDepartments } from '../hooks/useDepartments';
import api from '../services/api';
import type { DepartmentManaged, CreateDepartmentInput } from '../types/department.types';
import type { Provider, CreateProviderInput } from '../types/provider.types';

export const DepartmentProviderManagement: React.FC = () => {
  const [deptPage, setDeptPage] = useState(1);
  const [deptStatusFilter, setDeptStatusFilter] = useState<string | undefined>();
  const [providerPage, setProviderPage] = useState(1);
  const [providerStatusFilter, setProviderStatusFilter] = useState<string | undefined>();

  const {
    departments, loading: deptsLoading, pagination: deptPagination,
    createDepartment, updateDepartment, deactivateDepartment,
    creating: deptCreating, updating: deptUpdating,
  } = useDepartmentManagement({ page: deptPage, status: deptStatusFilter });

  const {
    providers, loading: providersLoading, pagination: providerPagination,
    createProvider, deleteProvider,
    creating: providerCreating, deleting: providerDeleting,
  } = useProviders({ page: providerPage, status: providerStatusFilter });

  const { departments: deptDropdown } = useDepartments();

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentManaged | null>(null);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [scheduleProvider, setScheduleProvider] = useState<Provider | null>(null);
  const [reassignProvider, setReassignProvider] = useState<Provider | null>(null);
  const [availableUsers, setAvailableUsers] = useState<{ id: number; first_name: string; last_name: string; role: string }[]>([]);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    if (showProviderModal) {
      api.get('/admin/users', { params: { limit: 100, role: 'doctor' } })
        .then((res) => {
          const doctors = res.data.data || [];
          api.get('/admin/users', { params: { limit: 100, role: 'staff' } })
            .then((staffRes) => {
              const staff = staffRes.data.data || [];
              setAvailableUsers([...doctors, ...staff]);
            })
            .catch(() => setAvailableUsers(doctors));
        })
        .catch(() => setAvailableUsers([]));
    }
  }, [showProviderModal]);

  const handleDeptSubmit = async (data: CreateDepartmentInput) => {
    const result = editingDept
      ? await updateDepartment(editingDept.id, data)
      : await createDepartment(data);
    if (result.success) {
      setShowDeptModal(false);
      setEditingDept(null);
      showToast(result.message);
    }
    return result;
  };

  const handleDeptEdit = (dept: DepartmentManaged) => {
    setEditingDept(dept);
    setShowDeptModal(true);
  };

  const handleDeptDeactivate = async (dept: DepartmentManaged) => {
    if (!window.confirm(`Deactivate "${dept.name}"? This cannot be undone easily.`)) return;
    const result = await deactivateDepartment(dept.id);
    showToast(result.message);
  };

  const handleProviderSubmit = async (data: CreateProviderInput) => {
    const result = await createProvider(data);
    if (result.success) {
      setShowProviderModal(false);
      showToast(result.message);
    }
    return result;
  };

  const handleProviderRemove = async (provider: Provider) => {
    const result = await deleteProvider(provider.id);
    if (!result.success && result.message.includes('future appointments')) {
      setReassignProvider(provider);
    } else {
      showToast(result.message);
    }
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: '1200px', margin: '0 auto', padding: '24px',
  };
  const sectionStyle: React.CSSProperties = {
    backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb',
    padding: '20px', marginBottom: '24px',
  };
  const headerStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px',
  };
  const addBtnStyle: React.CSSProperties = {
    padding: '8px 16px', borderRadius: '6px', border: 'none',
    backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '0.875rem',
  };
  const filterStyle: React.CSSProperties = {
    padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '6px',
    fontSize: '0.875rem', cursor: 'pointer',
  };
  const paginationStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px',
  };
  const pageBtnStyle: React.CSSProperties = {
    padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '4px',
    backgroundColor: '#fff', cursor: 'pointer', fontSize: '0.75rem',
  };

  return (
    <div style={containerStyle}>
      <nav aria-label="Breadcrumb" style={{ marginBottom: '16px', fontSize: '0.875rem', color: '#6b7280' }}>
        Admin Dashboard &gt; Department &amp; Provider Management
      </nav>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>
        Department &amp; Provider Management
      </h1>

      {toast && (
        <div role="status" aria-live="polite" style={{
          position: 'fixed', top: '16px', right: '16px', padding: '12px 20px',
          backgroundColor: '#dcfce7', color: '#166534', borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 100, fontSize: '0.875rem',
        }}>
          {toast}
        </div>
      )}

      {/* Departments Section */}
      <section style={sectionStyle} aria-label="Departments">
        <div style={headerStyle}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Departments</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={deptStatusFilter || ''}
              onChange={(e) => { setDeptStatusFilter(e.target.value || undefined); setDeptPage(1); }}
              style={filterStyle}
              aria-label="Filter departments by status"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              style={addBtnStyle}
              onClick={() => { setEditingDept(null); setShowDeptModal(true); }}
            >
              + Add Department
            </button>
          </div>
        </div>

        {deptsLoading ? (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>Loading departments...</p>
        ) : (
          <>
            <DepartmentTable
              departments={departments}
              onEdit={handleDeptEdit}
              onDeactivate={handleDeptDeactivate}
            />
            {deptPagination.totalPages > 1 && (
              <div style={paginationStyle}>
                <button style={pageBtnStyle} disabled={deptPage <= 1} onClick={() => setDeptPage((p) => p - 1)}>Previous</button>
                <span style={{ fontSize: '0.875rem', padding: '6px' }}>Page {deptPagination.page} of {deptPagination.totalPages}</span>
                <button style={pageBtnStyle} disabled={deptPage >= deptPagination.totalPages} onClick={() => setDeptPage((p) => p + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Providers Section */}
      <section style={sectionStyle} aria-label="Providers">
        <div style={headerStyle}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Providers</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={providerStatusFilter || ''}
              onChange={(e) => { setProviderStatusFilter(e.target.value || undefined); setProviderPage(1); }}
              style={filterStyle}
              aria-label="Filter providers by status"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              style={addBtnStyle}
              onClick={() => setShowProviderModal(true)}
            >
              + Add Provider
            </button>
          </div>
        </div>

        {providersLoading ? (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>Loading providers...</p>
        ) : (
          <>
            <ProviderTable
              providers={providers}
              onEditSchedule={(p) => setScheduleProvider(p)}
              onRemove={handleProviderRemove}
            />
            {providerPagination.totalPages > 1 && (
              <div style={paginationStyle}>
                <button style={pageBtnStyle} disabled={providerPage <= 1} onClick={() => setProviderPage((p) => p - 1)}>Previous</button>
                <span style={{ fontSize: '0.875rem', padding: '6px' }}>Page {providerPagination.page} of {providerPagination.totalPages}</span>
                <button style={pageBtnStyle} disabled={providerPage >= providerPagination.totalPages} onClick={() => setProviderPage((p) => p + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Modals */}
      {showDeptModal && (
        <DepartmentModal
          department={editingDept}
          onSubmit={handleDeptSubmit}
          onClose={() => { setShowDeptModal(false); setEditingDept(null); }}
          saving={deptCreating || deptUpdating}
        />
      )}

      {showProviderModal && (
        <ProviderModal
          availableUsers={availableUsers}
          departments={deptDropdown}
          onSubmit={handleProviderSubmit}
          onClose={() => setShowProviderModal(false)}
          saving={providerCreating}
        />
      )}

      {scheduleProvider && (
        <ProviderScheduleEditor
          providerId={scheduleProvider.id}
          providerName={`${scheduleProvider.last_name}, ${scheduleProvider.first_name}`}
          onClose={() => setScheduleProvider(null)}
        />
      )}

      {reassignProvider && (
        <AppointmentReassignmentModal
          providerId={reassignProvider.id}
          providerName={`${reassignProvider.last_name}, ${reassignProvider.first_name}`}
          onClose={() => setReassignProvider(null)}
        />
      )}
    </div>
  );
};
