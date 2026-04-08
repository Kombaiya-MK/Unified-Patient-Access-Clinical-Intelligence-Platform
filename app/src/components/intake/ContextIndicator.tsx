/**
 * ContextIndicator Component
 * 
 * File: app/src/components/intake/ContextIndicator.tsx
 * Task: US_027 TASK_003 - Frontend Validation Indicators
 * 
 * Chat footer showing active context fields being "remembered" by the AI.
 */
import React from 'react';

interface ContextIndicatorProps {
  contextFields: string[];
}

const FIELD_LABELS: Record<string, string> = {
  chiefComplaint: 'chief complaint',
  symptoms: 'symptoms',
  medications: 'medications',
  allergies: 'allergies',
  medicalHistory: 'medical history',
  familyHistory: 'family history',
  emergencyContact: 'emergency contact',
  painLevel: 'pain level',
  symptomOnset: 'symptom onset',
};

export const ContextIndicator: React.FC<ContextIndicatorProps> = ({ contextFields }) => {
  if (contextFields.length === 0) return null;

  const maxDisplay = 3;
  const displayFields = contextFields.slice(0, maxDisplay).map(
    (f) => FIELD_LABELS[f] || f,
  );
  const remaining = contextFields.length - maxDisplay;

  return (
    <div
      className="context-indicator"
      style={{
        padding: '6px 16px',
        fontSize: '12px',
        color: '#9ca3af',
        borderTop: '1px solid #f3f4f6',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}
      role="status"
      aria-label={`Remembering: ${contextFields.join(', ')}`}
    >
      <span style={{ opacity: 0.7 }}>🧠</span>
      <span>
        Remembering: {displayFields.join(', ')}
        {remaining > 0 && ` +${remaining} more`}
      </span>
    </div>
  );
};
