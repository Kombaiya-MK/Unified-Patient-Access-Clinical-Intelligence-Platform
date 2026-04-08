/**
 * Demographics Section Component
 * @module components/patient-profile/DemographicsSection
 * @description Displays and allows editing of patient demographics
 * @epic EP-006
 * @story US-031
 * @task task_001_fe_unified_patient_profile_ui
 */

import React from 'react';
import type { ProfileDemographics } from '../../types/clinicalProfile.types';

interface DemographicsSectionProps {
  demographics: ProfileDemographics;
}

export const DemographicsSection: React.FC<DemographicsSectionProps> = ({ demographics }) => {
  const fields: { label: string; value: string | undefined }[] = [
    { label: 'First Name', value: demographics.first_name },
    { label: 'Last Name', value: demographics.last_name },
    { label: 'MRN', value: demographics.mrn },
    { label: 'Date of Birth', value: demographics.date_of_birth },
    { label: 'Gender', value: demographics.gender },
    { label: 'Address', value: demographics.address },
    { label: 'Phone', value: demographics.phone },
    { label: 'Email', value: demographics.email },
  ];

  return (
    <div role="tabpanel" id="panel-demographics" aria-labelledby="tab-demographics">
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Demographics</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
        {fields.map(field => (
          <div key={field.label} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #E5E7EB' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem', fontWeight: 500 }}>
              {field.label}
            </label>
            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
              {field.value || <span style={{ color: '#9CA3AF' }}>Not available</span>}
            </div>
          </div>
        ))}
      </div>

      {demographics.emergency_contact && (
        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Emergency Contact</h3>
          <div style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #E5E7EB' }}>
            <p style={{ margin: '0.25rem 0' }}><strong>Name:</strong> {demographics.emergency_contact.name}</p>
            <p style={{ margin: '0.25rem 0' }}><strong>Relationship:</strong> {demographics.emergency_contact.relationship}</p>
            <p style={{ margin: '0.25rem 0' }}><strong>Phone:</strong> {demographics.emergency_contact.phone}</p>
          </div>
        </div>
      )}
    </div>
  );
};
