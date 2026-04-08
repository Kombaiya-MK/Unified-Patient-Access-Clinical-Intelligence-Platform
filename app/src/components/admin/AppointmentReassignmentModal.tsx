/**
 * AppointmentReassignmentModal Component
 *
 * Displays provider's future appointments for reassignment workflow.
 *
 * @module AppointmentReassignmentModal
 * @task US_036 TASK_004
 */

import React from 'react';
import { useProviderAppointments } from '../../hooks/useProviders';
import type { Provider } from '../../types/provider.types';

interface AppointmentReassignmentModalProps {
  providerId: number;
  providerName: string;
  onClose: () => void;
}

export const AppointmentReassignmentModal: React.FC<AppointmentReassignmentModalProps> = ({
  providerId,
  providerName,
  onClose,
}) => {
  const { appointments, loading } = useProviderAppointments(providerId);

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
  };
  const modalStyle: React.CSSProperties = {
    backgroundColor: '#fff', borderRadius: '8px', padding: '24px',
    width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto',
  };
  const tdStyle: React.CSSProperties = {
    padding: '8px 12px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem',
  };

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label="Future Appointments">
      <div style={modalStyle}>
        <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem' }}>Future Appointments</h2>
        <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: '#6b7280' }}>
          {providerName} has appointments that must be reassigned before removal.
        </p>

        {loading ? (
          <p>Loading appointments...</p>
        ) : appointments.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No future appointments found.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...tdStyle, fontWeight: 600 }}>Date</th>
                <th style={{ ...tdStyle, fontWeight: 600 }}>Type</th>
                <th style={{ ...tdStyle, fontWeight: 600 }}>Patient</th>
                <th style={{ ...tdStyle, fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => (
                <tr key={apt.id}>
                  <td style={tdStyle}>{new Date(apt.appointment_date).toLocaleDateString()}</td>
                  <td style={tdStyle}>{apt.appointment_type}</td>
                  <td style={tdStyle}>{apt.patient_first_name} {apt.patient_last_name}</td>
                  <td style={tdStyle}>{apt.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
