/**
 * Unified Patient Profile View
 * @module components/patient-profile/UnifiedPatientProfile
 * @description Main container for the unified patient profile with tabs
 * @epic EP-006
 * @story US-031
 */

import React, { useState } from 'react';
import type { UnifiedProfile } from '../../types/clinicalProfile.types';
import { ProfileHeader } from './ProfileHeader';
import { ProfileTabs, type ProfileTabId } from './ProfileTabs';
import { DemographicsSection } from './DemographicsSection';
import { MedicationsSection } from './MedicationsSection';
import { LabResultsSection } from './LabResultsSection';
import { ConflictAlert } from './ConflictAlert';

interface UnifiedPatientProfileProps {
  profile: UnifiedProfile;
  onResolveConflict?: (fieldName: string) => void;
}

export const UnifiedPatientProfile: React.FC<UnifiedPatientProfileProps> = ({ profile, onResolveConflict }) => {
  const [activeTab, setActiveTab] = useState<ProfileTabId>('demographics');

  const conflictCounts: Record<string, number> = {};
  if (profile.conflicts) {
    for (const conflict of profile.conflicts) {
      if (conflict.resolution_status === 'Pending') {
        const section = conflict.field_name.split('.')[0] || 'demographics';
        conflictCounts[section] = (conflictCounts[section] || 0) + 1;
      }
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'demographics':
        return <DemographicsSection demographics={profile.demographics} />;
      case 'medications':
        return (
          <MedicationsSection
            medications={profile.medical_history?.medications || []}
            medicationConflicts={profile.medication_conflicts || []}
          />
        );
      case 'lab-results':
        return <LabResultsSection labResults={profile.medical_history?.lab_results || []} />;
      case 'medical-history':
        return (
          <div role="tabpanel" id="panel-medical-history">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Medical History</h2>
            {profile.medical_history?.conditions && profile.medical_history.conditions.length > 0 ? (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {profile.medical_history.conditions.map((condition, idx) => (
                  <li key={idx} style={{ padding: '0.75rem', borderBottom: '1px solid #F3F4F6' }}>
                    <strong>{condition.name}</strong>
                    {condition.diagnosed_date && <span style={{ color: '#6B7280', marginLeft: '0.5rem' }}>Dx: {condition.diagnosed_date}</span>}
                    {condition.status && <span style={{ marginLeft: '0.5rem', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', backgroundColor: '#D1FAE5', color: '#065F46' }}>{condition.status}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#6B7280' }}>No conditions recorded.</p>
            )}
          </div>
        );
      case 'allergies':
        return (
          <div role="tabpanel" id="panel-allergies">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Allergies</h2>
            {profile.medical_history?.allergies && profile.medical_history.allergies.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {profile.medical_history.allergies.map((allergy, idx) => (
                  <div key={idx} style={{ padding: '0.75rem', border: '1px solid #E5E7EB', borderRadius: '0.5rem' }}>
                    <div style={{ fontWeight: 500 }}>{allergy.allergen}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                      Severity: <span style={{ fontWeight: 500, color: allergy.severity === 'Severe' ? '#991B1B' : '#6B7280' }}>{allergy.severity}</span>
                    </div>
                    {allergy.reaction && <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Reaction: {allergy.reaction}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6B7280' }}>No allergies recorded.</p>
            )}
          </div>
        );
      case 'visits':
        return (
          <div role="tabpanel" id="panel-visits">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Visits</h2>
            {profile.medical_history?.visits && profile.medical_history.visits.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {profile.medical_history.visits.map((visit, idx) => (
                  <div key={idx} style={{ padding: '0.75rem', border: '1px solid #E5E7EB', borderRadius: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{visit.visit_type}</strong>
                      <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>{visit.date}</span>
                    </div>
                    {visit.provider && <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Provider: {visit.provider}</div>}
                    {visit.notes && <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>{visit.notes}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6B7280' }}>No visits recorded.</p>
            )}
          </div>
        );
      default:
        return <p style={{ color: '#6B7280' }}>This section is available in clinical review.</p>;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
      <ProfileHeader
        demographics={profile.demographics}
        medicationConflicts={profile.medication_conflicts || []}
        conflicts={profile.conflicts || []}
        processingStatus={profile.processing_status}
      />

      <ConflictAlert
        conflicts={profile.conflicts || []}
        onResolve={onResolveConflict}
      />

      <ProfileTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        conflictCounts={conflictCounts}
      />

      {renderTabContent()}
    </div>
  );
};
