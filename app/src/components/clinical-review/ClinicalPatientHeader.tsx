/**
 * Clinical Review Patient Header Component
 * @module components/clinical-review/ClinicalPatientHeader
 * @description Header for clinical data review with patient info & status
 * @epic EP-006
 * @story US-034
 * @task task_001_fe_clinical_data_review_interface
 */

import React from 'react';
import type { UnifiedProfile } from '../../types/clinicalProfile.types';

interface ClinicalPatientHeaderProps {
  profile: UnifiedProfile;
}

export const ClinicalPatientHeader: React.FC<ClinicalPatientHeaderProps> = ({ profile }) => {
  const { demographics, processing_status, confidence_score } = profile;
  const conflictCount = profile.conflicts?.filter(c => c.resolution_status === 'Pending').length || 0;
  const medConflictCount = profile.medication_conflicts?.filter(c => c.conflict_status === 'Active').length || 0;

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1.25rem', backgroundColor: '#FFFFFF', borderRadius: '0.5rem', border: '1px solid #E5E7EB', marginBottom: '1rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.25rem' }}>
          {demographics.first_name} {demographics.last_name}
        </h1>
        <div style={{ color: '#6B7280', fontSize: '0.875rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <span>MRN: {demographics.mrn}</span>
          <span>DOB: {demographics.date_of_birth}</span>
          <span>Gender: {demographics.gender}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        {/* Profile Confidence */}
        {confidence_score !== undefined && (
          <div style={{
            padding: '0.375rem 0.75rem',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            fontWeight: 500,
            backgroundColor: confidence_score >= 0.9 ? '#D1FAE5' : '#FEF3C7',
            color: confidence_score >= 0.9 ? '#065F46' : '#92400E',
          }}>
            Profile: {(confidence_score * 100).toFixed(0)}%
          </div>
        )}

        {/* Conflict Counter */}
        {(conflictCount > 0 || medConflictCount > 0) && (
          <div style={{
            padding: '0.375rem 0.75rem',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            fontWeight: 500,
            backgroundColor: medConflictCount > 0 ? '#FEE2E2' : '#FEF3C7',
            color: medConflictCount > 0 ? '#991B1B' : '#92400E',
          }}>
            {conflictCount + medConflictCount} conflict{(conflictCount + medConflictCount) > 1 ? 's' : ''}
          </div>
        )}

        {/* Processing Status */}
        {processing_status.pending_documents > 0 && (
          <div style={{
            padding: '0.375rem 0.75rem',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            fontWeight: 500,
            backgroundColor: '#DBEAFE',
            color: '#1E40AF',
          }}>
            Processing...
          </div>
        )}
      </div>
    </div>
  );
};
