/**
 * Profile Header Component
 * @module components/patient-profile/ProfileHeader
 * @description Displays patient name, MRN, DOB with alert banners
 * @epic EP-006
 * @story US-031
 * @task task_001_fe_unified_patient_profile_ui
 */

import React from 'react';
import type { ProfileDemographics, MedicationConflictItem, ProfileConflict, ProcessingStatus } from '../../types/clinicalProfile.types';

interface ProfileHeaderProps {
  demographics: ProfileDemographics;
  medicationConflicts: MedicationConflictItem[];
  conflicts: ProfileConflict[];
  processingStatus: ProcessingStatus;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  demographics,
  medicationConflicts,
  conflicts,
  processingStatus,
}) => {
  const criticalConflicts = medicationConflicts.filter(c => c.severity_level >= 4);
  const pendingFieldConflicts = conflicts.filter(c => c.resolution_status === 'Pending');

  return (
    <div className="profile-header" style={{ marginBottom: '1.5rem' }}>
      {/* Patient Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
            {demographics.first_name} {demographics.last_name}
          </h1>
          <div style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            <span>MRN: {demographics.mrn}</span>
            <span style={{ margin: '0 0.5rem' }}>|</span>
            <span>DOB: {demographics.date_of_birth}</span>
            <span style={{ margin: '0 0.5rem' }}>|</span>
            <span>Gender: {demographics.gender}</span>
          </div>
        </div>
      </div>

      {/* Critical Medication Conflict Banner - 7:1 contrast ratio */}
      {criticalConflicts.length > 0 && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            backgroundColor: '#991B1B',
            color: '#FFFFFF',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            marginBottom: '0.5rem',
            fontWeight: 600,
          }}
        >
          ⚠️ {criticalConflicts.length} Critical Medication Conflict{criticalConflicts.length > 1 ? 's' : ''} - Review Required
        </div>
      )}

      {/* Data Conflicts Notification */}
      {pendingFieldConflicts.length > 0 && (
        <div
          role="status"
          style={{
            backgroundColor: '#FEF3C7',
            color: '#92400E',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            marginBottom: '0.5rem',
          }}
        >
          ⚡ {pendingFieldConflicts.length} data conflict{pendingFieldConflicts.length > 1 ? 's' : ''} detected - fields require review
        </div>
      )}

      {/* Processing Status */}
      {processingStatus.pending_documents > 0 && (
        <div
          role="status"
          style={{
            backgroundColor: '#DBEAFE',
            color: '#1E40AF',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            marginBottom: '0.5rem',
          }}
        >
          🔄 Processing {processingStatus.pending_documents} document{processingStatus.pending_documents > 1 ? 's' : ''}
          {processingStatus.estimated_completion_time && ` - ETA: ${processingStatus.estimated_completion_time}`}
        </div>
      )}
    </div>
  );
};
