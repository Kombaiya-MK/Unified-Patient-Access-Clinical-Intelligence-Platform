# Task - TASK_004: Frontend Medical Coding Tab Interface

## Requirement Reference
- User Story: [us_032]
- Story Location: [.propel/context/tasks/us_032/us_032.md]
- Acceptance Criteria:
    - AC1: Access Medical Coding tab in clinical data review (SCR-010)
    - AC1: Display Code + Description + Confidence Score (%)
    - AC1: Allow edit/approve/reject each code with dropdown showing alternative codes
    - AC1: Auto-approve if >95% confidence, require review if <95%
- Edge Case:
    - EC1: Vague condition → show multiple alternatives ranked
    - EC2: Combination codes → display primary + secondary codes
    - EC3: Manual search → search ICD-10 database

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-010-clinical-data-review.html |
| **Screen Spec** | .propel/context/docs/figma_spec.md#SCR-010 |
| **UXR Requirements** | AIR-S02 (>98% accuracy), AIR-O02 (Human override), UXR-502 (Clear confidence indicators) |
| **Design Tokens** | .propel/context/docs/designsystem.md#colors, #badges, #tables |

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
Create Medical Coding tab in clinical data review interface. Add new tab "Medical Coding" in patient profile navigation. Create MedicalCodingTab component fetching appointment diagnoses from patient_profiles. Add "Generate Codes" button calling POST /api/appointments/:id/codes/generate, show loading spinner during AI processing. Display CodingTable with columns: Diagnosis, Suggested ICD-10 Code, Description, Confidence %, Status (AI Generated/Approved/Rejected), Actions. Render confidence badge: green (≥95%) "High Confidence - Auto-Approved", yellow (<95%) "Needs Review". For each row add Actions dropdown: "Approve" (if not approved), "Reject" with reason input, "Edit" opens CodeEditorModal with alternative codes dropdown populated from suggestions, "View Details" shows full ICD-10 definition panel. Create CodeEditorModal with search box for manual ICD-10 lookup calling GET /api/codes/search, dropdown showing alternatives ranked by confidence, "Save" button calling PATCH /api/appointments/:id/codes/:codeIndex/modify. Add "Approve All" button (enabled only if all codes ≥95% confidence) calling POST /api/appointments/:id/codes/bulk-approve. Add "Bulk Edit" for multi-select with checkboxes. Display coding status indicator: "Not Started", "AI Generated", "Pending Review", "Approved". Show toast notifications for approve/reject/modify actions. Add audit trail panel showing all coding decisions from medical_coding_audit.

## Dependent Tasks
- TASK_001: Database Migration (icd10_codes JSONB storage)
- TASK_002: AI Medical Coding Service (code suggestions)
- TASK_003: Backend Coding API (endpoints)

## Impacted Components
- **CREATE** app/src/components/medical-coding/MedicalCodingTab.tsx - Main tab component
- **CREATE** app/src/components/medical-coding/CodingTable.tsx - Diagnosis-code table
- **CREATE** app/src/components/medical-coding/ConfidenceBadge.tsx - Confidence indicator
- **CREATE** app/src/components/medical-coding/CodeEditorModal.tsx - Edit code modal with alternatives
- **CREATE** app/src/components/medical-coding/CodeSearchBox.tsx - Manual ICD-10 search
- **CREATE** app/src/components/medical-coding/CodeDetailsPanel.tsx - Full code definition display
- **CREATE** app/src/components/medical-coding/BulkActionsBar.tsx - Approve All and Bulk Edit toolbar
- **CREATE** app/src/hooks/useMedicalCoding.ts - Custom hook for coding operations
- **MODIFY** app/src/pages/PatientProfilePage.tsx - Add Medical Coding tab

## Implementation Plan
1. **Create useMedicalCoding hook**: Implement generateCodes(appointmentId) calling POST /api/appointments/:id/codes/generate, getCodes(appointmentId) calling GET /api/appointments/:id/codes, approveCode(appointmentId, codeIndex, staffId, rationale) calling PATCH approve, rejectCode similar, modifyCode(appointmentId, codeIndex, newCode, rationale) calling PATCH modify, bulkApprove(appointmentId) calling POST bulk-approve, searchCodes(query, searchType) calling GET /api/codes/search, return {codes, loading, error, codingStatus, refetch}
2. **Create ConfidenceBadge.tsx**: Props: confidence (number 0-100), render badge with text and color: if confidence ≥95 green badge "High Confidence - Auto-Approved", if 80-94 yellow badge "Needs Review", if <80 red badge "Low Confidence", show confidence percentage inline
3. **Create CodeSearchBox.tsx**: Props: onSelect(code), render search input with dropdown results, call useMedicalCoding.searchCodes on input change with debounce 300ms, display results list with code + description, highlight matching text, click selects code and calls onSelect
4. **Create CodeDetailsPanel.tsx**: Props: code string, render side panel or expandable section, fetch full ICD-10 definition from database or display from cached data, show: Official Code, Full Description, Category, Billing Guidelines (if available), Related Codes, "Close" button
5. **Create CodeEditorModal.tsx**: Props: isOpen, diagnosis, currentCode, alternatives array, onSave, onClose, render modal with heading "Edit Code for: {diagnosis}", show current code, dropdown of alternatives sorted by confidence with labels "{code} - {description} ({confidence}%)", search box using CodeSearchBox for manual lookup, "Save" button calls onSave with selected code, "Cancel" button closes
6. **Create CodingTable.tsx**: Props: codes array from useMedicalCoding, onApprove, onReject, onEdit, render table with columns: Checkbox (for bulk select), Diagnosis, Suggested ICD-10 Code (bold), Description (gray), Confidence (ConfidenceBadge), Status badge (color-coded), Actions dropdown (Approve/Reject/Edit/View Details), for approved codes show approved icon and approved_by name, for rejected show rejected icon, highlight primary codes (is_primary=true) with blue background
7. **Create BulkActionsBar.tsx**: Props: selectedCodes, allHighConfidence boolean, render toolbar with "Approve All" button (enabled if allHighConfidence), "Bulk Approve Selected" (enabled if selectedCodes.length > 0), "Bulk Reject" with reason modal, show count of selected codes
8. **Create MedicalCodingTab.tsx**: Use useMedicalCoding hook to fetch codes and coding status, render page header with coding status badge and "Generate Codes" button, show loading spinner during generation, render CodingTable with all codes, render BulkActionsBar if codes exist, add CodeEditorModal state for editing, add success/error toast notifications on actions, display audit trail section at bottomshowing history from medical_coding_audit, add "Refresh" button to refetch codes
9. **Modify PatientProfilePage.tsx**: Add "Medical Coding" tab to tab navigation (after Clinical Data tab), render MedicalCodingTab component when tab active, pass appointment_id prop
10. **Handle combination codes**: In CodingTable, if code has is_primary=true, display "Primary Code" badge, show alternatives as indented secondary codes, group visually
11. **Add validation**: Before approve/reject/modify, confirm action with dialog "Approve code {code} for {diagnosis}?", validate staff has permission, show error toast if API call fails
12. **Styling**: Green confidence badge background: #D4EDDA, Yellow: #FFF3CD, Red: #F8D7DA, Table alternating row colors, Actions dropdown with icons (checkmark, X, pencil, eye), Responsive layout for mobile <768px

**Focus on how to implement**: Generate codes button: `<Button onClick={async () => { setLoading(true); await generateCodes(appointmentId); refetch(); setLoading(false); toast.success('Codes generated'); }} disabled={loading}>{loading ? <Spinner /> : 'Generate Codes'}</Button>`. Coding table: `<table><thead><tr><th>Checkbox</th><th>Diagnosis</th><th>Code</th><th>Description</th><th>Confidence</th><th>Status</th><th>Actions</th></tr></thead><tbody>{codes.map((code, idx) => <tr key={idx} className={code.is_primary ? 'primary-code' : ''}><td><input type="checkbox" onChange={() => toggleSelect(idx)} /></td><td>{code.diagnosis_text}</td><td><strong>{code.icd10_code}</strong></td><td>{code.description}</td><td><ConfidenceBadge confidence={code.confidence_score} /></td><td><StatusBadge status={code.status} /></td><td><ActionsDropdown onApprove={() => handleApprove(idx)} onReject={() => handleReject(idx)} onEdit={() => openEditModal(idx)} onViewDetails={() => openDetailsPanel(code.icd10_code)} /></td></tr>)}</tbody></table>`. Approve handler: `const handleApprove = async (codeIndex: number) => { if (!confirm(`Approve code ${codes[codeIndex].icd10_code}?`)) return; await approveCode(appointmentId, codeIndex, staffId); toast.success('Code approved'); refetch(); };`. Code editor modal: `<Modal isOpen={isEditOpen} onClose={closeEditModal}><h2>Edit Code for: {editingCode?.diagnosis_text}</h2><Select value={selectedCode} onChange={setSelectedCode}>{alternatives.map(alt => <option value={alt.code}>{alt.code} - {alt.description} ({alt.confidence_score}%)</option>)}</Select><CodeSearchBox onSelect={setSelectedCode} /><Button onClick={() => { modifyCode(appointmentId, editIndex, selectedCode, rationale); closeEditModal(); }}>Save</Button></Modal>`.

## Current Project State
```
app/
├── src/
│   ├── pages/
│   │   └── PatientProfilePage.tsx (may exist, to be modified)
│   ├── components/
│   │   └── medical-coding/
│   │       ├── MedicalCodingTab.tsx (to be created)
│   │       ├── CodingTable.tsx (to be created)
│   │       ├── ConfidenceBadge.tsx (to be created)
│   │       ├── CodeEditorModal.tsx (to be created)
│   │       ├── CodeSearchBox.tsx (to be created)
│   │       ├── CodeDetailsPanel.tsx (to be created)
│   │       └── BulkActionsBar.tsx (to be created)
│   └── hooks/
│       └── useMedicalCoding.ts (to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/medical-coding/MedicalCodingTab.tsx | Main Medical Coding tab component |
| CREATE | app/src/components/medical-coding/CodingTable.tsx | Diagnosis-code table with actions |
| CREATE | app/src/components/medical-coding/ConfidenceBadge.tsx | Color-coded confidence indicator |
| CREATE | app/src/components/medical-coding/CodeEditorModal.tsx | Modal for editing codes with alternatives |
| CREATE | app/src/components/medical-coding/CodeSearchBox.tsx | ICD-10 search input with dropdown results |
| CREATE | app/src/components/medical-coding/CodeDetailsPanel.tsx | Full code definition display |
| CREATE | app/src/components/medical-coding/BulkActionsBar.tsx | Toolbar for bulk approve/reject |
| CREATE | app/src/hooks/useMedicalCoding.ts | Hook for medical coding API operations |
| MODIFY | app/src/pages/PatientProfilePage.tsx | Add Medical Coding tab to navigation |

## External References
- **React useState**: https://react.dev/reference/react/useState - State management
- **React useEffect**: https://react.dev/reference/react/useEffect - Side effects for data fetching
- **Axios**: https://axios-http.com/docs/intro - HTTP requests
- **Debouncing Input**: https://www.freecodecamp.org/news/debouncing-in-react/ - Search box debounce
- **CSS Grid for Tables**: https://css-tricks.com/snippets/css/complete-guide-grid/ - Responsive table layout

## Build Commands
- Build TypeScript: `npm run build` (compile src/ to dist/)
- Run in development: `npm run dev` (start Vite dev server)
- Run tests: `npm test` (unit tests for medical coding components)
- Type check: `npm run type-check`

## Implementation Validation Strategy
- [x] Reference wireframe at .propel/context/wireframes/Hi-Fi/wireframe-SCR-010-clinical-data-review.html during implementation
- [x] Visual comparison against wireframe at 375px, 768px, 1440px
- [x] Run `/analyze-ux` to validate wireframe alignment
- [x] Medical Coding tab appears in patient profile navigation
- [x] "Generate Codes" button triggers AI suggestion
- [x] Loading spinner displays during code generation
- [x] CodingTable displays all columns correctly
- [x] Confidence badges show correct colors (green ≥95%, yellow <95%)
- [x] Auto-approved codes marked with green checkmark
- [x] Actions dropdown shows Approve/Reject/Edit/View Details
- [x] "Approve" button calls API and updates UI
- [x] "Reject" button prompts for reason and logs to audit
- [x] "Edit" opens CodeEditorModal with alternatives dropdown
- [x] CodeSearchBox searches ICD-10 database with debounce
- [x] "Approve All" button enabled only if all codes ≥95%
- [x] Bulk select checkboxes work correctly
- [x] Combination codes display primary + secondary visually
- [x] Toast notifications appear after actions
- [x] Audit trail shows all coding decisions
- [x] Responsive layout works on mobile

## Implementation Checklist
- [ ] Reference wireframe at .propel/context/wireframes/Hi-Fi/wireframe-SCR-010-clinical-data-review.html during implementation
- [ ] Create app/src/hooks/useMedicalCoding.ts (functions: generateCodes POST /api/appointments/:id/codes/generate, getCodes GET /codes, approveCode PATCH /approve, rejectCode PATCH /reject, modifyCode PATCH /modify, bulkApprove POST /bulk-approve, searchCodes GET /codes/search, return state codes/loading/error/codingStatus/refetch)
- [ ] Create app/src/components/medical-coding/ConfidenceBadge.tsx (props: confidence number, render badge: ≥95 green "High Confidence - Auto-Approved", 80-94 yellow "Needs Review", <80 red "Low Confidence", show percentage)
- [ ] Create app/src/components/medical-coding/CodeSearchBox.tsx (props: onSelect, search input with debounce 300ms, call useMedicalCoding.searchCodes, display dropdown results code+description, click selects and calls onSelect)
- [ ] Create app/src/components/medical-coding/CodeDetailsPanel.tsx (props: code string, side panel or expandable, show Official Code, Full Description, Category, Billing Guidelines, Related Codes, Close button)
- [ ] Create app/src/components/medical-coding/CodeEditorModal.tsx (props: isOpen, diagnosis, currentCode, alternatives, onSave, onClose, modal with Edit Code heading, alternatives dropdown sorted by confidence, CodeSearchBox for manual lookup, Save and Cancel buttons)
- [ ] Create app/src/components/medical-coding/CodingTable.tsx (props: codes array, onApprove, onReject, onEdit, table columns: Checkbox, Diagnosis, Code bold, Description gray, Confidence badge, Status badge, Actions dropdown Approve/Reject/Edit/View Details, highlight primary codes blue background)
- [ ] Create app/src/components/medical-coding/BulkActionsBar.tsx (props: selectedCodes, allHighConfidence, toolbar with Approve All button enabled if allHighConfidence, Bulk Approve Selected, Bulk Reject, show selected count)
- [ ] Create app/src/components/medical-coding/MedicalCodingTab.tsx (use useMedicalCoding hook, page header with coding status badge and Generate Codes button, loading spinner, CodingTable, BulkActionsBar, CodeEditorModal state, toast notifications, audit trail section, Refresh button)
- [ ] Modify app/src/pages/PatientProfilePage.tsx (add Medical Coding tab to navigation after Clinical Data, render MedicalCodingTab when tab active, pass appointment_id prop)
- [ ] Implement combination code display (in CodingTable: if is_primary=true show Primary Code badge, display alternatives as indented secondary codes, group visually)
- [ ] Add action confirmations (before approve/reject/modify: confirm dialog with code and diagnosis, validate staff permission, show error toast if API fails)
- [ ] Add CSS styling (ConfidenceBadge: green #D4EDDA, yellow #FFF3CD, red #F8D7DA, table alternating rows, actions dropdown with icons checkmark/X/pencil/eye, responsive <768px mobile layout)
- [ ] Write unit tests (test Generate Codes button triggers API, test Approve/Reject/Edit actions call hooks, test bulk approve enabled logic, test search box debounce, test modal open/close, test confidence badge colors, test combination code display)
