# Task - TASK_003: Frontend Conflict Resolution Interface with Diff View

## Requirement Reference
- User Story: [us_034]
- Story Location: [.propel/context/tasks/us_034/us_034.md]
- Acceptance Criteria:
    - AC2: Conflicting data highlighted in yellow with diff view showing source documents
    - AC2: "Resolve Conflict" action to manually select correct value
- Edge Case:
    - EC2: Different document formats handled by extraction
    - EC3: AI confidence <90% marked "Needs Review"
    - EC4: Historical versions tracked via audit log
- UXR Compliance:
    - UXR-WCAG-A01: WCAG AA compliance
    - UXR-ALERT-C01: Sufficient contrast for conflict highlights

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | Available |
| **Wireframe Type** | Hi-Fi HTML Wireframe |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-010-clinical-data-review.html |
| **Screen Spec** | SCR-010 |
| **UXR Requirements** | UXR-WCAG-A01, UXR-ALERT-C01 |
| **Design Tokens** | N/A |

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.2.x |
| Frontend | TypeScript | 5.3.x |
| Text Diff | react-diff-viewer | 3.x |
| Date Handling | date-fns | 3.x |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | AIR-O02 (human override capability) |
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
Create conflict resolution interface enhancing Clinical Data Review page from task_002. Highlight conflicting data fields with yellow background (WCAG AA compliant). Add conflict indicator icon (warning triangle) next to field label when conflicts exist. Implement ConflictResolutionModal showing side-by-side diff view of conflicting values. Use react-diff-viewer library for text comparison. Display source document metadata for each version: document name, upload date, extraction confidence. Show "Resolve Conflict" button opening modal. Modal has three sections: 1) Field name and conflict description, 2) Side-by-side comparison of all conflicting values with radio buttons to select correct version, 3) Resolution form with notes textarea and "Confirm Resolution" button. Support conflict types: Simple (2 values), Multiple (>2 values), Complex (structured data like medications with multiple fields). For complex conflicts show table comparison row-by-row. Allow manual entry option if none of the extracted values are correct. After resolution POST to /api/patients/:id/conflicts/:fieldName/resolve with selected_value and resolution_notes. Update unified profile immediately without full page reload. Log resolution to audit trail. Show conflict resolution count in tab badges. Integrate with audit log timeline showing historical conflict resolutions with staff name and timestamp. Add toast notification "Conflict resolved successfully". Filter conflicts by: All, Pending, Resolved. Sort by: Field Name, Severity. Keyboard shortcut C to open next pending conflict. Track resolution progress: "5 of 12 conflicts resolved". WCAG AA compliant with sufficient contrast and keyboard navigation per UXR-WCAG-A01.

## Dependent Tasks
- US-034 task_001: Backend conflict resolution API
- US-034 task_002: Clinical Data Review page layout

## Impacted Components
- **CREATE** app/src/components/clinical-review/ConflictIndicator.tsx - Yellow highlight and icon
- **CREATE** app/src/components/clinical-review/ConflictResolutionModal.tsx - Diff view modal
- **CREATE** app/src/components/clinical-review/ConflictDiffView.tsx - Side-by-side comparison
- **CREATE** app/src/components/clinical-review/ConflictResolutionForm.tsx - Resolution form
- **CREATE** app/src/components/clinical-review/ConflictFilter.tsx - Filter and sort controls
- **CREATE** app/src/components/clinical-review/ConflictProgress.tsx - Resolution progress bar
- **CREATE** app/src/components/clinical-review/AuditLogTimeline.tsx - Historical resolutions
- **CREATE** app/src/hooks/useConflictResolution.ts - Resolution logic
- **MODIFY** app/src/components/clinical-review/DemographicsTab.tsx - Add conflict indicators
- **MODIFY** app/src/components/clinical-review/MedicalHistoryTab.tsx - Add conflict indicators
- **MODIFY** app/src/components/clinical-review/MedicationsTab.tsx - Add conflict indicators
- **MODIFY** app/src/components/clinical-review/AllergiesTab.tsx - Add conflict indicators

## Implementation Plan
1. **Create ConflictIndicator.tsx**: Accept {fieldName, conflicts, onResolve} props, render yellow highlight background: `backgroundColor: '#fef3c7'` with WCAG AA contrast, warning triangle icon next to field label, show conflict count badge if multiple values, onClick open ConflictResolutionModal, tooltip on hover: "Click to resolve conflict"
2. **Create ConflictResolutionModal.tsx**: Accept {isOpen, onClose, conflict: {field_name, conflicting_values: [{value, source_document_id, confidence, extracted_date}], resolution_status}, onResolve} props, render modal with three sections: header with field name and description, diff view section, resolution form section, use React state for selected value and notes, submit calls useConflictResolution hook
3. **Create ConflictDiffView.tsx**: Accept {conflicting_values} props, use react-diff-viewer library for text comparison, if conflicting_values.length === 2 render side-by-side diff, if >2 values render list view with radio buttons, for each value show: value text, source document name with link, extraction date formatted with date-fns, confidence percentage with StatusBadge, radio button to select, highlight differences in yellow
4. **Create ConflictResolutionForm.tsx**: Accept {conflictingValues, onSubmit} props, render radio group for selecting value, include "Manual Entry" option with text input, required resolution_notes textarea min 10 characters, "Confirm Resolution" button disabled until selection and notes provided, show confirmation: "Are you sure? This will update the patient profile.", keyboard accessible
5. **Create useConflictResolution.ts hook**: Export useConflictResolution() hook: const resolveConflict = async (patientId, fieldName, selectedValue, resolutionNotes) => {const response = await axios.patch(\`/api/patients/\${patientId}/conflicts/\${fieldName}/resolve\`, {selected_value: selectedValue, resolution_notes: resolutionNotes, resolved_by_staff_id: currentStaffId}); return response.data;}, use React Query useMutation with onSuccess: invalidate clinicalProfile cache, show toast notification, optimistic update, onError: rollback, show error toast, return {resolveConflict, isLoading, error}
6. **Create ConflictFilter.tsx**: Render filter controls: dropdown "Filter by: All | Pending | Resolved", dropdown "Sort by: Field Name | Severity", search input to filter by field name, show conflict count: "{filteredCount} of {totalCount} conflicts", apply filters to conflicts list
7. **Create ConflictProgress.tsx**: Accept {totalConflicts, resolvedConflicts} props, render progress bar showing percentage: `{resolvedConflicts} of {totalConflicts} resolved`, progress bar visual with green fill: `width: ${(resolvedConflicts / totalConflicts) * 100}%`, show message "All conflicts resolved! ✓" when complete
8. **Create AuditLogTimeline.tsx**: Accept {patientId} props, fetch GET /api/patients/:id/clinical-profile/history, render timeline of conflict resolutions: timestamp formatted, field name, previous value → new value, resolved by staff name, resolution notes, expandable for details, use timeline library or custom CSS, sort by most recent first
9. **Modify DemographicsTab.tsx**: For each field check if profile.conflicts includes conflict for that field, if yes render ConflictIndicator wrapping the field, pass conflict data and resolve handler
10. **Modify MedicalHistoryTab.tsx**: Same as Demographics - wrap conflicting fields with ConflictIndicator
11. **Modify MedicationsTab.tsx**: Same - wrap conflicting medication entries with ConflictIndicator, show warning icon in table row
12. **Modify AllergiesTab.tsx**: Same - wrap conflicting allergy entries with ConflictIndicator
13. **Add conflict tab badges**: In TabNavigation.tsx show badge with pending conflict count: "Medical History (3)" if 3 conflicts in that section
14. **Add keyboard shortcut**: In ClinicalDataReview.tsx add useEffect for Ctrl+C or just C key: find first pending conflict, open ConflictResolutionModal automatically, cycle through conflicts with repeated C presses
15. **Add toast notifications**: Use toast library (react-hot-toast or similar), show "Conflict resolved successfully ✓", show "Error resolving conflict" on failure, show "All conflicts resolved!" when complete
16. **Complex conflict handling**: For structured data (medications with name/dosage/frequency), render table comparison showing each field in columns, allow field-by-field selection or select entire row
17. **Testing**: Test conflict indicators display correctly, test ConflictResolutionModal opens and shows diff view, test resolution updates profile, test audit log shows resolved conflicts, test filter and sort, test keyboard shortcuts, test progress bar updates, test WCAG AA compliance

**Focus on how to implement**: Conflict indicator: `const ConflictIndicator = ({fieldName, conflicts, children}) => { const handleClick = () => setModalOpen(true); return <div className="conflict-field" style={{backgroundColor: '#fef3c7', padding: '8px', borderRadius: '4px', position: 'relative'}} onClick={handleClick}><WarningIcon className="conflict-icon" />{children}<span className="conflict-badge">{conflicts.length} conflicts</span></div>; };`. Diff view: `import ReactDiffViewer from 'react-diff-viewer'; const ConflictDiffView = ({conflictingValues}) => { const [oldValue, newValue] = conflictingValues; return <ReactDiffViewer oldValue={oldValue.value} newValue={newValue.value} splitView={true} showDiffOnly={false} leftTitle={\`\${oldValue.source_document_name} (\${formatDate(oldValue.extracted_date)})\`} rightTitle={\`\${newValue.source_document_name}\`} />; };`. Resolution: `const {resolveConflict, isLoading} = useConflictResolution(); const handleResolve = async () => { await resolveConflict(patientId, fieldName, selectedValue, notes); toast.success('Conflict resolved'); onClose(); refetchProfile(); };`. Audit log: `const {data: auditLog} = useQuery(['auditLog', patientId], () => axios.get(\`/api/patients/\${patientId}/clinical-profile/history\`).then(res => res.data)); return <Timeline>{auditLog?.map(entry => <TimelineItem key={entry.id}><time>{formatDate(entry.timestamp)}</time><div>{entry.field_name}: {entry.previous_value} → {entry.new_value}</div><small>by {entry.staff_name}</small></TimelineItem>)}</Timeline>;`.

## Current Project State
```
app/src/components/clinical-review/
├── DemographicsTab.tsx (existing from task_002, to be modified)
├── MedicalHistoryTab.tsx (existing, to be modified)
├── MedicationsTab.tsx (existing, to be modified)
├── AllergiesTab.tsx (existing, to be modified)
├── ConflictIndicator.tsx (to be created)
├── ConflictResolutionModal.tsx (to be created)
├── ConflictDiffView.tsx (to be created)
├── ConflictResolutionForm.tsx (to be created)
├── ConflictFilter.tsx (to be created)
├── ConflictProgress.tsx (to be created)
└── AuditLogTimeline.tsx (to be created)
app/src/hooks/
└── useConflictResolution.ts (to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/clinical-review/ConflictIndicator.tsx | Yellow highlight wrapper for conflicting fields |
| CREATE | app/src/components/clinical-review/ConflictResolutionModal.tsx | Modal for resolving conflicts |
| CREATE | app/src/components/clinical-review/ConflictDiffView.tsx | Side-by-side diff view |
| CREATE | app/src/components/clinical-review/ConflictResolutionForm.tsx | Resolution form with radio selection |
| CREATE | app/src/components/clinical-review/ConflictFilter.tsx | Filter and sort controls |
| CREATE | app/src/components/clinical-review/ConflictProgress.tsx | Progress bar showing resolution status |
| CREATE | app/src/components/clinical-review/AuditLogTimeline.tsx | Historical conflict resolutions |
| CREATE | app/src/hooks/useConflictResolution.ts | Conflict resolution hook |
| MODIFY | app/src/components/clinical-review/DemographicsTab.tsx | Add ConflictIndicator wrappers |
| MODIFY | app/src/components/clinical-review/MedicalHistoryTab.tsx | Add ConflictIndicator wrappers |
| MODIFY | app/src/components/clinical-review/MedicationsTab.tsx | Add ConflictIndicator wrappers |
| MODIFY | app/src/components/clinical-review/AllergiesTab.tsx | Add ConflictIndicator wrappers |

## External References
- **react-diff-viewer**: https://www.npmjs.com/package/react-diff-viewer - Side-by-side diff comparison
- **React Hook Form**: https://react-hook-form.com/ - Form handling for resolution
- **react-hot-toast**: https://react-hot-toast.com/ - Toast notifications
- **date-fns**: https://date-fns.org/ - Date formatting for timestamps
- **WCAG AA Contrast**: https://webaim.org/resources/contrastchecker/ - Ensure yellow highlight has sufficient contrast
- **Wireframe**: .propel/context/wireframes/Hi-Fi/wireframe-SCR-010-clinical-data-review.html

## Build Commands
- Start dev server: `npm run dev` (Vite dev server)
- Build for production: `npm run build`
- Type check: `npm run type-check`
- Lint: `npm run lint`
- Install diff viewer: `npm install react-diff-viewer`

## Implementation Validation Strategy
- [x] Conflicting fields highlighted with yellow background (#fef3c7)
- [x] Yellow highlight has sufficient WCAG AA contrast
- [x] Warning triangle icon displays next to conflicting fields
- [x] ConflictResolutionModal opens on click
- [x] Diff view shows side-by-side comparison using react-diff-viewer
- [x] Source document metadata displayed for each value
- [x] Radio buttons allow selecting correct value
- [x] Manual entry option available
- [x] Resolution notes textarea required (min 10 chars)
- [x] PATCH /api/patients/:id/conflicts/:fieldName/resolve called on confirm
- [x] Profile updates without full page reload
- [x] Toast notification shows on successful resolution
- [x] Audit log timeline shows historical resolutions
- [x] ConflictFilter filters by All/Pending/Resolved
- [x] ConflictProgress bar shows resolution percentage
- [x] Keyboard shortcut C opens next pending conflict
- [x] Tab badges show pending conflict count
- [x] Complex conflicts (medications) show table comparison
- [x] All components keyboard accessible
- [x] WCAG AA compliance verified with axe-core

## Implementation Checklist
- [ ] Create app/src/components/clinical-review/ConflictIndicator.tsx (accept fieldName/conflicts/children props, render yellow background #fef3c7 WCAG AA, warning triangle icon, conflict count badge, onClick open modal, tooltip "Click to resolve", keyboard accessible)
- [ ] Create app/src/components/clinical-review/ConflictResolutionModal.tsx (accept isOpen/onClose/conflict/onResolve props, render modal with sections: header field name, diff view, resolution form, state for selectedValue/notes, submit calls useConflictResolution, close on success)
- [ ] Create app/src/components/clinical-review/ConflictDiffView.tsx (accept conflictingValues props, use react-diff-viewer for text comparison, if 2 values side-by-side diff, if >2 list view with radio buttons, show source_document_name/extraction_date/confidence/StatusBadge for each value, highlight differences yellow)
- [ ] Create app/src/components/clinical-review/ConflictResolutionForm.tsx (accept conflictingValues/onSubmit props, radio group for selecting value, "Manual Entry" option with text input, resolution_notes textarea required min 10 chars, "Confirm Resolution" button disabled until selection and notes, confirmation message, keyboard accessible)
- [ ] Create app/src/hooks/useConflictResolution.ts (export useConflictResolution hook: resolveConflict async function PATCH /api/patients/:id/conflicts/:fieldName/resolve with selected_value/resolution_notes/resolved_by_staff_id, React Query useMutation, onSuccess invalidate clinicalProfile cache and show toast, onError rollback and show error, return resolveConflict/isLoading/error)
- [ ] Create app/src/components/clinical-review/ConflictFilter.tsx (filter dropdown All/Pending/Resolved, sort dropdown Field Name/Severity, search input by field name, show conflict count "{filteredCount} of {totalCount}", apply filters to list)
- [ ] Create app/src/components/clinical-review/ConflictProgress.tsx (accept totalConflicts/resolvedConflicts props, progress bar with percentage, visual green fill width calculation, show "{resolvedConflicts} of {totalConflicts} resolved", message "All conflicts resolved! ✓" when complete)
- [ ] Create app/src/components/clinical-review/AuditLogTimeline.tsx (accept patientId, GET /api/patients/:id/clinical-profile/history, render timeline: timestamp/field_name/previous_value → new_value/resolved by staff_name/resolution_notes, expandable details, sort by recent first, use timeline CSS or library)
- [ ] Modify app/src/components/clinical-review/DemographicsTab.tsx (for each field check profile.conflicts for matching field_name, if conflict exists wrap field with ConflictIndicator component, pass conflict data and resolve handler)
- [ ] Modify app/src/components/clinical-review/MedicalHistoryTab.tsx (same as Demographics: wrap conflicting fields with ConflictIndicator, show warning icon in table rows with conflicts)
- [ ] Modify app/src/components/clinical-review/MedicationsTab.tsx (wrap conflicting medication entries with ConflictIndicator, show warning icon in table row, highlight row with yellow background)
- [ ] Modify app/src/components/clinical-review/AllergiesTab.tsx (wrap conflicting allergy entries with ConflictIndicator, highlight row with yellow)
- [ ] Add conflict count badges to tabs (modify TabNavigation.tsx: for each tab count pending conflicts in that section, show badge "Medical History (3)" if 3 pending, use profile.conflicts filtered by section)
- [ ] Add keyboard shortcut C for conflicts (in ClinicalDataReview.tsx useEffect: on C key press find first pending conflict, open ConflictResolutionModal, cycle through with repeated C, focus management)
- [ ] Add toast notifications (install react-hot-toast, show "Conflict resolved successfully ✓" on success, "Error resolving conflict" on failure, "All conflicts resolved!" when totalConflicts === resolvedConflicts)
- [ ] Handle complex conflicts for medications (structured data with name/dosage/frequency: render table comparison row-by-row, allow field-by-field selection or select entire row, radio buttons per row)
- [ ] Add WCAG AA accessibility (yellow background sufficient contrast, keyboard navigation for all elements, ARIA labels for radio buttons/modal/indicators, focus trap in modal, screen reader announcements for resolutions)
- [ ] Write comprehensive tests (test ConflictIndicator displays yellow highlight, test modal opens and shows diff view, test resolveConflict API call with correct payload, test profile refetch after resolution, test audit log renders timeline, test filter and sort functionality, test progress bar updates, test keyboard shortcut C, test tab badges update, test toast notifications, test accessibility with axe-core)
