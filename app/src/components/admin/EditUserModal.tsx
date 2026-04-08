/**
 * EditUserModal Component
 * 
 * Modal form for editing existing user accounts.
 * Pre-fills current values. Password is optional.
 * 
 * @module EditUserModal
 * @task US_035 TASK_002
 */

import React, { useState, useEffect } from 'react';
import type { User, UpdateUserInput, Department } from '../../types/user.types';

interface EditUserModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSubmit: (userId: number, data: UpdateUserInput) => Promise<void>;
  departments: Department[];
  submitting: boolean;
}

interface FormErrors {
  role?: string;
  first_name?: string;
  last_name?: string;
  department_id?: string;
  general?: string;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  user,
  onClose,
  onSubmit,
  departments,
  submitting,
}) => {
  const [formData, setFormData] = useState<UpdateUserInput>({});
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (user) {
      setFormData({
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number || '',
        department_id: user.department_id || null,
      });
      setErrors({});
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleChange = (field: keyof UpdateUserInput, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors: FormErrors = {};

    if (formData.first_name !== undefined && !formData.first_name?.trim()) {
      validationErrors.first_name = 'First name is required';
    }
    if (formData.last_name !== undefined && !formData.last_name?.trim()) {
      validationErrors.last_name = 'Last name is required';
    }
    if (formData.role === 'patient' && !formData.department_id) {
      validationErrors.department_id = 'Department is required for Patient role';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await onSubmit(user.id, formData);
    } catch (err: any) {
      setErrors({ general: err.message || 'Failed to update user' });
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.875rem',
    boxSizing: 'border-box',
  };

  const errorInputStyle: React.CSSProperties = { ...inputStyle, borderColor: '#ef4444' };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 500,
    marginBottom: '4px',
    color: '#374151',
  };

  const errorStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: '#ef4444',
    marginTop: '2px',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Edit User"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '24px',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          overflowY: 'auto',
          margin: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>Edit User</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '16px' }}>
          Editing: <strong>{user.email}</strong>
        </div>

        {errors.general && (
          <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', borderRadius: '6px', marginBottom: '12px', color: '#dc2626', fontSize: '0.8rem' }} role="alert">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle} htmlFor="eu-first-name">First Name</label>
              <input
                id="eu-first-name"
                type="text"
                value={formData.first_name || ''}
                onChange={(e) => handleChange('first_name', e.target.value)}
                style={errors.first_name ? errorInputStyle : inputStyle}
                aria-invalid={!!errors.first_name}
              />
              {errors.first_name && <div style={errorStyle}>{errors.first_name}</div>}
            </div>
            <div>
              <label style={labelStyle} htmlFor="eu-last-name">Last Name</label>
              <input
                id="eu-last-name"
                type="text"
                value={formData.last_name || ''}
                onChange={(e) => handleChange('last_name', e.target.value)}
                style={errors.last_name ? errorInputStyle : inputStyle}
                aria-invalid={!!errors.last_name}
              />
              {errors.last_name && <div style={errorStyle}>{errors.last_name}</div>}
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle} htmlFor="eu-role">Role</label>
            <select
              id="eu-role"
              value={formData.role || user.role}
              onChange={(e) => {
                handleChange('role', e.target.value);
                if (e.target.value !== 'patient') handleChange('department_id', null);
              }}
              style={inputStyle}
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {(formData.role || user.role) === 'patient' && (
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle} htmlFor="eu-department">Department *</label>
              <select
                id="eu-department"
                value={formData.department_id ?? ''}
                onChange={(e) => handleChange('department_id', e.target.value ? parseInt(e.target.value, 10) : null)}
                style={errors.department_id ? errorInputStyle : inputStyle}
                aria-invalid={!!errors.department_id}
              >
                <option value="">Select department...</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
              {errors.department_id && <div style={errorStyle}>{errors.department_id}</div>}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle} htmlFor="eu-phone">Phone Number</label>
            <input
              id="eu-phone"
              type="tel"
              value={formData.phone_number || ''}
              onChange={(e) => handleChange('phone_number', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                fontSize: '0.875rem',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '8px 16px',
                fontSize: '0.875rem',
                backgroundColor: submitting ? '#93c5fd' : '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
