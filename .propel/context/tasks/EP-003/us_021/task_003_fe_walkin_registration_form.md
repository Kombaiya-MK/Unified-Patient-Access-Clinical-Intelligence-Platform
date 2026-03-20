# Task - TASK_003: Frontend Walk-in Registration Form

## Requirement Reference
- User Story: [us_021]
- Story Location: [.propel/context/tasks/us_021/us_021.md]
- Acceptance Criteria:
    - AC1: Click "Register Walk-in" button on queue management page, opens modal
    - AC1: Fill quick registration form (patient name, phone, date of birth, chief complaint, preferred provider if any)
    - AC1: System searches existing patient by phone/DOB, auto-fills if found
    - AC1: Submit adds walk-in to queue with "Walk-in" badge
    - AC1: Success notification displays "Walk-in registered. Estimated wait: [X] min. SMS sent to patient."
- Edge Case:
    - EC1: Walk-in patient already registered - Search by phone/DOB, auto-fill existing patient details

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-009-queue-management.html |
| **Screen Spec** | .propel/context/docs/figma_spec.md#SCR-009 |
| **UXR Requirements** | UXR-001 (Quick check-in, max 2 minutes), UXR-501 (Inline validation), UXR-503 (Handle network errors) |
| **Design Tokens** | .propel/context/docs/designsystem.md#forms, #modals, #buttons |

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
| Frontend | React Hook Form | 7.x |
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
Create walk-in registration modal with form fields (patient name, phone, DOB, chief complaint, provider preference, urgent flag). Implement real-time patient search by phone/DOB to auto-fill existing patient data. Use React Hook Form for validation and submission. Display success toast with estimated wait time after registration. Integrate with backend API from TASK_001.

## Dependent Tasks
- TASK_001: Backend Walk-in Registration API (provides search and registration endpoints)
- US_020 TASK_001: Frontend Queue Table UI (hosts "Register Walk-in" button)

## Impacted Components
- **CREATE** app/src/components/walkin/WalkinRegistrationModal.tsx - Main modal component
- **CREATE** app/src/components/walkin/WalkinForm.tsx - Form component with validation
- **CREATE** app/src/components/walkin/PatientSearchField.tsx - Phone/DOB search with auto-fill
- **CREATE** app/src/components/walkin/WalkinRegistrationModal.css - Modal and form styles
- **CREATE** app/src/hooks/useWalkinRegistration.ts - Hook for API calls (search, register)
- **CREATE** app/src/types/walkin.types.ts - TypeScript interfaces for walk-in data
- **MODIFY** app/src/pages/QueueManagementPage.tsx - Add "Register Walk-in" button, modal state
- **MODIFY** app/src/components/common/Toast.tsx - Display success notification (create if not exists)

## Implementation Plan
1. **Create walkin.types.ts**: Define interfaces for `WalkinFormData`, `WalkinRegistrationResult`, `PatientSearchResult`
2. **Create useWalkinRegistration.ts**: Hook with functions:
   - `searchPatient(phone, dob)`: Call GET /api/staff/walkin/search, return patient details
   - `registerWalkin(data)`: Call POST /api/staff/walkin/register, return result with wait time
3. **Create PatientSearchField.tsx**: Component with phone input (formatted ###-###-####) and DOB input (date picker), debounced search on blur, displays "Existing patient found: [Name]" message when match, auto-fills form
4. **Create WalkinForm.tsx**: Form using React Hook Form with fields:
   - Patient Name (text, required if not found by search, disabled if found)
   - Phone (formatted input, required, validation: 10 digits)
   - Date of Birth (date picker, required, validation: < today)
   - Chief Complaint (textarea, required, max 200 chars)
   - Preferred Provider (dropdown, optional, fetched from API)
   - Urgent checkbox (moves to priority queue)
5. **Create WalkinRegistrationModal.tsx**: Modal with header "Register Walk-in Patient", WalkinForm, "Add to Queue" submit button (disabled during submission), "Cancel" button, closes on success or cancel
6. **Add Validation**: Inline validation with error messages below fields, phone format validation (###-###-####), DOB validation (must be in past), chief complaint length validation
7. **Add Success Toast**: After successful registration, show green toast "Walk-in registered. Estimated wait: [X] min. SMS sent to patient.", auto-dismiss after 5 seconds
8. **Integrate with Queue Page**: Add "Register Walk-in" button (top-right, secondary style) to QueueManagementPage, opens modal on click, refreshes queue after successful registration

**Focus on how to implement**: Use React Hook Form for form state management and validation. Phone input uses mask pattern "999-999-9999". Patient search debounces phone+DOB input by 500ms to avoid excessive API calls. Auto-fill disables name field when existing patient found. Urgent checkbox shows warning message "Priority check-in: Patient will be seen next." Modal closes on successful submission and triggers queue refresh in parent component.

## Current Project State
```
app/
├── src/
│   ├── pages/
│   │   └── QueueManagementPage.tsx (US_020 TASK_001, to be modified)
│   ├── components/
│   │   ├── queue/
│   │   │   └── QueueTable.tsx (US_020)
│   │   ├── walkin/
│   │   │   └── (all components to be created)
│   │   └── common/
│   │       ├── LoadingSpinner.tsx
│   │       └── (Toast.tsx to be created or modified)
│   ├── hooks/
│   │   ├── useQueueData.ts (US_020)
│   │   └── (useWalkinRegistration.ts to be created)
│   ├── types/
│   │   ├── queue.types.ts (US_020)
│   │   └── (walkin.types.ts to be created)
│   └── App.tsx
└── public/
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/walkin/WalkinRegistrationModal.tsx | Modal component with form, handles open/close state, submission |
| CREATE | app/src/components/walkin/WalkinForm.tsx | Form with React Hook Form validation, fields for name/phone/DOB/complaint/provider/urgent |
| CREATE | app/src/components/walkin/PatientSearchField.tsx | Phone+DOB search with debounce, displays existing patient match, auto-fills form |
| CREATE | app/src/components/walkin/WalkinRegistrationModal.css | Modal overlay, form styles, button layout, field validation errors |
| CREATE | app/src/hooks/useWalkinRegistration.ts | Hook with searchPatient, registerWalkin functions calling backend API |
| CREATE | app/src/types/walkin.types.ts | TypeScript interfaces: WalkinFormData, WalkinRegistrationResult, PatientSearchResult |
| CREATE | app/src/components/common/Toast.tsx | Toast notification component with auto-dismiss (create if not exists) |
| MODIFY | app/src/pages/QueueManagementPage.tsx | Add "Register Walk-in" button (top-right), modal open state, refresh queue after registration |

## External References
- **React Hook Form**: https://react-hook-form.com/ - Form validation and state management
- **Input Masking**: https://www.npmjs.com/package/react-input-mask - Phone number formatting
- **Date Picker**: https://www.npmjs.com/package/react-datepicker - Date input component
- **Debounce Hook**: https://usehooks.com/useDebounce/ - Debouncing API calls
- **React Modal**: https://reactcommunity.org/react-modal/ - Accessible modal patterns
- **Toast Notifications**: https://www.npmjs.com/package/react-hot-toast - Toast notification library

## Build Commands
- Install dependencies: `npm install` (in app directory)
- Install React Hook Form: `npm install react-hook-form@7.x`
- Install input mask: `npm install react-input-mask @types/react-input-mask`
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start Vite dev server with hot reload)
- Run tests: `npm test` (execute unit tests for walkin components)

## Implementation Validation Strategy
- [x] Unit tests pass for WalkinForm, WalkinRegistrationModal, useWalkinRegistration
- [x] Visual comparison against wireframe completed at 375px, 768px, 1440px
- [x] Run `/analyze-ux` to validate wireframe alignment
- [x] Patient search validation: Enter phone+DOB, verify existing patient auto-fills name
- [x] Form validation: Submit with invalid data, verify inline error messages
- [x] Phone format validation: Phone input accepts only 10 digits with formatting
- [x] Success flow: Submit valid form, verify toast shows estimated wait time, queue refreshes
- [x] Cancel flow: Click cancel button, modal closes without submission
- [x] Urgent flag: Check urgent checkbox, verify "Priority check-in" warning displays

## Implementation Checklist
- [ ] Reference wireframe at .propel/context/wireframes/Hi-Fi/wireframe-SCR-009-queue-management.html during implementation
- [ ] Install react-hook-form@7.x, react-input-mask, @types/react-input-mask dependencies
- [ ] Create walkin.types.ts with interfaces: WalkinFormData (patientName, phone, dob, chiefComplaint, preferredProviderId?, isUrgent), WalkinRegistrationResult (success, appointmentId, estimatedWaitMinutes, patientName), PatientSearchResult (patientId, name, phone, dob, hasExistingAppointments)
- [ ] Create useWalkinRegistration.ts hook (searchPatient: GET /api/staff/walkin/search?phone=&dob=, registerWalkin: POST /api/staff/walkin/register, return { searching, registering, error, searchPatient, registerWalkin })
- [ ] Create PatientSearchField.tsx component (phone input with mask "999-999-9999", DOB date picker, useDebouncedValue 500ms, onSearchComplete callback auto-fills parent form, displays "✓ Existing patient: [Name]" when found)
- [ ] Create WalkinForm.tsx using React Hook Form (fields: patientName disabled if found, phone required 10 digits, dob required past date, chiefComplaint textarea maxLength 200 required, preferredProviderId optional dropdown, isUrgent checkbox, validation rules, onSubmit callback)
- [ ] Create WalkinRegistrationModal.tsx (modal overlay, header "Register Walk-in Patient", WalkinForm component, "Add to Queue" submit button disabled during submission, "Cancel" button, onClose callback, resets form on open)
- [ ] Create WalkinRegistrationModal.css (modal overlay with backdrop, modal content centered max-width 580px, form-grid 2-column layout, button group right-aligned, inline error messages red below fields)
