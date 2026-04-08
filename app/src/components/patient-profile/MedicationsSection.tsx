/**
 * Medications Section Component
 * @module components/patient-profile/MedicationsSection
 * @description Displays current medications with conflict integration
 * @epic EP-006
 * @story US-031
 * @task task_001_fe_unified_patient_profile_ui
 */

import React from 'react';
import type { ProfileMedication, MedicationConflictItem } from '../../types/clinicalProfile.types';
import { ConfidenceBadge } from './ConfidenceBadge';

interface MedicationsSectionProps {
  medications: ProfileMedication[];
  medicationConflicts: MedicationConflictItem[];
}

export const MedicationsSection: React.FC<MedicationsSectionProps> = ({ medications, medicationConflicts }) => {
  const activeConflicts = medicationConflicts.filter(c => c.conflict_status === 'Active');
  const maxSeverity = activeConflicts.length > 0
    ? Math.max(...activeConflicts.map(c => c.severity_level))
    : 0;

  const bannerColor = maxSeverity >= 4 ? '#991B1B' : maxSeverity >= 2 ? '#92400E' : '#065F46';
  const bannerBg = maxSeverity >= 4 ? '#FEE2E2' : maxSeverity >= 2 ? '#FEF3C7' : '#D1FAE5';
  const bannerText = maxSeverity >= 4
    ? `${activeConflicts.length} Critical Medication Conflict${activeConflicts.length > 1 ? 's' : ''}`
    : maxSeverity >= 2
    ? `${activeConflicts.length} Warning${activeConflicts.length > 1 ? 's' : ''}`
    : 'No Conflicts - All Medications Safe';

  return (
    <div role="tabpanel" id="panel-medications" aria-labelledby="tab-medications">
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Medications</h2>

      {/* Conflict Banner */}
      <div
        role="alert"
        style={{
          backgroundColor: bannerBg,
          color: bannerColor,
          padding: '0.75rem 1rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          fontWeight: 500,
        }}
      >
        {bannerText}
      </div>

      {/* Medications Table */}
      {medications.length === 0 ? (
        <p style={{ color: '#6B7280' }}>No medications recorded.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E5E7EB', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>Medication</th>
                <th style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>Dosage</th>
                <th style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>Frequency</th>
                <th style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>Status</th>
                <th style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {medications.map((med, index) => (
                <tr key={`${med.name}-${index}`} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>{med.name}</td>
                  <td style={{ padding: '0.5rem', fontSize: '0.875rem' }}>{med.dosage}</td>
                  <td style={{ padding: '0.5rem', fontSize: '0.875rem' }}>{med.frequency}</td>
                  <td style={{ padding: '0.5rem' }}>
                    <span style={{
                      padding: '0.125rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      backgroundColor: med.status === 'Active' ? '#D1FAE5' : '#FEF3C7',
                      color: med.status === 'Active' ? '#065F46' : '#92400E',
                    }}>
                      {med.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <ConfidenceBadge confidence={med.confidence ? med.confidence * 100 : undefined} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
