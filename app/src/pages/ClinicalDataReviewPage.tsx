/**
 * Clinical Data Review Page
 * @module pages/ClinicalDataReviewPage
 * @description Full clinical data review page with unified profile, medical coding,
 *   medication conflict detection, conflict resolution, and audit timeline.
 * @screen SCR-010
 * @epic EP-006
 * @story US-034
 */

import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useClinicalProfile } from '../hooks/useClinicalProfile';
import { useConflictResolution } from '../hooks/useConflictResolution';
import { ClinicalPatientHeader } from '../components/clinical-review/ClinicalPatientHeader';
import { ClinicalTabNavigation, type ClinicalTabId } from '../components/clinical-review/ClinicalTabNavigation';
import { ConflictProgress } from '../components/clinical-review/ConflictProgress';
import { ConflictResolutionModal } from '../components/clinical-review/ConflictResolutionModal';
import { AuditLogTimeline } from '../components/clinical-review/AuditLogTimeline';
import { StatusBadge } from '../components/clinical-review/StatusBadge';
import { DemographicsSection } from '../components/patient-profile/DemographicsSection';
import { MedicationsSection } from '../components/patient-profile/MedicationsSection';
import { LabResultsSection } from '../components/patient-profile/LabResultsSection';
import { MedicalCodingTab } from '../components/medical-coding/MedicalCodingTab';
import { ConflictBanner } from '../components/medications/ConflictBanner';
import { ConflictHistoryPanel } from '../components/medications/ConflictHistoryPanel';
import type { ProfileConflict } from '../types/clinicalProfile.types';

export const ClinicalDataReviewPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const { profile, loading, error, refresh } = useClinicalProfile(patientId || '');
  const { resolveConflict } = useConflictResolution();

  const [activeTab, setActiveTab] = useState<ClinicalTabId>('demographics');
  const [resolvingConflict, setResolvingConflict] = useState<ProfileConflict | null>(null);

  const handleResolveConflict = useCallback(async (fieldName: string, selectedValue: string, notes: string) => {
    if (!patientId) return;
    await resolveConflict(patientId, fieldName, selectedValue, notes);
    setResolvingConflict(null);
    refresh();
  }, [patientId, resolveConflict, refresh]);

  if (!patientId) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>No patient ID provided.</div>;
  }

  if (loading && !profile) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>Loading clinical profile...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: '#991B1B', marginBottom: '1rem' }}>{error}</div>
        <button onClick={refresh} style={{ padding: '0.5rem 1rem', border: '1px solid #D1D5DB', borderRadius: '0.375rem', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
  }

  if (!profile) return null;

  const pendingConflicts = profile.conflicts?.filter(c => c.resolution_status === 'Pending') || [];
  const totalConflicts = (pendingConflicts.length) + (profile.medication_conflicts?.filter(c => c.conflict_status === 'Active').length || 0);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'demographics':
        return <DemographicsSection demographics={profile.demographics} />;
      case 'medical-history':
        return (
          <div role="tabpanel" id="clinical-panel-medical-history">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Medical History</h2>
            {profile.medical_history?.conditions && profile.medical_history.conditions.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {profile.medical_history.conditions.map((condition, idx) => (
                  <div key={idx} style={{ padding: '0.75rem', border: '1px solid #E5E7EB', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{condition.name}</strong>
                      {condition.diagnosed_date && <span style={{ color: '#6B7280', fontSize: '0.875rem', marginLeft: '0.5rem' }}>Dx: {condition.diagnosed_date}</span>}
                    </div>
                    {condition.status && <StatusBadge status={condition.status} />}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6B7280' }}>No conditions recorded.</p>
            )}
          </div>
        );
      case 'medications':
        return (
          <div>
            <ConflictBanner
              conflicts={profile.medication_conflicts?.map(mc => ({
                conflict_id: mc.conflict_id,
                conflict_type: mc.conflict_type,
                medications_involved: mc.medications_involved,
                severity_level: mc.severity_level,
                interaction_mechanism: mc.interaction_mechanism || '',
                clinical_guidance: mc.clinical_guidance || '',
              })) || []}
            />
            <div style={{ marginTop: '1rem' }}>
              <MedicationsSection
                medications={profile.medical_history?.medications || []}
                medicationConflicts={profile.medication_conflicts || []}
              />
            </div>
          </div>
        );
      case 'allergies':
        return (
          <div role="tabpanel" id="clinical-panel-allergies">
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
      case 'lab-results':
        return <LabResultsSection labResults={profile.medical_history?.lab_results || []} />;
      case 'visits':
        return (
          <div role="tabpanel" id="clinical-panel-visits">
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
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6B7280' }}>No visits recorded.</p>
            )}
          </div>
        );
      case 'documents':
        return (
          <div role="tabpanel" id="clinical-panel-documents">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Documents</h2>
            <p style={{ color: '#6B7280' }}>Documents are available in the document upload section.</p>
          </div>
        );
      case 'coding':
        return <MedicalCodingTab appointmentId={patientId} />;
      case 'conflicts':
        return (
          <div role="tabpanel" id="clinical-panel-conflicts">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Data Conflicts</h2>
            <ConflictProgress conflicts={profile.conflicts || []} />
            {pendingConflicts.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {pendingConflicts.map((conflict, idx) => (
                  <div key={idx} style={{ padding: '0.75rem', border: '1px solid #F59E0B', borderRadius: '0.5rem', backgroundColor: '#FFFBEB' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{conflict.field_name}</span>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                          {conflict.conflicting_values.map((val, vi) => (
                            <span key={vi} style={{ fontSize: '0.75rem', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', backgroundColor: '#FEF3C7', color: '#78350F' }}>
                              {val.source}: {val.value}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => setResolvingConflict(conflict)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #D97706',
                          backgroundColor: 'transparent',
                          color: '#D97706',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#065F46' }}>✅ All conflicts have been resolved.</p>
            )}

            <div style={{ marginTop: '2rem' }}>
              <ConflictHistoryPanel patientId={patientId} />
            </div>

            <div style={{ marginTop: '2rem' }}>
              <AuditLogTimeline patientId={patientId} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
      <ClinicalPatientHeader profile={profile} />

      <ClinicalTabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        conflictCount={totalConflicts}
      />

      {renderTabContent()}

      {resolvingConflict && (
        <ConflictResolutionModal
          conflict={resolvingConflict}
          onResolve={handleResolveConflict}
          onClose={() => setResolvingConflict(null)}
        />
      )}
    </div>
  );
};
