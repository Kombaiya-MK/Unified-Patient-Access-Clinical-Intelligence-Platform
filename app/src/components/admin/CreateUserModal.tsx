/**
 * CreateUserModal Component
 * 
 * Modal form for creating new user accounts with validation.
 * Includes password strength indicator and conditional department field.
 * 
 * @module CreateUserModal
 * @task US_035 TASK_002
 */

import React, { useState } from 'react';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import type { CreateUserInput, Department } from '../../types/user.types';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserInput) => Promise<void>;
  departments: Department[];
  submitting: boolean;
}

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

interface FormErrors {
  email?: string;
  password?: string;
  confirm_password?: string;
  role?: string;
  first_name?: string;
  last_name?: string;
  department_id?: string;
  general?: string;
}

function validate(data: CreateUserInput): FormErrors {
  const errors: FormErrors = {};

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'A valid email address is required';
  }
  if (!data.password || data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  } else if (!PASSWORD_REGEX.test(data.password)) {
    errors.password = 'Must contain 1 uppercase, 1 number, and 1 special character (@$!%*?&)';
  }
  if (data.password !== data.confirm_password) {
    errors.confirm_password = 'Passwords do not match';
  }
  if (!data.role) {
    errors.role = 'Role is required';
  }
  if (!data.first_name?.trim()) {
    errors.first_name = 'First name is required';
  }
  if (!data.last_name?.trim()) {
    errors.last_name = 'Last name is required';
  }
  if (data.role === 'patient' && !data.department_id) {
    errors.department_id = 'Department is required for Patient role';
  }

  return errors;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  departments,
  submitting,
}) => {
  const [formData, setFormData] = useState<CreateUserInput>({
    email: '',
    password: '',
    confirm_password: '',
    role: 'patient',
    first_name: '',
    last_name: '',
    phone_number: '',
    department_id: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field: keyof CreateUserInput, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        email: '',
        password: '',
        confirm_password: '',
        role: 'patient',
        first_name: '',
        last_name: '',
        phone_number: '',
        department_id: null,
      });
      setErrors({});
    } catch (err: any) {
      setErrors({ general: err.message || 'Failed to create user' });
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

  const errorInputStyle: React.CSSProperties = {
    ...inputStyle,
    borderColor: '#ef4444',
  };

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
      aria-label="Create User"
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
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>Create User</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        {errors.general && (
          <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', borderRadius: '6px', marginBottom: '12px', color: '#dc2626', fontSize: '0.8rem' }} role="alert">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle} htmlFor="cu-first-name">First Name *</label>
              <input
                id="cu-first-name"
                type="text"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                style={errors.first_name ? errorInputStyle : inputStyle}
                aria-invalid={!!errors.first_name}
                aria-describedby={errors.first_name ? 'cu-first-name-error' : undefined}
              />
              {errors.first_name && <div id="cu-first-name-error" style={errorStyle}>{errors.first_name}</div>}
            </div>
            <div>
              <label style={labelStyle} htmlFor="cu-last-name">Last Name *</label>
              <input
                id="cu-last-name"
                type="text"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                style={errors.last_name ? errorInputStyle : inputStyle}
                aria-invalid={!!errors.last_name}
                aria-describedby={errors.last_name ? 'cu-last-name-error' : undefined}
              />
              {errors.last_name && <div id="cu-last-name-error" style={errorStyle}>{errors.last_name}</div>}
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle} htmlFor="cu-email">Email *</label>
            <input
              id="cu-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              style={errors.email ? errorInputStyle : inputStyle}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'cu-email-error' : undefined}
            />
            {errors.email && <div id="cu-email-error" style={errorStyle}>{errors.email}</div>}
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle} htmlFor="cu-password">Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                id="cu-password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                style={errors.password ? errorInputStyle : inputStyle}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'cu-password-error' : 'cu-password-hint'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  color: '#6b7280',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <PasswordStrengthIndicator password={formData.password} />
            {errors.password && <div id="cu-password-error" style={errorStyle}>{errors.password}</div>}
            <div id="cu-password-hint" style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '2px' }}>
              Min 8 chars, 1 uppercase, 1 number, 1 special character
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle} htmlFor="cu-confirm-password">Confirm Password *</label>
            <input
              id="cu-confirm-password"
              type="password"
              value={formData.confirm_password}
              onChange={(e) => handleChange('confirm_password', e.target.value)}
              style={errors.confirm_password ? errorInputStyle : inputStyle}
              aria-invalid={!!errors.confirm_password}
              aria-describedby={errors.confirm_password ? 'cu-confirm-error' : undefined}
            />
            {errors.confirm_password && <div id="cu-confirm-error" style={errorStyle}>{errors.confirm_password}</div>}
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle} htmlFor="cu-role">Role *</label>
            <select
              id="cu-role"
              value={formData.role}
              onChange={(e) => {
                handleChange('role', e.target.value);
                if (e.target.value !== 'patient') handleChange('department_id', null);
              }}
              style={errors.role ? errorInputStyle : inputStyle}
              aria-invalid={!!errors.role}
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
            {errors.role && <div style={errorStyle}>{errors.role}</div>}
          </div>

          {formData.role === 'patient' && (
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle} htmlFor="cu-department">Department *</label>
              <select
                id="cu-department"
                value={formData.department_id ?? ''}
                onChange={(e) => handleChange('department_id', e.target.value ? parseInt(e.target.value, 10) : null)}
                style={errors.department_id ? errorInputStyle : inputStyle}
                aria-invalid={!!errors.department_id}
                aria-describedby={errors.department_id ? 'cu-dept-error' : undefined}
              >
                <option value="">Select department...</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
              {errors.department_id && <div id="cu-dept-error" style={errorStyle}>{errors.department_id}</div>}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle} htmlFor="cu-phone">Phone Number</label>
            <input
              id="cu-phone"
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
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
