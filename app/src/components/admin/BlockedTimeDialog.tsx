/**
 * BlockedTimeDialog Component
 *
 * Small modal for adding a blocked time slot with reason.
 *
 * @module BlockedTimeDialog
 * @task US_036 TASK_004
 */

import React, { useState } from 'react';

interface BlockedTimeDialogProps {
  onSubmit: (data: { blocked_date: string; start_time: string; end_time: string; reason: string }) => Promise<{ success: boolean; message: string }>;
  onClose: () => void;
}

export const BlockedTimeDialog: React.FC<BlockedTimeDialogProps> = ({ onSubmit, onClose }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!reason.trim()) { setError('Reason is required'); return; }
    setSaving(true);
    const result = await onSubmit({ blocked_date: date, start_time: startTime, end_time: endTime, reason: reason.trim() });
    setSaving(false);
    if (!result.success) {
      setError(result.message);
    }
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60,
  };
  const modalStyle: React.CSSProperties = {
    backgroundColor: '#fff', borderRadius: '8px', padding: '24px', width: '100%', maxWidth: '400px',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem',
  };

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label="Add Blocked Time">
      <div style={modalStyle}>
        <h3 style={{ margin: '0 0 12px', fontSize: '1rem' }}>Block Time Slot</h3>
        {error && (
          <div role="alert" style={{ padding: '8px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '4px', marginBottom: '12px', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label htmlFor="blocked-date" style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>Date</label>
            <input id="blocked-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <div>
              <label htmlFor="blocked-start" style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>Start</label>
              <input id="blocked-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={inputStyle} required />
            </div>
            <div>
              <label htmlFor="blocked-end" style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>End</label>
              <input id="blocked-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={inputStyle} required />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="blocked-reason" style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>Reason *</label>
            <textarea id="blocked-reason" value={reason} onChange={(e) => setReason(e.target.value)} style={{ ...inputStyle, minHeight: '60px' }} required />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" onClick={onClose} disabled={saving} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#dc2626', color: '#fff', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Blocking...' : 'Block Time'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
