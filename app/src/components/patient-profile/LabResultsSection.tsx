/**
 * Lab Results Section Component
 * @module components/patient-profile/LabResultsSection
 * @description Displays lab test results with abnormal value highlighting
 * @epic EP-006
 * @story US-031
 * @task task_001_fe_unified_patient_profile_ui
 */

import React from 'react';
import type { ProfileLabResult } from '../../types/clinicalProfile.types';

interface LabResultsSectionProps {
  labResults: ProfileLabResult[];
}

export const LabResultsSection: React.FC<LabResultsSectionProps> = ({ labResults }) => {
  const getAbnormalStyle = (flag?: string) => {
    switch (flag) {
      case 'Critical': return { backgroundColor: '#FEE2E2', color: '#991B1B' };
      case 'High':
      case 'Low': return { backgroundColor: '#FEF3C7', color: '#92400E' };
      default: return {};
    }
  };

  return (
    <div role="tabpanel" id="panel-lab-results" aria-labelledby="tab-lab-results">
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Lab Results</h2>

      {labResults.length === 0 ? (
        <p style={{ color: '#6B7280' }}>No lab results available.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E5E7EB', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>Date</th>
                <th style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>Test Name</th>
                <th style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>Value</th>
                <th style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>Reference Range</th>
                <th style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {labResults.map((result, index) => {
                const abnormalStyle = getAbnormalStyle(result.abnormal_flag);
                return (
                  <tr key={`${result.test_name}-${index}`} style={{ borderBottom: '1px solid #F3F4F6', ...abnormalStyle }}>
                    <td style={{ padding: '0.5rem', fontSize: '0.875rem' }}>{result.date}</td>
                    <td style={{ padding: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>{result.test_name}</td>
                    <td style={{ padding: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>{result.value}</td>
                    <td style={{ padding: '0.5rem', fontSize: '0.875rem', color: '#6B7280' }}>{result.reference_range}</td>
                    <td style={{ padding: '0.5rem' }}>
                      {result.abnormal_flag && result.abnormal_flag !== 'Normal' ? (
                        <span style={{
                          padding: '0.125rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          ...getAbnormalStyle(result.abnormal_flag),
                        }}>
                          {result.abnormal_flag}
                        </span>
                      ) : (
                        <span style={{ color: '#065F46', fontSize: '0.75rem' }}>Normal</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
