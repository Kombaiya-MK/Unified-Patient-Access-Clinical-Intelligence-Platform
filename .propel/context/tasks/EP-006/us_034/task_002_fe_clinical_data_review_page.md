# Task - TASK_002: Frontend Clinical Data Review Page Layout (SCR-010)

## Requirement Reference
- User Story: [us_034]
- Story Location: [.propel/context/tasks/us_034/us_034.md]
- Acceptance Criteria:
    - AC1: Display unified profile with Demographics, Chief Complaint, Medical History, Current Medications, Allergies, Lab Results, Previous Visits sections
    - AC3: Show ICD-10/CPT coding section with AI-generated codes and confidence scores
    - AC4: Display medication conflict alerts with critical red banner
- Edge Case:
    - EC1: Document extraction still processing → show status badge with ETA
    - EC3: AI confidence <90% → mark with yellow badge "Needs Review"
    - EC4: Historical versions → provide audit log timeline
- UXR Compliance:
    - UXR-AUTO-S02: Auto-save edits every 30 seconds
    - UXR-WCAG-A01: WCAG AA compliance
    - UXR-ALERT-C01: 7:1 contrast for critical alerts

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | Available |
| **Wireframe Type** | Hi-Fi HTML Wireframe |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-010-clinical-data-review.html |
| **Screen Spec** | SCR-010 |
| **UXR Requirements** | UXR-AUTO-S02, UXR-WCAG-A01, UXR-ALERT-C01 |
| **Design Tokens** | N/A |

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.2.x |
| Frontend | TypeScript | 5.3.x |
| Frontend | React Hook Form | 7.x |
| Date Handling | date-fns | 3.x |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | AIR-O02 (human override for all AI suggestions) |
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
Create Clinical Data Review page (SCR-010) at app/src/pages/ClinicalDataReview.tsx showing unified patient profile. Display patient header with name, MRN, DOB, and alert banner. Implement tab navigation: Demographics, Medical History, Medications, Allergies, Lab Results, Visits, Documents, Coding. Each tab renders specific section from unified profile API. Demographics tab shows basic info with inline editing. Medical History shows conditions, surgeries, procedures with dates and source document links. Medications tab shows current medications with medication conflict banner from US-033 (red for critical, yellow for moderate, green for no conflicts). Allergies shows list with reactions. Lab Results shows table with date, test name, value, reference range, abnormal flag. Visits shows past appointments with chief complaint and provider. Documents tab shows all source clinical documents with extraction status badges (Processing/Processed/Needs Review/Failed). Coding tab shows ICD-10 and CPT codes with confidence scores from US-032. Add status indicators: green checkmark (≥90% confidence), yellow warning (<90% confidence), gray circle (manual entry). Implement inline editing with React Hook Form. Auto-save changes every 30s per UXR-AUTO-S02. Show document reference links for each data field (e.g., "Source: Intake Form - 2024-01-15"). Add keyboard shortcuts: C to focus conflict resolution, M to open medication details. Poll GET /api/patients/:id/clinical-profile every 10s if any documents are processing. Display loading skeleton while fetching. Handle partial data gracefully showing processing status. WCAG AA compliant with 7:1 contrast for critical alerts per UXR-ALERT-C01.

## Dependent Tasks
- US-034 task_001: Backend unified profile API

## Impacted Components
- **CREATE** app/src/pages/ClinicalDataReview.tsx - Main page component
- **CREATE** app/src/components/clinical-review/PatientHeader.tsx - Header with alert banner
- **CREATE** app/src/components/clinical-review/TabNavigation.tsx - Tab switcher
- **CREATE** app/src/components/clinical-review/DemographicsTab.tsx - Demographics section
- **CREATE** app/src/components/clinical-review/MedicalHistoryTab.tsx - Medical history section
- **CREATE** app/src/components/clinical-review/MedicationsTab.tsx - Medications with conflict banner
- **CREATE** app/src/components/clinical-review/AllergiesTab.tsx - Allergies list
- **CREATE** app/src/components/clinical-review/LabResultsTab.tsx - Lab results table
- **CREATE** app/src/components/clinical-review/VisitsTab.tsx - Previous visits
- **CREATE** app/src/components/clinical-review/DocumentsTab.tsx - Source documents list
- **CREATE** app/src/components/clinical-review/CodingTab.tsx - Medical coding display
- **CREATE** app/src/components/clinical-review/StatusBadge.tsx - Confidence indicators
- **CREATE** app/src/components/clinical-review/DocumentReferenceLink.tsx - Source links
- **CREATE** app/src/hooks/useClinicalProfile.ts - Profile fetching and polling
- **CREATE** app/src/hooks/useAutoSave.ts - Auto-save every 30s
- **CREATE** app/src/types/clinicalProfile.ts - TypeScript types
- **MODIFY** app/src/pages/index.ts - Export ClinicalDataReview

## Implementation Plan
1. **Create clinicalProfile.ts types**: Define UnifiedProfile = {patient_id, demographics: {first_name, last_name, mrn, dob, gender, contact_info}, chief_complaint: string, medical_history: {conditions, surgeries, procedures}, current_medications: [{name, dosage, frequency, source_document_id}], allergies: [{allergen, reaction, severity}], lab_results: [{date, test_name, value, reference_range, abnormal_flag, source_document_id}], previous_visits: [{date, chief_complaint, provider, icd10_codes}], icd10_codes: [{code, description, confidence, status}], medication_conflicts: [{severity, description}], conflicts: [{field_name, conflicting_values}], processing_status: {total_documents, processed_documents, estimated_completion_time}, last_updated}
2. **Create useClinicalProfile.ts hook**: Export useClinicalProfile(patientId) hook: GET /api/patients/:id/clinical-profile, use React Query with staleTime 5 minutes, if processing_status.pending_documents > 0 enable polling every 10s, return {profile, isLoading, error, refetch}
3. **Create useAutoSave.ts hook**: Export useAutoSave(data, onSave, debounceMs=30000) hook: use useDebounce from lodash or custom, track dirty fields, call onSave every 30s if dirty, show "Saving..." and "Saved" toast notifications
4. **Create StatusBadge.tsx**: Accept {confidence?: number, manual?: boolean} props, if confidence ≥90% green checkmark "Verified", if confidence <90% yellow warning "Needs Review", if manual gray circle "Manual Entry", use WCAG AA contrast
5. **Create DocumentReferenceLink.tsx**: Accept {document_id, document_name, extracted_date} props, render link "Source: {document_name} - {formatted_date}", onClick navigate to Documents tab with highlighted document
6. **Create PatientHeader.tsx**: Display patient name/MRN/DOB from profile.demographics, if medication_conflicts with severity='Critical' show red banner with 7:1 contrast per UXR-ALERT-C01, text: "⚠️ Critical Medication Conflict - Review Required", if conflicts.length > 0 show yellow notification "Data conflicts detected - {count} fields require review", if processing_status.pending_documents > 0 show blue info "Processing {count} documents - ETA {estimated_completion_time}"
7. **Create TabNavigation.tsx**: Implement tab switcher with tabs: Demographics, Medical History, Medications, Allergies, Lab Results, Visits, Documents, Coding, use controlled state const [activeTab, setActiveTab] = useState('demographics')_, highlight active tab, keyboard navigation with arrow keys
8. **Create DemographicsTab.tsx**: Display demographics fields: first_name, last_name, MRN, DOB, gender, address, phone, email, emergency_contact, inline editing with React Hook Form, use useAutoSave hook, show StatusBadge for AI confidence, show DocumentReferenceLink for source
9. **Create MedicalHistoryTab.tsx**: Display conditions table: name, icd10_code, diagnosed_date, status (Active/Resolved), source document link, display surgeries: procedure, date, surgeon, notes, display procedures: name, date, provider, outcome, show StatusBadge for confidence, filter by date range, collapsible sections
10. **Create MedicationsTab.tsx**: Display conflict banner at top using medication_conflicts from profile (if severity='Critical' red banner, severity='Moderate' yellow, else green), table columns: Medication, Dosage, Frequency, Prescriber, Start Date, Status, Source, Actions (Edit), show StatusBadge, link to ConflictDetailsModal from US-033, use DocumentReferenceLink
11. **Create AllergiesTab.tsx**: Table columns: Allergen, Reaction, Severity (Mild/Moderate/Severe/Life-Threatening), Onset Date, Source, color-code severity: Life-Threatening red, Severe orange, Moderate yellow, Mild green, show StatusBadge, inline add new allergy
12. **Create LabResultsTab.tsx**: Table columns: Date, Test Name, Value, Reference Range, Abnormal Flag (High/Low/Critical), Source, sort by date descending, filter by test type, highlight abnormal values: Critical red, High/Low orange, show chart icon to visualize trends, pagination 20 per page, export to CSV option
13. **Create VisitsTab.tsx**: Timeline of previous appointments: date, chief_complaint, provider_name, icd10_codes assigned, notes preview, expandable for full notes, show StatusBadge for AI-assigned codes, link to full appointment details
14. **Create DocumentsTab.tsx**: List all source clinical_documents: document_name, upload_date, extraction_status badge (Processing blue pulse, Processed green, Needs Review yellow, Failed red), extraction_confidence, action buttons: View, Re-extract, Delete, show processing ETA for pending extractions
15. **Create CodingTab.tsx**: Display ICD-10 codes table: Code, Description, Confidence %, Status (AI Generated/Approved/Rejected), Actions (Edit/Approve/Reject), display CPT codes table similarly, use StatusBadge, integrate with MedicalCodingTab from US-032 for editing, filter by status, bulk approve option
16. **Create ClinicalDataReview.tsx page**: Use useParams to get patientId, call useClinicalProfile(patientId), render loading skeleton while isLoading, render PatientHeader, render TabNavigation, render active tab component passing profile data, if error show error message with retry, add keyboard shortcuts: useEffect(() => {const handler = (e) => {if (e.key === 'c' && e.ctrlKey) focusConflicts(); if (e.key === 'm' && e.ctrlKey) openMedicationDetails();}; window.addEventListener('keydown', handler); return () => removeEventListener('keydown', handler);}, [])
17. **Add to pages/index.ts**: Export ClinicalDataReview
18. **Accessibility**: All components WCAG AA, 7:1 contrast for critical alerts, keyboard navigation, ARIA labels for tabs/badges/links, focus management, screen reader announcements for auto-save
19. **Testing**: Test unified profile loads correctly, test polling for processing documents stops when complete, test auto-save every 30s, test inline editing with React Hook Form, test tab navigation keyboard shortcuts, test conflict highlighting, test medication conflict banner, test document reference links, test status badges display correctly

**Focus on how to implement**: Profile fetching: `const useClinicalProfile = (patientId: string) => { return useQuery(['clinicalProfile', patientId], () => axios.get(\`/api/patients/\${patientId}/clinical-profile\`).then(res => res.data), { refetchInterval: (data) => data?.processing_status?.pending_documents > 0 ? 10000 : false, staleTime: 300000 }); };`. Auto-save: `const useAutoSave = (data: any, onSave: (data: any) => Promise<void>) => { const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle'); useEffect(() => { const timer = setTimeout(async () => { if (data && status === 'idle') { setStatus('saving'); await onSave(data); setStatus('saved'); setTimeout(() => setStatus('idle'), 2000); } }, 30000); return () => clearTimeout(timer); }, [data, onSave]); return status; };`. Status badge: `const StatusBadge = ({confidence, manual}) => { if (manual) return <span className="badge badge-gray"><CircleIcon /> Manual</span>; if (confidence >= 90) return <span className="badge badge-green"><CheckIcon /> Verified</span>; return <span className="badge badge-yellow"><WarningIcon /> Needs Review</span>; };`. Conflict banner: `{profile.medication_conflicts.filter(c => c.severity === 'Critical').length > 0 && <div className="alert alert-critical" style={{backgroundColor: '#b91c1c', color: '#fff', contrast: '7:1'}}><AlertIcon /> Critical Medication Conflict - Review Required</div>}`. Document reference: `<DocumentReferenceLink document_id={med.source_document_id} document_name="Intake Form" extracted_date={med.extracted_date} onClick={() => setActiveTab('documents')} />`.

## Current Project State
```
app/src/
├── pages/
│   ├── ClinicalDataReview.tsx (to be created)
│   └── index.ts (to be modified)
├── components/
│   └── clinical-review/
│       ├── PatientHeader.tsx (to be created)
│       ├── TabNavigation.tsx (to be created)
│       ├── DemographicsTab.tsx (to be created)
│       ├── MedicalHistoryTab.tsx (to be created)
│       ├── MedicationsTab.tsx (to be created)
│       ├── AllergiesTab.tsx (to be created)
│       ├── LabResultsTab.tsx (to be created)
│       ├── VisitsTab.tsx (to be created)
│       ├── DocumentsTab.tsx (to be created)
│       ├── CodingTab.tsx (to be created)
│       ├── StatusBadge.tsx (to be created)
│       └── DocumentReferenceLink.tsx (to be created)
├── hooks/
│   ├── useClinicalProfile.ts (to be created)
│   └── useAutoSave.ts (to be created)
└── types/
    └── clinicalProfile.ts (to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/pages/ClinicalDataReview.tsx | Main clinical data review page |
| CREATE | app/src/components/clinical-review/PatientHeader.tsx | Header with alert banners |
| CREATE | app/src/components/clinical-review/TabNavigation.tsx | Tab switcher component |
| CREATE | app/src/components/clinical-review/DemographicsTab.tsx | Demographics display and editing |
| CREATE | app/src/components/clinical-review/MedicalHistoryTab.tsx | Medical history section |
| CREATE | app/src/components/clinical-review/MedicationsTab.tsx | Medications with conflict banner |
| CREATE | app/src/components/clinical-review/AllergiesTab.tsx | Allergies display |
| CREATE | app/src/components/clinical-review/LabResultsTab.tsx | Lab results table |
| CREATE | app/src/components/clinical-review/VisitsTab.tsx | Previous visits timeline |
| CREATE | app/src/components/clinical-review/DocumentsTab.tsx | Source documents list |
| CREATE | app/src/components/clinical-review/CodingTab.tsx | Medical coding display |
| CREATE | app/src/components/clinical-review/StatusBadge.tsx | Confidence indicator badges |
| CREATE | app/src/components/clinical-review/DocumentReferenceLink.tsx | Source document links |
| CREATE | app/src/hooks/useClinicalProfile.ts | Profile fetching with polling |
| CREATE | app/src/hooks/useAutoSave.ts | Auto-save hook |
| CREATE | app/src/types/clinicalProfile.ts | TypeScript types |
| MODIFY | app/src/pages/index.ts | Export ClinicalDataReview |

## External References
- **React Hook Form**: https://react-hook-form.com/ - Form handling with inline editing
- **React Query**: https://tanstack.com/query/latest - Data fetching and polling
- **date-fns**: https://date-fns.org/ - Date formatting
- **WCAG AA Contrast**: https://webaim.org/resources/contrastchecker/ - 7:1 contrast for critical alerts
- **Keyboard Shortcuts**: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent - Event handling
- **Wireframe**: .propel/context/wireframes/Hi-Fi/wireframe-SCR-010-clinical-data-review.html

## Build Commands
- Start dev server: `npm run dev` (Vite dev server)
- Build for production: `npm run build`
- Type check: `npm run type-check` (tsc --noEmit)
- Lint: `npm run lint`

## Implementation Validation Strategy
- [x] ClinicalDataReview page loads unified profile
- [x] PatientHeader shows name/MRN/DOB correctly
- [x] Critical medication conflict banner displays with 7:1 contrast (UXR-ALERT-C01)
- [x] Conflict notification shows when conflicts > 0
- [x] Processing status displays with ETA for pending documents
- [x] Tab navigation switches between 8 tabs (Demographics, Medical History, Medications, Allergies, Lab Results, Visits, Documents, Coding)
- [x] DemographicsTab displays and allows inline editing
- [x] Auto-save triggers every 30s (UXR-AUTO-S02)
- [x] StatusBadge shows green (≥90%), yellow (<90%), gray (manual)
- [x] DocumentReferenceLink navigates to Documents tab
- [x] MedicationsTab shows conflict banner integrated from US-033
- [x] LabResultsTab highlights abnormal values
- [x] DocumentsTab shows extraction status badges
- [x] CodingTab displays ICD-10/CPT codes with confidence
- [x] Polling enabled when processing_status.pending_documents > 0
- [x] Polling stops when all documents processed
- [x] Keyboard shortcuts C (conflicts) and M (medications) work
- [x] WCAG AA compliance verified
- [x] Loading skeleton displays while fetching

## Implementation Checklist
- [ ] Create app/src/types/clinicalProfile.ts (interfaces: UnifiedProfile with patient_id/demographics/chief_complaint/medical_history/current_medications/allergies/lab_results/previous_visits/icd10_codes/medication_conflicts/conflicts/processing_status/last_updated, Demographics, MedicalHistory, Medication, Allergy, LabResult, Visit, ProcessingStatus)
- [ ] Create app/src/hooks/useClinicalProfile.ts (custom hook: accept patientId, use React Query useQuery, GET /api/patients/:id/clinical-profile, refetchInterval conditional on processing_status.pending_documents > 0 then 10s else false, staleTime 5 minutes, return profile/isLoading/error/refetch)
- [ ] Create app/src/hooks/useAutoSave.ts (custom hook: accept data/onSave/debounceMs=30000, track dirty state, useEffect with setTimeout 30s, call onSave, show status idle/saving/saved, return status for UI display)
- [ ] Create app/src/components/clinical-review/StatusBadge.tsx (accept confidence/manual props, render green checkmark if confidence ≥90%, yellow warning if <90%, gray circle if manual, WCAG AA contrast, icons from library)
- [ ] Create app/src/components/clinical-review/DocumentReferenceLink.tsx (accept document_id/document_name/extracted_date, render link text "Source: {document_name} - {formatted_date}", onClick navigate to Documents tab with document highlighted)
- [ ] Create app/src/components/clinical-review/PatientHeader.tsx (display patient name/MRN/DOB from profile.demographics, if medication_conflicts with severity='Critical' show red banner 7:1 contrast "⚠️ Critical Medication Conflict - Review Required", if conflicts.length > 0 yellow notification with count, if processing show blue info with ETA)
- [ ] Create app/src/components/clinical-review/TabNavigation.tsx (tab switcher with 8 tabs: Demographics/Medical History/Medications/Allergies/Lab Results/Visits/Documents/Coding, controlled state activeTab, highlight active, keyboard arrow navigation)
- [ ] Create app/src/components/clinical-review/DemographicsTab.tsx (display demographics fields: first_name/last_name/MRN/DOB/gender/address/phone/email/emergency_contact, inline editing React Hook Form, useAutoSave hook, StatusBadge for confidence, DocumentReferenceLink for source)
- [ ] Create app/src/components/clinical-review/MedicalHistoryTab.tsx (conditions table: name/icd10_code/diagnosed_date/status Active or Resolved/source, surgeries: procedure/date/surgeon/notes, procedures: name/date/provider/outcome, StatusBadge, date range filter, collapsible sections)
- [ ] Create app/src/components/clinical-review/MedicationsTab.tsx (conflict banner at top from medication_conflicts: red if Critical/yellow if Moderate/green if none, table: Medication/Dosage/Frequency/Prescriber/Start Date/Status/Source/Actions Edit, StatusBadge, DocumentReferenceLink, link to ConflictDetailsModal from US-033)
- [ ] Create app/src/components/clinical-review/AllergiesTab.tsx (table: Allergen/Reaction/Severity/Onset Date/Source, color-code severity: Life-Threatening red/Severe orange/Moderate yellow/Mild green, StatusBadge, inline add new allergy form)
- [ ] Create app/src/components/clinical-review/LabResultsTab.tsx (table: Date/Test Name/Value/Reference Range/Abnormal Flag/Source, sort by date descending, filter by test type, highlight abnormal: Critical red/High Low orange, chart icon for trends, pagination 20 per page, export CSV)
- [ ] Create app/src/components/clinical-review/VisitsTab.tsx (timeline: date/chief_complaint/provider_name/icd10_codes/notes preview, expandable for full notes, StatusBadge for AI codes, link to appointment details)
- [ ] Create app/src/components/clinical-review/DocumentsTab.tsx (list all clinical_documents: document_name/upload_date/extraction_status badge Processing blue pulse/Processed green/Needs Review yellow/Failed red, extraction_confidence, actions View/Re-extract/Delete, show ETA for pending)
- [ ] Create app/src/components/clinical-review/CodingTab.tsx (ICD-10 table: Code/Description/Confidence %/Status AI Generated or Approved or Rejected/Actions Edit Approve Reject, CPT table similarly, StatusBadge, integrate with MedicalCodingTab US-032, filter by status, bulk approve)
- [ ] Create app/src/pages/ClinicalDataReview.tsx (useParams patientId, useClinicalProfile(patientId), loading skeleton while isLoading, render PatientHeader/TabNavigation/active tab component, error handling with retry, keyboard shortcuts useEffect Ctrl+C for conflicts Ctrl+M for medications)
- [ ] Modify app/src/pages/index.ts (export ClinicalDataReview)
- [ ] Implement WCAG AA accessibility (all components 7:1 contrast for critical alerts, keyboard navigation, ARIA labels for tabs/badges/links, focus management tab trap, screen reader announcements for auto-save status)
- [ ] Write comprehensive tests (test profile loads, test polling starts when pending_documents > 0 and stops when complete, test auto-save every 30s, test inline editing, test tab navigation and keyboard shortcuts, test conflict banner displays, test medication alerts, test StatusBadge rendering, test DocumentReferenceLink navigation, test accessibility with axe-core)
