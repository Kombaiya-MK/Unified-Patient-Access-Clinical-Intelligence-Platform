# Task - TASK_001_FE_UNIFIED_PATIENT_PROFILE_UI

## Requirement Reference
- User Story: US_031
- Story Location: `.propel/context/tasks/us_031/us_031.md`
- Acceptance Criteria:
    - AC1: Unified profile aggregates data from all sources (intake, documents, manual), displays in sections (Demographics, Chief Complaint, Medical History with dates, Current Medications with last updated, Allergies with severity, Lab Results with trends), highlights conflicts in yellow, shows confidence scores for AI fields, displays "Last Updated" per section
- Edge Cases:
    - No documents: Show intake data only, "No documents uploaded" notice with "Upload" button
    - Outdated records: Medication >1 year → "Outdated?" warning
    - Critical mismatch: Multiple DOBs → red alert "Critical: DOB mismatch"

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-010 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-010-clinical-data-review.html |
| **Screen Spec** | SCR-010 (Clinical Data Review - unified profile view) |
| **UXR Requirements** | AIR-S01 (Conflict detection >95%), UXR-002 (Clear visual hierarchy), UXR-502 (Clear conflict indicators) |
| **Design Tokens** | Profile header: #F5F5F5 bg, Section headers: #1976D2 blue, Conflict: #FFF9C4 yellow bg, Confidence: green >90%, yellow 80-90%, red <80%, Outdated warning: #FF9800 orange, Critical alert: #DC3545 red banner |

> **Wireframe Components:**
> - Profile header: Patient photo, name, MRN, DOB, age, last visit, "Last Updated: [timestamp]"
> - Section tabs: Demographics, Medical History, Medications, Allergies, Lab Results, Visits, Documents
> - Conflict highlighting: Yellow background + "View Sources" dropdown showing conflicting values
> - Data source indicators: Small document icon next to each data point, tooltip shows source + extraction date
> - Lab results timeline: Trend lines (e.g., HbA1c over time), historical medication changes on timeline
> - Confidence badges: AI-extracted data shows confidence % with color coding

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | React | 18.2.x |
| Frontend | TypeScript | 5.3.x |
| Frontend | recharts | 2.x (Lab trend graphs) |
| Backend | Express | 4.x |
| Database | PostgreSQL | 16.x |
| AI/ML | N/A | N/A |

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No (Display AI-extracted data with confidence scores) |
| **AIR Requirements** | AIR-S01 (Conflict detection >95%), AIR-003 (Profile synthesis) |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | Yes (Responsive tabs, stacked sections) |
| **Platform Target** | Web |
| **Min OS Version** | iOS 14+, Android 10+ |
| **Mobile Framework** | React |

## Task Overview
Implement unified patient profile UI: (1) ClinicalDataReview page with tabbed sections, (2) Aggregate data from GET /api/patients/:id/profile (merges intake + documents + manual entries), (3) Profile header with patient photo, name, MRN, DOB, age, last visit date, "Last Updated" timestamp, (4) Sections: Demographics (name, DOB, phone, address), Medical History (conditions with diagnosis dates), Current Medications (name, dosage, frequency, last updated), Allergies (allergen, reaction, severity), Lab Results (table + trend graphs with recharts), Visits (past appointments), Documents (uploaded documents list), (5) Conflict highlighting with "View Sources" dropdown, (6) Data source indicators (document icon + tooltip), (7) Confidence badges for AI-extracted data (green >90%, yellow 80-90%, red <80%), (8) Outdated warnings (medications >1 year), (9) Critical alerts (DOB mismatch red banner), (10) WCAG AA compliant.

## Dependent Tasks
- US_030 Task 001: Deduplication service (provides merged data)
- US_031 Task 002: Profile aggregation API (GET /api/patients/:id/profile)

## Impacted Components
**New:**
- app/src/pages/ClinicalDataReview.tsx (Unified profile page)
- app/src/components/ProfileHeader.tsx (Patient summary header)
- app/src/components/ProfileSection.tsx (Reusable section component)
- app/src/components/LabResultsChart.tsx (Trend graph with recharts)
- app/src/components/DataSourceIndicator.tsx (Document icon + tooltip)
- app/src/components/ConfidenceBadge.tsx (AI confidence indicator)
- app/src/components/ConflictDropdown.tsx ("View Sources" dropdown)
- app/src/hooks/usePatientProfile.ts (Fetch profile data)

## Implementation Plan
1. Install recharts: npm install recharts
2. Create usePatientProfile hook: Fetch GET /api/patients/:id/profile, returns {demographics, medicalHistory, medications, allergies, labResults, visits, documents, conflicts[]}
3. Implement ProfileHeader: Display photo (or initials avatar), name, MRN, DOB, calculated age, last visit date, "Last Updated" timestamp (max of all section timestamps)
4. Implement ProfileSection: Reusable component with section tabs (Demographics, Medical History, etc.), each section shows relevant data with source indicators
5. Demographics section: Name, DOB (with conflict highlighting if mismatched), phone, email, address
6. Medical History: Conditions list with diagnosis dates, timeline view option
7. Current Medications: Table with name, dosage, frequency, start date, "Last Updated" date, outdated warning if >1 year
8. Allergies: List with allergen, reaction type, severity (mild/moderate/severe)
9. Lab Results: Table with test name, value, unit, reference range, date, trend indicator (↑↓), LabResultsChart with recharts line graph for historical values
10. Conflicts: Yellow background on conflicting fields, ConflictDropdown shows "View Sources" → lists values from each document
11. Data source indicators: DataSourceIndicator (document icon) with tooltip "From [document name] on [date]"
12. Confidence badges: ConfidenceBadge (green/yellow/red) shows confidence % for AI-extracted fields
13. Outdated warnings: If medication.lastUpdated < NOW() - 1 year, show orange "Outdated?" badge
14. Critical alerts: If DOB conflict, show red banner at top "Critical: Date of birth mismatch across documents. Click to resolve."
15. Responsive: Mobile → tabs become accordion, sections stack vertically

## Current Project State
```
ASSIGNMENT/app/src/
├── pages/ (dashboard exists)
└── (clinical data review to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/pages/ClinicalDataReview.tsx | Unified profile page |
| CREATE | app/src/components/ProfileHeader.tsx | Patient header |
| CREATE | app/src/components/ProfileSection.tsx | Section component |
| CREATE | app/src/components/LabResultsChart.tsx | Trend graph |
| CREATE | app/src/components/DataSourceIndicator.tsx | Source icon + tooltip |
| CREATE | app/src/components/ConfidenceBadge.tsx | AI confidence badge |
| CREATE | app/src/components/ConflictDropdown.tsx | View sources dropdown |
| CREATE | app/src/hooks/usePatientProfile.ts | Profile data hook |
| UPDATE | app/package.json | Add recharts |

## External References
- [recharts Documentation](https://recharts.org/)
- [React Tabs](https://www.npmjs.com/package/react-tabs)
- [AIR-003 Profile Synthesis](../../../.propel/context/docs/spec.md#AIR-003)
- [AIR-S01 Conflict Detection >95%](../../../.propel/context/docs/spec.md#AIR-S01)
- [UC-010 View Unified Profile](../../../.propel/context/docs/spec.md#UC-010)

## Build Commands
```bash
cd app
npm install recharts react-tabs
npm run dev
```

## Implementation Validation Strategy
- [ ] Unit tests: ProfileHeader calculates age correctly from DOB
- [ ] Integration tests: Fetch profile → displays aggregated data
- [ ] recharts installed: package.json shows recharts@2.x
- [ ] Profile page renders: Navigate to /patients/:id/profile → see unified view
- [ ] Profile header: Shows photo, name, MRN, DOB, age, last visit
- [ ] Section tabs: Click "Medications" → displays current medications
- [ ] Demographics section: Shows name, DOB, phone, address
- [ ] Medical history: Lists conditions with diagnosis dates
- [ ] Medications table: Shows name, dosage, frequency, last updated date
- [ ] Allergies list: Shows allergen, reaction, severity
- [ ] Lab results table: Shows test name, value, unit, reference range
- [ ] Lab trend graph: HbA1c results plotted on line chart over time
- [ ] Conflict highlighting: DOB field has yellow background if multiple values exist
- [ ] View sources: Click "View Sources" → dropdown shows "Doc1: 1990-01-15, Doc2: 1989-01-15"
- [ ] Data source indicator: Hover document icon → tooltip "From Lab Results #3 on 2025-01-10"
- [ ] Confidence badge: AI-extracted field shows "92%" green badge
- [ ] Outdated warning: Medication from 2022 → shows orange "Outdated?" badge
- [ ] Critical alert: Multiple DOBs → red banner "Critical: DOB mismatch"
- [ ] Responsive: Mobile → sections stack, tabs become accordion
- [ ] WCAG AA: Keyboard navigation, ARIA labels, 4.5:1 contrast

## Implementation Checklist
- [ ] Install recharts + react-tabs: `npm install recharts react-tabs`
- [ ] Create usePatientProfile.ts hook
- [ ] Implement ProfileHeader.tsx component
- [ ] Implement ProfileSection.tsx with tabs
- [ ] Create LabResultsChart.tsx with recharts
- [ ] Create DataSourceIndicator.tsx + tooltip
- [ ] Create ConfidenceBadge.tsx component
- [ ] Create ConflictDropdown.tsx component
- [ ] Create ClinicalDataReview.tsx page
- [ ] Add routing: /patients/:id/profile → ClinicalDataReview
- [ ] Test profile display with conflicts
- [ ] Validate WCAG AA compliance
- [ ] Document unified profile in app/README.md
