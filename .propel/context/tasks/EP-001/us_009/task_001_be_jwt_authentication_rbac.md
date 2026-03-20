# Task - TASK_001_BE_JWT_AUTHENTICATION_RBAC

## Requirement Reference
- User Story: US_009  
- Story Location: `.propel/context/tasks/us_009/us_009.md`
- Acceptance Criteria:
    - AC1: Valid credentials submitted, JWT token generated with 15-minute expiry containing user ID, role, email, stored in Redis
    - AC2: Valid JWT token, authentication middleware validates token and grants access based on role (Patient/Staff/Admin)
    - AC3: JWT token expires after 15 minutes, system returns 401 Unauthorized
    - AC4: User logs out, JWT token invalidated in Redis, client-side token cleared
- Edge Cases:
    - Invalid credentials: Return 401 with "Invalid email or password", log failed attempt to audit log
    - Concurrent logins: Allow multiple sessions, track last login timestamp
    - Redis unavailable: Fail gracefully, return 503 Service Unavailable, log error

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | N/A |
| **UXR Requirements** | N/A |
| **Design Tokens** | N/A |

> **Note**: Backend authentication - no UI (UI in TASK_002)

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.x |
| Backend | jsonwebtoken | 9.x |
| Backend | bcrypt | 5.x |
| Backend | TypeScript | 5.3.x |
| Database | PostgreSQL | 15+ |
| Database | Redis (Upstash) | Cloud |
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

> **Note**: Authentication only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend API only

## Task Overview
Implement JWT-based authentication system with role-based access control (RBAC), building on US_004 Redis session management. Create login endpoint with bcrypt password validation, JWT token generation with 15-minute expiry, Redis session storage, authentication middleware for protected routes, role-based authorization, token blacklisting for logout, and comprehensive audit logging for HIPAA compliance (NFR-003).

## Dependent Tasks
- US_002: Backend Express API must be configured
- US_003 TASK_001: PostgreSQL with Users table
- US_004 TASK_001: Redis connection setup
- US_004 TASK_003: Session management with Redis (builds on this)
- US_007: Users table with role column

## Impacted Components
**New:**
- server/src/controllers/authController.ts (Login, logout, refresh token handlers)
- server/src/services/authService.ts (Password validation, JWT generation, session management)
- server/src/middleware/authenticate.ts (JWT validation middleware)
- server/src/middleware/authorize.ts (RBAC middleware - role checking)
- server/src/utils/passwordHash.ts (Bcrypt hashing utilities)
- server/src/utils/tokenGenerator.ts (JWT sign/verify utilities)
- server/src/routes/auth.routes.ts (Authentication endpoints)
- server/src/types/auth.types.ts (JwtPayload, AuthRequest, LoginRequest interfaces)
- server/tests/integration/auth.test.ts (Authentication flow tests)

**Modified:**
- server/package.json (add bcrypt, jsonwebtoken if not already added)
- server/.env.example (add JWT_SECRET, JWT_EXPIRES_IN if not already added)
- server/src/routes/index.ts (Register auth routes)

## Implementation Plan
1. **Password Hashing**: Use bcrypt with salt rounds=10 for password storage
2. **Login Endpoint**: POST /api/auth/login validates email/password, generates JWT
3. **JWT Payload**: Include { userId, email, role, iat, exp }
4. **JWT Signing**: Use RS256 or HS256 with JWT_SECRET, 15-minute expiry
5. **Session Storage**: Store session in Redis with user_id as key, 15-minute TTL
6. **Authentication Middleware**: Verify JWT, check Redis session, attach user to req
7. **Authorization Middleware**: Check user role matches required role(s)
8. **Token Blacklist**: On logout, add JWT to Redis blacklist until expiry
9. **Logout Endpoint**: POST /api/auth/logout invalidates session and blacklists token
10. **Audit Logging**: Log login, logout, failed attempts to audit_logs table
11. **Error Handling**: Return 401 for invalid credentials, 403 for insufficient permissions
12. **Redis Failover**: Graceful degradation when Redis unavailable (503 Service Unavailable)

## Current Project State
```
ASSIGNMENT/
├── app/                     # Frontend (US_001)
├── server/                  # Backend API (US_002-008)
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   └── redis.ts     # Redis config (US_004)
│   │   ├── services/
│   │   │   └── sessionService.ts  # Session management (US_004 TASK_003)
│   │   └── middleware/
├── database/                # Users table (US_007)
└── monitoring/              # Metrics (US_005-006)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| MODIFY | server/package.json | Add bcrypt@5.x, jsonwebtoken@9.x if not present |
| MODIFY | server/.env.example | Add JWT_SECRET, JWT_EXPIRES_IN=15m, JWT_ALGORITHM=HS256 |
| CREATE | server/src/types/auth.types.ts | JwtPayload, LoginRequest, LoginResponse, AuthRequest extends Request |
| CREATE | server/src/utils/passwordHash.ts | hashPassword(plain: string): Promise<string>, comparePassword(plain, hash): Promise<boolean> |
| CREATE | server/src/utils/tokenGenerator.ts | signToken(payload), verifyToken(token), decodeToken(token) |
| CREATE | server/src/services/authService.ts | login(email, password), logout(userId, token), validateSession(userId) |
| CREATE | server/src/controllers/authController.ts | POST /login, POST /logout handlers |
| CREATE | server/src/middleware/authenticate.ts | Verify JWT, check session, attach req.user |
| CREATE | server/src/middleware/authorize.ts | authorize(...roles) - RBAC middleware |
| CREATE | server/src/routes/auth.routes.ts | POST /api/auth/login, POST /api/auth/logout |
| MODIFY | server/src/routes/index.ts | Import and register auth routes |
| CREATE | server/src/utils/auditLogger.ts | Log authentication events to audit_logs table |
| CREATE | server/tests/integration/auth.test.ts | Login, logout, token validation, RBAC tests |
| CREATE | server/docs/AUTHENTICATION.md | Auth flow diagram, JWT structure, RBAC guide |

> 3 modified files, 11 new files created

## External References
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [jsonwebtoken Library](https://www.npmjs.com/package/jsonwebtoken)
- [bcrypt Library](https://www.npmjs.com/package/bcrypt)
- [OAuth2 Flow](https://oauth.net/2/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [Express Authentication](https://expressjs.com/en/advanced/best-practice-security.html)

## Build Commands
```bash
# Install dependencies (if not already done in US_004)
cd server
npm install bcrypt jsonwebtoken
npm install --save-dev @types/bcrypt @types/jsonwebtoken

# Generate JWT secret (if not done)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Add to .env: JWT_SECRET=<generated-secret>

# Start development server
npm run dev

# Test login endpoint
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@example.com","password":"password123"}'
# Expected: {
#   "success": true,
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "expiresIn": 900,
#   "user": { "id": 1, "email": "patient@example.com", "role": "patient" }
# }

# Test protected endpoint with token
TOKEN="<token-from-login>"
curl http://localhost:3001/api/patients/profile \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 OK with patient data

# Test expired token (wait 16 minutes or manipulate JWT)
curl http://localhost:3001/api/patients/profile \
  -H "Authorization: Bearer $TOKEN"
# Expected: 401 Unauthorized, {"error":"Token expired"}

# Test invalid token
curl http://localhost:3001/api/patients/profile \
  -H "Authorization: Bearer invalid-token"
# Expected: 401 Unauthorized, {"error":"Invalid token"}

# Test RBAC - patient accessing admin endpoint
curl http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer $TOKEN"
# Expected: 403 Forbidden, {"error":"Insufficient permissions"}

# Test logout
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"
# Expected: { "success": true, "message": "Logged out successfully" }

# Test token after logout (should be blacklisted)
curl http://localhost:3001/api/patients/profile \
  -H "Authorization: Bearer $TOKEN"
# Expected: 401 Unauthorized, {"error":"Token has been revoked"}

# Check Redis for session
redis-cli -u $REDIS_URL --tls
GET session:1
# Expected: JSON with user session data

# Check Redis for blacklisted token
GET blacklist:<token-hash>
# Expected: "1" if token is blacklisted

# Query audit logs for authentication events
psql -U upaci_user -d upaci -c "
SELECT * FROM audit_logs 
WHERE action IN ('LOGIN', 'LOGOUT', 'LOGIN_FAILED') 
ORDER BY created_at DESC LIMIT 10;
"

# Run integration tests
npm test -- auth.test.ts
```

## Implementation Validation Strategy
- [ ] Unit tests pass (auth service, password hashing, JWT utilities)
- [ ] Integration tests pass (full auth flow)
- [ ] bcrypt and jsonwebtoken installed: `npm list bcrypt jsonwebtoken`
- [ ] JWT_SECRET configured: At least 64 characters in .env
- [ ] Login endpoint created: POST /api/auth/login returns 200 with token
- [ ] JWT structure valid: Payload contains userId, email, role, iat, exp
- [ ] JWT expiry correct: exp timestamp is 15 minutes from iat
- [ ] Session created in Redis: GET session:{userId} returns session data
- [ ] Session TTL correct: redis.ttl(session:1) returns ~900 seconds
- [ ] Password hashing works: Login accepts correct password, rejects incorrect
- [ ] Password comparison secure: Uses bcrypt.compare, timing-safe
- [ ] Authentication middleware works: Protected route requires valid token
- [ ] Token validation: Invalid/expired token → 401 Unauthorized
- [ ] RBAC middleware works: Patient accessing admin endpoint → 403 Forbidden
- [ ] Multiple roles supported: authorize('admin', 'staff') allows either role
- [ ] Logout invalidates session: Redis session deleted
- [ ] Token blacklisting works: Logged-out token rejected with "Token revoked"
- [ ] Audit logging: Login/logout events recorded in audit_logs table
- [ ] Failed login logged: Invalid credentials → audit log entry with IP
- [ ] Redis failover: Redis down → 503 Service Unavailable with error message
- [ ] Concurrent sessions: Same user can login from multiple devices

## Implementation Checklist

### Dependencies Installation
- [ ] Install bcrypt: `npm install bcrypt @types/bcrypt`
- [ ] Install jsonwebtoken: `npm install jsonwebtoken @types/jsonwebtoken`
- [ ] Generate JWT secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- [ ] Update .env: JWT_SECRET, JWT_EXPIRES_IN=15m, JWT_ALGORITHM=HS256

### Type Definitions (server/src/types/auth.types.ts)
- [ ] Define JwtPayload interface: { userId: number, email: string, role: string, iat: number, exp: number }
- [ ] Define LoginRequest interface: { email: string, password: string }
- [ ] Define LoginResponse interface: { success: boolean, token: string, expiresIn: number, user: { id, email, role } }
- [ ] Define AuthRequest interface extends Request: { user: JwtPayload }
- [ ] Define AuthSession interface: { userId, email, role, createdAt, lastActivity, deviceInfo }

### Password Hashing Utilities (server/src/utils/passwordHash.ts)
- [ ] Import bcrypt
- [ ] Implement hashPassword(plainPassword: string): Promise<string>
- [ ] Use bcrypt.hash(plainPassword, 10) - 10 salt rounds
- [ ] Implement comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean>
- [ ] Use bcrypt.compare(plainPassword, hashedPassword)
- [ ] Timing-safe comparison (bcrypt handles this)
- [ ] Export functions

### JWT Token Utilities (server/src/utils/tokenGenerator.ts)
- [ ] Import jsonwebtoken
- [ ] Implement signToken(payload: JwtPayload): string
- [ ] Use jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m', algorithm: 'HS256' })
- [ ] Implement verifyToken(token: string): JwtPayload | null
- [ ] Use jwt.verify(token, process.env.JWT_SECRET)
- [ ] Wrap in try/catch, return null on TokenExpiredError or JsonWebTokenError
- [ ] Implement decodeToken(token: string): JwtPayload | null
- [ ] Use jwt.decode(token) - no verification, for inspection only
- [ ] Export functions

### Authentication Service (server/src/services/authService.ts)
- [ ] Import: passwordHash, tokenGenerator, sessionService (from US_004), database pool
- [ ] Implement async login(email: string, password: string): Promise<LoginResponse>
- [ ] Query user from database: SELECT * FROM users WHERE email = $1 AND active = true
- [ ] If not found: throw new Error('Invalid email or password')
- [ ] Compare password: const isValid = await comparePassword(password, user.password_hash)
- [ ] If not valid: log failed attempt to audit_logs, throw error
- [ ] Generate JWT payload: { userId: user.id, email: user.email, role: user.role, iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000) + 900 }
- [ ] Sign token: const token = signToken(payload)
- [ ] Create session in Redis: await sessionService.createSession(user.id, { userId, email, role, createdAt: Date.now(), lastActivity: Date.now() })
- [ ] Log successful login to audit_logs: INSERT INTO audit_logs (user_id, action, ip_address) VALUES ($1, 'LOGIN', $2)
- [ ] Return: { success: true, token, expiresIn: 900, user: { id, email, role } }
- [ ] Implement async logout(userId: number, token: string): Promise<void>
- [ ] Delete session: await sessionService.deleteSession(userId)
- [ ] Add token to blacklist: const hash = crypto.createHash('sha256').update(token).digest('hex')
- [ ] await redisClient.setex(`blacklist:${hash}`, 900, '1')
- [ ] Log logout to audit_logs
- [ ] Implement async validateSession(userId: number): Promise<boolean>
- [ ] Check session exists in Redis: const session = await sessionService.getSession(userId)
- [ ] Return session !== null

### Authentication Controller (server/src/controllers/authController.ts)
- [ ] Import: authService, express types
- [ ] Implement async login(req: Request, res: Response, next: NextFunction)
- [ ] Extract email, password from req.body
- [ ] Validate: if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
- [ ] Try: const result = await authService.login(email, password)
- [ ] Return: res.json(result)
- [ ] Catch: res.status(401).json({ error: err.message })
- [ ] Implement async logout(req: AuthRequest, res: Response)
- [ ] Extract userId from req.user (set by authenticate middleware)
- [ ] Extract token from Authorization header
- [ ] await authService.logout(userId, token)
- [ ] Return: res.json({ success: true, message: 'Logged out successfully' })

### Authentication Middleware (server/src/middleware/authenticate.ts)
- [ ] Import: tokenGenerator, sessionService, blacklist (from authService)
- [ ] Implement async authenticate(req: AuthRequest, res: Response, next: NextFunction)
- [ ] Extract token from Authorization header: const authHeader = req.headers.authorization
- [ ] If no header: return res.status(401).json({ error: 'Authentication required' })
- [ ] Parse: const token = authHeader.split(' ')[1] // "Bearer <token>"
- [ ] Check if blacklisted: const hash = crypto.createHash('sha256').update(token).digest('hex')
- [ ] const isBlacklisted = await redisClient.exists(`blacklist:${hash}`)
- [ ] If blacklisted: return res.status(401).json({ error: 'Token has been revoked' })
- [ ] Verify token: const payload = verifyToken(token)
- [ ] If not valid: return res.status(401).json({ error: 'Invalid or expired token' })
- [ ] Check session in Redis: const sessionExists = await authService.validateSession(payload.userId)
- [ ] If not exists: return res.status(401).json({ error: 'Session expired' })
- [ ] Attach user to request: req.user = payload
- [ ] Refresh session TTL: await sessionService.refreshSession(payload.userId)
- [ ] Call next()
- [ ] Wrap in try/catch, handle Redis unavailable: return res.status(503).json({ error: 'Authentication service unavailable' })

### Authorization Middleware (server/src/middleware/authorize.ts)
- [ ] Implement authorize(...allowedRoles: string[])
- [ ] Return middleware function: (req: AuthRequest, res: Response, next: NextFunction) => {}
- [ ] Check if req.user exists (authenticate middleware must run first)
- [ ] If not: return res.status(401).json({ error: 'Authentication required' })
- [ ] Check role: if (!allowedRoles.includes(req.user.role))
- [ ] Return: res.status(403).json({ error: 'Insufficient permissions' })
- [ ] Call next()
- [ ] Usage: router.get('/admin/users', authenticate, authorize('admin'), userController.list)

### Authentication Routes (server/src/routes/auth.routes.ts)
- [ ] Import: express.Router, authController
- [ ] Create router: const router = express.Router()
- [ ] Define POST /login: router.post('/login', authController.login)
- [ ] Define POST /logout: router.post('/logout', authenticate, authController.logout)
- [ ] Optional: POST /refresh: router.post('/refresh', authenticate, authController.refresh) - for token refresh
- [ ] Export router

### Route Registration (server/src/routes/index.ts)
- [ ] Import: authRouter from './auth.routes'
- [ ] Register: app.use('/api/auth', authRouter)

### Audit Logging Utility (server/src/utils/auditLogger.ts)
- [ ] Import: database pool
- [ ] Implement async logAuthEvent(userId: number | null, action: string, success: boolean, ipAddress: string, userAgent: string)
- [ ] INSERT INTO audit_logs (user_id, action, ip_address, user_agent, new_values, created_at) VALUES ($1, $2, $3, $4, $5, NOW())
- [ ] new_values JSONB: { success, timestamp: new Date().toISOString() }
- [ ] Handle errors gracefully (don't block auth flow if audit log fails)

### Documentation (server/docs/AUTHENTICATION.md)
- [ ] Document authentication flow diagram
- [ ] Step 1: User submits credentials to POST /api/auth/login
- [ ] Step 2: Server validates credentials, hashes password with bcrypt
- [ ] Step 3: Server generates JWT with 15-minute expiry
- [ ] Step 4: Server stores session in Redis with 900s TTL
- [ ] Step 5: Server returns JWT token to client
- [ ] Step 6: Client stores token (localStorage or httpOnly cookie)
- [ ] Step 7: Client includes token in Authorization header for subsequent requests
- [ ] Step 8: Middleware validates token and session on each request
- [ ] Document JWT structure: { header, payload, signature }
- [ ] Document RBAC roles: admin (full access), staff (moderate access), patient (limited access)
- [ ] Document logout flow: POST /api/auth/logout, token blacklisted, session deleted
- [ ] Document security measures: bcrypt salt rounds, JWT secret strength, session timeout, token blacklist

### Integration Tests (server/tests/integration/auth.test.ts)
- [ ] Test: "should register user with bcrypt hashed password"
- [ ] Test: "should login with valid credentials and return JWT token"
- [ ] Verify: token structure, expiry timestamp, session in Redis
- [ ] Test: "should reject login with invalid credentials"
- [ ] Verify: 401 response, audit log entry
- [ ] Test: "should validate JWT token on protected route"
- [ ] Test: "should reject expired JWT token"
- [ ] Manipulate JWT exp claim, verify 401 response
- [ ] Test: "should enforce RBAC - patient cannot access admin endpoint"
- [ ] Login as patient, attempt admin route, verify 403
- [ ] Test: "should allow admin to access all endpoints"
- [ ] Login as admin, access patient/staff/admin routes, verify all succeed
- [ ] Test: "should logout and invalidate token"
- [ ] Logout, verify token blacklisted, session deleted
- [ ] Test: "should reject blacklisted token after logout"
- [ ] Test: "should handle Redis unavailable gracefully"
- [ ] Simulate Redis down, verify 503 Service Unavailable
- [ ] Test: "should refresh session TTL on activity"
- [ ] Make request, check Redis TTL refreshed to 900s
- [ ] Test: "should allow concurrent sessions from same user"
- [ ] Login twice with same credentials, verify both tokens valid
- [ ] Run tests: npm test -- auth.test.ts

### Execution and Validation
- [ ] Start server: npm run dev
- [ ] Test login with valid credentials: curl POST /api/auth/login
- [ ] Verify JWT returned with correct structure and expiry
- [ ] Check Redis: Session created with 900s TTL
- [ ] Test protected route with token: curl GET /api/patients/profile -H "Authorization: Bearer <token>"
- [ ] Verify 200 OK response
- [ ] Test RBAC: Patient accessing admin route → 403 Forbidden
- [ ] Test logout: curl POST /api/auth/logout
- [ ] Verify session deleted, token blacklisted
- [ ] Test token after logout: Should return 401 "Token revoked"
- [ ] Check audit_logs table: Verify LOGIN, LOGOUT entries
- [ ] Test invalid credentials: Verify 401 and audit log
- [ ] Load test: 100 concurrent login requests → all succeed
- [ ] Run all integration tests: npm test -- auth.test.ts → all pass
- [ ] Document results in AUTHENTICATION.md
