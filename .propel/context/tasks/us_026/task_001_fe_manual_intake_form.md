# Task - TASK_001_FE_MANUAL_INTAKE_FORM

## Requirement Reference
- User Story: US_026
- Story Location: `.propel/context/tasks/us_026/us_026.md`
- Acceptance Criteria:
    - AC1: Traditional form view with sections (Demographics, Chief Complaint, Medical History, Medications, Allergies, Surgeries, Family History), pre-fills AI data, progress indicator, inline validation, auto-saves every 30 seconds
- Edge Cases:
    - Switch from manual to AI: Preserve all form data, AI resumes with incomplete sections
    - Required fields: Asterisks, prevent submission if incomplete, scroll to first missing field
    - JavaScript disabled: Server-side rendered form fallback, show "Enable JavaScript" banner

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-007 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-007-intake-form.html |
| **Screen Spec** | SCR-007 (Manual mode: multi-section accordion form) |
| **UXR Requirements** | UXR-003 (Draft auto-save every 30s for error recovery), UXR-501 (Inline validation), UXR-502 (Clear error messages) |
| **Design Tokens** | Section headers: #1976D2 blue, Required asterisk: #DC3545 red, Auto-save indicator: #4CAF50 green, Progress bar: multi-color segments |

> **Wireframe Components:**
> - Form layout: Multi-section accordion (expand/collapse)
> - Section headers: Demographics, Chief Complaint (required), Medical History, Current Medications, Allergies, Previous Surgeries, Family History
> - Progress bar: Top "40% Complete - 4 of 10 sections" with colored segments
> - Auto-save indicator: "Draft saved at 2:35 PM" green text (top-right)
> - Mode toggle: "Switch to AI Mode" button (top-right)
> - Field types: Text inputs, dropdowns (medications with autocomplete), checkboxes (allergies), date pickers, textareas
> - Required markers: Red asterisks on required fields
> - Submit button: Bottom-right "Submit Intake" disabled until required fields filled

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | React | 18.2.x |
| Frontend | TypeScript | 5.3.x |
| Frontend | Formik | 2.x |
| Frontend | Yup | 1.x |
| Backend | Express | 4.x |
| Database | PostgreSQL | 16.x |
| AI/ML | N/A | N/A |

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No (Manual fallback, no AI processing) |
| **AIR Requirements** | AIR-007 (Manual override available) |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | Yes (Responsive) |
| **Platform Target** | Web |
| **Min OS Version** | iOS 14+, Android 10+ |
| **Mobile Framework** | React |

## Task Overview
Implement manual intake form: (1) IntakeManualForm component with accordion sections (Demographics, Chief Complaint, Medical History, Medications, Allergies, Surgeries, Family History), (2) Formik + Yup validation with inline errors, (3) Pre-fills data from route state (AI-collected data), (4) Auto-save draft to localStorage every 30 seconds (error recovery per UXR-003), (5) Progress bar shows completion percentage (count completed sections / 7 total), (6) Required field asterisks, scroll to first error on submit attempt, (7) "Switch to AI Mode" button with confirmation modal, (8) Medication autocomplete using react-select, (9) Submit → POST /api/intake/manual → saves to ClinicalDocuments, (10) Responsive accordion (collapse sections on mobile).

## Dependent Tasks
- US_025 Task 001: AI chat interface (provides pre-filled data on mode switch)
- US_003 Task 001: ClinicalDocuments table (data submission target)

## Impacted Components
**New:**
- app/src/components/IntakeManualForm.tsx (Form with accordion sections)
- app/src/components/IntakeSection.tsx (Reusable accordion section)
- app/src/components/MedicationAutocomplete.tsx (Autocomplete for medication names)
- app/src/hooks/useIntakeAutoSave.ts (Auto-save to localStorage every 30s)
- app/src/pages/IntakeManual.tsx (Page container)

**Modified:**
- app/src/types/intake.types.ts (Add IntakeFormData type)

## Implementation Plan
1. Create IntakeFormData type: { demographics: {...}, chiefComplaint, medicalHistory, medications[], allergies[], surgeries[], familyHistory }
2. Implement IntakeManualForm: Formik with 7 sections, pre-fills from location.state (AI data)
3. Accordion sections: Demographics (first/last name*, DOB*, phone*, email, address), Chief Complaint* (textarea 500 chars), Medical History (chronic conditions, hospitalizations), Medications (name, dosage, frequency), Allergies (allergen, reaction), Surgeries (procedure, date), Family History (conditions by relative)
4. Yup validation: Required fields (marked with *), email format, phone format, DOB (must be past), medications array schema
5. Auto-save: useIntakeAutoSave hook → setInterval 30s → saves Formik values to localStorage (key: intake_draft:{patientId})
6. Progress calculation: Count sections with >=1 filled field / 7 total * 100
7. Progress bar: Colored segments (green for completed, gray for empty), percentage text
8. Auto-save indicator: "Draft saved at [time]" green text, fades after 3s
9. Switch to AI: Button opens confirmation modal "Switch to AI mode? Your progress will be preserved.", navigates to /intake/ai with state={formikValues}
10. Submit: POST /api/intake/manual with all form data, clear localStorage draft on success

## Current Project State
```
ASSIGNMENT/app/src/
├── pages/ (dashboard, booking pages exist)
├── components/ (booking components exist)
└── (intake form components to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/IntakeManualForm.tsx | Form with accordion sections |
| CREATE | app/src/components/IntakeSection.tsx | Reusable accordion section |
| CREATE | app/src/components/MedicationAutocomplete.tsx | Medication name autocomplete |
| CREATE | app/src/hooks/useIntakeAutoSave.ts | Auto-save hook (localStorage every 30s) |
| CREATE | app/src/pages/IntakeManual.tsx | Manual intake page |
| UPDATE | app/src/types/intake.types.ts | Add IntakeFormData type |

## External References
- [React Accordion](https://www.npmjs.com/package/react-accessible-accordion)
- [Formik Field Arrays](https://formik.org/docs/api/fieldarray)
- [react-select Autocomplete](https://react-select.com/)
- [UXR-003 Error Recovery](../../../.propel/context/docs/spec.md#UXR-003)
- [AIR-007 Manual Override](../../../.propel/context/docs/spec.md#AIR-007)

## Build Commands
```bash
cd app
npm install react-accessible-accordion react-select
npm run dev
```

## Implementation Validation Strategy
- [ ] Unit tests: useIntakeAutoSave saves to localStorage every 30s
- [ ] Integration tests: Submit form → data saved to ClinicalDocuments
- [ ] Form renders: Navigate to /intake/manual → see accordion sections
- [ ] Accordion works: Click section header → expands/collapses content
- [ ] Pre-fill from AI: Navigate with state from AI chat → form fields populated
- [ ] Required asterisks: Demographics section shows asterisks on name, DOB, phone
- [ ] Inline validation: Enter invalid email → see "Invalid email format" error below field
- [ ] Medication autocomplete: Start typing "Aspirin" → see suggestions
- [ ] Auto-save works: Fill fields → wait 30s → see "Draft saved at [time]" indicator
- [ ] Draft recovery: Refresh page → form data restored from localStorage
- [ ] Progress bar updates: Fill 3 sections → progress shows "43% Complete - 3 of 7 sections"
- [ ] Submit validation: Try submit with empty required fields → scroll to first error, display "Please complete all required fields"
- [ ] Switch to AI: Click "Switch to AI Mode" → confirmation modal → navigate with form data preserved
- [ ] Submit success: Fill all required → submit → success toast → redirect to dashboard
- [ ] Responsive: Test mobile → sections stack, auto-save indicator moves to top
- [ ] WCAG AA: Tab navigation, ARIA labels, screen reader announces section expansions

## Implementation Checklist
- [ ] Install dependencies: `npm install react-accessible-accordion react-select`
- [ ] Create IntakeFormData type in intake.types.ts
- [ ] Implement IntakeSection.tsx accordion component
- [ ] Implement MedicationAutocomplete.tsx with react-select
- [ ] Implement useIntakeAutoSave.ts hook
- [ ] Implement IntakeManualForm.tsx with Formik + Yup + auto-save
- [ ] Create IntakeManual.tsx page
- [ ] Add routing: /intake/manual → IntakeManual page
- [ ] Test auto-save + draft recovery
- [ ] Test mode switching (AI ↔ Manual)
- [ ] Validate WCAG AA compliance
- [ ] Document manual intake in app/README.md
