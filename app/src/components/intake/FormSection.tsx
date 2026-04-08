/**
 * FormSection Component
 * 
 * File: app/src/components/intake/FormSection.tsx
 * Task: US_026 TASK_002 - Frontend Manual Form with Sections
 * 
 * Collapsible accordion section for manual intake form.
 */
import React, { useState } from 'react';

interface FormSectionProps {
  title: string;
  isCompleted: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  isCompleted,
  defaultOpen = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className="form-section"
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        marginBottom: '12px',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '14px 16px',
          border: 'none',
          backgroundColor: isCompleted ? '#f0fdf4' : '#f9fafb',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 600,
          color: '#1f2937',
          textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: isCompleted ? '#10b981' : '#9ca3af', fontSize: '16px' }}>
            {isCompleted ? '✓' : '○'}
          </span>
          {title}
        </span>
        <span style={{ fontSize: '12px', color: '#6b7280', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
          {children}
        </div>
      )}
    </div>
  );
};
