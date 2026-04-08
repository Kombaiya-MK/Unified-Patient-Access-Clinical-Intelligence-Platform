/**
 * Insurance Info Panel Component
 *
 * Displays comprehensive insurance verification information
 * in the patient profile view with re-verify capability.
 *
 * @module InsuranceInfoPanel
 * @task US_037 TASK_003
 */

import React, { useState } from 'react';
import { useInsuranceVerification } from '../../hooks/useInsuranceVerification';
import { InsuranceStatusBadge } from './InsuranceStatusBadge';
import { InsuranceIssuePopover } from './InsuranceIssuePopover';
import { VerificationHistory } from './VerificationHistory';
import type { VerificationStatus } from '../../types/insuranceVerification';
import { formatDistanceToNow } from 'date-fns';

interface InsuranceInfoPanelProps {
  patientId: number;
  appointmentId?: number;
}

export const InsuranceInfoPanel: React.FC<InsuranceInfoPanelProps> = ({
  patientId,
  appointmentId,
}) => {
  const { verification, loading, reVerify, reVerifying } = useInsuranceVerification(patientId);
  const [showPopover, setShowPopover] = useState(false);

  if (loading) {
    return (
      <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px' }}>
        <p style={{ color: '#6b7280' }}>Loading insurance information...</p>
      </div>
    );
  }

  if (!verification) {
    return (
      <div style={{
        padding: '20px', background: '#fffbeb', borderRadius: '8px',
        border: '1px solid #fbbf24',
      }}>
        <p style={{ margin: 0, color: '#92400e', fontSize: '14px' }}>
          ⚠️ Insurance information incomplete. Please collect during check-in.
        </p>
      </div>
    );
  }

  const handleReVerify = () => {
    if (appointmentId) {
      reVerify(appointmentId);
    }
  };

  return (
    <div style={{
      background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb',
      padding: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Insurance Information</h3>
        {appointmentId && (
          <button
            onClick={handleReVerify}
            disabled={reVerifying}
            style={{
              padding: '6px 14px', borderRadius: '6px', border: '1px solid #3b82f6',
              background: reVerifying ? '#93c5fd' : '#3b82f6',
              color: '#fff', cursor: reVerifying ? 'not-allowed' : 'pointer',
              fontSize: '13px',
            }}
          >
            {reVerifying ? 'Verifying...' : 'Re-verify Now'}
          </button>
        )}
      </div>

      <dl style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px 12px', fontSize: '14px', margin: 0 }}>
        <dt style={{ color: '#6b7280', fontWeight: 500 }}>Insurance Plan</dt>
        <dd style={{ margin: 0 }}>
          {verification.insurance_plan || '-'}
          {verification.is_primary_insurance && (
            <span style={{
              marginLeft: '8px', fontSize: '11px', background: '#dbeafe',
              color: '#1e40af', padding: '1px 6px', borderRadius: '4px',
            }}>
              Primary
            </span>
          )}
        </dd>

        <dt style={{ color: '#6b7280', fontWeight: 500 }}>Member ID</dt>
        <dd style={{ margin: 0 }}>{verification.member_id || '-'}</dd>

        <dt style={{ color: '#6b7280', fontWeight: 500 }}>Status</dt>
        <dd style={{ margin: 0 }}>
          <InsuranceStatusBadge
            status={verification.status as VerificationStatus}
            onClick={() => setShowPopover(true)}
          />
        </dd>

        <dt style={{ color: '#6b7280', fontWeight: 500 }}>Copay Amount</dt>
        <dd style={{ margin: 0 }}>
          {verification.copay_amount != null ? `$${Number(verification.copay_amount).toFixed(2)}` : '-'}
        </dd>

        <dt style={{ color: '#6b7280', fontWeight: 500 }}>Deductible Left</dt>
        <dd style={{ margin: 0 }}>
          {verification.deductible_remaining != null ? `$${Number(verification.deductible_remaining).toFixed(2)}` : '-'}
        </dd>

        <dt style={{ color: '#6b7280', fontWeight: 500 }}>Coverage Dates</dt>
        <dd style={{ margin: 0 }}>
          {verification.coverage_start_date && verification.coverage_end_date
            ? `${new Date(verification.coverage_start_date).toLocaleDateString()} – ${new Date(verification.coverage_end_date).toLocaleDateString()}`
            : 'N/A'}
        </dd>

        {verification.authorization_notes && (
          <>
            <dt style={{ color: '#6b7280', fontWeight: 500 }}>Auth Notes</dt>
            <dd style={{ margin: 0 }}>{verification.authorization_notes}</dd>
          </>
        )}

        <dt style={{ color: '#6b7280', fontWeight: 500 }}>Last Verified</dt>
        <dd style={{ margin: 0 }}>
          {verification.last_verified_at
            ? formatDistanceToNow(new Date(verification.last_verified_at), { addSuffix: true })
            : 'Never'}
        </dd>
      </dl>

      <VerificationHistory patientId={patientId} />

      {showPopover && (
        <InsuranceIssuePopover
          verification={verification}
          onClose={() => setShowPopover(false)}
          onRetry={appointmentId ? handleReVerify : undefined}
        />
      )}
    </div>
  );
};
