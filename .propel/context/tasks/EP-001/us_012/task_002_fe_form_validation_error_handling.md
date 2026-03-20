# Task - TASK_002_FE_FORM_VALIDATION_ERROR_HANDLING

## Requirement Reference
- User Story: US_012  
- Story Location: `.propel/context/tasks/us_012/us_012.md`
- Acceptance Criteria:
    - AC3: Invalid credentials → inline error "Invalid email or password" below form without page reload
- Edge Cases:
    - Empty fields: Display "Email is required", "Password is required"
    - Slow network: Show loading spinner, disable form, timeout 30 seconds with retry
    - Backend unavailable: Display "Service temporarily unavailable. Please try again." with retry button

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-001 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-001-login.html |
| **Screen Spec** | SCR-001 (Login Page) |
| **UXR Requirements** | UXR-501 (Inline validation), UXR-502 (Clear error messages) |
| **Design Tokens** | Error color: #C53030, Error text: 14px, Error icon |

> **Note**: Form validation with inline error display

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.2 |
| Frontend | TypeScript | 5.3.x |
| Frontend | Yup / Zod | Latest (validation schema) |
| Backend | N/A | N/A |
| Database | N/A | N/A |

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

> **Note**: Form validation only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | Yes (Responsive web) |
| **Platform Target** | Web (Mobile-first) |
| **Min OS Version** | N/A |
| **Mobile Framework** | Responsive CSS |

> **Note**: Mobile-first validation UX

## Task Overview
Implement comprehensive form validation for login page with client-side validation (email format, required fields) and server-side error handling (invalid credentials, network errors). Create validation schema using Yup or Zod for type-safe validation. Implement real-time field validation (on blur) and form-level validation (on submit). Display inline error messages below each field with error styling (red border, error icon, error text). Handle API errors gracefully with user-friendly messages. Implement loading states with spinner and disabled form. Add timeout handling (30 seconds) with retry functionality for slow networks. Ensure error messages are accessible with role="alert" for screen readers.

## Dependent Tasks
- US_012 TASK_001: Login page UI must be implemented

## Impacted Components
**Modified:**
- app/src/components/auth/LoginForm.tsx (Add validation logic)
- app/src/pages/LoginPage.tsx (Add error state management)

**New:**
- app/src/utils/validation/loginSchema.ts (Validation schema with Yup/Zod)
- app/src/hooks/useFormValidation.ts (Custom hook for form validation)
- app/src/components/common/ErrorMessage.tsx (Reusable error message component)
- app/src/components/common/LoadingSpinner.tsx (Loading spinner component)
- app/src/utils/api/errorHandler.ts (API error handler utility)
- app/src/constants/errorMessages.ts (Error message constants)

## Implementation Plan
1. **Validation Schema**: Define Yup or Zod schema for email (format) and password (required, min length)
2. **Field Validation**: Validate on blur (real-time feedback)
3. **Form Validation**: Validate on submit before API call
4. **Error Display**: Show inline errors below fields with red border and error icon
5. **API Error Handling**: Map API errors to user-friendly messages
6. **Network Timeout**: Implement 30-second timeout with AbortController
7. **Retry Logic**: Show retry button on network errors
8. **Loading State**: Disable form inputs and show spinner during submission
9. **Accessibility**: Use role="alert" for error messages, aria-invalid on inputs
10. **Error Messages**: Centralize error messages for consistency and i18n preparation

## Current Project State
```
ASSIGNMENT/
├── app/                     # Frontend (US_001)
│   ├── src/
│   │   ├── pages/
│   │   │   └── LoginPage.tsx (US_012 TASK_001)
│   │   └── components/
│   │       └── auth/
│   │           └── LoginForm.tsx (US_012 TASK_001)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/utils/validation/loginSchema.ts | Yup/Zod schema for email and password validation |
| CREATE | app/src/hooks/useFormValidation.ts | Custom hook for form validation logic |
| CREATE | app/src/components/common/ErrorMessage.tsx | Reusable error message component with icon |
| CREATE | app/src/components/common/LoadingSpinner.tsx | Spinner component for loading states |
| CREATE | app/src/utils/api/errorHandler.ts | Map API errors to user-friendly messages |
| CREATE | app/src/constants/errorMessages.ts | Centralized error message constants |
| MODIFY | app/src/components/auth/LoginForm.tsx | Integrate validation, error display, loading state |
| MODIFY | app/src/pages/LoginPage.tsx | Handle API errors, timeout, retry logic |

> 2 modified files, 6 new files created

## External References
- [Yup Validation](https://github.com/jquense/yup)
- [Zod Validation](https://zod.dev/)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [AbortController for Timeout](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [ARIA role=alert](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/alert_role)

## Build Commands
```bash
# Install validation library
cd app
npm install yup
# OR
npm install zod

# Start development server
npm start

# Test validation scenarios
# 1. Empty fields: Leave email/password empty, click Login
# Expected: "Email is required", "Password is required" below fields

# 2. Invalid email format: Enter "notanemail", click Login
# Expected: "Please enter a valid email address"

# 3. Valid format but wrong credentials: Enter valid email + wrong password
# Expected: API call, then "Invalid email or password" below form

# 4. Network timeout: Simulate slow network (DevTools Network throttling to Slow 3G)
# Expected: After 30 seconds, "Request timed out. Please try again." with Retry button

# 5. Backend unavailable: Stop backend server, click Login
# Expected: "Service temporarily unavailable. Please try again." with Retry button

# 6. Real-time validation: Enter invalid email, tab to next field (blur event)
# Expected: Error appears immediately without submitting form

# 7. Error clearing: Fix email error, tab away
# Expected: Error message disappears

# Test accessibility
# Screen reader: Errors announced with role="alert"
# Keyboard: Focus moves to first error field after submit attempt
```

## Implementation Validation Strategy
- [ ] Validation schema created with email and password rules
- [ ] Empty email → "Email is required" error
- [ ] Empty password → "Password is required" error
- [ ] Invalid email format → "Please enter a valid email address"
- [ ] Real-time validation on blur → error appears without submit
- [ ] Form-level validation on submit → checks all fields before API call
- [ ] Invalid credentials from API → "Invalid email or password" displayed
- [ ] Network timeout (30s) → "Request timed out" with Retry button
- [ ] Backend unavailable → "Service temporarily unavailable" with Retry button
- [ ] Loading state → form disabled, spinner shown, button text "Logging in..."
- [ ] Error styling → red border on input, error icon, error text below
- [ ] Error accessibility → role="alert", aria-invalid="true" on inputs
- [ ] Retry button works → clears error, re-attempts API call
- [ ] Error clears on successful input fix → no stale errors

## Implementation Checklist

### Error Message Constants (app/src/constants/errorMessages.ts)
- [ ] export const ERROR_MESSAGES = {
- [ ]   EMAIL_REQUIRED: 'Email is required',
- [ ]   EMAIL_INVALID: 'Please enter a valid email address',
- [ ]   PASSWORD_REQUIRED: 'Password is required',
- [ ]   PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters',
- [ ]   INVALID_CREDENTIALS: 'Invalid email or password',
- [ ]   NETWORK_ERROR: 'Network error. Please check your connection.',
- [ ]   TIMEOUT_ERROR: 'Request timed out. Please try again.',
- [ ]   SERVER_ERROR: 'Service temporarily unavailable. Please try again.',
- [ ]   GENERIC_ERROR: 'Something went wrong. Please try again.'
- [ ] }

### Validation Schema (app/src/utils/validation/loginSchema.ts)
- [ ] Import yup (or zod)
- [ ] export const loginSchema = yup.object().shape({
- [ ]   email: yup.string()
- [ ]     .required(ERROR_MESSAGES.EMAIL_REQUIRED)
- [ ]     .email(ERROR_MESSAGES.EMAIL_INVALID),
- [ ]   password: yup.string()
- [ ]     .required(ERROR_MESSAGES.PASSWORD_REQUIRED)
- [ ]     .min(8, ERROR_MESSAGES.PASSWORD_MIN_LENGTH)
- [ ] })
- [ ] Export schema and validation function: export const validateLogin = async (data) => { try { await loginSchema.validate(data, { abortEarly: false }); return { valid: true, errors: {} }; } catch (err) { /* map errors */ return { valid: false, errors }; } }

### API Error Handler (app/src/utils/api/errorHandler.ts)
- [ ] Import ERROR_MESSAGES
- [ ] export const handleApiError = (error: any): string => {
- [ ]   if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
- [ ]     return ERROR_MESSAGES.TIMEOUT_ERROR;
- [ ]   }
- [ ]   if (error.response?.status === 401 || error.response?.status === 403) {
- [ ]     return ERROR_MESSAGES.INVALID_CREDENTIALS;
- [ ]   }
- [ ]   if (error.response?.status >= 500) {
- [ ]     return ERROR_MESSAGES.SERVER_ERROR;
- [ ]   }
- [ ]   if (!error.response) {
- [ ]     return ERROR_MESSAGES.NETWORK_ERROR;
- [ ]   }
- [ ]   return error.response?.data?.message || ERROR_MESSAGES.GENERIC_ERROR;
- [ ] }

### Error Message Component (app/src/components/common/ErrorMessage.tsx)
- [ ] Props: { message: string; icon?: boolean; }
- [ ] Render: <div role="alert" className="error-message">
- [ ]   {icon && <ErrorIcon />}
- [ ]   <span>{message}</span>
- [ ] </div>
- [ ] CSS: .error-message { display: flex; align-items: center; gap: 8px; color: var(--color-error); font-size: 14px; margin-top: 4px; }

### Loading Spinner Component (app/src/components/common/LoadingSpinner.tsx)
- [ ] Props: { size?: 'small' | 'medium' | 'large' }
- [ ] Render: <div className={`spinner spinner-${size}`} role="status" aria-label="Loading">
- [ ]   <div className="spinner-circle"></div>
- [ ] </div>
- [ ] CSS: Animated rotating circle with CSS @keyframes

### Form Validation Hook (app/src/hooks/useFormValidation.ts)
- [ ] Import loginSchema, ERROR_MESSAGES
- [ ] export const useFormValidation = () => {
- [ ]   const [errors, setErrors] = useState<Record<string, string>>({})
- [ ]   const validateField = (name: string, value: string) => {
- [ ]     try { loginSchema.validateSyncAt(name, { [name]: value }); setErrors(prev => { const newErrors = {...prev}; delete newErrors[name]; return newErrors; }); } catch (err) { setErrors(prev => ({ ...prev, [name]: err.message })); }
- [ ]   }
- [ ]   const validateAll = async (data: LoginCredentials) => {
- [ ]     const result = await validateLogin(data);
- [ ]     setErrors(result.errors);
- [ ]     return result.valid;
- [ ]   }
- [ ]   const clearError = (name: string) => { setErrors(prev => { const newErrors = {...prev}; delete newErrors[name]; return newErrors; }); }
- [ ]   const clearAllErrors = () => setErrors({})
- [ ]   return { errors, validateField, validateAll, clearError, clearAllErrors }
- [ ] }

### Update LoginForm (app/src/components/auth/LoginForm.tsx)
- [ ] Import useFormValidation, ErrorMessage, LoadingSpinner
- [ ] Use hook: const { errors, validateField, validateAll, clearAllErrors } = useFormValidation()
- [ ] On email blur: validateField('email', email)
- [ ] On password blur: validateField('password', password)
- [ ] On submit: const isValid = await validateAll({ email, password, rememberMe }); if (!isValid) return; /* proceed with API call */
- [ ] Update Input components: Pass error={errors.email} to email Input, error={errors.password} to password Input
- [ ] Show loading: {loading && <LoadingSpinner size="small" />} inside button
- [ ] Disable form: disabled={loading} on all inputs and button
- [ ] Display API error: {error && <ErrorMessage message={error} icon />} above submit button

### Update LoginPage (app/src/pages/LoginPage.tsx)
- [ ] Import handleApiError, axios
- [ ] State: const [loading, setLoading] = useState(false)
- [ ] State: const [error, setError] = useState<string | null>(null)
- [ ] State: const [showRetry, setShowRetry] = useState(false)
- [ ] Implement handleLogin: async (credentials: LoginCredentials) => {
- [ ]   setLoading(true); setError(null); setShowRetry(false);
- [ ]   const controller = new AbortController();
- [ ]   const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
- [ ]   try {
- [ ]     const response = await axios.post('/api/auth/login', credentials, { signal: controller.signal, timeout: 30000 });
- [ ]     clearTimeout(timeout);
- [ ]     // Handle success (TASK_003)
- [ ]   } catch (err) {
- [ ]     clearTimeout(timeout);
- [ ]     const errorMessage = handleApiError(err);
- [ ]     setError(errorMessage);
- [ ]     setShowRetry(true);
- [ ]   } finally {
- [ ]     setLoading(false);
- [ ]   }
- [ ] }
- [ ] Implement retry: const handleRetry = () => { handleLogin(lastCredentials); }
- [ ] Render retry button: {showRetry && <Button onClick={handleRetry} variant="secondary">Retry</Button>}

### Validation and Testing
- [ ] Start dev server: npm start
- [ ] Test empty fields: Submit empty form → errors appear for both fields
- [ ] Test invalid email: Enter "notanemail" → blur → error appears
- [ ] Test valid email: Enter "test@example.com" → blur → no error (or clears previous error)
- [ ] Test short password: Enter "123" → blur → "Password must be at least 8 characters"
- [ ] Test form-level validation: Fix email, leave password empty → submit → password error persists
- [ ] Test invalid credentials: Enter valid format but wrong password → submit → "Invalid email or password"
- [ ] Test network timeout: Slow 3G → submit → wait 30s → "Request timed out" with Retry
- [ ] Test backend down: Stop backend → submit → "Service temporarily unavailable" with Retry
- [ ] Test retry: Click Retry button → form re-submits
- [ ] Test loading state: Submit → form disabled, spinner shown
- [ ] Test error clearing: Fix field with error → blur → error disappears
- [ ] Test accessibility: Screen reader announces errors, aria-invalid on fields with errors
