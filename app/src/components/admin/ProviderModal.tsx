/**
 * ProviderModal Component
 *
 * Create/edit provider form with department assignments and weekly schedule.
 *
 * @module ProviderModal
 * @task US_036 TASK_004
 */

import React, { useState } from 'react';
import type { Department } from '../../types/user.types';
import type { CreateProviderInput } from '../../types/provider.types';

interface ProviderModalProps {
  availableUsers: { id: number; first_name: string; last_name: string; role: string }[];
  departments: Department[];
  onSubmit: (data: CreateProviderInput) => Promise<{ success: boolean; message: string }>;
  onClose: () => void;
  saving: boolean;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const ProviderModal: React.FC<ProviderModalProps> = ({
  availableUsers,
  departments,
  onSubmit,
  onClose,
  saving,
}) => {
  const [userId, setUserId] = useState<number>(0);
  const [specialty, setSpecialty] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [selectedDepts, setSelectedDepts] = useState<Record<number, boolean>>({});
  const [primaryDept, setPrimaryDept] = useState<number>(0);
  const [scheduleEnabled, setScheduleEnabled] = useState<Record<number, boolean>>({
    1: true, 2: true, 3: true, 4: true, 5: true,
  });
  const [scheduleStart, setScheduleStart] = useState<Record<number, string>>({
    0: '09:00', 1: '09:00', 2: '09:00', 3: '09:00', 4: '09:00', 5: '09:00', 6: '09:00',
  });
  const [scheduleEnd, setScheduleEnd] = useState<Record<number, string>>({
    0: '17:00', 1: '17:00', 2: '17:00', 3: '17:00', 4: '17:00', 5: '17:00', 6: '17:00',
  });
  const [formError, setFormError] = useState('');

  const handleDeptToggle = (deptId: number) => {
    setSelectedDepts((prev) => {
      const next = { ...prev, [deptId]: !prev[deptId] };
      if (!next[deptId] && primaryDept === deptId) setPrimaryDept(0);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!userId) { setFormError('Please select a user'); return; }
    if (!specialty.trim()) { setFormError('Specialty is required'); return; }

    const deptAssignments = Object.entries(selectedDepts)
      .filter(([, selected]) => selected)
      .map(([id]) => ({
        department_id: Number(id),
        primary_department: Number(id) === primaryDept,
      }));

    if (deptAssignments.length === 0) {
      setFormError('At least one department assignment is required');
      return;
    }

    const weeklySchedule = Object.entries(scheduleEnabled)
      .filter(([, enabled]) => enabled)
      .map(([day]) => ({
        day_of_week: Number(day),
        start_time: scheduleStart[Number(day)] || '09:00',
        end_time: scheduleEnd[Number(day)] || '17:00',
      }));

    const result = await onSubmit({
      user_id: userId,
      specialty: specialty.trim(),
      license_number: licenseNumber.trim() || undefined,
      department_assignments: deptAssignments,
      weekly_schedule: weeklySchedule,
    });

    if (!result.success) setFormError(result.message);
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
  };
  const modalStyle: React.CSSProperties = {
    backgroundColor: '#fff', borderRadius: '8px', padding: '24px',
    width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto',
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
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label="Add Provider">
      <div style={modalStyle}>
        <h2 style={{ margin: '0 0 16px', fontSize: '1.25rem' }}>Add Provider</h2>

        {formError && (
          <div role="alert" style={{ padding: '8px 12px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '6px', marginBottom: '16px', fontSize: '0.875rem' }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label htmlFor="provider-user" style={labelStyle}>User *</label>
            <select id="provider-user" value={userId} onChange={(e) => setUserId(Number(e.target.value))} style={inputStyle} required>
              <option value={0}>-- Select User --</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.last_name}, {u.first_name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <label htmlFor="provider-specialty" style={labelStyle}>Specialty *</label>
            <input id="provider-specialty" type="text" value={specialty} onChange={(e) => setSpecialty(e.target.value)} style={inputStyle} required />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="provider-license" style={labelStyle}>License Number</label>
            <input id="provider-license" type="text" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} style={inputStyle} />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Department Assignments *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {departments.map((dept) => (
                <div key={dept.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id={`dept-${dept.id}`}
                    checked={!!selectedDepts[dept.id]}
                    onChange={() => handleDeptToggle(dept.id)}
                    aria-label={`Assign to ${dept.name}`}
                  />
                  <label htmlFor={`dept-${dept.id}`} style={{ fontSize: '0.875rem', flex: 1 }}>{dept.name}</label>
                  {selectedDepts[dept.id] && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#6b7280' }}>
                      <input
                        type="radio"
                        name="primary-dept"
                        checked={primaryDept === dept.id}
                        onChange={() => setPrimaryDept(dept.id)}
                        aria-label={`Set ${dept.name} as primary`}
                      />
                      Primary
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Weekly Schedule</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {DAY_NAMES.map((name, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '100px 40px 1fr 1fr', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem' }}>{name}</span>
                  <input
                    type="checkbox"
                    checked={!!scheduleEnabled[idx]}
                    onChange={(e) => setScheduleEnabled((p) => ({ ...p, [idx]: e.target.checked }))}
                    aria-label={`Enable ${name}`}
                  />
                  <input
                    type="time"
                    value={scheduleStart[idx] || '09:00'}
                    disabled={!scheduleEnabled[idx]}
                    onChange={(e) => setScheduleStart((p) => ({ ...p, [idx]: e.target.value }))}
                    style={{ ...inputStyle, opacity: scheduleEnabled[idx] ? 1 : 0.5 }}
                    aria-label={`${name} start time`}
                  />
                  <input
                    type="time"
                    value={scheduleEnd[idx] || '17:00'}
                    disabled={!scheduleEnabled[idx]}
                    onChange={(e) => setScheduleEnd((p) => ({ ...p, [idx]: e.target.value }))}
                    style={{ ...inputStyle, opacity: scheduleEnabled[idx] ? 1 : 0.5 }}
                    aria-label={`${name} end time`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button type="button" onClick={onClose} disabled={saving} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Creating...' : 'Create Provider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
