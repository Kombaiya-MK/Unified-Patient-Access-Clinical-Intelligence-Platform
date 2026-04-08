/**
 * DepartmentModal Component
 *
 * Create/edit department form with operating hours grid.
 *
 * @module DepartmentModal
 * @task US_036 TASK_004
 */

import React, { useState } from 'react';
import { OperatingHoursGrid } from './OperatingHoursGrid';
import type { DepartmentManaged, CreateDepartmentInput, OperatingHours } from '../../types/department.types';

interface DepartmentModalProps {
  department?: DepartmentManaged | null;
  onSubmit: (data: CreateDepartmentInput) => Promise<{ success: boolean; message: string }>;
  onClose: () => void;
  saving: boolean;
}

const DEFAULT_HOURS: OperatingHours = {
  monday: { open: '08:00', close: '20:00', is_open: true },
  tuesday: { open: '08:00', close: '20:00', is_open: true },
  wednesday: { open: '08:00', close: '20:00', is_open: true },
  thursday: { open: '08:00', close: '20:00', is_open: true },
  friday: { open: '08:00', close: '20:00', is_open: true },
  saturday: { open: '08:00', close: '20:00', is_open: true },
  sunday: { open: '08:00', close: '20:00', is_open: true },
};

export const DepartmentModal: React.FC<DepartmentModalProps> = ({
  department,
  onSubmit,
  onClose,
  saving,
}) => {
  const [name, setName] = useState(department?.name || '');
  const [code, setCode] = useState(department?.code || '');
  const [description, setDescription] = useState(department?.description || '');
  const [operatingHours, setOperatingHours] = useState<OperatingHours>(
    department?.operating_hours || DEFAULT_HOURS,
  );
  const [location, setLocation] = useState(department?.location || '');
  const [phone, setPhone] = useState(department?.phone_number || '');
  const [email, setEmail] = useState(department?.email || '');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !code.trim()) {
      setFormError('Name and code are required');
      return;
    }

    const result = await onSubmit({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim() || undefined,
      operating_hours: operatingHours,
      location: location.trim() || undefined,
      phone_number: phone.trim() || undefined,
      email: email.trim() || undefined,
    });

    if (!result.success) {
      setFormError(result.message);
    }
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
  };
  const modalStyle: React.CSSProperties = {
    backgroundColor: '#fff', borderRadius: '8px', padding: '24px',
    width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', border: '1px solid #d1d5db',
    borderRadius: '6px', fontSize: '0.875rem',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 500,
  };
  const fieldStyle: React.CSSProperties = { marginBottom: '16px' };

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label={department ? 'Edit Department' : 'Add Department'}>
      <div style={modalStyle}>
        <h2 style={{ margin: '0 0 16px', fontSize: '1.25rem' }}>
          {department ? 'Edit Department' : 'Add Department'}
        </h2>

        {formError && (
          <div role="alert" style={{ padding: '8px 12px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '6px', marginBottom: '16px', fontSize: '0.875rem' }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label htmlFor="dept-name" style={labelStyle}>Name *</label>
            <input id="dept-name" type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} required />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="dept-code" style={labelStyle}>Code *</label>
            <input id="dept-code" type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} style={inputStyle} required />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="dept-desc" style={labelStyle}>Description</label>
            <textarea id="dept-desc" value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: '60px' }} />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Operating Hours</label>
            <OperatingHoursGrid value={operatingHours} onChange={setOperatingHours} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={fieldStyle}>
              <label htmlFor="dept-location" style={labelStyle}>Location</label>
              <input id="dept-location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label htmlFor="dept-phone" style={labelStyle}>Phone</label>
              <input id="dept-phone" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={fieldStyle}>
            <label htmlFor="dept-email" style={labelStyle}>Email</label>
            <input id="dept-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button type="button" onClick={onClose} disabled={saving} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : department ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
