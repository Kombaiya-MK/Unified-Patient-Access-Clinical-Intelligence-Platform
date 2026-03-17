# Task - TASK_001_FE_LOGIN_PAGE_UI

## Requirement Reference
- User Story: US_012
- Story Location: `.propel/context/tasks/us_012/us_012.md`
- Acceptance Criteria:
    - AC1: Login page (SCR-001) displays email/password fields, "Remember Me" checkbox, "Forgot Password" link, "Login" button when not authenticated
    - AC2: Valid credentials redirect to role-specific dashboard (SCR-002 Patient, SCR-003 Staff, SCR-004 Admin)
    - AC3: Invalid credentials show inline error "Invalid email or password" below form without page reload
    - AC4: Keyboard navigation: Tab through form elements with visible focus indicators (2px solid outline)
- Edge Cases:
    - Empty fields: Display inline validation errors "Email is required", "Password is required"
    - Slow network: Show loading spinner, disable form, timeout after 30 seconds with retry
    - Backend unavailable: Display "Service temporarily unavailable. Please try again." with retry button
    - Password visibility toggle: Show/hide icon with aria-label for screen readers

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-001 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-001-login.html |
| **Screen Spec** | SCR-001 (Login Page) |
| **UXR Requirements** | UXR-101 (WCAG AA), UXR-102 (Screen reader), UXR-103 (Keyboard nav), UXR-201 (Mobile-first), UXR-302 (4.5:1 contrast), UXR-501 (Inline validation), UXR-502 (Clear errors) |
| **Design Tokens** | Primary color: #007BFF, Error: #DC3545, Success: #28A745, Font: Inter 16px, Focus outline: 2px solid #007BFF |

> **Wireframe Components:**
> - Email input: text, required, pattern for email validation, aria-label="Email address"
> - Password input: password type, required, minLength 8, show/hide toggle button, aria-label="Password"
> - Remember Me checkbox: extends session to 7 days (overrides 15-min default)
> - Forgot Password link: navigates to /forgot-password
> - Login button: primary action, disabled during submission, shows loading spinner
> - Responsive breakpoints: Mobile 375px+, Tablet 768px+, Desktop 1024px+
> - Color contrast: 4.5:1 minimum (WCAG AA), 7:1 for primary button

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | React | 18.2.x |
| Frontend | TypeScript | 5.3.x |
| Frontend | React Router | 6.x |
| Frontend | Axios | 1.x |
| Backend | Express (auth API) | 4.x |
| Database | N/A (FE only) | N/A |
| AI/ML | N/A | N/A |

**Note**: All UI components MUST be compatible with React 18.2, TypeScript 5.3, WCAG 2.2 AA

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

> **Note**: No AI features - authentication UI only

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | Yes (Responsive Web - Mobile-first) |
| **Platform Target** | Web (Responsive) |
| **Min OS Version** | iOS 14+, Android 10+ (browser support) |
| **Mobile Framework** | React (Responsive Web App) |

> **Note**: Mobile-first responsive design, not native app

## Task Overview
Implement Login page (SCR-001) with email/password form, inline validation (Formik + Yup), WCAG 2.2 AA accessibility (keyboard navigation, screen reader labels, 4.5:1 color contrast), role-based redirection (Patient→Dashboard, Staff→Queue, Admin→Admin Dashboard), loading states, error handling (401, 503, network timeout), "Remember Me" session extension, password show/hide toggle. Follows wireframe-SCR-001-login.html layout.

## Dependent Tasks
- US_001: React frontend setup (routing, folder structure)
- US_009 Task 001: Backend authentication API (POST /auth/login)

## Impacted Components
**New:**
- app/src/pages/LoginPage.tsx (Login page component)
- app/src/components/LoginForm.tsx (Form component with Formik)
- app/src/hooks/useAuth.ts (Custom hook for authentication state)
- app/src/services/authService.ts (API calls to /auth/login, /auth/logout)
- app/src/types/auth.types.ts (LoginRequest, LoginResponse, UserRole types)
- app/src/utils/validators.ts (Yup schemas for email/password validation)
- app/src/styles/LoginPage.module.css (Scoped styles for login page)

## Implementation Plan
1. **Install dependencies**: `npm install formik yup axios react-router-dom`
2. **Create types**: LoginRequest {email, password, rememberMe}, LoginResponse {token, userId, role}, UserRole enum
3. **Create authService**: 
   - login(credentials): POST /auth/login, return {token, userId, role}
   - logout(): POST /auth/logout
   - storeToken(token, rememberMe): Save to localStorage (7 days) or sessionStorage (15 min)
4. **Create useAuth hook**: 
   - login(credentials): Call authService, store token, navigate to role-specific dashboard
   - logout(): Clear token, navigate to /login
   - isAuthenticated: Check if token exists and not expired
5. **Create validators**: Yup schema for email (required, valid format), password (required, min 8 chars)
6. **Create LoginForm component**:
   - Formik with initialValues {email: '', password: '', rememberMe: false}
   - onSubmit: Call useAuth.login, handle success/error
   - Inline validation on blur (email format, password length)
   - Display errors below fields (red text, error icon)
   - Loading state: Disable form, show spinner on button
   - Password toggle: Eye icon to show/hide password
7. **Create LoginPage component**:
   - Header with logo, title "Login to UPACI"
   - LoginForm component
   - "Forgot Password?" link (navigate to /forgot-password)
   - Responsive layout: Mobile-first (stacked), Tablet+ (centered card)
8. **Implement accessibility**:
   - aria-label for form fields
   - aria-invalid for error states
   - aria-live for error announcements
   - Visible focus indicators (2px solid outline)
   - Logical tab order
9. **Configure routing**: / redirects to /login if not authenticated, /login redirects to dashboard if authenticated
10. **Test error scenarios**: 401 (invalid credentials), 503 (backend unavailable), network timeout (30s), empty fields validation

## Current Project State
```
ASSIGNMENT/
├── app/                  # Frontend (US_001)
│   ├── src/
│   │   ├── pages/ (exists, empty)
│   │   ├── components/ (exists, empty)
│   │   ├── hooks/ (exists, empty)
│   │   ├── services/ (exists, empty)
│   │   ├── types/ (exists, empty)
│   │   ├── utils/ (exists, empty)
│   │   └── styles/ (exists, empty)
│   └── package.json
└── server/ (auth API ready from US_009)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/pages/LoginPage.tsx | Login page layout with logo, form, forgot password link |
| CREATE | app/src/components/LoginForm.tsx | Formik form with email, password, rememberMe, submit button |
| CREATE | app/src/hooks/useAuth.ts | Custom hook: login, logout, isAuthenticated |
| CREATE | app/src/services/authService.ts | Axios calls: POST /auth/login, storeToken, getToken, clearToken |
| CREATE | app/src/types/auth.types.ts | LoginRequest, LoginResponse, UserRole interfaces |
| CREATE | app/src/utils/validators.ts | Yup schemas: loginSchema with email/password rules |
| CREATE | app/src/styles/LoginPage.module.css | Scoped styles: mobile-first, centered card, 4.5:1 contrast |
| UPDATE | app/src/App.tsx | Add routes: / → redirect logic, /login → Login Page |
| UPDATE | app/package.json | Add dependencies: formik, yup, axios, react-router-dom |

> Creates 7 new files, updates 2 existing files

## External References
- [Formik Documentation](https://formik.org/docs/overview)
- [Yup Validation](https://github.com/jquense/yup)
- [React Router v6](https://reactrouter.com/en/main)
- [Axios HTTP Client](https://axios-http.com/docs/intro)
- [WCAG 2.2 AA Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [ARIA Labels Best Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Wireframe SCR-001](../../../.propel/context/wireframes/Hi-Fi/wireframe-SCR-001-login.html)

## Build Commands
```bash
# Install dependencies
cd app
npm install formik yup axios react-router-dom

# Development server
npm run dev  # Opens http://localhost:3000/login

# Build
npm run build

# Test
npm run test
```

## Implementation Validation Strategy
- [ ] Unit tests: LoginForm renders email, password, button
- [ ] Unit tests: Validation shows errors for invalid email format
- [ ] Integration tests: Successful login redirects to correct dashboard by role
- [ ] formik installed: package.json shows formik@2.x
- [ ] yup installed: package.json shows yup@1.x
- [ ] Login page renders: Navigate to /login → see email, password fields, Login button
- [ ] Email validation: Enter invalid email → blur → see "Invalid email format" error
- [ ] Password validation: Enter 6 chars → blur → see "Password must be at least 8 characters"
- [ ] Empty field validation: Submit empty form → see "Email is required", "Password is required"
- [ ] Keyboard navigation: Tab through form → all elements receive focus outline (2px solid)
- [ ] Screen reader: Use NVDA/JAWS → verify aria-labels announced correctly
- [ ] Color contrast: Use browser DevTools → verify 4.5:1 minimum contrast ratio
- [ ] Password toggle: Click eye icon → password visible, click again → hidden
- [ ] Loading state: Submit form → button shows spinner, form disabled
- [ ] Valid credentials: Submit → redirected to /dashboard (patient) or /queue (staff) or /admin (admin)
- [ ] Invalid credentials: Submit → see "Invalid email or password" below form (red text)
- [ ] Backend unavailable: Stop backend → submit → see "Service temporarily unavailable" with retry button
- [ ] Network timeout: Simulate slow network → wait 30s → timeout message displayed
- [ ] Remember Me: Check checkbox → login → token stored in localStorage (persist 7 days)
- [ ] Remember Me unchecked: Login → token stored in sessionStorage (clear on close)
- [ ] Responsive: Test at 375px (mobile), 768px (tablet), 1024px (desktop) → layout adapts

## Implementation Checklist
- [ ] Install dependencies: `cd app && npm install formik yup axios react-router-dom`
- [ ] Create app/src/types/auth.types.ts:
  - [ ] `export type UserRole = 'admin' | 'staff' | 'patient'`
  - [ ] `export interface LoginRequest { email: string; password: string; rememberMe?: boolean; }`
  - [ ] `export interface LoginResponse { token: string; userId: string; role: UserRole; email: string; }`
- [ ] Create app/src/services/authService.ts:
  - [ ] Import axios
  - [ ] `const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'`
  - [ ] Implement login(credentials): `axios.post('${API_BASE_URL}/auth/login', credentials)`
  - [ ] Implement storeToken(token, rememberMe): `rememberMe ? localStorage.setItem('authToken', token) : sessionStorage.setItem('authToken', token)`
  - [ ] Implement getToken(): `localStorage.getItem('authToken') || sessionStorage.getItem('authToken')`
  - [ ] Implement clearToken(): `localStorage.removeItem('authToken'); sessionStorage.removeItem('authToken')`
  - [ ] Implement logout(): `axios.post('${API_BASE_URL}/auth/logout', {}, { headers: { Authorization: 'Bearer ${getToken()}' }})`
- [ ] Create app/src/utils/validators.ts:
  - [ ] Import yup
  - [ ] `export const loginSchema = yup.object({ email: yup.string().required('Email is required').email('Invalid email format'), password: yup.string().required('Password is required').min(8, 'Password must be at least 8 characters') })`
- [ ] Create app/src/hooks/useAuth.ts:
  - [ ] Import useState, useNavigate, authService
  - [ ] State: loading, error
  - [ ] Implement login(credentials):
    - [ ] Set loading=true, error=null
    - [ ] Try authService.login(credentials)
    - [ ] On success: storeToken(token, rememberMe), navigate to dashboard by role (patient→/dashboard, staff→/queue, admin→/admin)
    - [ ] On error: Set error message, log to console
    - [ ] Finally: Set loading=false
  - [ ] Implement logout(): authService.clearToken(), navigate to /login
  - [ ] Implement isAuthenticated(): !!authService.getToken()
  - [ ] Return { login, logout, isAuthenticated, loading, error }
- [ ] Create app/src/components/LoginForm.tsx:
  - [ ] Import Formik, Form, Field, ErrorMessage, useAuth, loginSchema
  - [ ] Formik initialValues: {email: '', password: '', rememberMe: false}
  - [ ] Formik validationSchema: loginSchema
  - [ ] Formik onSubmit: (values) => auth.login(values)
  - [ ] State: showPassword (for toggle)
  - [ ] Render:
    - [ ] Email Field with label, aria-label="Email address", aria-invalid={touched && error}
    - [ ] ErrorMessage for email (red text below field)
    - [ ] Password Field with label, type={showPassword ? 'text' : 'password'}, aria-label="Password"
    - [ ] Eye icon button: onClick toggle showPassword, aria-label="Show password" / "Hide password"
    - [ ] ErrorMessage for password
    - [ ] Remember Me checkbox with label
    - [ ] Submit button: disabled={isSubmitting}, shows spinner if loading
    - [ ] Global error message below form (red text, aria-live="assertive")
  - [ ] Styles: Focus outline 2px solid, color contrast 4.5:1
- [ ] Create app/src/pages/LoginPage.tsx:
  - [ ] Import LoginForm, Link from react-router-dom
  - [ ] Render:
    - [ ] Header: Logo (UPACI), Title "Login"
    - [ ] LoginForm component
    - [ ] Forgot Password link: <Link to="/forgot-password">Forgot Password?</Link>
    - [ ] Footer: Privacy policy, terms of service links
  - [ ] Layout: Centered card (max-width 400px), mobile-first responsive
- [ ] Create app/src/styles/LoginPage.module.css:
  - [ ] Container: display flex, justify-content center, align-items center, height 100vh
  - [ ] Card: background #ffffff, padding 2rem, border-radius 8px, box-shadow 0 2px 8px rgba(0,0,0,0.1)
  - [ ] Input: border 1px solid #ccc, padding 0.75rem, font-size 16px (prevent iOS zoom)
  - [ ] Button: background #007BFF, color #fff, padding 0.75rem, border-radius 4px, font-weight 600
  - [ ] Focus: outline 2px solid #007BFF, outline-offset 2px
  - [ ] Error text: color #DC3545, font-size 14px, margin-top 0.25rem
  - [ ] Media query @media (max-width: 768px): Reduce padding, full-width inputs
- [ ] Update app/src/App.tsx:
  - [ ] Import BrowserRouter, Routes, Route, Navigate
  - [ ] Add routes:
    - [ ] <Route path="/login" element={<LoginPage />} />
    - [ ] <Route path="/" element={useAuth().isAuthenticated() ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
  - [ ] Protected route wrapper: Check isAuthenticated, else redirect to /login
- [ ] Update app/.env.example: VITE_API_URL=http://localhost:3001
- [ ] Test login page:
  - [ ] `npm run dev` → navigate to http://localhost:3000/login
  - [ ] Verify email, password fields, remember me checkbox, login button render correctly
- [ ] Test validation:
  - [ ] Enter "invalidemail" → blur → verify "Invalid email format" error
  - [ ] Enter "short" password → blur → verify "Password must be at least 8 characters"
  - [ ] Submit empty form → verify "Email is required", "Password is required"
- [ ] Test keyboard navigation:
  - [ ] Tab through: email → password → toggle → remember me → login button
  - [ ] Verify focus indicators visible (2px outline)
- [ ] Test password toggle: Click eye icon → password visible, click again → hidden
- [ ] Test successful login:
  - [ ] Enter valid credentials → submit
  - [ ] Verify redirect to /dashboard (patient) or /queue (staff) or /admin (admin)
- [ ] Test invalid credentials:
  - [ ] Enter invalid credentials → submit
  - [ ] Verify "Invalid email or password" error displayed
- [ ] Test remember me: Check checkbox → login → verify token in localStorage (persist across sessions)
- [ ] Test responsive: Resize to 375px, 768px, 1024px → verify layout adapts
- [ ] Document login flow in app/README.md: Routes, authService usage, token storage strategy
