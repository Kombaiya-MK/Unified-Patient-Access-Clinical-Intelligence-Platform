/**
 * Verification History Component
 *
 * Expandable accordion showing past insurance verification attempts.
 *
 * @module VerificationHistory
 * @task US_037 TASK_003
 */

import React, { useState, useEffect } from 'react';
import { useInsuranceVerification } from '../../hooks/useInsuranceVerification';
import { InsuranceStatusBadge } from './InsuranceStatusBadge';
import type { VerificationStatus } from '../../types/insuranceVerification';

interface VerificationHistoryProps {
  patientId: number;
}

export const VerificationHistory: React.FC<VerificationHistoryProps> = ({ patientId }) => {
  const { history, historyTotal, fetchHistory } = useInsuranceVerification(patientId);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (expanded && history.length === 0) {
      fetchHistory(1);
    }
  }, [expanded, history.length, fetchHistory]);

  return (
    <div style={{ marginTop: '16px' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '14px', color: '#3b82f6', fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: '6px',
        }}
      >
        {expanded ? '▼' : '▶'} View Verification History ({historyTotal} records)
      </button>

      {expanded && (
        <div style={{ marginTop: '8px', overflowX: 'auto' }}>
          {history.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#6b7280' }}>No verification history</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#6b7280' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#6b7280' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#6b7280' }}>Source</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#6b7280' }}>Copay</th>
                </tr>
              </thead>
              <tbody>
                {history.map((v) => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px' }}>
                      {new Date(v.verification_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '8px' }}>
                      <InsuranceStatusBadge status={v.status as VerificationStatus} />
                    </td>
                    <td style={{ padding: '8px' }}>{v.verification_source || '-'}</td>
                    <td style={{ padding: '8px' }}>
                      {v.copay_amount != null ? `$${Number(v.copay_amount).toFixed(2)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
