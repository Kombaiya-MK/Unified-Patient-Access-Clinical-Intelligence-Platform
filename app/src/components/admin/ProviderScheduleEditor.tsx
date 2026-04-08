/**
 * ProviderScheduleEditor Component
 *
 * Visual weekly schedule editor displayed as a grid.
 * Shows available slots (green), blocked times (red),
 * and existing appointments (gray).
 *
 * @module ProviderScheduleEditor
 * @task US_036 TASK_004
 */

import React, { useState, useEffect } from 'react';
import { useProviderSchedule } from '../../hooks/useProviders';
import type { ScheduleEntry } from '../../types/provider.types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface ProviderScheduleEditorProps {
  providerId: number;
  providerName: string;
  onClose: () => void;
}

export const ProviderScheduleEditor: React.FC<ProviderScheduleEditorProps> = ({
  providerId,
  providerName,
  onClose,
}) => {
  const { schedule, loading, updateSchedule, createBlockedTime } = useProviderSchedule(providerId);
  const [localSchedule, setLocalSchedule] = useState<ScheduleEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showBlockedForm, setShowBlockedForm] = useState(false);
  const [blockedDate, setBlockedDate] = useState(new Date().toISOString().split('T')[0]);
  const [blockedStart, setBlockedStart] = useState('09:00');
  const [blockedEnd, setBlockedEnd] = useState('17:00');
  const [blockedReason, setBlockedReason] = useState('');

  useEffect(() => {
    if (schedule) {
      setLocalSchedule(schedule.weekly_schedule);
    }
  }, [schedule]);

  const handleToggleSlot = (dayOfWeek: number) => {
    const existing = localSchedule.find((s) => s.day_of_week === dayOfWeek);
    if (existing) {
      setLocalSchedule(localSchedule.filter((s) => s.day_of_week !== dayOfWeek));
    } else {
      setLocalSchedule([
        ...localSchedule,
        { day_of_week: dayOfWeek, start_time: '09:00', end_time: '17:00', is_available: true },
      ]);
    }
  };

  const handleTimeChange = (dayOfWeek: number, field: 'start_time' | 'end_time', value: string) => {
    setLocalSchedule(
      localSchedule.map((s) =>
        s.day_of_week === dayOfWeek ? { ...s, [field]: value } : s,
      ),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    const result = await updateSchedule(localSchedule);
    setMessage(result.message);
    setSaving(false);
  };

  const handleAddBlockedTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockedReason.trim()) { setMessage('Reason is required for blocked time'); return; }
    const result = await createBlockedTime({
      blocked_date: blockedDate,
      start_time: blockedStart,
      end_time: blockedEnd,
      reason: blockedReason.trim(),
    });
    setMessage(result.message);
    if (result.success) {
      setShowBlockedForm(false);
      setBlockedReason('');
    }
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
  };
  const modalStyle: React.CSSProperties = {
    backgroundColor: '#fff', borderRadius: '8px', padding: '24px',
    width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto',
  };
  const inputStyle: React.CSSProperties = {
    padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.875rem',
  };

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label="Edit Provider Schedule">
      <div style={modalStyle}>
        <h2 style={{ margin: '0 0 16px', fontSize: '1.25rem' }}>
          Schedule: {providerName}
        </h2>

        {message && (
          <div role="alert" style={{ padding: '8px 12px', backgroundColor: message.includes('success') ? '#dcfce7' : '#fef2f2', color: message.includes('success') ? '#166534' : '#dc2626', borderRadius: '6px', marginBottom: '16px', fontSize: '0.875rem' }}>
            {message}
          </div>
        )}

        {loading ? (
          <p>Loading schedule...</p>
        ) : (
          <>
            <h3 style={{ fontSize: '1rem', margin: '0 0 8px' }}>Weekly Availability</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              {DAY_NAMES.map((name, idx) => {
                const slot = localSchedule.find((s) => s.day_of_week === idx);
                return (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '60px 40px 1fr 1fr', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{name}</span>
                    <input
                      type="checkbox"
                      checked={!!slot}
                      onChange={() => handleToggleSlot(idx)}
                      aria-label={`Enable ${name}`}
                    />
                    <input
                      type="time"
                      value={slot?.start_time || '09:00'}
                      disabled={!slot}
                      onChange={(e) => handleTimeChange(idx, 'start_time', e.target.value)}
                      style={{ ...inputStyle, opacity: slot ? 1 : 0.5 }}
                      aria-label={`${name} start`}
                    />
                    <input
                      type="time"
                      value={slot?.end_time || '17:00'}
                      disabled={!slot}
                      onChange={(e) => handleTimeChange(idx, 'end_time', e.target.value)}
                      style={{ ...inputStyle, opacity: slot ? 1 : 0.5 }}
                      aria-label={`${name} end`}
                    />
                  </div>
                );
              })}
            </div>

            {schedule?.blocked_times && schedule.blocked_times.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1rem', margin: '0 0 8px' }}>Blocked Times</h3>
                {schedule.blocked_times.map((bt) => (
                  <div key={bt.id} style={{ padding: '6px 12px', backgroundColor: '#fef2f2', borderRadius: '4px', marginBottom: '4px', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{bt.blocked_date}: {bt.start_time} – {bt.end_time}</span>
                    <span style={{ color: '#6b7280' }}>{bt.reason}</span>
                  </div>
                ))}
              </div>
            )}

            {schedule?.existing_appointments && schedule.existing_appointments.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1rem', margin: '0 0 8px' }}>Upcoming Appointments</h3>
                {schedule.existing_appointments.map((apt) => (
                  <div key={apt.id} style={{ padding: '6px 12px', backgroundColor: '#f3f4f6', borderRadius: '4px', marginBottom: '4px', fontSize: '0.875rem' }}>
                    {new Date(apt.appointment_date).toLocaleDateString()} — {apt.duration_minutes}min — {apt.status}
                  </div>
                ))}
              </div>
            )}

            {showBlockedForm ? (
              <form onSubmit={handleAddBlockedTime} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '12px', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '0.875rem' }}>Add Blocked Time</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <input type="date" value={blockedDate} onChange={(e) => setBlockedDate(e.target.value)} style={inputStyle} aria-label="Blocked date" />
                  <input type="time" value={blockedStart} onChange={(e) => setBlockedStart(e.target.value)} style={inputStyle} aria-label="Blocked start time" />
                  <input type="time" value={blockedEnd} onChange={(e) => setBlockedEnd(e.target.value)} style={inputStyle} aria-label="Blocked end time" />
                </div>
                <input type="text" placeholder="Reason (required)" value={blockedReason} onChange={(e) => setBlockedReason(e.target.value)} style={{ ...inputStyle, width: '100%', marginBottom: '8px' }} aria-label="Blocked time reason" required />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="submit" style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', backgroundColor: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: '0.75rem' }}>
                    Add Block
                  </button>
                  <button type="button" onClick={() => setShowBlockedForm(false)} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer', fontSize: '0.75rem' }}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowBlockedForm(true)}
                style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer', fontSize: '0.75rem', marginBottom: '16px' }}
              >
                + Add Blocked Time
              </button>
            )}
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer' }}>
            Close
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Saving...' : 'Save Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
};
