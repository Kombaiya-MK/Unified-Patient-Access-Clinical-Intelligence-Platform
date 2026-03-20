# Task - TASK_003: Frontend Switch to AI Mode Integration

## Requirement Reference
- User Story: [us_026]
- Story Location: [.propel/context/tasks/us_026/us_026.md]
- Acceptance Criteria:
    - AC1: Click "Switch to AI Mode" button available in manual form view
- Edge Case:
    - EC1: Switching from manual to AI preserves all entered form data, AI resumes asking about incomplete sections only

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-007-patient-intake.html |
| **Screen Spec** | .propel/context/docs/figma_spec.md#SCR-007 |
| **UXR Requirements** | AIR-007 (Seamless AI-manual switching), UXR-003 (Data preservation) |
| **Design Tokens** | .propel/context/docs/designsystem.md#buttons |

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
| **AI Impact** | Yes (switching to AI mode) |
| **AIR Requirements** | AIR-007 (Seamless switching) |
| **AI Pattern** | Data preservation during mode switching |
| **Prompt Template Path** | .propel/context/prompts/ai-intake-conversation.md (from US_025) |
| **Guardrails Config** | AI resumes only for incomplete sections |
| **Model Provider** | OpenAI GPT-4 |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Add "Switch to AI Mode" button to manual intake form (top-right position). On click, display confirmation modal "Switch to AI Assistant?" explaining "Your form progress will be saved. The AI will help you complete the remaining sections", with Continue and Cancel buttons. On confirm, save current form data as draft via POST /api/intake/manual/draft, navigate to /intake/ai with URL query param ?draftId=[id] or pass form data via React Router state. Modify AI intake page (from US_025) to accept initialFormData prop, use POST /api/intake/ai/start with context parameter including pre-filled fields, AI system prompt adjusted to ask only about incomplete sections (e.g., if chief_complaint filled, skip that question). Display info banner "Continuing from manual form - AI will complete remaining fields". Set intake_mode='hybrid' when final submission occurs.

## Dependent Tasks
- TASK_002: Frontend Manual Form (source of form data)
- US_025 TASK_003: AI Chat Interface (destination to integrate)
- US_025 TASK_002: Backend AI API (needs to accept pre-filled context)

## Impacted Components
- **MODIFY** app/src/pages/ManualIntakePage.tsx - Add "Switch to AI Mode" button and confirmation modal
- **CREATE** app/src/components/intake/SwitchToAIModal.tsx - Confirmation modal for AI mode switch
- **MODIFY** app/src/pages/AIPatientIntakePage.tsx - Accept initialFormData from manual form
- **MODIFY** app/src/hooks/useAIConversation.ts - Handle pre-filled context in start conversation
- **CREATE** app/src/utils/formDataMapper.ts - Map form data to AI conversation context (reverse of intakeDataMapper)
- **MODIFY** server/src/services/openai/openAiService.ts - Adjust system prompt for pre-filled fields (backend change)

## Implementation Plan
1. **Create formDataMapper.ts**: Implement mapFormDataToAIContext(formData: IntakeFormData): Partial<ExtractedIntakeData> function - map reasonForVisit → chief_complaint, symptomsDescription → symptoms, medicalHistoryNotes → medical_history, handle arrays (medications, allergies), skip empty/null fields, return only filled fields for AI to use as context
2. **Create SwitchToAIModal.tsx**: Modal with h3 "Switch to AI Assistant?", paragraph explaining data preservation "Your form progress will be saved. The AI will help you complete the remaining sections based on what you've already entered.", info icon with text "The AI will ask follow-up questions only for incomplete information", Continue button (primary) and Cancel button (secondary), controlled via isOpen prop, onConfirm and onCancel callbacks
3. **Modify ManualIntakePage.tsx**: Add "Switch to AI Mode" button in top-right corner with secondary/outline style (inverse of manual form button in AI view), onClick sets showSwitchModal state to true, render SwitchToAIModal component, onConfirm callback: call POST /api/intake/manual/draft with current form data, navigate('/intake/ai', { state: { initialFormData: mapFormDataToAIContext(getValues()), draftId, mode: 'hybrid' } })
4. **Modify AIPatientIntakePage.tsx**: Use useLocation() to access state, check if location.state?.initialFormData exists, if yes display info banner at top "Continuing from manual form - AI will complete remaining fields", pass initialFormData to useAIConversation hook as additional parameter
5. **Modify useAIConversation hook**: Accept optional initialFormData parameter, in POST /api/intake/ai/start request body, include pre_filled_data: initialFormData, backend uses this to seed conversation context and adjust system prompt to skip already-filled sections
6. **Modify openAiService.ts (backend)**: In sendMessage system prompt, if pre_filled_data exists, add instruction "Patient has already provided: [list filled fields]. Focus your questions on the remaining sections: [list incomplete sections]. Do not ask about information already provided.", seed extractedData with pre_filled_data values
7. **Add Validation**: Before switching, validate current form data format (ensure dates are valid, pain level is 1-10, etc.), save draft even if incomplete (partial save allowed), include section completion status in AI context so AI knows which sections to prioritize
8. **Add Accessibility**: Add ARIA label to switch button "Switch from manual to AI-assisted intake", announce mode switch to screen readers with live region "Switching to AI assistant mode"

**Focus on how to implement**: React Router navigation with state: `navigate('/intake/ai', { state: { initialFormData, draftId, mode: 'hybrid' } })`. Access in destination: `const location = useLocation(); const initialFormData = location.state?.initialFormData`. AI context seeding: backend adds pre_filled_data to conversation context on start, AI system prompt modified dynamically based on which fields are filled. Incomplete section detection: `const incompleteSections = ALL_SECTIONS.filter(section => !isComplete(formData, section))`. Modal prevents accidental switches with confirmation. Session storage backup: `sessionStorage.setItem('manualIntakeBackup', JSON.stringify(formData))` before navigation. AI greeting changes: "I see you've started your intake form. Let me help you complete the remaining information." instead of standard greeting.

## Current Project State
```
app/
├── src/
│   ├── pages/
│   │   ├── ManualIntakePage.tsx (TASK_002, to be modified)
│   │   └── AIPatientIntakePage.tsx (US_025 TASK_003, to be modified)
│   ├── components/
│   │   ├── intake/
│   │   │   ├── ManualIntakeForm.tsx (TASK_002)
│   │   │   ├── AIChatInterface.tsx (US_025 TASK_003)
│   │   │   ├── SwitchToManualModal.tsx (US_025 TASK_004)
│   │   │   └── (SwitchToAIModal.tsx to be created)
│   │   └── common/
│   │       └── Modal.tsx (base modal)
│   ├── hooks/
│   │   └── useAIConversation.ts (US_025 TASK_003, to be modified)
│   ├── types/
│   │   ├── aiIntake.types.ts (US_025)
│   │   └── manualIntake.types.ts (TASK_002)
│   └── utils/
│       ├── intakeDataMapper.ts (US_025 TASK_004, AI → Manual)
│       └── (formDataMapper.ts to be created, Manual → AI)
└── public/
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/intake/SwitchToAIModal.tsx | Confirmation modal explaining AI will complete remaining sections |
| CREATE | app/src/utils/formDataMapper.ts | Map manual form data to AI conversation context (reverse mapper) |
| MODIFY | app/src/pages/ManualIntakePage.tsx | Add "Switch to AI Mode" button and modal, handle confirm navigation |
| MODIFY | app/src/pages/AIPatientIntakePage.tsx | Accept initialFormData from location.state, display info banner, seed AI context |
| MODIFY | app/src/hooks/useAIConversation.ts | Accept initialFormData parameter, pass to backend in start request |
| MODIFY | server/src/services/openai/openAiService.ts | Adjust system prompt based on pre-filled fields, seed extractedData |

## External References
- **React Router State**: https://reactrouter.com/en/main/hooks/use-location - Passing data between routes
- **Dynamic Prompt Engineering**: https://platform.openai.com/docs/guides/prompt-engineering - Conditional prompt instructions
- **Data Mapping Patterns**: https://en.wikipedia.org/wiki/Data_mapping - Transform between schemas
- **Session Storage**: https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage - Persist data across navigation
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
- [x] "Switch to AI Mode" button renders in top-right corner of manual form
- [x] Confirmation modal displays on button click
- [x] Navigates to AI mode on modal confirm
- [x] Form data saved as draft before switching
- [x] AI greeting acknowledges pre-filled data ("I see you've started your intake")
- [x] AI asks only about incomplete sections
- [x] All manual form data preserved in AI conversation context
- [x] Info banner displays "Continuing from manual form"
- [x] Final submission saves intake_mode='hybrid'
- [x] Screen reader announces mode switch

## Implementation Checklist
- [ ] Reference wireframe at .propel/context/wireframes/Hi-Fi/wireframe-SCR-007-patient-intake.html during implementation
- [ ] Create formDataMapper.ts (export mapFormDataToAIContext function: accepts IntakeFormData, returns Partial<ExtractedIntakeData> with mapped fields reasonForVisit→chief_complaint, symptomsDescription→symptoms, medicalHistoryNotes→medical_history, medications/allergies arrays preserved, filter out null/empty values)
- [ ] Create SwitchToAIModal.tsx component (props: isOpen, onConfirm, onCancel, render modal with h3 "Switch to AI Assistant?", paragraph explaining AI will complete remaining sections, info icon with text about targeted questions, Continue and Cancel buttons)
- [ ] Modify ManualIntakePage.tsx (add state showSwitchModal, render button "Switch to AI Mode" in top-right with secondary style, onClick sets showSwitchModal=true, render SwitchToAIModal, onConfirm: save draft axios.post('/api/intake/manual/draft', {form_data: getValues()}), call mapFormDataToAIContext, navigate('/intake/ai', {state: {initialFormData, draftId, mode: 'hybrid'}}), close modal)
- [ ] Modify AIPatientIntakePage.tsx (useLocation to get state, check location.state?.initialFormData, if exists display info banner "Continuing from manual form - AI will complete remaining fields", pass initialFormData to useAIConversation hook as prop)
- [ ] Modify useAIConversation.ts hook (add optional initialFormData parameter, in POST /api/intake/ai/start request body include {appointment_id, pre_filled_data: initialFormData}, backend seeds conversation context with this data, AI greeting changes to acknowledge existing data)
- [ ] Modify openAiService.ts backend (in sendMessage system prompt builder, if conversation.pre_filled_data exists: add instruction "Patient has already provided: {list filled fields}. Focus questions on: {list incomplete sections}. Do not repeat questions for provided information.", seed initialExtractedData with pre_filled_data values)
- [ ] Add incomplete section detection (create getIncompleteSections function: checks which required fields are missing from formData, returns array of section names like ['Medications', 'Family History'], pass to AI prompt for targeted questioning)
- [ ] Add sessionStorage backup (before navigation: sessionStorage.setItem('manualIntakeBackup', JSON.stringify(getValues())), in AIPatientIntakePage fallback: if no location.state, check sessionStorage)
