# Task - TASK_003_FE_AUTH_INTEGRATION_ROUTING

## Requirement Reference
- User Story: US_012  
- Story Location: `.propel/context/tasks/us_012/us_012.md`
- Acceptance Criteria:
    - AC2: Valid credentials → authenticate and redirect to role-specific dashboard (SCR-002 Patient, SCR-003 Staff, SCR-004 Admin)

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes (Routing behavior) |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | SCR-002 (Patient Dashboard), SCR-003 (Staff Dashboard), SCR-004 (Admin Dashboard) |
| **UXR Requirements** | Seamless role-based navigation |
| **Design Tokens** | N/A |

> **Note**: Authentication flow and role-based routing

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.2 |
| Frontend | TypeScript | 5.3.x |
| Frontend | React Router | 6.x |
| Frontend | Axios | 1.x |
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.x |
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

> **Note**: Authentication integration only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | Yes (Responsive web) |
| **Platform Target** | Web |
| **Min OS Version** | N/A |
| **Mobile Framework** | Responsive web |

> **Note**: Web-based authentication flow

## Task Overview
Integrate login page with backend authentication API (US_009). Implement API call to POST /api/auth/login with email and password. Store JWT token and user data in localStorage on successful authentication. Create AuthContext for global authentication state management. Implement role-based routing: Patient → /patient/dashboard, Staff → /staff/dashboard, Admin → /admin/dashboard. Create ProtectedRoute component to guard authenticated routes. Implement token refresh logic. Add logout functionality. Handle "Remember Me" checkbox to extend session (7 days vs 15 minutes). Implement automatic redirect to login on 401 responses. Persist authentication state across page refreshes.

## Dependent Tasks
- US_012 TASK_001: Login page UI must exist
- US_012 TASK_002: Form validation must be implemented
- US_009 TASK_001: Backend authentication API must exist

## Impacted Components
**Modified:**
- app/src/App.tsx (Add AuthProvider, ProtectedRoute, role-based routes)
- app/src/pages/LoginPage.tsx (Implement API call and redirect logic)

**New:**
- app/src/context/AuthContext.tsx (Global auth state with Context API)
- app/src/hooks/useAuth.ts (Custom hook for auth operations)
- app/src/components/auth/ProtectedRoute.tsx (Route guard component)
- app/src/services/authService.ts (API calls for login, logout, refresh)
- app/src/utils/storage/tokenStorage.ts (localStorage utilities for token)
- app/src/utils/api/axiosInstance.ts (Axios instance with interceptors)
- app/src/pages/PatientDashboard.tsx (Placeholder patient dashboard - SCR-002)
- app/src/pages/StaffDashboard.tsx (Placeholder staff dashboard - SCR-003)
- app/src/pages/AdminDashboard.tsx (Placeholder admin dashboard - SCR-004)

## Implementation Plan
1. **Auth Service**: Create authService with login(), logout(), refreshToken() methods
2. **Token Storage**: Implement localStorage utilities for token and user data
3. **Axios Interceptors**: Add request interceptor (attach token), response interceptor (handle 401)
4. **Auth Context**: Create AuthContext with user state, login, logout, isAuthenticated
5. **Auth Hook**: Create useAuth() hook for easy access to auth context
6. **Login Integration**: Call authService.login() on form submit, store token, update context
7. **Role-Based Redirect**: After login, check user.role and redirect accordingly
8. **Remember Me**: Pass rememberMe flag to backend, store expiry in localStorage
9. **Protected Route**: Create ProtectedRoute wrapper that checks authentication
10. **Token Refresh**: Implement silent token refresh before expiry
11. **Logout**: Clear token from storage, reset context, redirect to login
12. **Persistence**: Load token from localStorage on app mount, validate and restore session

## Current Project State
```
ASSIGNMENT/
├── app/                     # Frontend (US_001)
│   ├── src/
│   │   ├── pages/
│   │   │   └── LoginPage.tsx (US_012 TASK_001, TASK_002)
│   │   └── components/
│   │       └── auth/
│   │           └── LoginForm.tsx (US_012 TASK_001)
└── server/                  # Backend API
    └── src/
        └── routes/
            └── auth.routes.ts (US_009 - /api/auth/login endpoint)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/context/AuthContext.tsx | Global auth state with user, token, login, logout |
| CREATE | app/src/hooks/useAuth.ts | Custom hook: useAuth() returns context |
| CREATE | app/src/services/authService.ts | API calls: login(), logout(), refreshToken(), getCurrentUser() |
| CREATE | app/src/utils/storage/tokenStorage.ts | localStorage: saveToken(), getToken(), removeToken(), saveUser(), getUser() |
| CREATE | app/src/utils/api/axiosInstance.ts | Axios with interceptors for token and 401 handling |
| CREATE | app/src/components/auth/ProtectedRoute.tsx | Route guard: redirect to /login if not authenticated |
| CREATE | app/src/pages/PatientDashboard.tsx | Placeholder: <h1>Patient Dashboard</h1> (SCR-002) |
| CREATE | app/src/pages/StaffDashboard.tsx | Placeholder: <h1>Staff Dashboard</h1> (SCR-003) |
| CREATE | app/src/pages/AdminDashboard.tsx | Placeholder: <h1>Admin Dashboard</h1> (SCR-004) |
| MODIFY | app/src/App.tsx | Wrap with AuthProvider, add routes for dashboards, use ProtectedRoute |
| MODIFY | app/src/pages/LoginPage.tsx | Call authService.login(), handle success redirect |

> 2 modified files, 9 new files created

## External References
- [React Context API](https://react.dev/reference/react/useContext)
- [React Router Protected Routes](https://reactrouter.com/en/main/start/concepts#protected-routes)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
- [JWT Storage Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

## Build Commands
```bash
# Start backend
cd server
npm run dev

# Start frontend
cd app
npm start

# Test authentication flow
# 1. Navigate to http://localhost:3000/ → Redirects to /login
# 2. Login with patient credentials: patient@test.com / Test123!
# Expected: Redirects to /patient/dashboard

# 3. Logout, login with staff credentials: staff@test.com / Test123!
# Expected: Redirects to /staff/dashboard

# 4. Logout, login with admin credentials: admin@test.com / Test123!
# Expected: Redirects to /admin/dashboard

# 5. Test Remember Me: Check checkbox, login
# Expected: Token stored with extended expiry (7 days)

# 6. Test session persistence: Login → Refresh page
# Expected: Still logged in, dashboard displayed

# 7. Test protected routes: Logout, try to access /patient/dashboard
# Expected: Redirects to /login

# 8. Test token expiry: Login → Wait 15 minutes (or modify JWT expiry for testing) → Make API call
# Expected: Auto-refresh token OR redirect to login if refresh fails

# 9. Test invalid token: Manually corrupt token in localStorage → Refresh page
# Expected: Clears token, redirects to /login

# Check with curl (backend API)
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Test123!","rememberMe":false}'
# Expected: 200, JSON with { token: "...", user: { id, email, role: "admin" } }

# Access protected endpoint with token
TOKEN="<jwt-token-from-login>"
curl http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200, user list

# Access without token
curl http://localhost:3001/api/admin/users
# Expected: 401 Unauthorized
```

## Implementation Validation Strategy
- [ ] Auth service created with login(), logout(), refreshToken()
- [ ] Token storage utilities work: saveToken(), getToken(), removeToken()
- [ ] Axios instance created with Authorization header interceptor
- [ ] Response interceptor handles 401 → logout and redirect to /login
- [ ] AuthContext provides: user, token, isAuthenticated, login, logout
- [ ] useAuth() hook returns auth context
- [ ] Login API call successful: Returns token and user data
- [ ] Token stored in localStorage on successful login
- [ ] User state updated in AuthContext on login
- [ ] Role-based redirect: Patient → /patient/dashboard, Staff → /staff/dashboard, Admin → /admin/dashboard
- [ ] ProtectedRoute redirects to /login if !isAuthenticated
- [ ] Remember Me: Extended token expiry (7 days) when checked
- [ ] Session persistence: Reload page while logged in → still authenticated
- [ ] Logout clears token and user state
- [ ] Token refresh works (if implemented)
- [ ] Invalid token handled: Clears storage, redirects to login

## Implementation Checklist

### Token Storage Utilities (app/src/utils/storage/tokenStorage.ts)
- [ ] const TOKEN_KEY = 'auth_token'
- [ ] const USER_KEY = 'auth_user'
- [ ] const EXPIRY_KEY = 'auth_expiry'
- [ ] export const saveToken = (token: string, expiresIn?: number) => {
- [ ]   localStorage.setItem(TOKEN_KEY, token);
- [ ]   if (expiresIn) {
- [ ]     const expiry = Date.now() + expiresIn * 1000;
- [ ]     localStorage.setItem(EXPIRY_KEY, expiry.toString());
- [ ]   }
- [ ] }
- [ ] export const getToken = (): string | null => {
- [ ]   const expiry = localStorage.getItem(EXPIRY_KEY);
- [ ]   if (expiry && Date.now() > parseInt(expiry)) {
- [ ]     removeToken(); return null;
- [ ]   }
- [ ]   return localStorage.getItem(TOKEN_KEY);
- [ ] }
- [ ] export const removeToken = () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(EXPIRY_KEY); }
- [ ] export const saveUser = (user: any) => { localStorage.setItem(USER_KEY, JSON.stringify(user)); }
- [ ] export const getUser = () => { const user = localStorage.getItem(USER_KEY); return user ? JSON.parse(user) : null; }
- [ ] export const removeUser = () => { localStorage.removeItem(USER_KEY); }

### Axios Instance (app/src/utils/api/axiosInstance.ts)
- [ ] Import axios, getToken, removeToken
- [ ] const axiosInstance = axios.create({ baseURL: '/api', timeout: 30000 })
- [ ] Request interceptor: axiosInstance.interceptors.request.use((config) => {
- [ ]   const token = getToken();
- [ ]   if (token) config.headers.Authorization = `Bearer ${token}`;
- [ ]   return config;
- [ ] })
- [ ] Response interceptor: axiosInstance.interceptors.response.use((response) => response, (error) => {
- [ ]   if (error.response?.status === 401) {
- [ ]     removeToken(); removeUser();
- [ ]     window.location.href = '/login';
- [ ]   }
- [ ]   return Promise.reject(error);
- [ ] })
- [ ] export default axiosInstance

### Auth Service (app/src/services/authService.ts)
- [ ] Import axiosInstance, tokenStorage
- [ ] export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
- [ ]   const response = await axiosInstance.post('/auth/login', credentials);
- [ ]   const { token, user } = response.data;
- [ ]   const expiresIn = credentials.rememberMe ? 7 * 24 * 60 * 60 : 15 * 60; // 7 days or 15 min
- [ ]   saveToken(token, expiresIn);
- [ ]   saveUser(user);
- [ ]   return response.data;
- [ ] }
- [ ] export const logout = async (): Promise<void> => {
- [ ]   try { await axiosInstance.post('/auth/logout'); } catch (e) { /* ignore */ }
- [ ]   removeToken();
- [ ]   removeUser();
- [ ] }
- [ ] export const refreshToken = async (): Promise<string> => {
- [ ]   const response = await axiosInstance.post('/auth/refresh');
- [ ]   const { token } = response.data;
- [ ]   saveToken(token);
- [ ]   return token;
- [ ] }
- [ ] export const getCurrentUser = (): any => { return getUser(); }

### Auth Context (app/src/context/AuthContext.tsx)
- [ ] Import React, createContext, useState, useEffect
- [ ] interface AuthContextType { user: any | null; isAuthenticated: boolean; login: (credentials: LoginCredentials) => Promise<void>; logout: () => Promise<void>; }
- [ ] export const AuthContext = createContext<AuthContextType | undefined>(undefined)
- [ ] export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
- [ ]   const [user, setUser] = useState<any | null>(null)
- [ ]   const [isAuthenticated, setIsAuthenticated] = useState(false)
- [ ]   useEffect(() => {
- [ ]     const token = getToken();
- [ ]     const savedUser = getCurrentUser();
- [ ]     if (token && savedUser) {
- [ ]       setUser(savedUser);
- [ ]       setIsAuthenticated(true);
- [ ]     }
- [ ]   }, [])
- [ ]   const handleLogin = async (credentials: LoginCredentials) => {
- [ ]     const data = await authService.login(credentials);
- [ ]     setUser(data.user);
- [ ]     setIsAuthenticated(true);
- [ ]   }
- [ ]   const handleLogout = async () => {
- [ ]     await authService.logout();
- [ ]     setUser(null);
- [ ]     setIsAuthenticated(false);
- [ ]   }
- [ ]   return <AuthContext.Provider value={{ user, isAuthenticated, login: handleLogin, logout: handleLogout }}>{children}</AuthContext.Provider>
- [ ] }

### Auth Hook (app/src/hooks/useAuth.ts)
- [ ] Import useContext, AuthContext
- [ ] export const useAuth = () => {
- [ ]   const context = useContext(AuthContext);
- [ ]   if (!context) throw new Error('useAuth must be used within AuthProvider');
- [ ]   return context;
- [ ] }

### Protected Route (app/src/components/auth/ProtectedRoute.tsx)
- [ ] Import Navigate, useAuth
- [ ] interface Props { children: ReactNode; allowedRoles?: string[]; }
- [ ] export const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
- [ ]   const { isAuthenticated, user } = useAuth();
- [ ]   if (!isAuthenticated) return <Navigate to="/login" replace />;
- [ ]   if (allowedRoles && !allowedRoles.includes(user?.role)) {
- [ ]     return <Navigate to="/unauthorized" replace />;
- [ ]   }
- [ ]   return <>{children}</>;
- [ ] }

### Placeholder Dashboards
- [ ] app/src/pages/PatientDashboard.tsx: export const PatientDashboard = () => { const { user, logout } = useAuth(); return (<div><h1>Patient Dashboard</h1><p>Welcome, {user.email}</p><button onClick={logout}>Logout</button></div>); }
- [ ] app/src/pages/StaffDashboard.tsx: Similar with "Staff Dashboard"
- [ ] app/src/pages/AdminDashboard.tsx: Similar with "Admin Dashboard"

### Update LoginPage (app/src/pages/LoginPage.tsx)
- [ ] Import useAuth, useNavigate (React Router)
- [ ] const { login } = useAuth()
- [ ] const navigate = useNavigate()
- [ ] Update handleLogin: async (credentials: LoginCredentials) => {
- [ ]   setLoading(true); setError(null);
- [ ]   try {
- [ ]     await login(credentials);
- [ ]     const user = getCurrentUser();
- [ ]     // Role-based redirect
- [ ]     if (user.role === 'patient') navigate('/patient/dashboard');
- [ ]     else if (user.role === 'staff') navigate('/staff/dashboard');
- [ ]     else if (user.role === 'admin') navigate('/admin/dashboard');
- [ ]   } catch (err) {
- [ ]     const errorMessage = handleApiError(err);
- [ ]     setError(errorMessage);
- [ ]   } finally {
- [ ]     setLoading(false);
- [ ]   }
- [ ] }

### Update App.tsx (app/src/App.tsx)
- [ ] Import AuthProvider, ProtectedRoute, BrowserRouter, Routes, Route, Navigate
- [ ] Import LoginPage, PatientDashboard, StaffDashboard, AdminDashboard
- [ ] Wrap app with AuthProvider and BrowserRouter
- [ ] Define routes:
- [ ] <Route path="/login" element={<LoginPage />} />
- [ ] <Route path="/patient/dashboard" element={<ProtectedRoute allowedRoles={['patient']}><PatientDashboard /></ProtectedRoute>} />
- [ ] <Route path="/staff/dashboard" element={<ProtectedRoute allowedRoles={['staff', 'admin']}><StaffDashboard /></ProtectedRoute>} />
- [ ] <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
- [ ] <Route path="/" element={<Navigate to="/login" replace />} />
- [ ] <Route path="*" element={<Navigate to="/login" replace />} />

### Validation and Testing
- [ ] Start backend and frontend: npm run dev (both)
- [ ] Navigate to http://localhost:3000/ → redirects to /login
- [ ] Login with patient@test.com / Test123! → redirects to /patient/dashboard
- [ ] Refresh page → still on dashboard (session persisted)
- [ ] Click logout → redirects to /login
- [ ] Login with staff@test.com → redirects to /staff/dashboard
- [ ] Login with admin@test.com → redirects to /admin/dashboard
- [ ] Test Remember Me: Check box, login → token expiry set to 7 days
- [ ] Test protected route: Logout, try to access /admin/dashboard → redirects to /login
- [ ] Test role restriction: Login as patient, manually navigate to /admin/dashboard → redirects to /unauthorized or /login
- [ ] Test invalid credentials: Wrong password → "Invalid email or password"
- [ ] Test 401 handling: Corrupt token in localStorage, make API call → auto-logout and redirect
- [ ] Check localStorage: token, user, expiry stored correctly
