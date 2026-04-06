/**
 * Profile Tabs Component
 * @module components/patient-profile/ProfileTabs
 * @description Tab navigation for unified patient profile sections
 * @epic EP-006
 * @story US-031
 * @task task_001_fe_unified_patient_profile_ui
 */

import React from 'react';

export type ProfileTabId = 'demographics' | 'medical-history' | 'medications' | 'allergies' | 'lab-results' | 'visits' | 'documents' | 'coding';

interface ProfileTabsProps {
  activeTab: ProfileTabId;
  onTabChange: (tab: ProfileTabId) => void;
  conflictCounts?: Record<string, number>;
}

const TABS: { id: ProfileTabId; label: string }[] = [
  { id: 'demographics', label: 'Demographics' },
  { id: 'medical-history', label: 'Medical History' },
  { id: 'medications', label: 'Medications' },
  { id: 'allergies', label: 'Allergies' },
  { id: 'lab-results', label: 'Lab Results' },
  { id: 'visits', label: 'Visits' },
  { id: 'documents', label: 'Documents' },
  { id: 'coding', label: 'Coding' },
];

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, onTabChange, conflictCounts }) => {
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight' && index < TABS.length - 1) {
      onTabChange(TABS[index + 1].id);
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      onTabChange(TABS[index - 1].id);
    }
  };

  return (
    <div role="tablist" aria-label="Profile sections" style={{ display: 'flex', gap: '0.25rem', borderBottom: '2px solid #E5E7EB', marginBottom: '1.5rem', overflowX: 'auto' }}>
      {TABS.map((tab, index) => {
        const count = conflictCounts?.[tab.id] || 0;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            style={{
              padding: '0.75rem 1rem',
              border: 'none',
              borderBottom: isActive ? '2px solid #2563EB' : '2px solid transparent',
              background: 'none',
              color: isActive ? '#2563EB' : '#6B7280',
              fontWeight: isActive ? 600 : 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontSize: '0.875rem',
              position: 'relative',
            }}
          >
            {tab.label}
            {count > 0 && (
              <span
                style={{
                  backgroundColor: '#F59E0B',
                  color: '#FFFFFF',
                  borderRadius: '9999px',
                  fontSize: '0.6875rem',
                  padding: '0.125rem 0.375rem',
                  marginLeft: '0.375rem',
                  fontWeight: 600,
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
