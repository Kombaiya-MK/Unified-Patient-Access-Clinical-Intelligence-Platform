/**
 * DataSummaryPanel Component
 * 
 * File: app/src/components/intake/DataSummaryPanel.tsx
 * Task: US_025 TASK_003 - Frontend AI Chat Interface
 * 
 * Right panel showing extracted data summary and progress.
 * Highlights newly validated fields with glow animation.
 */
import React, { useState, useEffect, useRef } from 'react';
import type { ExtractedIntakeData, IntakeProgress } from '../../types/aiIntake.types';

interface DataSummaryPanelProps {
  extractedData: ExtractedIntakeData;
  progress: IntakeProgress;
}

const SECTION_LABELS: Record<string, string> = {
  chief_complaint: 'Chief Complaint',
  symptom_details: 'Symptom Details',
  medications: 'Medications',
  allergies: 'Allergies',
  medical_history: 'Medical History',
  family_history: 'Family History',
  emergency_contact: 'Emergency Contact',
};

export const DataSummaryPanel: React.FC<DataSummaryPanelProps> = ({
  extractedData,
  progress,
}) => {
  const [highlightedFields, setHighlightedFields] = useState<Set<string>>(new Set());
  const prevDataRef = useRef<string>('');

  // Detect newly validated fields and highlight them
  useEffect(() => {
    const currentKeys = Object.keys(extractedData).filter(
      (k) => extractedData[k] !== undefined && extractedData[k] !== null,
    );
    const serialized = currentKeys.join(',');

    if (serialized !== prevDataRef.current && prevDataRef.current !== '') {
      const prevKeys = new Set(prevDataRef.current.split(','));
      const newKeys = currentKeys.filter((k) => !prevKeys.has(k));
      if (newKeys.length > 0) {
        setHighlightedFields(new Set(newKeys));
        setTimeout(() => setHighlightedFields(new Set()), 1500);
      }
    }
    prevDataRef.current = serialized;
  }, [extractedData]);

  return (
    <div
      className="data-summary-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px',
        backgroundColor: '#ffffff',
        borderLeft: '1px solid #e5e7eb',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {/* Progress Bar */}
      <div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
          Intake Progress
        </h3>
        <div
          style={{
            height: '8px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
          role="progressbar"
          aria-valuenow={progress.percentComplete}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Intake ${progress.percentComplete}% complete`}
        >
          <div
            style={{
              height: '100%',
              width: `${progress.percentComplete}%`,
              backgroundColor: '#10b981',
              borderRadius: '4px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <span style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
          {progress.completedSections.length} of {progress.totalSections} sections complete
        </span>
      </div>

      {/* Section Checklist */}
      <div>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
          Sections
        </h4>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {Object.entries(SECTION_LABELS).map(([key, label]) => {
            const isCompleted = progress.completedSections.includes(key);
            return (
              <li
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 0',
                  fontSize: '13px',
                  color: isCompleted ? '#059669' : '#9ca3af',
                }}
              >
                <span>{isCompleted ? '✓' : '○'}</span>
                <span>{label}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Extracted Data Summary */}
      <div>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
          Collected Information
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {extractedData.chiefComplaint && (
            <SummaryField
              label="Chief Complaint"
              value={extractedData.chiefComplaint}
              highlighted={highlightedFields.has('chiefComplaint')}
            />
          )}
          {extractedData.symptoms && extractedData.symptoms.length > 0 && (
            <SummaryField
              label="Symptoms"
              value={extractedData.symptoms.join(', ')}
              highlighted={highlightedFields.has('symptoms')}
            />
          )}
          {extractedData.painLevel !== undefined && (
            <SummaryField
              label="Pain Level"
              value={`${extractedData.painLevel}/10`}
              highlighted={highlightedFields.has('painLevel')}
            />
          )}
          {extractedData.medications && extractedData.medications.length > 0 && (
            <SummaryField
              label="Medications"
              value={extractedData.medications.map((m) => m.name).join(', ')}
              highlighted={highlightedFields.has('medications')}
            />
          )}
          {extractedData.allergies && extractedData.allergies.length > 0 && (
            <SummaryField
              label="Allergies"
              value={extractedData.allergies.map((a) => a.allergen).join(', ')}
              highlighted={highlightedFields.has('allergies')}
            />
          )}
          {extractedData.medicalHistory && extractedData.medicalHistory.length > 0 && (
            <SummaryField
              label="Medical History"
              value={extractedData.medicalHistory.join(', ')}
              highlighted={highlightedFields.has('medicalHistory')}
            />
          )}
          {extractedData.emergencyContact?.name && (
            <SummaryField
              label="Emergency Contact"
              value={`${extractedData.emergencyContact.name}${extractedData.emergencyContact.phone ? ` - ${extractedData.emergencyContact.phone}` : ''}`}
              highlighted={highlightedFields.has('emergencyContact')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const SummaryField: React.FC<{ label: string; value: string; highlighted: boolean }> = ({
  label,
  value,
  highlighted,
}) => (
  <div
    style={{
      padding: '8px 12px',
      backgroundColor: highlighted ? '#fef9c3' : '#f9fafb',
      borderRadius: '8px',
      borderLeft: '3px solid #10b981',
      transition: 'background-color 0.3s ease',
    }}
  >
    <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
      {label}
    </div>
    <div style={{ fontSize: '13px', color: '#1f2937', marginTop: '2px' }}>{value}</div>
  </div>
);
