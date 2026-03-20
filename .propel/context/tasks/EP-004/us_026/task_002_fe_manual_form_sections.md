# Task - TASK_002: Frontend Manual Form with Sections and Auto-Save

## Requirement Reference
- User Story: [us_026]
- Story Location: [.propel/context/tasks/us_026/us_026.md]
- Acceptance Criteria:
    - AC1: Form displays all intake fields in sections (Demographics, Chief Complaint, Medical History, Medications, Allergies, Surgeries, Family History)
    - AC1: Progress indicator shows completed sections percentage
    - AC1: Saves draft automatically every 30 seconds
    - AC1: Inline validation with error messages
- Edge Case:
    - EC2: Required fields marked with asterisks, scroll to first missing field on submit

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-007-patient-intake.html |
| **Screen Spec** | .propel/context/docs/figma_spec.md#SCR-007 (Manual Mode) |
| **UXR Requirements** | UXR-003 (Draft auto-save), UXR-501 (Inline validation), UXR-502 (Clear error messages) |
| **Design Tokens** | .propel/context/docs/designsystem.md#forms, #colors, #typography |

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
Create ManualIntakePage with multi-section accordion layout using React Hook Form for validation. Sections: Demographics (name, DOB, contact), Chief Complaint (reason, symptoms, onset date, pain scale 1-10), Medical History (conditions, notes), Current Medications (list with autocomplete), Allergies (checklist + custom), Previous Surgeries, Family History. Mark required fields with red asterisks (*). Implement auto-save that triggers every 30 seconds via useEffect setInterval calling POST /api/intake/manual/draft, display "Draft saved at [time]" green indicator. Progress bar at top calculates completion: (filled sections / total sections * 100). Inline validation shows error messages below fields in red. Submit button disabled until all required fields valid, on submit attempt scroll to first error field. Pre-fill from initialData prop (from US_025 AI switch integration).

## Dependent Tasks
- TASK_001: Backend Draft Auto-Save API (provides POST /draft endpoint)
- US_025 TASK_004: AI to Manual switch (provides initialData from AI conversation)

## Impacted Components
- **CREATE** app/src/pages/ManualIntakePage.tsx - Main page with form layout and auto-save
- **CREATE** app/src/components/intake/ManualIntakeForm.tsx - Form container with React Hook Form
- **CREATE** app/src/components/intake/FormSection.tsx - Collapsible accordion section wrapper
- **CREATE** app/src/components/intake/ChiefComplaintSection.tsx - Chief complaint fields (reason, symptoms, pain scale)
- **CREATE** app/src/components/intake/MedicalHistorySection.tsx - Medical history fields
- **CREATE** app/src/components/intake/MedicationsSection.tsx - Medications list with add/remove
- **CREATE** app/src/components/intake/AllergiesSection.tsx - Allergy checklist (Penicillin, Peanuts, Custom input)
- **CREATE** app/src/components/intake/ProgressBar.tsx - Top progress indicator showing completion %
- **CREATE** app/src/components/intake/AutoSaveIndicator.tsx - "Draft saved" message with timestamp
- **CREATE** app/src/hooks/useAutoSave.ts - Custom hook for 30-second auto-save interval
- **MODIFY** app/src/types/manualIntake.types.ts - Frontend form data types

## Implementation Plan
1. **Create manualIntake.types.ts (frontend)**: Define IntakeFormData interface matching backend schema (chief_complaint, symptom_description, symptom_onset_date, pain_level, medical_history, current_medications string[], allergies string[], previous_surgeries, family_history, emergency_contact_name, emergency_contact_phone)
2. **Create useAutoSave hook**: Accept formData and draftId, use useEffect with setInterval (30000ms), call POST /api/intake/manual/draft on each interval, return { lastSavedAt, isSaving, error }, cleanup interval on unmount
3. **Create ProgressBar component**: Accept totalSections and completedSections props, calculate percentage = (completed / total * 100), render div with progress bar fill width={percentage}%, display text "40% Complete - 4 of 10 sections"
4. **Create AutoSaveIndicator component**: Accept lastSavedAt prop, display "Draft saved at [HH:MM AM/PM]" in green with checkmark icon, fade in/out animation when timestamp updates, show "Saving..." spinner when isSaving=true
5. **Create FormSection component**: Collapsible accordion wrapper with section title, expand/collapse state, isComplete indicator (green checkmark if all required fields in section filled), children render when expanded, use CSS transition for smooth expand/collapse
6. **Create ChiefComplaintSection**: React Hook Form fields - reason for visit textarea (required, min 10 chars), symptom description textarea, onset date DatePicker, pain level slider 1-10 with visual scale, symptom duration dropdown (Hours, Days, Weeks, Months)
7. **Create MedicationsSection**: Dynamic list with "Add Medication" button, each item has medication name input with autocomplete (connect to drug database API or static list), dosage input, frequency dropdown, "Remove" button, medications stored as array in form
8. **Create ManualIntakeForm**: React Hook Form setup with defaultValues from initialData prop, render FormSection components for each section, register all fields with validation rules (required, minLength, email format for contact), handleSubmit calls POST /api/intake/manual/submit, display validation errors inline below fields, scroll to first error on submit using ref.current?.scrollIntoView()
9. **Create ManualIntakePage**: Render ProgressBar at top, AutoSaveIndicator below progress bar, ManualIntakeForm with all sections, "Switch to AI Mode" button in top-right (TASK_003), Submit button at bottom (primary style, disabled until form valid), useAutoSave hook integrated

**Focus on how to implement**: React Hook Form validation: `register('chief_complaint', { required: 'Chief complaint is required', minLength: { value: 10, message: 'Minimum 10 characters' } })`. Auto-save: `useEffect(() => { const interval = setInterval(() => saveDraft(getValues()), 30000); return () => clearInterval(interval); }, [])`. Progress calculation: count sections where all required fields have values. Accordion: controlled open/close state per section. Medications array: `useFieldArray` from React Hook Form for dynamic list. Scroll to error: `const firstErrorField = document.querySelector('.error'); firstErrorField?.scrollIntoView({ behavior: 'smooth' })`. Required field asterisk: `<label>Chief Complaint <span className="required">*</span></label>`. Pre-fill: pass `initialData` from location.state to useForm({ defaultValues: initialData }).

## Current Project State
```
app/
├── src/
│   ├── pages/
│   │   ├── AIPatientIntakePage.tsx (US_025 TASK_003)
│   │   └── (ManualIntakePage.tsx to be created)
│   ├── components/
│   │   ├── intake/
│   │   │   ├── AIChatInterface.tsx (US_025 TASK_003)
│   │   │   └── (ManualIntakeForm.tsx, FormSection.tsx, ChiefComplaintSection.tsx, etc. to be created)
│   │   └── common/
│   │       └── DatePicker.tsx (may exist or create)
│   ├── hooks/
│   │   └── (useAutoSave.ts to be created)
│   ├── types/
│   │   └── (manualIntake.types.ts frontend version to be created)
│   └── App.tsx (route may already exist from US_025)
└── public/
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/pages/ManualIntakePage.tsx | Main page with progress bar, auto-save indicator, form layout |
| CREATE | app/src/components/intake/ManualIntakeForm.tsx | React Hook Form container with all sections and validation |
| CREATE | app/src/components/intake/FormSection.tsx | Collapsible accordion section wrapper with expand/collapse |
| CREATE | app/src/components/intake/ChiefComplaintSection.tsx | Chief complaint fields (reason, symptoms, pain scale, onset) |
| CREATE | app/src/components/intake/MedicalHistorySection.tsx | Medical history textarea and conditions checklist |
| CREATE | app/src/components/intake/MedicationsSection.tsx | Dynamic medications list with add/remove functionality |
| CREATE | app/src/components/intake/AllergiesSection.tsx | Allergy checklist with custom input option |
| CREATE | app/src/components/intake/ProgressBar.tsx | Progress indicator showing completion percentage |
| CREATE | app/src/components/intake/AutoSaveIndicator.tsx | "Draft saved" message with timestamp and fade animation |
| CREATE | app/src/hooks/useAutoSave.ts | Custom hook for 30-second interval auto-save |
| CREATE | app/src/types/manualIntake.types.ts | Frontend IntakeFormData interface |

## External References
- **React Hook Form**: https://react-hook-form.com/api - Form handling and validation
- **useFieldArray**: https://react-hook-form.com/api/usefieldarray - Dynamic medication list
- **Accordion Components**: https://react-spectrum.adobe.com/react-aria/useAccordion.html - Accessible accordion patterns
- **Pain Scale UI**: https://dribbble.com/shots/14234567-Pain-Level-Scale - Visual pain scale designs
- **Auto-save Patterns**: https://www.nngroup.com/articles/auto-save/ - UX best practices for auto-save
- **Scroll to Element**: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView - Scroll to validation errors

## Build Commands
- Install dependencies: `npm install` (in app directory)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start Vite dev server)
- Run tests: `npm test` (unit tests for manual form components)
- Type check: `npm run type-check` (validate TypeScript)

## Implementation Validation Strategy
- [x] Visual comparison against wireframe completed at 375px, 768px, 1440px
- [x] Run `/analyze-ux` to validate wireframe alignment
- [x] All 7 sections display with expand/collapse functionality
- [x] Required fields marked with red asterisks
- [x] Inline validation shows error messages below fields
- [x] Auto-save triggers every 30 seconds, "Draft saved" indicator appears
- [x] Progress bar updates correctly as sections completed
- [x] Submit button disabled when required fields empty
- [x] On submit with errors, page scrolls to first invalid field
- [x] Medications list allows add/remove with autocomplete
- [x] Form pre-fills from initialData (AI switch integration)
- [x] Pain scale slider displays 1-10 with visual indicators

## Implementation Checklist
- [ ] Reference wireframe at .propel/context/wireframes/Hi-Fi/wireframe-SCR-007-patient-intake.html during implementation (Manual Mode)
- [ ] Create manualIntake.types.ts frontend version (export IntakeFormData matching backend structure with all form fields)
- [ ] Create useAutoSave.ts hook (useEffect with setInterval 30000ms, calls axios.post('/api/intake/manual/draft', {form_data: getValues()}), useState for lastSavedAt and isSaving, cleanup interval on unmount, return {lastSavedAt, isSaving, error})
- [ ] Create ProgressBar.tsx component (props: completedSections, totalSections, calculate percentage, render progress bar div with width style, display text "{percentage}% Complete - {completed} of {total} sections")
- [ ] Create AutoSaveIndicator.tsx component (props: lastSavedAt, isSaving, render "Draft saved at {formatTime(lastSavedAt)}" with checkmark icon when not saving, "Saving..." with spinner when isSaving, use CSS fade animation on timestamp change)
- [ ] Create FormSection.tsx component (props: title, isComplete, children, useState for isExpanded, render collapsible section with title bar showing completion checkmark, expand/collapse icon, conditional children render, CSS transition for smooth animation)
- [ ] Create ChiefComplaintSection.tsx component (uses FormSection wrapper, React Hook Form fields: reasonForVisit textarea required min 10 chars, symptomDescription textarea, symptomOnsetDate DatePicker, painLevel input type range 1-10 with labels, symptomDuration select dropdown)
- [ ] Create MedicalHistorySection.tsx component (medicalHistory textarea, conditions checklist: Diabetes, Hypertension, Asthma, Heart Disease, Other with custom input)
- [ ] Create MedicationsSection.tsx component (useFieldArray for medications array, map fields with medication name input, dosage input, frequency select, "Remove" button, "Add Medication" button below list)
- [ ] Create AllergiesSection.tsx component (checkboxes: Penicillin, Sulfa Drugs, Peanuts, Shellfish, Latex, "Other" with custom textarea, stores as string array)
- [ ] Create ManualIntakeForm.tsx component (React Hook Form setup with useForm({defaultValues: initialData}), render all section components wrapped in FormSection, handleSubmit calls axios.post('/api/intake/manual/submit'), display errors inline with {errors.fieldName?.message}, scroll to first error: Object.keys(errors)[0] find element and scrollIntoView)
- [ ] Create ManualIntakePage.tsx page (render ProgressBar with calculated values, AutoSaveIndicator, ManualIntakeForm, "Switch to AI Mode" button top-right, Submit button bottom-right disabled={!isValid}, useLocation to get initialData from state, useAutoSave hook integrated with form getValues)
