# Task - TASK_003: Frontend Patient Search Component

## Requirement Reference
- User Story: [us_023]
- Story Location: [.propel/context/tasks/us_023/us_023.md]
- Acceptance Criteria:
    - AC1: Search for patient by phone/email/name, select them from results dropdown
- Edge Case:
    - EC1: Patient doesn't exist in system - Display "Patient not found" with "Register New Patient" button

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-003-staff-dashboard.html, .propel/context/wireframes/Hi-Fi/wireframe-SCR-006-appointment-booking.html |
| **Screen Spec** | .propel/context/docs/figma_spec.md#SCR-003, #SCR-006 |
| **UXR Requirements** | UXR-001 (Quick booking flow), UXR-501 (Inline validation) |
| **Design Tokens** | .propel/context/docs/designsystem.md#forms, #dropdowns |

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
Create PatientSearchBox component with debounced search input (300ms delay), calls GET /api/staff/patients/search on typing, displays dropdown results with patient name, DOB, phone, email when matches found. Support search by any field (phone/email/name). When patient selected, emit onPatientSelect event with patient object. If no results, display "No patients found" message with "Register New Patient" button that opens registration modal (or navigates to registration page). Add loading spinner during search, clear results on input clear, minimum 2 characters before triggering search.

## Dependent Tasks
- TASK_001: Backend Patient Search API (provides GET /api/staff/patients/search endpoint)
- US_020 TASK_001: Frontend base components (may reuse dropdown/input styling)

## Impacted Components
- **CREATE** app/src/components/staff/PatientSearchBox.tsx - Search input with dropdown results
- **CREATE** app/src/components/staff/PatientSearchResult.tsx - Individual result item in dropdown
- **CREATE** app/src/hooks/usePatientSearch.ts - Custom hook for debounced search API calls
- **CREATE** app/src/types/patient.types.ts - Patient, PatientSearchResult interfaces
- **CREATE** app/src/components/staff/RegisterNewPatientButton.tsx - Button displayed when no results (placeholder for future registration feature)

## Implementation Plan
1. **Create patient.types.ts**: Define Patient interface (id, first_name, last_name, date_of_birth, phone, email, last_visit_date), PatientSearchResult interface (same as Patient for now)
2. **Create usePatientSearch hook**: Accept query string, use useDebounce (300ms) for input, use useEffect to call API when debounced query changes and length >= 2, return { results, loading, error, clearResults }
3. **Create PatientSearchResult.tsx**: Display single result as dropdown item - show full name (bold), DOB YYYY-MM-DD (gray), phone (gray), email (gray), onClick calls parent onSelect handler with patient object
4. **Create PatientSearchBox.tsx**: Render search input with label "Search Patient by Name, Phone, or Email", call usePatientSearch hook, display loading spinner in input when loading=true, show dropdown with results when results.length > 0, show "No patients found" + RegisterNewPatientButton when results.length === 0 and query.length >= 2
5. **Create RegisterNewPatientButton.tsx**: Button with label "Register New Patient", onClick opens modal or navigates to /staff/patients/register (placeholder - implementation in future US), secondary button style
6. **Add Dropdown Styling**: Absolute positioned dropdown below input, z-index 1000, white background, box-shadow, max-height 400px with scroll, each result item has hover background color, border-radius 4px
7. **Add Input Styling**: Full-width input with search icon (magnifying glass) on left, clear button (X icon) on right when input has value, 40px height, border-radius 8px, focus state with blue outline
8. **Add Keyboard Navigation**: Up/Down arrows navigate results, Enter selects highlighted result, Escape closes dropdown

**Focus on how to implement**: useDebounce hook uses setTimeout to delay API call. API call: axios.get('/api/staff/patients/search', { params: { name: query } }) - backend searches across all fields with single query param. Dropdown uses conditional rendering: {showDropdown && <div className="dropdown">...</div>}. Clear button: {query && <button onClick={clearInput}>✕</button>}. Loading state shows spinner icon inside input field. Selected patient emitted via onPatientSelect(patient) callback prop. Results array mapped to <PatientSearchResult key={patient.id} patient={patient} onClick={handleSelect} />.

## Current Project State
```
app/
├── src/
│   ├── pages/
│   │   └── StaffBookingPage.tsx (to be created in TASK_004, will use PatientSearchBox)
│   ├── components/
│   │   ├── staff/
│   │   │   └── (PatientSearchBox.tsx, PatientSearchResult.tsx, RegisterNewPatientButton.tsx to be created)
│   │   └── common/
│   │       ├── Input.tsx (may exist, reusable input component)
│   │       └── Spinner.tsx (may exist, loading spinner component)
│   ├── hooks/
│   │   ├── useDebounce.ts (may exist, or create)
│   │   └── (usePatientSearch.ts to be created)
│   ├── types/
│   │   └── (patient.types.ts to be created)
│   └── App.tsx
└── public/
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/types/patient.types.ts | Patient, PatientSearchResult interfaces with id, name, DOB, contact fields |
| CREATE | app/src/hooks/usePatientSearch.ts | Debounced search hook calling GET /api/staff/patients/search |
| CREATE | app/src/components/staff/PatientSearchBox.tsx | Main search input with dropdown results, loading, and no results state |
| CREATE | app/src/components/staff/PatientSearchResult.tsx | Individual result item with patient details and onClick handler |
| CREATE | app/src/components/staff/RegisterNewPatientButton.tsx | Secondary button for patient registration (placeholder) |
| CREATE | app/src/hooks/useDebounce.ts | Utility hook for debouncing input (if doesn't exist) |

## External References
- **React Debouncing**: https://www.freecodecamp.org/news/debouncing-in-react/ - Custom useDebounce hook implementation
- **Dropdown Components**: https://react-spectrum.adobe.com/react-aria/useCombobox.html - Accessible autocomplete patterns
- **Keyboard Navigation**: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/ - ARIA combobox keyboard interactions
- **CSS Dropdown Positioning**: https://css-tricks.com/popper-css-position-elements/ - Positioning dropdowns with CSS
- **React Hook Form**: https://react-hook-form.com/ - Form handling (if integrating with booking form)

## Build Commands
- Install dependencies: `npm install` (in app directory)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start Vite dev server)
- Run tests: `npm test` (unit tests for patient search component)
- Type check: `npm run type-check` (validate TypeScript)

## Implementation Validation Strategy
- [x] Unit tests pass for usePatientSearch hook (test debouncing, API call, error handling)
- [x] Visual comparison against wireframe completed at 375px, 768px, 1440px
- [x] Run `/analyze-ux` to validate wireframe alignment
- [x] Search triggers after 2 characters typed
- [x] Debounce works: typing rapidly waits 300ms before API call
- [x] Dropdown displays with results, each result shows name, DOB, phone, email
- [x] Clicking result calls onPatientSelect with patient object
- [x] "No patients found" message displays when no results
- [x] Loading spinner shows during API call
- [x] Keyboard navigation: Arrow keys navigate, Enter selects, Escape closes

## Implementation Checklist
- [ ] Reference wireframes at .propel/context/wireframes/Hi-Fi/wireframe-SCR-003-staff-dashboard.html and wireframe-SCR-006-appointment-booking.html during implementation
- [ ] Create patient.types.ts (export interface Patient with id: string, first_name: string, last_name: string, date_of_birth: string, phone: string, email: string, last_visit_date?: string)
- [ ] Create useDebounce.ts hook (accept value and delay, return debounced value using useState and useEffect with setTimeout cleanup)
- [ ] Create usePatientSearch.ts hook (accept query: string, use useDebounce(query, 300), useEffect to call axios.get when debouncedQuery.length >= 2, return {results: Patient[], loading: boolean, error: string | null, clearResults: () => void})
- [ ] Create PatientSearchResult.tsx component (props: patient, onClick, render div with patient name in bold, DOB/phone/email in gray smaller text, onClick handler passes patient to parent, hover background color change)
- [ ] Create PatientSearchBox.tsx component (props: onPatientSelect: (patient: Patient) => void, render input with search icon left, clear button right if query exists, call usePatientSearch, conditionally render dropdown with results list or "No patients found" message + RegisterNewPatientButton, show loading spinner when loading=true)
- [ ] Create RegisterNewPatientButton.tsx component (render button with text "Register New Patient", onClick={onRegister} prop, secondary button styling, placeholder for future feature)
- [ ] Add CSS for dropdown (position: absolute, top: 100%, left: 0, width: 100%, max-height: 400px, overflow-y: auto, background: white, box-shadow: 0 4px 6px rgba(0,0,0,0.1), border-radius: 4px, z-index: 1000)
