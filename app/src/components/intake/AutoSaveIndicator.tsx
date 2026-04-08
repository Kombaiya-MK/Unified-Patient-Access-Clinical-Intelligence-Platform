/**
 * AutoSaveIndicator Component
 * 
 * File: app/src/components/intake/AutoSaveIndicator.tsx
 * Task: US_026 TASK_002 - Frontend Manual Form with Sections
 * 
 * Small indicator showing auto-save status.
 */
import React from 'react';

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSavedAt: string | null;
  error: string | null;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  isSaving,
  lastSavedAt,
  error,
}) => {
  let text: string;
  let color: string;

  if (error) {
    text = 'Save failed';
    color = '#ef4444';
  } else if (isSaving) {
    text = 'Saving...';
    color = '#6b7280';
  } else if (lastSavedAt) {
    const time = new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    text = `Saved at ${time}`;
    color = '#10b981';
  } else {
    text = 'Not saved yet';
    color = '#9ca3af';
  }

  return (
    <div
      className="auto-save-indicator"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        color,
      }}
      role="status"
      aria-live="polite"
    >
      <span style={{ fontSize: '10px' }}>
        {error ? '✕' : isSaving ? '↻' : lastSavedAt ? '✓' : '○'}
      </span>
      <span>{text}</span>
    </div>
  );
};
