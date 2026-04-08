/**
 * ClarificationBadge Component
 * 
 * File: app/src/components/intake/ClarificationBadge.tsx
 * Task: US_027 TASK_003 - Frontend Validation Indicators
 * 
 * Yellow badge shown on AI messages that contain clarifying questions.
 */
import React from 'react';

export const ClarificationBadge: React.FC = () => (
  <span
    className="clarification-badge"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 8px',
      backgroundColor: '#fef3c7',
      color: '#92400e',
      borderRadius: '10px',
      fontSize: '11px',
      fontWeight: 600,
    }}
    role="status"
    aria-label="Clarification needed"
  >
    <span>ℹ</span> Clarification needed
  </span>
);
