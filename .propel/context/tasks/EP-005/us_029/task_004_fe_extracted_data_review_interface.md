# Task - TASK_004: Frontend Extracted Data Review Interface

## Requirement Reference
- User Story: [us_029]
- Story Location: [.propel/context/tasks/us_029/us_029.md]
- Acceptance Criteria:
    - AC1: Display extraction status badge on documents (Processing, Processed, Needs Review, Failed)
    - AC1: Show extracted data in readable format with confidence indicators
    - AC1: Allow staff to edit low-confidence fields inline
    - AC1: Provide "Approve" button to commit reviewed data
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
| **UXR Requirements** | AIR-Q01 (>95% accuracy), AIR-Q03 (Format agnostic), UXR-401 (Processing status updates <200ms) |
| **Design Tokens** | .propel/context/docs/designsystem.md#colors, #badges, #forms |

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
| Frontend | React Hook Form | 7.x |
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
Create frontend interface for viewing and reviewing AI-extracted clinical data. Add extraction status badge to document thumbnails in upload gallery: "Processing" (blue spinner icon), "Processed" (green checkmark), "Needs Review" (yellow warning triangle), "Extraction Failed" (red X). Add "View Extracted Data" button on each document that opens side panel or modal showing extracted fields in readable form layout with sections: Patient Information (patient_name, date_of_birth), Document Details (document_date, provider_name, facility_name), Diagnosed Conditions (list), Prescribed Medications (table with name, dosage, frequency), Lab Test Results (table with test_name, value, unit, reference_range), Allergies (list). Display confidence indicator next to each field: green chip ">90%" for high confidence, yellow chip "80-90%" for medium, red chip "<80%" for low. Enable inline editing for low-confidence fields (<80%) with input validation. Add "Approve & Save" button at bottom that calls PATCH /api/documents/:id/review with corrected data, reviewed_by_staff_id, review_notes. Show success toast "Data approved successfully" and close panel. Add "Manual Extraction" button for failed documents that calls POST /api/documents/:id/extract to retry. Poll extraction status every 5 seconds when status is "Processing" to update badge in real-time.

## Dependent Tasks
- TASK_001: Database Migration (extraction fields)
- TASK_002: AI Extraction Service (data source)
- TASK_003: Backend Extraction API (endpoints)

## Impacted Components
- **CREATE** app/src/components/documents/ExtractionStatusBadge.tsx - Status badge with color coding
- **CREATE** app/src/components/documents/ExtractedDataPanel.tsx - Side panel/modal for viewing data
- **CREATE** app/src/components/documents/ConfidenceIndicator.tsx - Color-coded confidence chip
- **CREATE** app/src/components/documents/EditableField.tsx - Inline editable form field
- **CREATE** app/src/components/documents/MedicationsTable.tsx - Table for medications with dosage/frequency
- **CREATE** app/src/components/documents/LabResultsTable.tsx - Table for lab results
- **CREATE** app/src/hooks/useExtractedData.ts - Custom hook for fetching and updating extracted data
- **MODIFY** app/src/components/documents/DocumentThumbnail.tsx - Add extraction status badge
- **MODIFY** app/src/pages/DocumentUploadPage.tsx - Integrate extracted data panel

## Implementation Plan
1. **Create ExtractionStatusBadge.tsx**: Props: status ('Processing' | 'Processed' | 'Needs Review' | 'Extraction Failed'), render badge with icon and text, color mapping: Processing = blue with spinner, Processed = green with checkmark, Needs Review = yellow with warning triangle, Extraction Failed = red with X icon, small badge size to fit on thumbnail corner
2. **Create ConfidenceIndicator.tsx**: Props: confidence (number 0-100), render colored chip with percentage text, color logic: if confidence >= 90 green, if 80-89 yellow, if <80 red, show with "✓" icon for high confidence, "!" icon for low, tooltip on hover explaining confidence meaning
3. **Create EditableField.tsx**: Props: label, value, confidence, editable (boolean), onChange, render as read-only text if not editable or confidence >=80, render as input field if editable and confidence <80, highlight with yellow border if editable, show confidence indicator inline, validate input on blur and show error message
4. **Create MedicationsTable.tsx**: Props: medications array [{name, dosage, frequency, confidence}], render table with columns: Medication Name, Dosage, Frequency, Confidence, each cell shows EditableField if confidence <80 else plain text with ConfidenceIndicator, allow add/remove rows if in edit mode
5. **Create LabResultsTable.tsx**: Props: lab_results array [{test_name, value, unit, reference_range, confidence}], render table with columns: Test Name, Value, Unit, Reference Range, Confidence, similar editable logic as MedicationsTable, highlight abnormal values outside reference_range
6. **Create useExtractedData hook**: Implement fetchExtractedData(documentId) calling GET /api/documents/:id/extracted-data, return {data, loading, error, refetch}, implement approveData(documentId, correctedData, reviewNotes) calling PATCH /api/documents/:id/review, implement retryExtraction(documentId) calling POST /api/documents/:id/extract, implement polling logic: if status is 'Processing' poll every 5 seconds until status changes
7. **Create ExtractedDataPanel.tsx**: Props: isOpen, documentId, onClose, use useExtractedData hook to fetch data, render side panel (drawer from right) or modal, show loading spinner while fetching, display sections: Patient Information, Document Details, Diagnosed Conditions, Medications, Lab Results, Allergies, each field with EditableField and ConfidenceIndicator, track edited fields in local state using React Hook Form, "Approve & Save" button at bottom calls approveData with corrected values and closes panel, "Cancel" button closes without saving, if status is 'Extraction Failed' show error message and "Retry Extraction" button
8. **Modify DocumentThumbnail.tsx**: Add ExtractionStatusBadge in top-right corner of thumbnail card (absolute positioning), add "View Extracted Data" button below existing View/Delete buttons, onClick opens ExtractedDataPanel with document_id
9. **Modify DocumentUploadPage.tsx**: Add state for selected document and panel open status, render ExtractedDataPanel when open with selected documentId, pass onClose handler to close panel
10. **Add real-time status updates**: In useExtractedData hook, when status is 'Processing' start interval polling every 5 seconds: setInterval(() => refetch(), 5000), clear interval when status changes or component unmounts, update ExtractionStatusBadge automatically when status changes
11. **Add form validation**: Use React Hook Form with Zod resolver to validate edited fields match expected formats (dates in YYYY-MM-DD, medications have required fields, numeric lab values), show validation errors inline, disable "Approve & Save" button if form invalid
12. **Add success/error handling**: On successful approval show success toast "Data approved successfully", refetch documents list to update status badge, on error show error toast with message from API response

**Focus on how to implement**: Status badge: `{status === 'Processing' && <span className="badge badge-blue"><SpinnerIcon /> Processing</span>}`. Confidence indicator: `<span className={confidence >= 90 ? 'chip-green' : confidence >= 80 ? 'chip-yellow' : 'chip-red'}>{confidence}%</span>`. Editable field: `{editable && confidence < 80 ? <input value={value} onChange={onChange} className="input-warning" /> : <span>{value} <ConfidenceIndicator confidence={confidence} /></span>}`. Fetch data: `const {data, loading, error, refetch} = useExtractedData(documentId); useEffect(() => { if (data?.extraction_status === 'Processing') { const interval = setInterval(refetch, 5000); return () => clearInterval(interval); }}, [data?.extraction_status]);`. Approve: `const handleApprove = async () => { const correctedData = getValues(); await approveData(documentId, correctedData, reviewNotes); toast.success('Data approved'); onClose(); };`. Side panel: `<div className={isOpen ? 'panel panel-open' : 'panel panel-closed'} style={{position: 'fixed', right: 0, top: 0, height: '100vh', width: '500px', background: 'white', boxShadow: '-2px 0 10px rgba(0,0,0,0.1)', transform: isOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s'}}> ... </div>`.

## Current Project State
```
app/
├── src/
│   ├── pages/
│   │   └── DocumentUploadPage.tsx (US_028, to be modified)
│   ├── components/
│   │   └── documents/
│   │       ├── DocumentThumbnail.tsx (US_028, to be modified)
│   │       ├── ExtractionStatusBadge.tsx (to be created)
│   │       ├── ExtractedDataPanel.tsx (to be created)
│   │       ├── ConfidenceIndicator.tsx (to be created)
│   │       ├── EditableField.tsx (to be created)
│   │       ├── MedicationsTable.tsx (to be created)
│   │       └── LabResultsTable.tsx (to be created)
│   └── hooks/
│       └── useExtractedData.ts (to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/documents/ExtractionStatusBadge.tsx | Color-coded status badge with icons |
| CREATE | app/src/components/documents/ExtractedDataPanel.tsx | Side panel for viewing/editing extracted data |
| CREATE | app/src/components/documents/ConfidenceIndicator.tsx | Confidence percentage chip (green/yellow/red) |
| CREATE | app/src/components/documents/EditableField.tsx | Inline editable field with validation |
| CREATE | app/src/components/documents/MedicationsTable.tsx | Table for medications data |
| CREATE | app/src/components/documents/LabResultsTable.tsx | Table for lab results data |
| CREATE | app/src/hooks/useExtractedData.ts | Hook for fetching/updating extracted data with polling |
| MODIFY | app/src/components/documents/DocumentThumbnail.tsx | Add extraction status badge and View Extracted Data button |
| MODIFY | app/src/pages/DocumentUploadPage.tsx | Integrate ExtractedDataPanel |

## External References
- **React Hook Form**: https://react-hook-form.com/ - Form state management and validation
- **Zod with React Hook Form**: https://react-hook-form.com/get-started#SchemaValidation - Schema validation
- **React Polling Pattern**: https://www.robinwieruch.de/react-polling/ - Implement interval polling
- **CSS Modules**: https://github.com/css-modules/css-modules - Scoped styling
- **Badge Design Patterns**: https://www.nngroup.com/articles/indicators-validations-notifications/ - UX best practices

## Build Commands
- Build TypeScript: `npm run build` (compile src/ to dist/)
- Run in development: `npm run dev` (start Vite dev server)
- Run tests: `npm test` (unit tests for extraction components)
- Type check: `npm run type-check`

## Implementation Validation Strategy
- [x] Reference wireframe at .propel/context/wireframes/Hi-Fi/wireframe-SCR-010-clinical-data-review.html during implementation
- [x] Visual comparison against wireframe at 375px, 768px, 1440px
- [x] Run `/analyze-ux` to validate wireframe alignment
- [x] ExtractionStatusBadge displays correct icon and color for each status
- [x] "View Extracted Data" button opens ExtractedDataPanel
- [x] ExtractedDataPanel displays all sections with extracted data
- [x] ConfidenceIndicator shows correct color based on percentage
- [x] Low-confidence fields (<80%) are editable
- [x] High-confidence fields (≥80%) are read-only
- [x] Form validation prevents invalid data submission
- [x] "Approve & Save" button calls API and updates status
- [x] Success toast appears after approval
- [x] "Retry Extraction" button appears for failed documents
- [x] Status polling updates badge every 5 seconds during processing
- [x] Panel closes after successful approval

## Implementation Checklist
- [ ] Reference wireframe at .propel/context/wireframes/Hi-Fi/wireframe-SCR-010-clinical-data-review.html during implementation
- [ ] Create app/src/components/documents/ExtractionStatusBadge.tsx (props: status, render badge with icon and color: Processing=blue+spinner, Processed=green+checkmark, Needs Review=yellow+warning, Extraction Failed=red+X)
- [ ] Create app/src/components/documents/ConfidenceIndicator.tsx (props: confidence number 0-100, render chip with color: >=90 green, 80-89 yellow, <80 red, show percentage text and icon)
- [ ] Create app/src/components/documents/EditableField.tsx (props: label, value, confidence, editable, onChange, render input if editable and confidence <80 else read-only text with ConfidenceIndicator, validate on blur)
- [ ] Create app/src/components/documents/MedicationsTable.tsx (props: medications array, render table with columns name/dosage/frequency/confidence, use EditableField for low confidence cells)
- [ ] Create app/src/components/documents/LabResultsTable.tsx (props: lab_results array, render table with columns test_name/value/unit/reference_range/confidence, highlight abnormal values, use EditableField)
- [ ] Create app/src/hooks/useExtractedData.ts (fetchExtractedData function calling GET /api/documents/:id/extracted-data, approveData calling PATCH /api/documents/:id/review, retryExtraction calling POST /api/documents/:id/extract, polling logic with setInterval for 'Processing' status)
- [ ] Create app/src/components/documents/ExtractedDataPanel.tsx (props: isOpen, documentId, onClose, use useExtractedData hook, render side panel with sections: Patient Info, Document Details, Conditions, Medications table, Lab Results table, Allergies, React Hook Form for editing, Approve & Save button, Cancel button, loading spinner, error message for failed extraction with Retry button)
- [ ] Modify app/src/components/documents/DocumentThumbnail.tsx (add ExtractionStatusBadge in top-right corner with absolute position, add View Extracted Data button below View/Delete buttons, onClick opens panel)
- [ ] Modify app/src/pages/DocumentUploadPage.tsx (add state for selectedDocumentId and isPanelOpen, render ExtractedDataPanel when open, pass documentId and onClose handler)
- [ ] Implement polling in useExtractedData (useEffect: if status='Processing' start 5s interval calling refetch, cleanup interval on status change or unmount)
- [ ] Add form validation with Zod schemas (validate dates YYYY-MM-DD format, medications have name/dosage/frequency, lab values are numeric, use zodResolver with React Hook Form)
- [ ] Add success/error handling (on approve success show toast and close panel, on error show error toast with API message, on retry show "Extraction restarted" message)
