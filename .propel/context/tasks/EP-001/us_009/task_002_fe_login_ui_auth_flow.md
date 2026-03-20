# Task - TASK_002_FE_LOGIN_UI_AUTH_FLOW

## Requirement Reference
- User Story: US_009  
- Story Location: `.propel/context/tasks/us_009/us_009.md`
- Acceptance Criteria:
    - AC1: User enters valid credentials, submits login form, receives JWT token
    - AC2: Valid JWT token used for API requests to protected endpoints
    - AC3: JWT token expires, user redirected to login with session timeout message
    - AC4: User clicks logout, token cleared, redirected to login page
- Edge Cases:
    - Invalid credentials: Display error message "Invalid email or password"
    - Redis unavailable: Display "Service temporarily unavailable" message

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | See .propel/context/docs/figma_spec.md#SCR-001 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-001-login.html |
| **Screen Spec** | SCR-001 |
| **UXR Requirements** | UXR-101 (WCAG 2.2 AA), UXR-103 (keyboard navigation), UXR-501 (inline validation) |
| **Design Tokens** | Use theme colors, spacing, typography from design system |

> **Note**: Login UI with accessibility compliance

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.2 |
| Frontend | TypeScript | 5.3.x |
| Frontend | React Router | 6.x |
| Frontend | Axios | 1.x |
| Backend | N/A (TASK_001) | N/A |
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

> **Note**: Login UI only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Web application only

## Task Overview
Create accessible login UI following SCR-001 wireframe with React form components, form validation, JWT token storage in localStorage, Axios interceptors for automatic token injection, protected route wrapper, session timeout detection with redirect, logout functionality, and error handling. Ensure WCAG 2.2 AA compliance, full keyboard navigation, and inline form validation (UXR-101, UXR-103, UXR-501).

## Dependent Tasks
- US_001: React frontend project setup
- US_009 TASK_001: Backend authentication API

## Impacted Components
**New:**
- app/src/pages/LoginPage.tsx (Login form UI - SCR-001)
- app/src/components/LoginForm.tsx (Reusable login form component)
- app/src/contexts/AuthContext.tsx (Authentication state management)
- app/src/services/authService.ts (API calls for login/logout)
- app/src/utils/tokenStorage.ts (localStorage wrapper for JWT)
- app/src/utils/axiosConfig.ts (Axios instance with interceptors)
- app/src/components/ProtectedRoute.tsx (Route wrapper for authentication)
- app/src/hooks/useAuth.ts (Custom hook for auth context)
- app/src/types/auth.types.ts (User, LoginCredentials, AuthState interfaces)

**Modified:**
- app/src/App.tsx (Add AuthProvider, protected routes)
- app/src/main.tsx (Wrap app with AuthProvider context)
- app/src/services/api.ts (Add token to headers)

## Implementation Plan
1. **Login Form UI**: Create SCR-001 login page with email/password inputs, submit button
2. **Form Validation**: Client-side validation (email format, required fields, min length)
3. **Authentication Service**: API calls for POST /api/auth/login, POST /api/auth/logout
4. **Token Storage**: Store JWT in localStorage with key 'upaci_token'
5. **Auth Context**: Global state for user, isAuthenticated, login(), logout() functions
6. **Axios Interceptors**: Automatically inject Authorization header with Bearer token
7. **Protected Routes**: Wrap routes requiring authentication (dashboard, appointments, etc.)
8. **Session Timeout**: Detect 401 responses, redirect to login with "Session expired" message
9. **Logout Flow**: Clear token from localStorage, clear auth context, redirect to login
10. **Error Handling**: Display form errors inline, API errors in toast/alert
11. **Accessibility**: ARIA labels, keyboard navigation, focus management, screen reader support
12. **Loading States**: Show spinner during login, disable button to prevent double-submit

## Current Project State
```
ASSIGNMENT/
├── app/                     # Frontend (US_001)
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   ├── services/       # API services
│   │   └── App.tsx         # Root component
├── server/                  # Backend with auth API (TASK_001)
└── .propel/context/wireframes/Hi-Fi/wireframe-SCR-001-login.html
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/types/auth.types.ts | User, LoginCredentials, AuthState, LoginResponse interfaces |
| CREATE | app/src/utils/tokenStorage.ts | getToken(), setToken(token), removeToken(), isTokenExpired() |
| CREATE | app/src/utils/axiosConfig.ts | Axios instance with base URL and interceptors |
| CREATE | app/src/services/authService.ts | login(credentials), logout(), getCurrentUser() API calls |
| CREATE | app/src/contexts/AuthContext.tsx | AuthProvider, AuthContext with user, login, logout, isAuthenticated |
| CREATE | app/src/hooks/useAuth.ts | Custom hook: const { user, login, logout, isAuthenticated } = useAuth() |
| CREATE | app/src/components/LoginForm.tsx | Form component with validation, error display, loading state |
| CREATE | app/src/pages/LoginPage.tsx | Login page layout, SCR-001 wireframe implementation |
| CREATE | app/src/components/ProtectedRoute.tsx | Route wrapper: redirects to /login if not authenticated |
| CREATE | app/src/components/LogoutButton.tsx | Logout button component for nav bar |
| MODIFY | app/src/App.tsx | Wrap routes with AuthProvider, add ProtectedRoute for dashboard routes |
| MODIFY | app/src/main.tsx | Import AuthProvider context |
| MODIFY | app/src/services/api.ts | Use axiosConfig instance instead of direct axios |

> 2 modified files, 11 new files created

## External References
- [React Context API](https://react.dev/reference/react/useContext)
- [React Router Authentication](https://reactrouter.com/en/main/start/tutorial#authentication)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
- [WCAG 2.2 AA Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [JWT Decoding (jwt-decode)](https://www.npmjs.com/package/jwt-decode)

## Build Commands
```bash
# Install additional dependencies
cd app
npm install axios jwt-decode

# Start development server
npm run dev

# Access login page
# Open browser: http://localhost:3000/login

# Test login flow
# Enter email: patient@example.com
# Enter password: password123
# Click "Sign In" button
# Expected: Redirect to dashboard, token stored in localStorage

# Inspect localStorage
# Browser DevTools -> Application -> Local Storage -> http://localhost:3000
# Key: upaci_token, Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Test protected route (when not logged in)
# Navigate to: http://localhost:3000/dashboard
# Expected: Redirect to /login

# Test protected route (when logged in)
# Login first, then navigate to /dashboard
# Expected: Dashboard loads successfully

# Test session timeout
# Login, wait 16 minutes (or manipulate token expiry)
# Make any API call
# Expected: Redirect to /login with "Your session has expired" message

# Test logout
# Click "Logout" button in nav bar
# Expected: Redirect to /login, token removed from localStorage

# Test invalid credentials
# Enter wrong password
# Expected: Error message "Invalid email or password" below form

# Test form validation
# Submit empty form
# Expected: Inline error messages "Email is required", "Password is required"

# Test accessibility (keyboard navigation)
# Tab through form fields
# Expected: Focus visible on email input, password input, submit button
# Press Enter on submit button → form submits

# Test screen reader (with NVDA/JAWS)
# Expected: Form fields announced with labels, error messages read aloud

# Build production
npm run build

# Preview production build
npm run preview
```

## Implementation Validation Strategy
- [ ] Unit tests pass (LoginForm, AuthContext, tokenStorage)
- [ ] Integration tests pass (full login flow)
- [ ] axios and jwt-decode installed: `npm list axios jwt-decode`
- [ ] Login page renders at /login route
- [ ] Form fields present: email input, password input, submit button
- [ ] Form validation works: Empty fields show inline errors
- [ ] Email validation: Invalid email format shows error
- [ ] Login success: Valid credentials → redirect to dashboard, token stored
- [ ] Token in localStorage: upaci_token key with JWT value
- [ ] Token includes correct payload: userId, email, role
- [ ] Protected route redirects: /dashboard when not logged in → /login
- [ ] Protected route allows access: Logged in user can access /dashboard
- [ ] Axios interceptor works: API requests include Authorization header
- [ ] Session timeout detected: 401 response → redirect to /login with message
- [ ] Logout works: Token cleared, context reset, redirect to /login
- [ ] Error display: Invalid credentials → error message shown inline
- [ ] Loading state: Submit button disabled and shows spinner during request
- [ ] WCAG 2.2 AA compliance: Lighthouse accessibility score >= 95
- [ ] Keyboard navigation: Can tab through all form elements
- [ ] ARIA labels: Form fields have accessible labels
- [ ] Focus management: Login success → focus moved to dashboard heading
- [ ] Screen reader compatible: Announcements for errors and state changes

## Implementation Checklist

### Type Definitions (app/src/types/auth.types.ts)
- [ ] Define User interface: { id: number, email: string, role: string, firstName?: string, lastName?: string }
- [ ] Define LoginCredentials interface: { email: string, password: string }
- [ ] Define LoginResponse interface: { success: boolean, token: string, expiresIn: number, user: User }
- [ ] Define AuthState interface: { user: User | null, isAuthenticated: boolean, isLoading: boolean }
- [ ] Export all types

### Token Storage Utility (app/src/utils/tokenStorage.ts)
- [ ] Define TOKEN_KEY = 'upaci_token'
- [ ] Implement getToken(): string | null
- [ ] Return localStorage.getItem(TOKEN_KEY)
- [ ] Implement setToken(token: string): void
- [ ] localStorage.setItem(TOKEN_KEY, token)
- [ ] Implement removeToken(): void
- [ ] localStorage.removeItem(TOKEN_KEY)
- [ ] Implement isTokenExpired(): boolean
- [ ] Decode token using jwt-decode
- [ ] Check if exp * 1000 < Date.now()
- [ ] Return true if expired, false otherwise
- [ ] Export all functions

### Axios Configuration (app/src/utils/axiosConfig.ts)
- [ ] Import axios, tokenStorage
- [ ] Create axios instance: const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api' })
- [ ] Add request interceptor: apiClient.interceptors.request.use((config) => {})
- [ ] Get token: const token = getToken()
- [ ] If token exists and not expired: config.headers.Authorization = `Bearer ${token}`
- [ ] Return config
- [ ] Add response interceptor: apiClient.interceptors.response.use((response) => response, (error) => {})
- [ ] If error.response.status === 401: removeToken(), window.location.href = '/login?expired=true'
- [ ] Return Promise.reject(error)
- [ ] Export apiClient

### Authentication Service (app/src/services/authService.ts)
- [ ] Import apiClient, types
- [ ] Implement async login(credentials: LoginCredentials): Promise<LoginResponse>
- [ ] const response = await apiClient.post('/auth/login', credentials)
- [ ] Return response.data
- [ ] Implement async logout(): Promise<void>
- [ ] await apiClient.post('/auth/logout')
- [ ] Implement async getCurrentUser(): Promise<User>
- [ ] const response = await apiClient.get('/auth/me') - optional endpoint to verify token
- [ ] Return response.data
- [ ] Export functions

### Authentication Context (app/src/contexts/AuthContext.tsx)
- [ ] Import React, createContext, useState, useEffect
- [ ] Import tokenStorage, authService, types
- [ ] Define AuthContextType: { user: User | null, isAuthenticated: boolean, isLoading: boolean, login: (credentials) => Promise<void>, logout: () => Promise<void> }
- [ ] Create context: const AuthContext = createContext<AuthContextType | undefined>(undefined)
- [ ] Implement AuthProvider component
- [ ] State: const [user, setUser] = useState<User | null>(null)
- [ ] State: const [isAuthenticated, setIsAuthenticated] = useState(false)
- [ ] State: const [isLoading, setIsLoading] = useState(true)
- [ ] useEffect on mount: check if token exists and not expired
- [ ] If valid token: decode token, extract user info, setUser, setIsAuthenticated(true)
- [ ] setIsLoading(false)
- [ ] Implement login function: async (credentials: LoginCredentials) => {}
- [ ] const response = await authService.login(credentials)
- [ ] setToken(response.token)
- [ ] setUser(response.user)
- [ ] setIsAuthenticated(true)
- [ ] Implement logout function: async () => {}
- [ ] await authService.logout()
- [ ] removeToken()
- [ ] setUser(null)
- [ ] setIsAuthenticated(false)
- [ ] Return <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>{children}</AuthContext.Provider>
- [ ] Export AuthProvider, AuthContext

### useAuth Hook (app/src/hooks/useAuth.ts)
- [ ] Import useContext, AuthContext
- [ ] Implement useAuth(): AuthContextType
- [ ] const context = useContext(AuthContext)
- [ ] if (!context) throw new Error('useAuth must be used within AuthProvider')
- [ ] Return context
- [ ] Export useAuth

### Login Form Component (app/src/components/LoginForm.tsx)
- [ ] Import React, useState, useAuth
- [ ] Define props: onSuccess?: () => void
- [ ] State: const [email, setEmail] = useState('')
- [ ] State: const [password, setPassword] = useState('')
- [ ] State: const [errors, setErrors] = useState<{ email?: string, password?: string, general?: string }>({})
- [ ] State: const [isLoading, setIsLoading] = useState(false)
- [ ] const { login } = useAuth()
- [ ] Implement validate(): boolean
- [ ] const newErrors: typeof errors = {}
- [ ] if (!email) newErrors.email = 'Email is required'
- [ ] else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format'
- [ ] if (!password) newErrors.password = 'Password is required'
- [ ] else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters'
- [ ] setErrors(newErrors)
- [ ] Return Object.keys(newErrors).length === 0
- [ ] Implement handleSubmit: async (e: React.FormEvent) => {}
- [ ] e.preventDefault()
- [ ] if (!validate()) return
- [ ] setIsLoading(true)
- [ ] setErrors({})
- [ ] try { await login({ email, password }); onSuccess?.() }
- [ ] catch (err) { setErrors({ general: err.response?.data?.error || 'Login failed. Please try again.' }) }
- [ ] finally { setIsLoading(false) }
- [ ] Render form: <form onSubmit={handleSubmit} aria-label="Login form">
- [ ] Email input: <input type="email" id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} aria-describedby="email-error" required />
- [ ] Email error: {errors.email && <span id="email-error" role="alert">{errors.email}</span>}
- [ ] Password input: <input type="password" id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!errors.password} aria-describedby="password-error" required />
- [ ] Password error: {errors.password && <span id="password-error" role="alert">{errors.password}</span>}
- [ ] Submit button: <button type="submit" disabled={isLoading}>{isLoading ? 'Signing in...' : 'Sign In'}</button>
- [ ] General error: {errors.general && <div role="alert" aria-live="polite">{errors.general}</div>}
- [ ] Export LoginForm

### Login Page (app/src/pages/LoginPage.tsx)
- [ ] Import LoginForm, useNavigate from react-router-dom
- [ ] Import useSearchParams for reading ?expired=true query param
- [ ] const navigate = useNavigate()
- [ ] const [searchParams] = useSearchParams()
- [ ] const expired = searchParams.get('expired') === 'true'
- [ ] Implement handleSuccess: () => navigate('/dashboard')
- [ ] Render page: <div className="login-page">
- [ ] Show expiration message if expired: {expired && <div role="alert">Your session has expired. Please log in again.</div>}
- [ ] Render: <LoginForm onSuccess={handleSuccess} />
- [ ] Export LoginPage

### Protected Route Component (app/src/components/ProtectedRoute.tsx)
- [ ] Import useAuth, Navigate, Outlet from react-router-dom
- [ ] Implement ProtectedRoute(): JSX.Element
- [ ] const { isAuthenticated, isLoading } = useAuth()
- [ ] if (isLoading) return <div>Loading...</div> // Or skeleton loader
- [ ] if (!isAuthenticated) return <Navigate to="/login" replace />
- [ ] return <Outlet /> // Render nested routes
- [ ] Export ProtectedRoute

### Logout Button Component (app/src/components/LogoutButton.tsx)
- [ ] Import useAuth, useNavigate
- [ ] const { logout } = useAuth()
- [ ] const navigate = useNavigate()
- [ ] Implement handleLogout: async () => { await logout(); navigate('/login') }
- [ ] Render: <button onClick={handleLogout} aria-label="Log out">Logout</button>
- [ ] Export LogoutButton

### App.tsx Modification
- [ ] Import AuthProvider, ProtectedRoute, LoginPage
- [ ] Wrap routes with <AuthProvider>
- [ ] Define public routes: <Route path="/login" element={<LoginPage />} />
- [ ] Define protected routes: <Route element={<ProtectedRoute />}> <Route path="/dashboard" element={<DashboardPage />} /> ... </Route>
- [ ] Add logout button to navigation (when authenticated)

### main.tsx Modification
- [ ] Import AuthProvider
- [ ] Wrap App with AuthProvider: <AuthProvider><App /></AuthProvider>

### Testing
- [ ] Create app/src/__tests__/LoginForm.test.tsx
- [ ] Test: "should render login form"
- [ ] Test: "should show validation errors for empty fields"
- [ ] Test: "should show error for invalid email format"
- [ ] Test: "should call login on valid submit"
- [ ] Test: "should display API error message"
- [ ] Test: "should disable submit button while loading"
- [ ] Create app/src/__tests__/ProtectedRoute.test.tsx
- [ ] Test: "should redirect to login when not authenticated"
- [ ] Test: "should render children when authenticated"
- [ ] Run tests: npm test

### Execution and Validation
- [ ] Start frontend: npm run dev
- [ ] Navigate to http://localhost:3000/login
- [ ] Verify login form renders with SCR-001 wireframe design
- [ ] Test form validation: Submit empty → inline errors shown
- [ ] Test email validation: Enter "test" → "Invalid email format"
- [ ] Test login success: Valid credentials → redirect to /dashboard
- [ ] Check localStorage: upaci_token exists
- [ ] Test protected route: Navigate to /dashboard without login → redirect to /login
- [ ] Test logout: Click logout button → redirect to /login, token removed
- [ ] Test session timeout: Wait 16 minutes → API call → redirect with "Session expired" message
- [ ] Test keyboard navigation: Tab through form → all elements focusable
- [ ] Test screen reader: Enable screen reader → form labels announced
- [ ] Run Lighthouse accessibility audit → score >= 95
- [ ] Test mobile responsive: Resize browser → form adapts to mobile view
- [ ] Run all tests: npm test → all pass
