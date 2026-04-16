# Task - task_002_fe_enhanced_validation_schemas

## Requirement Reference
- User Story: US_047 - Inline Form Validation and Error Handling
- Story Location: .propel/context/tasks/us_047/us_047.md
- Acceptance Criteria:
    - System validates fields on blur (when user leaves field) for immediate feedback
    - System validates common field types: Email (RFC 5322 compliant regex), Phone (US format (XXX) XXX-XXXX or international +X XXX XXX XXXX), Date (valid date range, no future dates for DOB, no past dates for appointments), Required fields (not empty or whitespace only), Custom validations (e.g., insurance member ID format per provider)
    - System prevents form submission if validation fails (submit button disabled with tooltip "Please fix 3 errors")
    - System preserves form data during validation errors (no data loss on validation failure)
    - System implements debounced validation for expensive checks (e.g., username availability check after 500ms of no typing)
- Edge Cases:
    - What happens when validation rules change during session? (Re-validate all fields on rule update, show notification "Validation rules updated")
    - How are network errors during async validation handled? (Show "Unable to validate - check connection" message, allow user to proceed with warning)

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A (applies to all form screens) |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | See form wireframes: SCR-001, SCR-006, SCR-007, SCR-008, SCR-013 |
| **Screen Spec** | figma_spec.md#SCR-001, #SCR-006, #SCR-007, #SCR-008, #SCR-013 |
| **UXR Requirements** | UXR-501 (inline validation), UXR-502 (error recovery) |
| **Design Tokens** | designsystem.md#1.1 (Color Palette - Error colors) |

> US_047 Specific Validations (from user story):
> - **Email**: Regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, error "Email must include @ and domain (e.g., user@example.com)"
> - **Phone**: Format (XXX) XXX-XXXX, auto-formats as user types, error "Phone must be 10 digits"
> - **Date of Birth**: Must be past date, age ≥18 years, error "Patient must be 18 or older" or "Date cannot be in the future"
> - **Password**: Min 8 characters, 1 uppercase, 1 number, 1 special char, strength meter (Weak/Medium/Strong) below field
> - **Required fields**: Asterisk (*) in label, error "This field is required"
> - **Character limits**: Counter below field "45/200", turns red at 190+ characters as warning
> - **Validation Timing**: On Blur (most common), On Change (password strength, character count), On Submit (final validation), Debounced (async checks after 500ms)

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE:**
- **MUST** reference wireframes during validation schema implementation to match error message placement and timing
- **MUST** validate that error states match wireframe specifications (red border, error icon, inline message)

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.x |
| Library | Formik | 2.x |
| Library | Yup | 1.x |
| Library | date-fns | 3.x |
| Backend | N/A | N/A |
| Database | N/A | N/A |
| AI/ML | N/A | N/A |

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
Extend existing Yup validation schemas in app/src/utils/validators.ts with comprehensive field-level validations (email, phone, date, required, custom formats) and integrate them into all forms with on-blur validation, form-level error aggregation, submit button disabling logic, and form data preservation. Implement debounced async validation for expensive checks (username availability, insurance eligibility).

**Purpose**: Establish robust client-side validation logic that prevents invalid data submission, provides immediate feedback on blur, and gracefully handles async validation scenarios.

**Capabilities**:
- Email validation with RFC 5322 compliant regex
- Phone validation for US and international formats with auto-formatting
- Date validation with range checks (past dates for DOB, future dates for appointments, age >= 18)
- Required field validation (no empty or whitespace-only input)
- Custom format validations (insurance member ID per provider)
- Character limit enforcement with warning threshold
- Password strength validation (min 8 chars, 1 uppercase, 1 number, 1 special char)
- Form-level error aggregation before submit
- Submit button disabled state based on validation errors
- Form data preservation during validation failures (no data loss)
- Debounced async validation for expensive checks (500ms delay)

## Dependent Tasks
- task_001_fe_form_validation_ui_components (provides UI components like SuccessIndicator, CharacterCounter, FormErrorSummary)

## Impacted Components
- **MODIFY**: app/src/utils/validators.ts (extend with new validation schemas)
- **MODIFY**: app/src/components/LoginForm.tsx (add on-blur validation, form error aggregation, submit disabling)
- **CREATE**: app/src/utils/validators/phoneValidator.ts (US + international phone format validation)
- **CREATE**: app/src/utils/validators/dateValidator.ts (date range validation, age check)
- **CREATE**: app/src/utils/validators/customValidators.ts (insurance member ID, custom formats)
- **MODIFY**: app/src/constants/errorMessages.ts (add new specific error messages)
- **CREATE**: app/src/hooks/useAsyncValidation.ts (debounced async validation hook)
- **CREATE**: app/src/hooks/useFormErrorTracking.ts (track form-level errors for submit button disabling)

## Implementation Plan

### Phase 1: Enhanced Validation Schemas (2 hours)
1. **Extend validators.ts with email validation**:
   - Update EMAIL_REGEX to RFC 5322 compliant: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
   - Error message: "Email must include @ and domain (e.g., user@example.com)"
   - Max length: 255 characters

2. **Create phoneValidator.ts**:
   - US phone format: (XXX) XXX-XXXX validation
   - International format: +X XXX XXX XXXX validation
   - Auto-formatting function: formatPhoneNumber(rawInput) -> formatted output
   - Yup schema: `phoneSchema` with `.matches()` for format validation
   - Error message: "Phone must be 10 digits" (US) or "Please enter a valid international phone number"

3. **Create dateValidator.ts**:
   - Past date validation: `isPastDate(date)` using date-fns `isPast()`
   - Future date validation: `isFutureDate(date)` using date-fns `isFuture()`
   - Age check: `isAgeAbove18(dob)` using date-fns `differenceInYears()`
   - Yup schemas: `dobSchema` (must be past, age >= 18), `appointmentDateSchema` (must be future)
   - Error messages: "Date must be in the past", "Date must be in the future", "Patient must be 18 or older"

4. **Create customValidators.ts**:
   - Insurance member ID format validation (per provider): `validateInsuranceMemberID(memberId, provider)`
   - Custom regex patterns for different insurance providers (e.g., BlueCross: /^[A-Z]{3}\d{9}$/)
   - Extensible for other custom formats
   - Yup schema: `insuranceMemberIDSchema` with dynamic `.matches()` based on provider

### Phase 2: Password Strength Validation (1 hour)
5. **Extend passwordSchema with strength rules**:
   - Min 8 characters, max 128 characters
   - Must contain: 1 uppercase, 1 lowercase, 1 number, 1 special character
   - Regex: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/`
   - Password strength calculation: `calculatePasswordStrength(password)` -> "Weak" | "Medium" | "Strong"
   - Strength meter logic: Weak (meets min requirements), Medium (12+ chars), Strong (16+ chars + special chars)
   - Error message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"

### Phase 3: Form-Level Validation & Submit Disabling (1.5 hours)
6. **Create useFormErrorTracking hook**:
   - Track all field errors in form state
   - Aggregate errors into array: `formErrors: Array<{field: string, message: string}>`
   - Expose `hasErrors: boolean` (true if any field has errors)
   - Calculate error count: `errorCount: number`
   - Use case: Enable/disable submit button based on `hasErrors`

7. **Implement submit button disabling logic**:
   - Disable submit button when `hasErrors === true`
   - Add tooltip on hover: "Please fix [errorCount] error(s)"
   - Prevent form submission in `onSubmit` handler (early return if errors exist)
   - Visual state: Gray background, cursor: not-allowed, opacity: 0.6

### Phase 4: On-Blur Validation & Data Preservation (1 hour)
8. **Configure validateOnBlur for all forms**:
   - Modify Formik config: `validateOnBlur={true}`, `validateOnChange={false}` (default)
   - Exception: Password strength and character counters use `validateOnChange={true}`
   - Trigger validation immediately when user leaves field (blur event)
   - Update error state in Formik: `touched[fieldName]` set to true on blur

9. **Implement form data preservation**:
   - Formik automatically preserves form data in state (no additional code needed)
   - Validate that errors do NOT clear form values (test: trigger validation error, verify input value persists)
   - Add persistence to localStorage for long forms (optional, e.g., appointment booking intake form)
   - localStorage key: `formDraft_[formName]_[userId]`
   - Auto-save on blur: `localStorage.setItem(key, JSON.stringify(formValues))`

### Phase 5: Async Validation with Debouncing (1.5 hours)
10. **Create useAsyncValidation hook**:
    - Accept: `validationFn: (value: string) => Promise<boolean>`, `delay: number = 500`
    - Return: `{isValidating: boolean, validationError: string | null, validate: (value: string) => void}`
    - Debounce logic: Use useDebounce hook from task_001, wait 500ms before calling `validationFn`
    - Handle network errors: Catch promise rejection, show "Unable to validate - check connection" message
    - Allow user to proceed with warning (don't block form submission on network error)

11. **Integrate async validation into forms**:
    - Example: Username availability check in registration form
    - API endpoint: `GET /api/users/check-username?username=X` (implemented in task_003)
    - Use useAsyncValidation hook: `validate(username)` on blur
    - Display AsyncValidationSpinner from task_001 while `isValidating === true`
    - Show validation error if username is taken: "Username is already taken"

## Current Project State
```
app/
  src/
    components/
      common/
        SuccessIndicator.tsx (from task_001)
        CharacterCounter.tsx (from task_001)
        FormErrorSummary.tsx (from task_001)
        AsyncValidationSpinner.tsx (from task_001)
      LoginForm.tsx (MODIFY - add on-blur, error tracking, submit disabling)
    constants/
      errorMessages.ts (MODIFY - add new error messages)
    hooks/
      useDebounce.ts (from task_001)
      (NEW - useAsyncValidation.ts, useFormErrorTracking.ts)
    utils/
      validators.ts (MODIFY - extend with new schemas)
      validators/
        (NEW - phoneValidator.ts, dateValidator.ts, customValidators.ts)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| MODIFY | app/src/utils/validators.ts | Extend with email, password strength schemas |
| CREATE | app/src/utils/validators/phoneValidator.ts | US + international phone format validation with auto-formatting |
| CREATE | app/src/utils/validators/dateValidator.ts | Date range validation (past, future, age >= 18) |
| CREATE | app/src/utils/validators/customValidators.ts | Insurance member ID format validation per provider |
| MODIFY | app/src/constants/errorMessages.ts | Add specific error messages for email, phone, date, password validations |
| CREATE | app/src/hooks/useAsyncValidation.ts | Debounced async validation hook (500ms delay, network error handling) |
| CREATE | app/src/hooks/useFormErrorTracking.ts | Track form-level errors for submit button disabling logic |
| MODIFY | app/src/components/LoginForm.tsx | Add validateOnBlur, form error tracking, submit button disabling, form data preservation |

## External References
- **Yup Validation Methods**: https://github.com/jquense/yup#api (`.matches()`, `.min()`, `.max()`, `.oneOf()`)
- **RFC 5322 Email Regex**: https://emailregex.com/ (Email validation standard)
- **date-fns Library**: https://date-fns.org/docs/Getting-Started (Date manipulation and validation)
- **Phone Number Formatting**: https://www.npmjs.com/package/libphonenumber-js (International phone number formatting)
- **Formik Validation**: https://formik.org/docs/guides/validation (On-blur vs on-change validation)
- **Password Strength Meter**: https://www.npmjs.com/package/zxcvbn (Password strength calculation)
- **localStorage API**: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage (Form data persistence)

## Build Commands
```bash
# Install dependencies
cd app
npm install date-fns libphonenumber-js zxcvbn

# Start dev server
npm run dev

# Run linting
npm run lint

# Type check
npm run type-check

# Build for production
npm run build
```

## Implementation Validation Strategy
- [x] Unit tests pass (test each validator function with valid/invalid inputs)
- [x] Integration tests pass (test forms with validation schemas)
- [x] **[UI Tasks]** Visual comparison against wireframe completed (error states match wireframe specs)
- [x] **[UI Tasks]** Run `/analyze-ux` to validate error message placement and timing
- [x] Manual testing: Trigger validation errors on blur, verify error messages are specific and helpful
- [x] Async validation testing: Mock slow API responses, verify 500ms debounce works correctly
- [x] Network error testing: Disconnect network during async validation, verify graceful fallback
- [x] Form data preservation: Trigger validation errors, verify form values persist (no data loss)
- [x] Submit button disabling: Verify button is disabled when errors exist, enabled when all fields valid
- [x] Cross-browser testing: Verify validation works in Chrome, Firefox, Safari, Edge

## Implementation Checklist
- [x] Create validators/phoneValidator.ts with US format (XXX) XXX-XXXX and international +X XXX XXX XXXX validation, plus auto-formatting utility
- [x] Create validators/dateValidator.ts with past/future date checks and age >= 18 validation using date-fns
- [x] Create validators/customValidators.ts with insurance member ID format validation (per provider with dynamic regex)
- [x] Extend validators.ts with RFC 5322 compliant email regex and password strength rules (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char, strength meter logic)
- [x] Create useFormErrorTracking hook to aggregate field errors, expose hasErrors boolean, and implement submit button disabling logic with tooltip "Fix X errors"
- [x] Configure validateOnBlur for all forms (Formik: validateOnBlur={true}, validateOnChange={false} for most fields, except password strength/character counters)
- [x] Create useAsyncValidation hook with 500ms debounce, network error handling ("Unable to validate - check connection"), and integrate with username availability and insurance eligibility checks
- [x] Add specific error messages to errorMessages.ts for email, phone, date, password, insurance validations, and verify form data persistence (Formik state + optional localStorage for long forms)
- **[UI Tasks - MANDATORY]** Reference wireframes during implementation to match error state timing and placement
- **[UI Tasks - MANDATORY]** Validate error messages appear on blur and match wireframe specifications before marking complete
