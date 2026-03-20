# Task - TASK_004: Frontend Manual Form Switch with Seamless Data Transfer

## Requirement Reference
- User Story: [us_025]
- Story Location: [.propel/context/tasks/us_025/us_025.md]
- Acceptance Criteria:
    - AC3: Click "Switch to Manual Form", transition seamlessly with all AI-collected data pre-filled without data loss
- Edge Case:
    - EC3: When circuit breaker opens, automatically switch to manual form with preserved data

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-007-patient-intake.html |
| **Screen Spec** | .propel/context/docs/figma_spec.md#SCR-007 (AI Mode and Manual Mode) |
| **UXR Requirements** | UXR-003 (Error recovery with data preservation), AIR-007 (Seamless AI-manual switching) |
| **Design Tokens** | .propel/context/docs/designsystem.md#forms, #buttons |

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
| **AI Impact** | Yes (handling AI-to-manual transition) |
| **AIR Requirements** | AIR-007 (Seamless switching) |
| **AI Pattern** | Data preservation during mode switching |
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
Add "Switch to Manual Form" button to AI chat interface (top-right position). On click, display confirmation modal "Switch to Manual Form?" explaining "Your conversation will be saved and all collected information will be pre-filled in the form", with Continue and Cancel buttons. On confirm, navigate to /intake/manual with URL query param ?conversationId=[id] or pass extracted data via React Router state. Modify manual intake form component (from US_026) to accept initialData prop and use React Hook Form's defaultValues to pre-fill fields. Map AI-extracted data structure to manual form field names (e.g., extractedData.chief_complaint → form.reasonForVisit). Handle automatic switch on circuit breaker error: detect 503 response from AI API, display toast notification "AI service temporarily unavailable. Switching to manual form...", navigate with data preservation. Save intake_mode='hybrid' in database when switching.

## Dependent Tasks
- TASK_003: Frontend AI Chat Interface (source of extracted data)
- US_026: Manual intake form component (destination form to integrate)

## Impacted Components
- **MODIFY** app/src/pages/AIPatientIntakePage.tsx - Add "Switch to Manual Form" button and confirmation modal
- **CREATE** app/src/components/intake/SwitchToManualModal.tsx - Confirmation modal for mode switch
- **MODIFY** app/src/pages/ManualIntakePage.tsx - Accept initialData from AI conversation (from US_026)
- **CREATE** app/src/utils/intakeDataMapper.ts - Map AI-extracted data to manual form field structure
- **MODIFY** app/src/hooks/useAIConversation.ts - Handle circuit breaker errors and trigger automatic switch
- **MODIFY** app/src/types/aiIntake.types.ts - Add IntakeFormData interface for manual form mapping

## Implementation Plan
1. **Create intakeDataMapper.ts**: Implement mapAIDataToFormData(extractedData: ExtractedIntakeData): IntakeFormData function - map chief_complaint → reasonForVisit, symptoms → symptomsDescription, medical_history → medicalHistoryNotes, medications → currentMedicationsList (array), allergies → allergiesList (array), pain_level → painScale (1-10), duration → symptomDuration, handle null/undefined values with empty strings or default values
2. **Create SwitchToManualModal.tsx**: Modal with h3 "Switch to Manual Form?", paragraph explaining data preservation "Your conversation will be saved and all collected information will be pre-filled in the form. You can continue editing in manual mode.", warning icon with text "You won't be able to return to AI mode for this session", Continue button (primary style) and Cancel button (secondary), controlled via isOpen prop, onConfirm and onCancel callbacks
3. **Modify AIPatientIntakePage.tsx**: Add "Switch to Manual Form" button in top-right corner with secondary/outline style, onClick sets showSwitchModal state to true, render SwitchToManualModal component, onConfirm callback uses navigate('/intake/manual', { state: { initialData: mapAIDataToFormData(conversation.extractedData), conversationId: conversation.conversationId, mode: 'hybrid' } })
4. **Modify ManualIntakePage.tsx**: Use useLocation() to access state, check if location.state?.initialData exists, if yes pass to form as defaultValues in React Hook Form useForm({ defaultValues: initialData }), display info banner at top "Continuing from AI conversation - fields pre-filled with your responses", set intake_mode='hybrid' when submitting
5. **Modify useAIConversation hook error handling**: In sendMessage function catch block, check if error.response?.status === 503 (circuit breaker open), if yes set autoSwitch state to true and display toast "AI service temporarily unavailable. Switching to manual form...", trigger navigation after 2 second delay
6. **Add Data Validation**: Before mapping, validate extracted data format (e.g., pain_level must be 1-10, dates in ISO format), sanitize strings (trim whitespace, remove special characters), handle partial data gracefully (only map fields that were successfully extracted)
7. **Add Preservatio n Logic**: Store conversation history in sessionStorage or local state during switch, include conversationId in form submission for audit trail, update clinical_documents intake_mode='hybrid' when form submitted after AI switch
8. **Add Accessibility**: Add ARIA label to switch button "Switch from AI to manual intake form", announce mode switch to screen readers with live region "Switching to manual form mode", ensure focus moves to first form field after transition

**Focus on how to implement**: React Router navigation with state: `navigate('/intake/manual', { state: { initialData, conversationId, mode: 'hybrid' } })`. Access in destination: `const location = useLocation(); const initialData = location.state?.initialData`. React Hook Form pre-fill: `const { register, handleSubmit } = useForm({ defaultValues: initialData || {} })`. Data mapping handles type conversions: arrays to comma-separated strings if needed, numeric strings to numbers. Circuit breaker auto-switch: `setTimeout(() => navigate(...), 2000)` with toast notification first. Modal prevents accidental switches with confirmation step. Session storage backup: `sessionStorage.setItem('aiIntakeData', JSON.stringify(extractedData))` before navigation.

## Current Project State
```
app/
├── src/
│   ├── pages/
│   │   ├── AIPatientIntakePage.tsx (TASK_003, to be modified)
│   │   └── ManualIntakePage.tsx (US_026, to be modified)
│   ├── components/
│   │   ├── intake/
│   │   │   ├── AIChatInterface.tsx (TASK_003)
│   │   │   ├── ManualIntakeForm.tsx (US_026)
│   │   │   └── (SwitchToManualModal.tsx to be created)
│   │   └── common/
│   │       └── Modal.tsx (base modal component)
│   ├── hooks/
│   │   └── useAIConversation.ts (TASK_003, to be modified)
│   ├── types/
│   │   └── aiIntake.types.ts (TASK_003, to be modified)
│   └── utils/
│       └── (intakeDataMapper.ts to be created)
└── public/
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/intake/SwitchToManualModal.tsx | Confirmation modal explaining data preservation with Continue/Cancel buttons |
| CREATE | app/src/utils/intakeDataMapper.ts | Map AI-extracted data structure to manual form field names |
| MODIFY | app/src/pages/AIPatientIntakePage.tsx | Add "Switch to Manual Form" button and modal, handle confirm navigation |
| MODIFY | app/src/pages/ManualIntakePage.tsx | Accept initialData from location.state, pre-fill form with React Hook Form defaultValues |
| MODIFY | app/src/hooks/useAIConversation.ts | Handle 503 circuit breaker errors, trigger automatic switch with toast |
| MODIFY | app/src/types/aiIntake.types.ts | Add IntakeFormData interface matching manual form structure |

## External References
- **React Router State**: https://reactrouter.com/en/main/hooks/use-location - Passing data between routes
- **React Hook Form Default Values**: https://react-hook-form.com/api/useform/#defaultValues - Pre-fill form fields
- **Session Storage**: https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage - Persist data across navigation
- **Data Mapping Patterns**: https://en.wikipedia.org/wiki/Data_mapping - Transform data between schemas
- **ARIA Live Regions**: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions - Announce mode changes

## Build Commands
- Install dependencies: `npm install` (in app directory)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start Vite dev server)
- Run tests: `npm test` (integration tests for mode switching)
- Type check: `npm run type-check` (validate TypeScript)

## Implementation Validation Strategy
- [x] Visual comparison against wireframe completed at 375px, 768px, 1440px
- [x] Run `/analyze-ux` to validate wireframe alignment
- [x] "Switch to Manual Form" button renders in top-right corner
- [x] Confirmation modal displays on button click
- [x] Navigates to manual form on modal confirm
- [x] All AI-extracted data pre-filled in manual form fields
- [x] No data loss during transition (verify all fields mapped correctly)
- [x] Info banner displays "Continuing from AI conversation"
- [x] Circuit breaker 503 error triggers automatic switch with toast
- [x] Form submits with intake_mode='hybrid'
- [x] conversationId passed for audit trail
- [x] Screen reader announces mode switch

## Implementation Checklist
- [ ] Reference wireframe at .propel/context/wireframes/Hi-Fi/wireframe-SCR-007-patient-intake.html during implementation (both AI and Manual modes)
- [ ] Create intakeDataMapper.ts (export mapAIDataToFormData function: accepts ExtractedIntakeData, returns IntakeFormData with mapped fields chief_complaint→reasonForVisit, symptoms→symptomsDescription, medical_history→medicalHistoryNotes, medications→currentMedicationsList array, allergies→allergiesList array, pain_level→painScale number, handle nulls with defaults)
- [ ] Modify aiIntake.types.ts (add IntakeFormData interface matching manual form structure with reasonForVisit: string, symptomsDescription: string, medicalHistoryNotes: string, currentMedicationsList: string[], allergiesList: string[], painScale: number, symptomDuration: string)
- [ ] Create SwitchToManualModal.tsx component (props: isOpen, onConfirm, onCancel, render modal with h3 "Switch to Manual Form?", paragraph explaining data preservation, warning about no return to AI mode, Continue and Cancel buttons with loading state)
- [ ] Modify AIPatientIntakePage.tsx (add state showSwitchModal, render button "Switch to Manual Form" in top-right with secondary style, onClick sets showSwitchModal=true, render SwitchToManualModal, onConfirm: call mapAIDataToFormData, navigate('/intake/manual', {state: {initialData, conversationId, mode: 'hybrid'}}), close modal)
- [ ] Modify ManualIntakePage.tsx (useLocation to get state, check location.state?.initialData, pass to useForm defaultValues: location.state?.initialData || {}, display info banner if initialData exists "Continuing from AI conversation - X fields pre-filled", set intake_mode location.state?.mode || 'manual' when submitting, include conversationId in submission)
- [ ] Modify useAIConversation.ts sendMessage error handler (catch error, if error.response?.status === 503: toast.error("AI service temporarily unavailable. Switching to manual form..."), setAutoSwitch(true), setTimeout(() => navigate('/intake/manual', {state: {initialData: mapAIDataToFormData(conversation.extractedData), conversationId, mode: 'hybrid'}}), 2000))
- [ ] Add sessionStorage backup (before navigation: sessionStorage.setItem('aiIntakeBackup', JSON.stringify({extractedData, conversationId})), in ManualIntakePage fallback: if no location.state, check sessionStorage for backup data)
- [ ] Add ARIA announcements (aria-label on switch button "Switch from AI to manual intake form", ARIA live region div to announce "Switching to manual form mode" when transition starts)
