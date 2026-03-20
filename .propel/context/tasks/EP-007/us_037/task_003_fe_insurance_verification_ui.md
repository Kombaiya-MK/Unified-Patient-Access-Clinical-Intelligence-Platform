# Task - TASK_003: Frontend Insurance Verification UI with Status Badges and Details Panel

## Requirement Reference
- User Story: [us_037]
- Story Location: [.propel/context/tasks/us_037/us_037.md]
- Acceptance Criteria:
    - AC1: Display verification status in staff queue (SCR-009) as badge (Green "Verified" / Red "Issue" / Yellow "Auth Required" / Gray "Not Verified")
    - AC1: Display detailed verification info in patient profile (SCR-011) insurance panel
    - AC1: Show copay amount, coverage dates, authorization requirements, last verified timestamp
    - AC1: "Re-verify Now" button triggers immediate API call
    - AC1: Issue popover shows specific problem and recommended action
    - AC1: Verification history expandable section with past attempts
- Edge Case:
    - EC1: API down → show "Verification Pending" status with retry indicator
    - EC2: Missing insurance info → show "Insurance Info Incomplete" prompt to collect
    - EC3: Multiple plans → show "Primary" indicator, "Secondary Insurance" note for manual review
- UXR Compliance:
    - UXR-501: Real-time status badges
    - UXR-402: Error recovery patterns (retry button, clear error messages)

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-009-queue-management.html, .propel/context/wireframes/Hi-Fi/wireframe-SCR-011-appointment-management.html |
| **Screen Spec** | figma_spec.md#SCR-009, figma_spec.md#SCR-011 |
| **UXR Requirements** | UXR-501, UXR-402 |
| **Design Tokens** | N/A |

> **CRITICAL**: MUST reference wireframe-SCR-009-queue-management.html and wireframe-SCR-011-appointment-management.html during implementation to match badge styles, panel layout, and popover structure.

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.2.x |
| Frontend | TypeScript | 5.3.x |
| Date Handling | date-fns | 3.x |

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
Add insurance verification status display to Staff Queue (SCR-009) and Patient Profile (SCR-011). In Staff Queue, add Insurance Status column with InsuranceStatusBadge component showing: Green "Verified ✓" (status='active'), Red "Issue ✗" (status='inactive' or 'requires_auth'), Yellow "Pending ⏳" (status='pending'), Gray "Not Verified" (no verification record). Click badge opens InsuranceIssuePopover with verification details, specific problem description (e.g., "Insurance Inactive - Coverage Expired"), recommended action ("Contact patient to update insurance"), "Contact Patient" button triggering notification/reminder. In Patient Profile (SCR-011), add Insurance Info Panel as card with fields: Insurance Plan (text from patient_profiles.insurance_provider), Member ID (insurance_policy_number), Status (InsuranceStatusBadge), Copay Amount ($XX.XX formatted), Deductible Remaining ($XXX.XX), Coverage Dates (MM/DD/YYYY - MM/DD/YYYY from coverage_start_date to coverage_end_date), Authorization Notes (displayed if not null), Last Verified (timestamp formatted with date-fns formatDistanceToNow), "Re-verify Now" button (triggers POST /api/insurance/verifications/verify/:appointmentId, shows loading spinner, updates on success), Verification History expandable accordion showing past attempts (date, status, API provider, error if failed). Fetch verification data with useInsuranceVerification(patientId) hook calling GET /api/insurance/verifications/:patientId. Handle edge cases: missing insurance info → show alert "Insurance information incomplete. Please collect during check-in" with link to edit patient, API pending → show spinning icon with "Verification in progress", multiple plans → show "Primary Insurance" label, note "Secondary insurance on file - manual review required". Polling every 30 seconds if status='pending' to check for updates. WCAG AA accessible with keyboard navigation and ARIA labels.

## Dependent Tasks
- US-037 task_002: Backend insurance verification API endpoints
- US-020: Staff Queue page (SCR-009) structure exists
- US-011: Patient Profile page (SCR-011) structure exists

## Impacted Components
- **CREATE** app/src/components/insurance/InsuranceStatusBadge.tsx - Status badge component
- **CREATE** app/src/components/insurance/InsuranceIssuePopover.tsx - Issue details popover
- **CREATE** app/src/components/insurance/InsuranceInfoPanel.tsx - Patient profile insurance card
- **CREATE** app/src/components/insurance/VerificationHistory.tsx - History accordion
- **CREATE** app/src/hooks/useInsuranceVerification.ts - Verification data hook
- **CREATE** app/src/types/insuranceVerification.ts - Insurance types
- **MODIFY** app/src/pages/StaffQueue.tsx - Add Insurance Status column
- **MODIFY** app/src/pages/PatientProfile.tsx - Add Insurance Info Panel

## Implementation Plan
1. **Create insuranceVerification.ts types**: Define InsuranceVerification = {id: number, patient_id: number, appointment_id?: number, verification_date: string, status: 'active' | 'inactive' | 'requires_auth' | 'pending' | 'failed' | 'incomplete', copay_amount?: number, deductible_remaining?: number, coverage_start_date?: string, coverage_end_date?: string, authorization_notes?: string, insurance_plan: string, member_id: string, last_verified_at: string, verification_source: string, is_primary_insurance: boolean}, VerificationAttempt = {id: number, attempt_number: number, api_provider: string, response_code: string, status: string, error_message?: string, attempted_at: string}
2. **Create useInsuranceVerification.ts hook**: Export useInsuranceVerification(patientId) hook: GET /api/insurance/verifications/:patientId with React Query, useQuery(['insuranceVerification', patientId]), if verification.status === 'pending' set refetchInterval: 30000 (30s polling), return {verification, isLoading, error, refetch}, export useReVerify mutation: POST /api/insurance/verifications/verify/:appointmentId, onSuccess refetch verification and show toast, export useVerificationHistory(patientId) hook: GET /api/insurance/verifications/:patientId/history, return {history, isLoading}
3. **Create InsuranceStatusBadge.tsx**: Accept {status, onClick?} props, render badge with color and icon based on status: 'active' → green bg "#10b981" with checkmark icon "Verified ✓", 'inactive' → red bg "#ef4444" with x icon "Issue ✗", 'requires_auth' → yellow bg "#f59e0b" with warning icon "Auth Required ⚠️", 'pending' → yellow bg with spinning icon "Pending ⏳", 'failed' → red with alert icon "Failed", 'incomplete' → gray bg "#6b7280" "Not Verified", null (no verification) → gray "Not Verified", onClick shows cursor pointer and triggers popover, WCAG AA contrast ratios, ARIA label describing status
4. **Create InsuranceIssuePopover.tsx**: Accept {verification, onClose, onContactPatient} props, render popover/modal with sections: Problem summary (e.g., "Insurance Inactive" if status='inactive', "Prior Authorization Required" if status='requires_auth', "Verification Failed" if status='failed'), Details (authorization_notes if exists, error_message if failed), Recommended Action (for inactive: "Contact patient to update insurance information", for requires_auth: "Request prior authorization from insurance provider", for failed: "Retry verification or verify manually"), Actions: "Contact Patient" button triggering onContactPatient callback, "Retry Verification" button if failed, "Close" button, display coverage dates if available showing expiration
5. **Create InsuranceInfoPanel.tsx**: Accept {patientId, appointmentId} props, use useInsuranceVerification(patientId) hook, render card with header "Insurance Information" and "Re-verify Now" button, fields: Insurance Plan (verification.insurance_plan or patient.insurance_provider), Member ID (verification.member_id or patient.insurance_policy_number with masking ***-XX-1234), Status (InsuranceStatusBadge with onClick opens InsuranceIssuePopover), Copay Amount (formatted as currency $XX.XX, show "-" if null), Deductible Remaining (formatted currency), Coverage Dates (formatDate from coverage_start_date to coverage_end_date, show "N/A" if null), Authorization Notes (display if not null, collapsible if long), Last Verified (formatDistanceToNow from last_verified_at, show "Never" if null), "Re-verify Now" button calls useReVerify mutation with loading spinner, show success toast "Insurance verified successfully" or error toast, Verification History accordion component below
6. **Create VerificationHistory.tsx**: Accept {patientId} props, use useVerificationHistory hook, render expandable accordion "View Verification History ({count} attempts)", when expanded show table/list: Date (formatted), Status (badge), API Provider, Result (Success/Failed/Timeout), Error Message (if failed), collapsible if >5 entries showing most recent 5 with "Show All" expand
7. **Modify StaffQueue.tsx**: Add Insurance Status column to queue table after Patient Name/Appointment Time columns, for each patient row fetch useInsuranceVerification(patient.patient_id), render InsuranceStatusBadge with status, onClick opens InsuranceIssuePopover, if no verification show gray "Not Verified" badge, include filter dropdown above table for Insurance Status: All/Verified/Issues/Pending/Not Verified
8. **Modify PatientProfile.tsx**: Add Insurance Info Panel section in patient details tabs or sidebar, render InsuranceInfoPanel component with patientId and appointmentId from route params, position near demographics or medical history sections per wireframe SCR-011 layout
9. **Handle edge cases**: Missing insurance in patient_profiles → InsuranceInfoPanel shows alert "Insurance information incomplete. Please update insurance details." with "Edit Patient" button link to patient edit form, Multiple insurance plans → check is_primary_insurance flag, show badge "Primary Insurance" next to insurance plan field, add note below "Secondary insurance on file - see patient records", API down/timeout → InsuranceIssuePopover shows "Verification service temporarily unavailable. Retry scheduled." with countdown timer if retry_after exists, Pending verification → show spinning icon and text "Verifying insurance eligibility..." with estimated time if available
10. **Contact patient action**: OnContactPatient callback in InsuranceIssuePopover triggers notification to patient via existing notification service from US-016, opens modal with pre-filled message "Your insurance verification failed. Please contact our office to update insurance information." with SMS/Email options, logs action to audit log
11. **Polling logic**: In useInsuranceVerification hook, check if verification.status === 'pending', set refetchInterval: 30000 (30s), stop polling when status changes to 'active'/'inactive'/'failed', show notification when status resolves to non-pending
12. **Accessibility**: WCAG AA keyboard navigation (Tab to Insurance Status badge, Enter to open popover, Esc to close), ARIA labels on all badges "Insurance status: {status}", screen reader announcements when status updates, focus management in popover (trap focus, return focus to trigger on close)
13. **Testing**: Test InsuranceStatusBadge displays correct colors and icons for each status, test InsuranceIssuePopover opens on badge click, test InsuranceInfoPanel displays all fields correctly, test Re-verify button triggers verification, test Verification History expands and shows attempts, test Staff Queue column displays badges, test filter by insurance status works, test polling stops when status resolves, test missing insurance shows alert, test keyboard navigation and ARIA labels

**Focus on how to implement**: Use insurance verification hook: `const useInsuranceVerification = (patientId: number) => { return useQuery(['insuranceVerification', patientId], () => axios.get(\`/api/insurance/verifications/\${patientId}\`).then(res => res.data), { staleTime: 60000, refetchInterval: (data) => data?.status === 'pending' ? 30000 : false, enabled: !!patientId }); };`. Status badge: `const InsuranceStatusBadge = ({status, onClick}) => { const config = {active: {bg: '#10b981', text: 'Verified ✓', icon: <CheckIcon/>}, inactive: {bg: '#ef4444', text: 'Issue ✗', icon: <XIcon/>}, requires_auth: {bg: '#f59e0b', text: 'Auth Required ⚠️', icon: <AlertIcon/>}, pending: {bg: '#f59e0b', text: 'Pending ⏳', icon: <SpinnerIcon className="animate-spin"/>}, failed: {bg: '#ef4444', text: 'Failed', icon: <AlertIcon/>}, incomplete: {bg: '#6b7280', text: 'Not Verified', icon: null}}[status] || {bg: '#6b7280', text: 'Not Verified', icon: null}; return <span className="badge" style={{backgroundColor: config.bg, color: '#fff', cursor: onClick ? 'pointer' : 'default'}} onClick={onClick} role="button" tabIndex={0} aria-label={\`Insurance status: \${config.text}\`}>{config.icon} {config.text}</span>; };`. Insurance panel: `const InsuranceInfoPanel = ({patientId, appointmentId}) => { const {data: verification, isLoading, refetch} = useInsuranceVerification(patientId); const {mutate: reVerify, isLoading: isVerifying} = useReVerify(); const [showPopover, setShowPopover] = useState(false); const handleReVerify = () => { reVerify(appointmentId, {onSuccess: () => {toast.success('Insurance verified'); refetch();}}); }; if (isLoading) return <Skeleton/>; if (!verification?.insurance_plan) return <Alert>Insurance information incomplete. <Button>Edit Patient</Button></Alert>; return <Card><h3>Insurance Information <Button onClick={handleReVerify} disabled={isVerifying}>{isVerifying ? <Spinner/> : 'Re-verify Now'}</Button></h3><dl><dt>Insurance Plan</dt><dd>{verification.insurance_plan} {verification.is_primary_insurance && <Badge>Primary</Badge>}</dd><dt>Member ID</dt><dd>{verification.member_id}</dd><dt>Status</dt><dd><InsuranceStatusBadge status={verification.status} onClick={() => setShowPopover(true)}/></dd><dt>Copay Amount</dt><dd>{verification.copay_amount ? \`$\${verification.copay_amount.toFixed(2)}\` : '-'}</dd><dt>Deductible Remaining</dt><dd>{verification.deductible_remaining ? \`$\${verification.deductible_remaining.toFixed(2)}\` : '-'}</dd><dt>Coverage Dates</dt><dd>{verification.coverage_start_date ? \`\${formatDate(verification.coverage_start_date)} - \${formatDate(verification.coverage_end_date)}\` : 'N/A'}</dd>{verification.authorization_notes && <><dt>Authorization Notes</dt><dd>{verification.authorization_notes}</dd></>}<dt>Last Verified</dt><dd>{verification.last_verified_at ? formatDistanceToNow(new Date(verification.last_verified_at), {addSuffix: true}) : 'Never'}</dd></dl><VerificationHistory patientId={patientId}/>{showPopover && <InsuranceIssuePopover verification={verification} onClose={() => setShowPopover(false)} onContactPatient={...}/>}</Card>; };`. Staff queue integration: `const StaffQueue = () => { const {data: appointments} = useAppointments(); return <Table><thead><tr><th>Patient</th><th>Time</th><th>Insurance Status</th><th>Actions</th></tr></thead><tbody>{appointments.map(appt => { const {data: verification} = useInsuranceVerification(appt.patient_id); return <tr key={appt.id}><td>{appt.patient_name}</td><td>{appt.appointment_time}</td><td><InsuranceStatusBadge status={verification?.status} onClick={() => openIssuePopover(verification)}/></td><td>...</td></tr>; })}</tbody></Table>; };`.

## Current Project State
```
app/src/
├── pages/
│   ├── StaffQueue.tsx (existing from US-020, to be modified)
│   └── PatientProfile.tsx (existing from US-011, to be modified)
├── components/
│   └── insurance/
│       ├── InsuranceStatusBadge.tsx (to be created)
│       ├── InsuranceIssuePopover.tsx (to be created)
│       ├── InsuranceInfoPanel.tsx (to be created)
│       └── VerificationHistory.tsx (to be created)
├── hooks/
│   └── useInsuranceVerification.ts (to be created)
└── types/
    └── insuranceVerification.ts (to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/types/insuranceVerification.ts | Insurance verification type definitions |
| CREATE | app/src/hooks/useInsuranceVerification.ts | Verification data hooks |
| CREATE | app/src/components/insurance/InsuranceStatusBadge.tsx | Status badge component |
| CREATE | app/src/components/insurance/InsuranceIssuePopover.tsx | Issue details popover |
| CREATE | app/src/components/insurance/InsuranceInfoPanel.tsx | Insurance info card |
| CREATE | app/src/components/insurance/VerificationHistory.tsx | History accordion |
| MODIFY | app/src/pages/StaffQueue.tsx | Add Insurance Status column |
| MODIFY | app/src/pages/PatientProfile.tsx | Add Insurance Info Panel |

## External References
- **React Query**: https://tanstack.com/query/latest - Data fetching with polling
- **date-fns**: https://date-fns.org/ - Date formatting (formatDistanceToNow, formatDate)
- **WCAG Badge Contrast**: https://webaim.org/resources/contrastchecker/ - Ensure 4.5:1 minimum
- **Popover Patterns**: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ - Accessible popover
- **Wireframe SCR-009**: .propel/context/wireframes/Hi-Fi/wireframe-SCR-009-queue-management.html
- **Wireframe SCR-011**: .propel/context/wireframes/Hi-Fi/wireframe-SCR-011-appointment-management.html

## Build Commands
- Start dev server: `npm run dev`
- Build for production: `npm run build`
- Type check: `npm run type-check`
- Lint: `npm run lint`

## Implementation Validation Strategy
- [x] InsuranceStatusBadge displays correct colors for each status
- [x] Active status shows green badge with checkmark "Verified ✓"
- [x] Inactive/failed status shows red badge "Issue ✗"
- [x] Requires auth status shows yellow badge "Auth Required ⚠️"
- [x] Pending status shows yellow badge with spinning icon "Pending ⏳"
- [x] Badge WCAG AA contrast ratios verified
- [x] InsuranceIssuePopover opens on badge click
- [x] Popover shows problem summary, details, recommended actions
- [x] Contact Patient button triggers notification
- [x] InsuranceInfoPanel displays all fields correctly
- [x] Copay and deductible formatted as currency
- [x] Coverage dates formatted as MM/DD/YYYY - MM/DD/YYYY
- [x] Last Verified shows relative time (e.g., "2 hours ago")
- [x] Re-verify Now button triggers verification with loading spinner
- [x] Re-verify success shows toast notification and updates data
- [x] VerificationHistory accordion expands to show past attempts
- [x] History shows date, status, API provider, errors
- [x] Staff Queue Insurance Status column added
- [x] Queue table displays badges for each patient
- [x] Filter dropdown for Insurance Status works (All/Verified/Issues/Pending)
- [x] Patient Profile Insurance Info Panel displays
- [x] Missing insurance shows alert with "Edit Patient" link
- [x] Multiple plans show "Primary Insurance" indicator
- [x] Polling every 30s when status='pending'
- [x] Polling stops when status resolves
- [x] Keyboard navigation works (Tab, Enter, Esc)
- [x] ARIA labels on all interactive elements
- [x] Screen reader announcements for status updates
- [x] Visual comparison against wireframes SCR-009 and SCR-011 completed

## Implementation Checklist
- [ ] Create app/src/types/insuranceVerification.ts (interfaces: InsuranceVerification with id/patient_id/appointment_id/verification_date/status enum/copay_amount/deductible_remaining/coverage_start_date/coverage_end_date/authorization_notes/insurance_plan/member_id/last_verified_at/verification_source/is_primary_insurance, VerificationAttempt with id/attempt_number/api_provider/response_code/status/error_message/attempted_at)
- [ ] Create app/src/hooks/useInsuranceVerification.ts (custom hook: useQuery GET /api/insurance/verifications/:patientId, if verification.status === 'pending' set refetchInterval 30000 for polling else false, staleTime 60000, return verification/isLoading/error/refetch, useMutation useReVerify POST /api/insurance/verifications/verify/:appointmentId onSuccess invalidate and toast, useVerificationHistory GET /api/insurance/verifications/:patientId/history return history/isLoading)
- [ ] Create app/src/components/insurance/InsuranceStatusBadge.tsx (accept status/onClick props, map status to config: active green #10b981 "Verified ✓" CheckIcon, inactive red #ef4444 "Issue ✗" XIcon, requires_auth yellow #f59e0b "Auth Required ⚠️" AlertIcon, pending yellow "Pending ⏳" SpinnerIcon animate-spin, failed red "Failed", incomplete gray #6b7280 "Not Verified", render badge span with backgroundColor from config color white cursor pointer if onClick, onClick triggers callback, ARIA label "Insurance status: {text}", WCAG AA contrast 4.5:1 minimum)
- [ ] Create app/src/components/insurance/InsuranceIssuePopover.tsx (accept verification/onClose/onContactPatient props, render popover/modal with sections: Problem summary h3 based on status "Insurance Inactive" or "Prior Authorization Required" or "Verification Failed", Details paragraph showing authorization_notes if exists or error_message if failed, Recommended Action paragraph with specific guidance for status, Actions div with buttons: "Contact Patient" onClick onContactPatient, "Retry Verification" if status=failed onClick useReVerify, "Close" onClick onClose, display coverage dates if available showing expiration warning if close to end date, keyboard accessible Tab order and Esc to close)
- [ ] Create app/src/components/insurance/InsuranceInfoPanel.tsx (accept patientId/appointmentId props, use useInsuranceVerification(patientId), if isLoading render Skeleton, if no insurance_plan render Alert "Insurance information incomplete" with "Edit Patient" button, render Card with header "Insurance Information" and "Re-verify Now" button onClick handleReVerify with loading spinner if isVerifying, dl fields: Insurance Plan verification.insurance_plan with Badge "Primary" if is_primary_insurance, Member ID verification.member_id, Status InsuranceStatusBadge onClick opens InsuranceIssuePopover state, Copay Amount formatted currency $XX.XX or "-", Deductible Remaining formatted currency, Coverage Dates formatDate range or "N/A", Authorization Notes if not null collapsible, Last Verified formatDistanceToNow addSuffix or "Never", VerificationHistory component below, InsuranceIssuePopover conditional render with showPopover state)
- [ ] Create app/src/components/insurance/VerificationHistory.tsx (accept patientId props, use useVerificationHistory hook, render expandable accordion "View Verification History ({count} attempts)", when expanded show table/list: Date formatted, Status badge mini version, API Provider text, Result Success/Failed/Timeout, Error Message if failed, collapsible if >5 entries show recent 5 with "Show All" button, if isLoading show skeleton, if no history show "No verification history")
- [ ] Modify app/src/pages/StaffQueue.tsx (add Insurance Status column after Patient Name and Appointment Time columns, for each appointment row use useInsuranceVerification(appt.patient_id), render InsuranceStatusBadge with verification?.status, onClick openIssuePopover state with selected verification, if no verification show gray "Not Verified", add filter dropdown above table: "Filter by Insurance Status" with options All/Verified/Issues/Pending/Not Verified, filter appointments based on selection)
- [ ] Modify app/src/pages/PatientProfile.tsx (add Insurance Info Panel section in patient details layout, position near demographics or medical history per wireframe SCR-011, render InsuranceInfoPanel component with patientId from route params and appointmentId if viewing from appointment context, ensure responsive layout mobile/tablet/desktop)
- [ ] Implement contact patient action (onContactPatient callback in InsuranceIssuePopover: open modal with pre-filled message "Your insurance verification failed. Please contact our office to update insurance information.", SMS/Email options using notification service from US-016, log action to audit_logs with action='insurance_contact_patient')
- [ ] Handle missing insurance edge case (in InsuranceInfoPanel if patient has no insurance_provider or insurance_policy_number in patient_profiles: show Alert "Insurance information incomplete. Please collect during check-in." with "Edit Patient" button link to patient edit form)
- [ ] Handle multiple insurance plans (check is_primary_insurance flag, show Badge "Primary Insurance" next to insurance_plan field, if patient has secondary insurance add note "Secondary insurance on file - manual review required")
- [ ] Implement polling logic (in useInsuranceVerification hook: if verification.status === 'pending' set refetchInterval 30000, stop polling when status changes to non-pending active/inactive/failed, show toast notification "Insurance verification completed" when status resolves from pending)
- [ ] Implement WCAG AA accessibility (keyboard navigation Tab to Insurance Status badge Enter to open popover Esc to close, ARIA labels on all badges "Insurance status: {status}", screen reader announcements role="status" when verification updates, focus management in popover trap focus return focus to trigger on close, ensure all interactive elements keyboard accessible)
- [ ] **[UI MANDATORY]** Reference wireframe-SCR-009-queue-management.html for Staff Queue insurance column placement and badge styles
- [ ] **[UI MANDATORY]** Reference wireframe-SCR-011-appointment-management.html for Patient Profile insurance panel layout and field arrangement
- [ ] **[UI MANDATORY]** Validate implementation against wireframes at breakpoints 375px, 768px, 1440px (mobile badge display, tablet table layout, desktop full panel)
- [ ] Write comprehensive tests (test InsuranceStatusBadge displays correct colors and icons for each status, test badge click opens InsuranceIssuePopover, test popover shows problem details and actions, test InsuranceInfoPanel displays all fields formatted correctly, test Re-verify button triggers verification mutation, test VerificationHistory expands and shows attempts, test Staff Queue column displays badges for each patient, test filter by insurance status works, test polling starts when status=pending and stops when resolved, test missing insurance shows alert, test keyboard navigation Tab/Enter/Esc, test ARIA labels with screen reader, test accessibility with axe-core)
