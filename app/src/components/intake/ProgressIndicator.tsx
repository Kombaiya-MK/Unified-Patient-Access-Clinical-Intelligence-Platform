/**
 * ProgressIndicator Component
 * 
 * File: app/src/components/intake/ProgressIndicator.tsx
 * Task: US_025 TASK_003 - Frontend AI Chat Interface
 * 
 * Horizontal progress bar for intake completion.
 */
import React from 'react';
import type { IntakeProgress } from '../../types/aiIntake.types';

interface ProgressIndicatorProps {
  progress: IntakeProgress;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ progress }) => {
  const { percentComplete, completedSections, totalSections } = progress;

  return (
    <div
      className="progress-indicator"
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>
          Intake Progress
        </span>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>
          {completedSections.length}/{totalSections} sections
        </span>
      </div>
      <div
        style={{
          height: '6px',
          backgroundColor: '#e5e7eb',
          borderRadius: '3px',
          overflow: 'hidden',
        }}
        role="progressbar"
        aria-valuenow={percentComplete}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Intake ${percentComplete}% complete`}
      >
        <div
          style={{
            height: '100%',
            width: `${percentComplete}%`,
            backgroundColor: percentComplete === 100 ? '#10b981' : '#2563eb',
            borderRadius: '3px',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  );
};
