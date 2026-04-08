/**
 * Clinical Tab Navigation Component
 * @module components/clinical-review/ClinicalTabNavigation
 * @description Tab navigation for clinical data review sections
 * @epic EP-006
 * @story US-034
 */

import React from 'react';

export type ClinicalTabId = 'demographics' | 'medical-history' | 'medications' | 'allergies' | 'lab-results' | 'visits' | 'documents' | 'coding' | 'conflicts';

interface ClinicalTabNavigationProps {
  activeTab: ClinicalTabId;
  onTabChange: (tab: ClinicalTabId) => void;
  conflictCount?: number;
}

const CLINICAL_TABS: { id: ClinicalTabId; label: string }[] = [
  { id: 'demographics', label: 'Demographics' },
  { id: 'medical-history', label: 'Medical History' },
  { id: 'medications', label: 'Medications' },
  { id: 'allergies', label: 'Allergies' },
  { id: 'lab-results', label: 'Lab Results' },
  { id: 'visits', label: 'Visits' },
  { id: 'documents', label: 'Documents' },
  { id: 'coding', label: 'Coding' },
  { id: 'conflicts', label: 'Conflicts' },
];

export const ClinicalTabNavigation: React.FC<ClinicalTabNavigationProps> = ({ activeTab, onTabChange, conflictCount }) => {
  return (
    <div role="tablist" aria-label="Clinical review sections" style={{ display: 'flex', gap: '0.25rem', borderBottom: '2px solid #E5E7EB', marginBottom: '1.5rem', overflowX: 'auto' }}>
      {CLINICAL_TABS.map(tab => {
        const isActive = activeTab === tab.id;
        const showBadge = tab.id === 'conflicts' && conflictCount && conflictCount > 0;

        return (
          <button
            key={tab.id}
            id={`clinical-tab-${tab.id}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`clinical-panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
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
            }}
          >
            {tab.label}
            {showBadge && (
              <span style={{
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                borderRadius: '9999px',
                fontSize: '0.6875rem',
                padding: '0.125rem 0.375rem',
                marginLeft: '0.375rem',
                fontWeight: 600,
              }}>
                {conflictCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
