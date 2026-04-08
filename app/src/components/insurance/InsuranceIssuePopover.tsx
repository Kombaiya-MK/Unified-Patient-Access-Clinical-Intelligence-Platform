/**
 * Insurance Issue Popover Component
 *
 * Shows details about insurance verification issues with recommended actions.
 *
 * @module InsuranceIssuePopover
 * @task US_037 TASK_003
 */

import React from 'react';
import type { InsuranceVerification } from '../../types/insuranceVerification';

interface InsuranceIssuePopoverProps {
  verification: InsuranceVerification;
  onClose: () => void;
  onRetry?: () => void;
}

function getProblemSummary(status: string): string {
  switch (status) {
    case 'inactive': return 'Insurance Inactive';
    case 'requires_auth': return 'Prior Authorization Required';
    case 'failed': return 'Verification Failed';
    case 'incomplete': return 'Insurance Info Incomplete';
    case 'pending': return 'Verification In Progress';
    default: return 'Insurance Issue';
  }
}

function getRecommendedAction(status: string): string {
  switch (status) {
    case 'inactive': return 'Contact patient to update insurance information.';
    case 'requires_auth': return 'Request prior authorization from insurance provider.';
    case 'failed': return 'Retry verification or verify manually.';
    case 'incomplete': return 'Collect insurance information during check-in.';
    case 'pending': return 'Verification is in progress. Please wait.';
    default: return 'Review patient insurance details.';
  }
}

export const InsuranceIssuePopover: React.FC<InsuranceIssuePopoverProps> = ({
  verification,
  onClose,
  onRetry,
}) => {
  return (
    <div
      role="dialog"
      aria-labelledby="insurance-popover-title"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div style={{
        background: '#fff', borderRadius: '8px', padding: '24px',
        maxWidth: '420px', width: '90%', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 id="insurance-popover-title" style={{ margin: 0, fontSize: '16px' }}>
            {getProblemSummary(verification.status)}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}
          >
            ×
          </button>
        </div>

        {verification.authorization_notes && (
          <p style={{ fontSize: '14px', color: '#374151', marginBottom: '12px' }}>
            <strong>Notes:</strong> {verification.authorization_notes}
          </p>
        )}

        {verification.coverage_start_date && verification.coverage_end_date && (
          <p style={{ fontSize: '14px', color: '#374151', marginBottom: '12px' }}>
            <strong>Coverage:</strong> {verification.coverage_start_date} — {verification.coverage_end_date}
          </p>
        )}

        <div style={{
          background: '#f3f4f6', borderRadius: '6px', padding: '12px', marginBottom: '16px',
        }}>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
            <strong>Recommended Action:</strong> {getRecommendedAction(verification.status)}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          {(verification.status === 'failed' || verification.status === 'inactive') && onRetry && (
            <button
              onClick={onRetry}
              style={{
                padding: '8px 16px', borderRadius: '6px', border: '1px solid #3b82f6',
                background: '#fff', color: '#3b82f6', cursor: 'pointer', fontSize: '13px',
              }}
            >
              Retry Verification
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px', borderRadius: '6px', border: 'none',
              background: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: '13px',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
