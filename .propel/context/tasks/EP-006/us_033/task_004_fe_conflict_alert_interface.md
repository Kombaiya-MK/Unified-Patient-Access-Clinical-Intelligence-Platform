# Task - TASK_004: Frontend Medication Conflict Alert and Override Interface

## Requirement Reference
- User Story: [us_033]
- Story Location: [.propel/context/tasks/us_033/us_033.md]
- Acceptance Criteria:
    - AC1: Display CRITICAL red banner alert for high-severity conflicts
    - AC1: Display WARNING yellow notification for moderate conflicts
    - AC1: Show NO CONFLICT green indicator for safe combinations
    - AC1: Include conflict details (mechanism, severity level 1-5, clinical guidance)
    - AC1: Block "Save" button for critical conflicts until staff acknowledges warning
    - AC1: Require "Override Reason" text field for critical overrides
- Edge Case:
    - EC1: Unrecognized medication → prompt for clarification
    - EC2: Dosage-dependent → show threshold guidance
    - EC3: No allergy data → show verification warning

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-010-clinical-data-review.html |
| **Screen Spec** | .propel/context/docs/figma_spec.md#SCR-010 |
| **UXR Requirements** | AIR-S03 (>99% accuracy), AIR-O02 (Human override required), UXR-503 (Critical alerts with severity indicators), NFR-SEC01 (Patient safety) |
| **Design Tokens** | .propel/context/docs/designsystem.md#colors, #alerts, #modals |

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
Create medication conflict alert interface in Clinical Data Review (SCR-010). Add conflict checking when staff adds/edits medications in medications section. Create ConflictBanner component displaying at top of screen when conflicts detected: red background for critical (severity ≥4), yellow for warning (severity 2-3), green "No Conflicts" for safe combinations, includes severity level indicator with 1-5 scale icons, "View Details" link opens ConflictDetailsModal. Create ConflictDetailsModal showing: Interacting Medications list (2+ medications involved), Interaction Type badge (Drug-Drug/Drug-Allergy/Drug-Condition), Severity scale visual (1-5 with icons: 1=info, 2=caution, 3=alert, 4=warning, 5=critical), Mechanism of Interaction expandable section with explanation text, Clinical Guidance recommendations, "Override" button for critical conflicts with required Override Reason textarea (min 10 chars), "Acknowledged" checkbox must be checked to enable Override button. Implement real-time conflict check: on medication add/edit blur event, call POST /api/patients/:id/medications/check-conflicts, display results immediately. Block "Save Medication" button when critical conflicts detected and not overridden, show "Critical Conflict - Override Required" tooltip. Add MedicationValidation component for autocomplete: search as user types with debounce 300ms, call POST /api/medications/validate, show suggestions dropdown if unrecognized, display drug class info. Show "No Allergy Data" warning banner if patient has no allergies recorded with "Verify with Patient" button. Add ConflictHistoryPanel showing all past conflict checks from audit log. Persist critical alerts until dismissed after override acknowledged.

## Dependent Tasks
- TASK_001: Database Migration (medication_conflicts storage)
- TASK_002: AI Conflict Detection Service (conflict detection logic)
- TASK_003: Backend Conflict API (endpoints for checking and overriding)

## Impacted Components
- **CREATE** app/src/components/medications/ConflictBanner.tsx - Alert banner at top of screen
- **CREATE** app/src/components/medications/ConflictDetailsModal.tsx - Detailed conflict information modal
- **CREATE** app/src/components/medications/SeverityIndicator.tsx - Visual severity scale 1-5
- **CREATE** app/src/components/medications/OverrideForm.tsx - Override reason form with acknowledgment
- **CREATE** app/src/components/medications/MedicationValidation.tsx - Autocomplete with validation
- **CREATE** app/src/components/medications/ConflictHistoryPanel.tsx - Audit log display
- **CREATE** app/src/hooks/useConflictCheck.ts - Custom hook for conflict operations
- **MODIFY** app/src/components/medications/MedicationForm.tsx - Add conflict checking on blur
- **MODIFY** app/src/pages/ClinicalDataReviewPage.tsx - Integrate conflict alerts (SCR-010)

## Implementation Plan
1. **Create useConflictCheck hook**: Implement checkConflicts(patientId, medications, allergies?, conditions?) calling POST /api/patients/:id/medications/check-conflicts, getActiveConflicts(patientId) calling GET /api/patients/:id/conflicts, overrideConflict(conflictId, staffId, reason, acknowledged) calling PATCH /api/patients/:id/conflicts/:conflictId/override, validateMedication(name) calling POST /api/medications/validate with debounce 300ms, return {conflicts, loading, error, hasActiveConflicts, criticalCount, warningCount, actionRequired}
2. **Create SeverityIndicator.tsx**: Props: severity (1-5), render icon and color: 1=blue info circle, 2=yellow caution triangle, 3=orange alert triangle, 4=red warning octagon, 5=red critical skull icon, include severity text label "Minor/Moderate/Major/Severe/Critical", tooltip with severity description
3. **Create ConflictBanner.tsx**: Props: conflicts array, onViewDetails, render banner at top of screen with color based on highest severity: severity ≥4 red background #DC3545, severity 2-3 yellow background #FFC107, severity 1 or no conflicts green background #28A745, show conflict count "{X} Critical Conflicts Detected" or "{X} Warnings" or "No Conflicts - All Medications Safe", include SeverityIndicator for highest severity, "View Details" button opens modal, dismissible with X button for warnings (not critical), persist critical banners until override
4. **Create ConflictDetailsModal.tsx**: Props: isOpen, conflict (or conflicts array), onClose, onOverride, render modal with heading "Medication Conflict Details", Interacting Medications section listing medication names with dosages, Interaction Type badge styled by type: Drug-Drug (purple), Drug-Allergy (red), Drug-Condition (orange), SeverityIndicator with 1-5 scale, Mechanism expandable section with "+"/"-" toggle showing interaction_mechanism text, Clinical Guidance section with recommendations styled as ordered list, if dosage_dependent show "Dosage Threshold: {threshold}" with current vs safe dosage, "Override" button at bottom visible only for severity ≥4, button opens OverrideForm inline or in same modal
5. **Create OverrideForm.tsx**: Props: conflictId, onSubmit, onCancel, render form with Override Reason textarea (placeholder "Explain why this conflict is being overridden...", min 10 chars, required), "I acknowledge this medication conflict and take responsibility" checkbox (required to enable submit), staff ID autofilled from current user context, "Override and Save" button (disabled until checkbox checked and reason ≥10 chars), "Cancel" button, validation error messages, show warning "This is a critical safety override and will be audited"
6. **Create MedicationValidation.tsx**: Props: value, onChange, onSelect, render autocomplete input field, on input change (debounced 300ms) call useConflictCheck.validateMedication, show loading spinner in input, if valid show green checkmark and drug class info, if invalid show suggestions dropdown with matching medications, click suggestion fills input and calls onSelect, show "Unrecognized medication - please verify" warning if no matches
7. **Create ConflictHistoryPanel.tsx**: Props: patientId, render section "Conflict Check History", call GET /api/patients/:id/conflicts/history, display table with columns: Check Date, Medications Checked, Conflicts Detected (count), Highest Severity, Checked By (System/Staff), expandable row showing full details, paginate with "Load More" button
8. **Modify MedicationForm.tsx**: Add onBlur event to medication name input calling conflict check, when adding new medication to list trigger checkConflicts for all patient medications including new one, display ConflictBanner if conflicts detected, disable "Save" button if critical conflicts (actionRequired=true) and not overridden, show tooltip "Critical Conflict - Override Required" on disabled button hover, integrate MedicationValidation component for medication name field
9. **Modify ClinicalDataReviewPage.tsx**: Add ConflictBanner at top of page above medications section, fetch active conflicts on page load with useConflictCheck.getActiveConflicts, display count badge on Medications tab if has_active_conflicts, render ConflictDetailsModal when "View Details" clicked, add "No Allergy Data" warning banner if patient.allergies empty or null with "Verify with Patient" button (updates UI to prompt staff), add ConflictHistoryPanel in expandable section below medications table
10. **Handle dosage-dependent conflicts**: In ConflictDetailsModal, if dosage_dependent=true, display dosage threshold section: "Current Dosage: {X} mg", "Safe Threshold: <{Y} mg", visual indicator showing current vs threshold with progress bar, guidance "Safe at current dose" in green or "Exceeds safe threshold" in red
11. **Add real-time validation**: Implement automatic conflict check when staff changes existing medication dosage (on blur), when medication is removed from list (re-check remaining medications), when allergy is added to patient profile (re-check all medications against new allergy)
12. **Styling**: Critical banner red #DC3545 with white text, warning banner yellow #FFC107 with black text, safe banner green #28A745 with white text, modal max-width 600px centered, severity icons with color gradients, Override button red with "Are you sure?" confirmation, responsive layout for mobile

**Focus on how to implement**: Conflict check on blur: `<input name="medication" onBlur={async (e) => { setCheckingConflicts(true); const result = await checkConflicts(patientId, [...existingMeds, {name: e.target.value, dosage, frequency}]); setConflicts(result.conflicts); setActionRequired(result.action_required); setCheckingConflicts(false); }} />`. Conflict banner: `{conflicts.length > 0 && <ConflictBanner conflicts={conflicts} severity={Math.max(...conflicts.map(c => c.severity_level))} onViewDetails={() => setShowModal(true)} />}`. Banner color: `const bgColor = highestSeverity >= 4 ? '#DC3545' : highestSeverity >= 2 ? '#FFC107' : '#28A745';`. Severity indicator: `<div className="severity-indicator">{severity === 5 && <SkullIcon color="red" />}{severity === 4 && <WarningIcon color="red" />}{severity === 3 && <AlertIcon color="orange" />}{severity === 2 && <CautionIcon color="yellow" />}{severity === 1 && <InfoIcon color="blue" />}<span>{severityText[severity]}</span></div>`. Override form: `<textarea value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} minLength={10} required /><label><input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} required /> I acknowledge this medication conflict and take responsibility</label><button onClick={handleOverride} disabled={!acknowledged || overrideReason.length < 10}>Override and Save</button>`. Save button block: `<button onClick={handleSave} disabled={actionRequired && !overridden} title={actionRequired ? "Critical Conflict - Override Required" : ""}>Save Medication</button>`. Medication validation: `const handleInputChange = useDebouncedCallback(async (value: string) => { const result = await validateMedication(value); if (result.valid) { setValid(true); setDrugClass(result.drug_class); } else { setSuggestions(result.suggestions); } }, 300);`.

## Current Project State
```
app/
├── src/
│   ├── pages/
│   │   └── ClinicalDataReviewPage.tsx (may exist for SCR-010, to be modified)
│   ├── components/
│   │   └── medications/
│   │       ├── MedicationForm.tsx (may exist, to be modified)
│   │       ├── ConflictBanner.tsx (to be created)
│   │       ├── ConflictDetailsModal.tsx (to be created)
│   │       ├── SeverityIndicator.tsx (to be created)
│   │       ├── OverrideForm.tsx (to be created)
│   │       ├── MedicationValidation.tsx (to be created)
│   │       └── ConflictHistoryPanel.tsx (to be created)
│   └── hooks/
│       └── useConflictCheck.ts (to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/medications/ConflictBanner.tsx | Color-coded alert banner for conflicts |
| CREATE | app/src/components/medications/ConflictDetailsModal.tsx | Modal showing conflict details with override option |
| CREATE | app/src/components/medications/SeverityIndicator.tsx | Visual severity scale 1-5 with icons |
| CREATE | app/src/components/medications/OverrideForm.tsx | Override reason form with acknowledgment checkbox |
| CREATE | app/src/components/medications/MedicationValidation.tsx | Autocomplete with validation and suggestions |
| CREATE | app/src/components/medications/ConflictHistoryPanel.tsx | Audit log display panel |
| CREATE | app/src/hooks/useConflictCheck.ts | Hook for conflict checking operations |
| MODIFY | app/src/components/medications/MedicationForm.tsx | Add conflict checking on blur |
| MODIFY | app/src/pages/ClinicalDataReviewPage.tsx | Integrate conflict alerts (SCR-010) |

## External References
- **React useState**: https://react.dev/reference/react/useState - State management
- **React useEffect**: https://react.dev/reference/react/useEffect - Side effects for conflict checks
- **Debouncing Input**: https://www.freecodecamp.org/news/debouncing-in-react/ - Medication validation debounce
- **Axios**: https://axios-http.com/docs/intro - HTTP requests
- **Modal Accessibility**: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ - ARIA patterns for modals

## Build Commands
- Build TypeScript: `npm run build` (compile src/ to dist/)
- Run in development: `npm run dev` (start Vite dev server)
- Run tests: `npm test` (unit tests for conflict components)
- Type check: `npm run type-check`

## Implementation Validation Strategy
- [x] Reference wireframe at .propel/context/wireframes/Hi-Fi/wireframe-SCR-010-clinical-data-review.html during implementation
- [x] Visual comparison against wireframe at 375px, 768px, 1440px
- [x] Run `/analyze-ux` to validate wireframe alignment
- [x] ConflictBanner displays with correct colors (red/yellow/green) based on severity
- [x] Critical conflicts show red banner with block on Save button
- [x] Warning conflicts show yellow banner without blocking Save
- [x] "View Details" link opens ConflictDetailsModal
- [x] ConflictDetailsModal shows all conflict information
- [x] Severity indicator displays correct icons for 1-5 scale
- [x] Override button visible only for critical conflicts (severity ≥4)
- [x] OverrideForm requires override_reason ≥10 chars
- [x] Acknowledgment checkbox must be checked to enable Override button
- [x] MedicationValidation autocomplete shows suggestions for unrecognized meds
- [x] Conflict check triggers on medication add/edit blur event
- [x] Save button disabled when critical conflicts not overridden
- [x] "No Allergy Data" warning displays when patient.allergies empty
- [x] ConflictHistoryPanel shows audit trail
- [x] Dosage-dependent conflicts show threshold guidance
- [x] Real-time validation with 300ms debounce
- [x] Responsive layout works on mobile

## Implementation Checklist
- [ ] Reference wireframe at .propel/context/wireframes/Hi-Fi/wireframe-SCR-010-clinical-data-review.html during implementation
- [ ] Create app/src/hooks/useConflictCheck.ts (functions: checkConflicts POST /api/patients/:id/medications/check-conflicts, getActiveConflicts GET /conflicts, overrideConflict PATCH /conflicts/:id/override, validateMedication POST /medications/validate with debounce 300ms, return conflicts/loading/error/hasActiveConflicts/criticalCount/warningCount/actionRequired)
- [ ] Create app/src/components/medications/SeverityIndicator.tsx (props: severity 1-5, render icon and color: 1=blue info circle, 2=yellow caution triangle, 3=orange alert, 4=red warning octagon, 5=red critical skull, include severity text Minor/Moderate/Major/Severe/Critical, tooltip with description)
- [ ] Create app/src/components/medications/ConflictBanner.tsx (props: conflicts array, onViewDetails, render banner top of screen, color by highest severity: ≥4 red #DC3545, 2-3 yellow #FFC107, ≤1 green #28A745, show count "X Critical Conflicts" or "X Warnings" or "No Conflicts - Safe", include SeverityIndicator, View Details button, dismissible X for warnings not critical, persist critical until override)
- [ ] Create app/src/components/medications/ConflictDetailsModal.tsx (props: isOpen, conflict/conflicts array, onClose, onOverride, modal with heading Medication Conflict Details, Interacting Medications list, Interaction Type badge colored Drug-Drug/Drug-Allergy/Drug-Condition, SeverityIndicator, Mechanism expandable with toggle, Clinical Guidance ordered list, dosage_dependent show threshold current vs safe, Override button for severity≥4, opens OverrideForm)
- [ ] Create app/src/components/medications/OverrideForm.tsx (props: conflictId, onSubmit, onCancel, form with Override Reason textarea min 10 chars required, "I acknowledge..." checkbox required, staff ID autofilled, Override and Save button disabled until checkbox+reason valid, Cancel button, validation errors, warning "critical safety override will be audited")
- [ ] Create app/src/components/medications/MedicationValidation.tsx (props: value, onChange, onSelect, autocomplete input, on input change debounced 300ms call validateMedication, loading spinner, if valid green checkmark+drug class, if invalid suggestions dropdown, click suggestion fills input calls onSelect, warning "Unrecognized - verify")
- [ ] Create app/src/components/medications/ConflictHistoryPanel.tsx (props: patientId, section "Conflict Check History", GET /api/patients/:id/conflicts/history, table: Check Date, Medications Checked, Conflicts Detected count, Highest Severity, Checked By, expandable rows, paginate Load More)
- [ ] Modify app/src/components/medications/MedicationForm.tsx (add onBlur event medication name input call conflict check, when adding new medication trigger checkConflicts for all+new, display ConflictBanner if detected, disable Save button if actionRequired=true not overridden, tooltip "Critical Conflict - Override Required" on disabled hover, integrate MedicationValidation component)
- [ ] Modify app/src/pages/ClinicalDataReviewPage.tsx (add ConflictBanner top of page, fetch active conflicts on load getActiveConflicts, count badge on Medications tab if has_active_conflicts, render ConflictDetailsModal when View Details clicked, "No Allergy Data" warning banner if patient.allergies empty with Verify button, ConflictHistoryPanel expandable below medications table)
- [ ] Handle dosage-dependent conflicts (in ConflictDetailsModal: if dosage_dependent=true show dosage threshold section Current Dosage X mg, Safe Threshold <Y mg, visual progress bar current vs threshold, guidance "Safe at current dose" green or "Exceeds threshold" red)
- [ ] Add real-time validation (conflict check on existing medication dosage change blur, when medication removed re-check remaining, when allergy added re-check all medications)
- [ ] Add CSS styling (Critical red #DC3545 white text, warning yellow #FFC107 black text, safe green #28A745 white text, modal max-width 600px centered, severity icons color gradients, Override button red with confirmation, responsive <768px mobile layout)
- [ ] Write unit tests (test ConflictBanner renders correct colors, test Save button disabled for critical conflicts, test Override form validation, test MedicationValidation debounce and suggestions, test conflict check on blur, test modal open/close, test severity indicator icons, test real-time updates)
