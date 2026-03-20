# Task - TASK_004: Frontend Conflict Visualization and Merge Results Display

## Requirement Reference
- User Story: [us_030]
- Story Location: [.propel/context/tasks/us_030/us_030.md]
- Acceptance Criteria:
    - AC1: Display merge status badge showing "Merged from X documents"
    - AC1: Show list of contributing source documents
    - AC1: Highlight conflicting fields with "Resolve Conflict" button
    - AC1: Display merge timeline with document upload dates
- Edge Case:
    - N/A (UI layer)

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-010-clinical-data-review.html |
| **Screen Spec** | .propel/context/docs/figma_spec.md#SCR-010 |
| **UXR Requirements** | AIR-Q02 (>95% deduplication accuracy), UXR-502 (Clear conflict indicators) |
| **Design Tokens** | .propel/context/docs/designsystem.md#colors, #badges, #timeline |

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- **MUST** open and reference the wireframe file/URL during UI implementation
- **MUST** match layout, spacing, typography, and colors from the wireframe
- **MUST** implement all states shown in wireframe (default, hover, focus, error, loading)
- **MUST** validate implementation against wireframe at breakpoints: 375px, 768px, 1440px
- Run `/analyze-ux` after implementation to verify pixel-perfect alignment

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.2.x |
| Frontend | TypeScript | 5.3.x |
| Frontend | Axios | 1.x |
| Frontend | CSS Modules | N/A |
| Frontend | D3.js (timeline) | 7.x |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Create frontend components to visualize merge results and conflicts. Add merge status badge to patient profile header showing "Merged from X documents" with blue info icon, clickable to open source documents panel. Create SourceDocumentsPanel modal displaying list of contributing documents: document type, upload date, extraction confidence, "View Document" link. Add conflict indicators: yellow highlight background on fields with unresolved conflicts, warning triangle icon, tooltip showing conflicting values from different documents, "Resolve Conflict" button opens conflict resolution dialog. Create ConflictResolutionDialog showing side-by-side comparison: left column document A values, right column document B values, confidence scores for each, radio buttons to select which value to keep or "Enter Custom Value" option, "Resolve" button saves decision calling PATCH /api/patients/:id/conflicts/:conflictId/resolve. Create MergeTimeline component using D3.js horizontal timeline: X-axis shows document upload dates, markers for each document with document type icon, tooltip on hover showing document details, current merged state marker at end. Add conflict count badge on patient profile navigation showing number of pending conflicts with yellow indicator. Fetch merge history with GET /api/patients/:id/merge-history and display in audit log table. Fetch conflicts with GET /api/patients/:id/conflicts and display in conflicts list panel.

## Dependent Tasks
- TASK_001: Database Migration (merge tracking data)
- TASK_002: Deduplication Algorithms (confidence scores)
- TASK_003: Merge Service API (endpoints for data)

## Impacted Components
- **CREATE** app/src/components/patient/MergeStatusBadge.tsx - Badge showing merge status with info icon
- **CREATE** app/src/components/patient/SourceDocumentsPanel.tsx - Modal listing contributing documents
- **CREATE** app/src/components/patient/ConflictIndicator.tsx - Yellow highlight for conflicting fields
- **CREATE** app/src/components/patient/ConflictResolutionDialog.tsx - Side-by-side comparison for conflict resolution
- **CREATE** app/src/components/patient/MergeTimeline.tsx - D3.js horizontal timeline of documents
- **CREATE** app/src/components/patient/MergeHistoryLog.tsx - Table of merge audit trail
- **CREATE** app/src/hooks/useMergeData.ts - Custom hook for fetching merge and conflict data
- **MODIFY** app/src/pages/PatientProfilePage.tsx - Integrate merge status and conflict indicators

## Implementation Plan
1. **Install D3.js**: npm install d3@^7.8.5 @types/d3@^7.4.3
2. **Create useMergeData hook**: Implement fetchMergeStatus(patientId) calling patient profile to get merge_status, merged_from_documents, implement fetchMergeHistory(patientId) calling GET /api/patients/:id/merge-history, implement fetchConflicts(patientId) calling GET /api/patients/:id/conflicts, implement resolveConflict(patientId, conflictId, resolution) calling PATCH /api/patients/:id/conflicts/:conflictId/resolve, return {mergeStatus, sourceDocuments, mergeHistory, conflicts, loading, error}
3. **Create MergeStatusBadge.tsx**: Props: mergeStatus, sourceDocumentCount, render badge with text "Merged from {count} documents" if status='Merged', "Has Conflicts" with yellow if status='Has Conflicts', "Single Source" if no merge, blue info icon clickable to open SourceDocumentsPanel, show conflict count badge with yellow indicator if conflicts > 0
4. **Create SourceDocumentsPanel.tsx**: Props: isOpen, sourceDocuments array, onClose, render modal with list of documents, each row shows: document type icon, filename, upload date formatted, extraction confidence percentage, "View Document" button opens document viewer, group by document type, sort by upload date descending
5. **Create ConflictIndicator.tsx**: Props: hasConflict, conflictData {field_name, conflicting_values}, onClick, render yellow highlight wrapper if hasConflict, warning triangle icon inline, tooltip on hover showing conflicting values: "Document A: {value1} ({confidence1}%) | Document B: {value2} ({confidence2}%)", clickable to open ConflictResolutionDialog
6. **Create ConflictResolutionDialog.tsx**: Props: isOpen, conflict {field_name, conflicting_values: [{value, source_document_id, confidence}]}, patientId, onClose, render modal with heading "Resolve Conflict: {field_name}", side-by-side layout: left column first document value with confidence, right column second document value with confidence, radio buttons to select which value to keep, "Enter Custom Value" option with input field, "Resolve" button calls useMergeData.resolveConflict with selected value, "Cancel" button closes, show success toast "Conflict resolved" after save
7. **Create MergeTimeline.tsx**: Props: sourceDocuments sorted by date, use D3.js to create SVG horizontal timeline, X-axis scale using d3.scaleTime with document dates, render circles for each document positioned by date, color-code by document type, show document type icon inside circles, tooltip on hover using native title or custom div showing document details (type, date, confidence), add line connecting all points, add "Current State" marker at end with green checkmark
8. **Create MergeHistoryLog.tsx**: Props: mergeHistory array, render table with columns: Merge Date, Algorithm Version, Source Documents (count), Fields Merged, Conflicts Detected (count), Performed By, expandable row to show detailed merge_decisions JSON, pagination if >20 logs
9. **Modify PatientProfilePage.tsx**: Add MergeStatusBadge in profile header, wrap conflicting fields with ConflictIndicator components (identify from conflicts data), add "Merge History" tab showing MergeHistoryLog, add "Conflicts" tab showing list of conflicts with ConflictResolutionDialog, render MergeTimeline in profile overview section
10. **Add conflict list panel**: Create section showing all pending conflicts, each row: field name, number of conflicting values, "Resolve" button opens ConflictResolutionDialog, filter by resolution_status='Pending'
11. **Add real-time updates**: After conflict resolution or new merge, refetch merge status and conflicts to update UI, show success feedback with toast notification
12. **Styling**: Yellow highlight for conflicts with rgba(255, 193, 7, 0.2) background, warning icons in #FFC107, timeline circles color-coded by document type (Lab: blue, Imaging: purple, Prescription: green, Insurance: orange), responsive layout for mobile

**Focus on how to implement**: Merge badge: `{mergeStatus === 'Merged' && <span className="badge badge-blue">Merged from {sourceDocuments.length} documents <InfoIcon onClick={openPanel} /></span>}`. Conflict indicator: `<div className={hasConflict ? 'field-wrapper conflict-highlight' : 'field-wrapper'} onClick={openDialog}>{hasConflict && <WarningIcon />}<span>{fieldValue}</span></div>`. Conflict dialog: `<RadioGroup value={selectedValue} onChange={setSelectedValue}>{conflictingValues.map(v => <Radio value={v.value}>Document {v.source_document_id}: {v.value} ({v.confidence}%)</Radio>)}<Radio value="custom"><input /></Radio></RadioGroup><Button onClick={handleResolve}>Resolve</Button>`. D3 timeline: `const svg = d3.select(ref.current).append('svg'); const xScale = d3.scaleTime().domain([minDate, maxDate]).range([0, width]); svg.selectAll('circle').data(documents).enter().append('circle').attr('cx', d => xScale(d.date)).attr('cy', height/2).attr('r', 8).attr('fill', d => getColorByType(d.type)).on('mouseover', (e, d) => showTooltip(d));`. Fetch conflicts: `const {conflicts} = useMergeData(patientId); const pendingConflicts = conflicts.filter(c => c.resolution_status === 'Pending');`.

## Current Project State
```
app/
├── src/
│   ├── pages/
│   │   └── PatientProfilePage.tsx (may exist, to be modified)
│   ├── components/
│   │   └── patient/
│   │       ├── MergeStatusBadge.tsx (to be created)
│   │       ├── SourceDocumentsPanel.tsx (to be created)
│   │       ├── ConflictIndicator.tsx (to be created)
│   │       ├── ConflictResolutionDialog.tsx (to be created)
│   │       ├── MergeTimeline.tsx (to be created)
│   │       └── MergeHistoryLog.tsx (to be created)
│   └── hooks/
│       └── useMergeData.ts (to be created)
└── package.json (to be updated with D3.js)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/patient/MergeStatusBadge.tsx | Badge showing merge status with source document count |
| CREATE | app/src/components/patient/SourceDocumentsPanel.tsx | Modal listing contributing documents with details |
| CREATE | app/src/components/patient/ConflictIndicator.tsx | Yellow highlight wrapper for conflicting fields |
| CREATE | app/src/components/patient/ConflictResolutionDialog.tsx | Side-by-side conflict resolution interface |
| CREATE | app/src/components/patient/MergeTimeline.tsx | D3.js horizontal timeline of document history |
| CREATE | app/src/components/patient/MergeHistoryLog.tsx | Audit trail table of merge actions |
| CREATE | app/src/hooks/useMergeData.ts | Hook for fetching merge status, history, and conflicts |
| MODIFY | app/src/pages/PatientProfilePage.tsx | Integrate merge visualization components |
| MODIFY | app/package.json | Add d3 and @types/d3 dependencies |

## External References
- **D3.js**: https://d3js.org/ - Data visualization library for timeline
- **D3 Time Scales**: https://d3js.org/d3-scale/time - Scale for date-based X-axis
- **D3 Selections**: https://d3js.org/d3-selection - DOM manipulation for SVG
- **UXR-502**: Clear conflict indicators - Yellow highlights and warning icons
- **Side-by-Side Comparison UX**: https://www.nngroup.com/articles/comparison-tables/ - Best practices

## Build Commands
- Install dependencies: `cd app && npm install d3@^7.8.5 @types/d3@^7.4.3`
- Build TypeScript: `npm run build` (compile src/ to dist/)
- Run in development: `npm run dev` (start Vite dev server)
- Run tests: `npm test` (unit tests for merge components)
- Type check: `npm run type-check`

## Implementation Validation Strategy
- [x] Reference wireframe at .propel/context/wireframes/Hi-Fi/wireframe-SCR-010-clinical-data-review.html during implementation
- [x] Visual comparison against wireframe at 375px, 768px, 1440px
- [x] Run `/analyze-ux` to validate wireframe alignment
- [x] MergeStatusBadge displays correct text and document count
- [x] Info icon opens SourceDocumentsPanel modal
- [x] SourceDocumentsPanel lists all contributing documents
- [x] ConflictIndicator applies yellow highlight to conflicting fields
- [x] Conflict tooltip shows conflicting values from different documents
- [x] ConflictResolutionDialog displays side-by-side comparison
- [x] Radio buttons allow selecting which value to keep
- [x] Custom value input option works correctly
- [x] "Resolve" button saves decision and updates UI
- [x] MergeTimeline renders horizontal timeline with D3.js
- [x] Timeline markers color-coded by document type
- [x] Timeline tooltips show document details on hover
- [x] MergeHistoryLog displays audit trail in table format
- [x] Expandable rows show detailed merge decisions
- [x] Conflict count badge shows pending conflicts
- [x] After resolution, conflicts list updates in real-time

## Implementation Checklist
- [ ] Reference wireframe at .propel/context/wireframes/Hi-Fi/wireframe-SCR-010-clinical-data-review.html during implementation
- [ ] Install dependencies: npm install d3@^7.8.5 @types/d3@^7.4.3
- [ ] Create app/src/hooks/useMergeData.ts (fetchMergeStatus from patient profile merge_status/merged_from_documents, fetchMergeHistory calling GET /api/patients/:id/merge-history, fetchConflicts calling GET /api/patients/:id/conflicts, resolveConflict calling PATCH /api/patients/:id/conflicts/:conflictId/resolve with selected value, return state and functions)
- [ ] Create app/src/components/patient/MergeStatusBadge.tsx (props: mergeStatus, sourceDocumentCount, conflictCount, render badge text based on status: 'Merged from X documents' blue or 'Has Conflicts' yellow, info icon clickable, conflict count badge with yellow indicator if >0)
- [ ] Create app/src/components/patient/SourceDocumentsPanel.tsx (props: isOpen, sourceDocuments, onClose, render modal with list: document type icon, filename, upload date formatted, extraction confidence %, View Document button, group by type, sort by date DESC)
- [ ] Create app/src/components/patient/ConflictIndicator.tsx (props: hasConflict, conflictData, onClick, render wrapper div with yellow background rgba(255,193,7,0.2) if conflict, warning triangle icon, tooltip showing conflicting values with confidence scores, clickable to open resolution dialog)
- [ ] Create app/src/components/patient/ConflictResolutionDialog.tsx (props: isOpen, conflict with field_name and conflicting_values array, patientId, onClose, render modal with heading Resolve Conflict: {field_name}, side-by-side layout left/right columns, radio buttons for each value with confidence, Enter Custom Value option with input, Resolve button calls resolveConflict, Cancel button, success toast after save)
- [ ] Create app/src/components/patient/MergeTimeline.tsx (props: sourceDocuments sorted by date, use D3.js create SVG, d3.scaleTime for X-axis with dates, render circles for each document positioned by date, color by type: Lab blue, Imaging purple, Prescription green, Insurance orange, tooltip on hover with document details, connecting line, Current State marker at end with green checkmark)
- [ ] Create app/src/components/patient/MergeHistoryLog.tsx (props: mergeHistory array, render table columns: Merge Date, Algorithm Version, Source Documents count, Fields Merged list, Conflicts Detected count, Performed By, expandable row showing merge_decisions JSON, pagination if >20)
- [ ] Modify app/src/pages/PatientProfilePage.tsx (add MergeStatusBadge in profile header, wrap conflicting fields with ConflictIndicator, add Merge History tab with MergeHistoryLog, add Conflicts tab with pending conflicts list, render MergeTimeline in overview section, use useMergeData hook)
- [ ] Create conflict list panel component (section showing pending conflicts: field name, conflicting values count, Resolve button per row, filter resolution_status='Pending', onClick opens ConflictResolutionDialog with conflict data)
- [ ] Add real-time updates (after resolveConflict success: refetch merge status and conflicts, show success toast "Conflict resolved successfully", update conflict count badge, remove resolved conflict from list)
- [ ] Add CSS styling (conflict highlight: background rgba(255,193,7,0.2), warning icon color #FFC107, timeline circles color-coded, responsive layout for mobile <768px stack side-by-side to vertical)
- [ ] Write unit tests (test MergeStatusBadge renders correct text, test ConflictIndicator applies yellow highlight, test ConflictResolutionDialog radio selection, test MergeTimeline D3 rendering, test resolveConflict API call, test real-time updates after resolution)
