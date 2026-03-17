# Task - TASK_001_BE_JWT_AUTHENTICATION

## Requirement Reference
- User Story: US_009
- Story Location: `.propel/context/tasks/us_009/us_009.md`
- Acceptance Criteria:
    - AC1: JWT token generated with 15-minute expiry containing user ID, role, email; stored in Redis for session management
    - AC2: Authentication middleware validates JWT and grants access based on role (Patient/Staff/Admin)
    - AC3: Expired tokens return 401 Unauthorized with redirect to login
    - AC4: Logout invalidates JWT in Redis, clears client-side token
- Edge Cases:
    - Invalid credentials: Return 401 with "Invalid email or password", log failed attempt to audit log
    - Concurrent login attempts: Allow multiple sessions, track last login timestamp
    - Redis unavailable during validation: Fail gracefully, return 503 Service Unavailable
    - Brute force prevention: Rate limit 5 failed attempts per 15 minutes per IP

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

> **Note**: Backend authentication service - no UI (UI handled in US_012)

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.x |
| Backend | jsonwebtoken | 9.x |
| Backend | bcrypt | 5.x |
| Cache | Redis (ioredis) | 5.x |
| Database | PostgreSQL | 16.x |
| AI/ML | N/A | N/A |

**Note**: All authentication MUST comply with HIPAA security requirements (NFR-003, NFR-004)

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

> **Note**: No AI implementation - authentication logic only

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend authentication service

## Task Overview
Implement JWT-based authentication with bcrypt password hashing. Create POST /auth/login endpoint (validate credentials, generate JWT, store session in Redis). Create POST /auth/logout endpoint (invalidate token in Redis). Implement auth middleware (verify JWT, check Redis session, extract user role). Add rate limiting (5 failed attempts per 15 min per IP). Implement RBAC checks (admin, staff, patient roles). Log failed attempts to audit log.

## Dependent Tasks
- US_002: Backend API setup
- US_003 Task 001: Database with Users table
- US_004: Redis caching for sessions

## Impacted Components
**New:**
- server/src/routes/auth.routes.ts (POST /login, POST /logout)
- server/src/controllers/auth.controller.ts (login, logout logic)
- server/src/services/auth.service.ts (validateCredentials, generateToken, invalidateToken)
- server/src/middleware/auth.middleware.ts (verifyToken, requireRole)
- server/src/utils/rate-limiter.ts (Track failed login attempts per IP)
- server/src/types/auth.types.ts (JWTPayload, LoginRequest, LoginResponse interfaces)
- server/.env.example (JWT_SECRET, JWT_EXPIRY)

## Implementation Plan
1. **Install dependencies**: `npm install jsonwebtoken bcrypt express-rate-limit`
2. **Define auth types**: JWTPayload {userId: string, email: string, role: 'admin'|'staff'|'patient'}, LoginRequest, LoginResponse
3. **Create AuthService**:
   - validateCredentials(email, password): Query user from DB, compare bcrypt hash
   - generateToken(user): Create JWT with 15-min expiry, store in Redis (key: session:{userId}:{tokenId})
   - invalidateToken(userId, tokenId): Delete Redis key
   - hashPassword(password): bcrypt.hash with salt rounds 12
4. **Create AuthController**:
   - login(req, res): Validate credentials, generate token, log success to audit, return {token, userId, role}
   - logout(req, res): Extract token, invalidate in Redis, return 200 OK
5. **Create auth middleware**:
   - verifyToken: Extract Authorization header (Bearer token), verify JWT signature, check Redis session exists, attach req.user
   - requireRole(roles): Check if req.user.role in allowed roles, else 403 Forbidden
6. **Implement rate limiting**: Track failed login attempts per IP in Redis, block after 5 failures for 15 minutes
7. **Add audit logging**: Log failed login attempts with IP, user agent, timestamp
8. **Create auth routes**: POST /auth/login (public), POST /auth/logout (protected), GET /auth/me (protected, returns current user)
9. **Error handling**: 401 for invalid credentials, 429 for rate limit, 503 if Redis unavailable

## Current Project State
```
ASSIGNMENT/
├── app/                  # Frontend (US_001)
├── server/               # Backend (US_002-005)
│   ├── src/
│   │   ├── routes/
│   │   │   └── auth.routes.ts (placeholder exists, to be implemented)
│   │   ├── controllers/ (exists)
│   │   ├── services/ (exists)
│   │   └── middleware/
│   │       └── auth.ts (placeholder exists, to be implemented)
│   └── db/ (users table exists from US_003)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| UPDATE | server/src/routes/auth.routes.ts | POST /login, POST /logout, GET /me |
| CREATE | server/src/controllers/auth.controller.ts | login, logout, getCurrentUser methods |
| CREATE | server/src/services/auth.service.ts | validateCredentials, generateToken, invalidateToken, hashPassword |
| UPDATE | server/src/middleware/auth.ts | verifyToken, requireRole middleware functions |
| CREATE | server/src/utils/rate-limiter.ts | Track failed login attempts per IP using Redis |
| CREATE | server/src/types/auth.types.ts | JWTPayload, LoginRequest, LoginResponse, UserRole interfaces |
| UPDATE | server/.env.example | Add JWT_SECRET, JWT_EXPIRY=900 (15 minutes in seconds) |
| UPDATE | server/package.json | Add jsonwebtoken, bcrypt, @types/jsonwebtoken, @types/bcrypt |

> Updates 4 existing files, creates 4 new files

## External References
- [jsonwebtoken Documentation](https://github.com/auth0/node-jsonwebtoken)
- [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)
- [Express Rate Limiting](https://www.npmjs.com/package/express-rate-limit)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NFR-003 HIPAA Compliance](../../../.propel/context/docs/spec.md#NFR-003)
- [NFR-008 Session Timeout](../../../.propel/context/docs/spec.md#NFR-008)

## Build Commands
```bash
# Install dependencies
cd server
npm install jsonwebtoken bcrypt express-rate-limit
npm install -D @types/jsonwebtoken @types/bcrypt

# Generate JWT secret (for .env)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Add to .env
JWT_SECRET=<generated_secret_64_chars>
JWT_EXPIRY=900

# Test authentication
npm run dev

# Example API calls
# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@example.com","password":"password123"}'

# Access protected route
curl http://localhost:3001/auth/me \
  -H "Authorization: Bearer <token>"

# Logout
curl -X POST http://localhost:3001/auth/logout \
  -H "Authorization: Bearer <token>"
```

## Implementation Validation Strategy
- [ ] Unit tests: validateCredentials returns user for valid credentials, null for invalid
- [ ] Unit tests: generateToken creates valid JWT with correct payload and expiry
- [ ] Integration tests: POST /auth/login with valid credentials returns JWT
- [ ] Integration tests: POST /auth/login with invalid credentials returns 401
- [ ] jsonwebtoken installed: package.json shows jsonwebtoken@9.x
- [ ] bcrypt installed: package.json shows bcrypt@5.x
- [ ] JWT_SECRET configured: .env has 64+ character secret
- [ ] Login endpoint works: POST /auth/login returns {token, userId, role}
- [ ] JWT payload correct: Decode token → verify userId, email, role, exp (15 min)
- [ ] Redis session stored: Login → verify Redis has key session:{userId}:{tokenId} with 900s TTL
- [ ] Auth middleware protects routes: GET /api/protected without token → 401 Unauthorized
- [ ] Auth middleware validates token: GET /api/protected with valid token → 200 OK
- [ ] Role-based access works: Patient user tries admin endpoint → 403 Forbidden
- [ ] Token expiry enforced: Wait 15 minutes → API request → 401 Unauthorized
- [ ] Logout invalidates token: Logout → try API request → 401 Unauthorized
- [ ] Rate limiting works: 5 failed logins → 6th attempt → 429 Too Many Requests
- [ ] Failed login logged: Invalid credentials → audit_logs table has entry
- [ ] Redis unavailable: Stop Redis → login attempt → 503 Service Unavailable

## Implementation Checklist
- [ ] Install dependencies: `npm install jsonwebtoken bcrypt express-rate-limit @types/jsonwebtoken @types/bcrypt`
- [ ] Generate JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- [ ] Add to server/.env.example: JWT_SECRET, JWT_EXPIRY=900
- [ ] Create server/src/types/auth.types.ts:
  - [ ] `export type UserRole = 'admin' | 'staff' | 'patient'`
  - [ ] `export interface JWTPayload { userId: string; email: string; role: UserRole; iat: number; exp: number; }`
  - [ ] `export interface LoginRequest { email: string; password: string; }`
  - [ ] `export interface LoginResponse { token: string; userId: string; role: UserRole; email: string; }`
- [ ] Create server/src/services/auth.service.ts:
  - [ ] Import bcrypt, jwt, pool (database), redisClient
  - [ ] Implement validateCredentials(email, password): 
    - [ ] Query user: `SELECT id, email, password_hash, role FROM users WHERE email = $1`
    - [ ] If no user → return null
    - [ ] Compare password: `await bcrypt.compare(password, user.password_hash)`
    - [ ] If match → return {userId, email, role}, else → null
  - [ ] Implement generateToken(user):
    - [ ] Create payload: {userId: user.id, email: user.email, role: user.role}
    - [ ] Sign JWT: `jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY })`
    - [ ] Extract tokenId: jwt payload.jti or generate UUID
    - [ ] Store in Redis: `session:{userId}:{tokenId}` with TTL 900 seconds
    - [ ] Return token
  - [ ] Implement invalidateToken(userId, tokenId): `redisClient.del(session:${userId}:${tokenId})`
  - [ ] Implement hashPassword(password): `bcrypt.hash(password, 12)` (12 salt rounds)
- [ ] Create server/src/controllers/auth.controller.ts:
  - [ ] Import authService, auditLog
  - [ ] Implement login(req, res):
    - [ ] Extract {email, password} from req.body
    - [ ] Validate inputs (email format, password length >8)
    - [ ] Call authService.validateCredentials(email, password)
    - [ ] If invalid → log failed attempt to audit_logs → return 401 "Invalid email or password"
    - [ ] If valid → generate token → log success to audit_logs → return {token, userId, role, email}
  - [ ] Implement logout(req, res):
    - [ ] Extract userId, tokenId from req.user (set by auth middleware)
    - [ ] Call authService.invalidateToken(userId, tokenId)
    - [ ] Return 200 OK
  - [ ] Implement getCurrentUser(req, res): Return req.user (userId, email, role)
- [ ] Create server/src/utils/rate-limiter.ts:
  - [ ] Import redisClient
  - [ ] Implement trackFailedLogin(ip):
    - [ ] Key: `login-attempts:${ip}`
    - [ ] Increment counter: `redisClient.incr(key)`
    - [ ] Set TTL 900 seconds (15 minutes) if first attempt: `redisClient.expire(key, 900)`
    - [ ] Get count: `redisClient.get(key)`
    - [ ] If count >= 5 → return true (blocked), else false
  - [ ] Implement resetFailedLogins(ip): `redisClient.del(login-attempts:${ip})`
- [ ] Update server/src/middleware/auth.ts:
  - [ ] Import jwt, redisClient
  - [ ] Implement verifyToken(req, res, next):
    - [ ] Extract Authorization header: `req.headers.authorization`
    - [ ] If missing → return 401 "No token provided"
    - [ ] Parse token: `authHeader.split(' ')[1]` (Bearer format)
    - [ ] Verify JWT: `jwt.verify(token, JWT_SECRET)` → decode payload
    - [ ] Check Redis session: `redisClient.exists(session:${userId}:${tokenId})`
    - [ ] If no session → return 401 "Session expired"
    - [ ] Attach to request: `req.user = { userId, email, role }`
    - [ ] Call next()
  - [ ] Implement requireRole(...roles):
    - [ ] Return middleware: (req, res, next) => { if (!roles.includes(req.user.role)) return 403 "Forbidden"; next(); }
- [ ] Update server/src/routes/auth.routes.ts:
  - [ ] Import authController, verifyToken from middleware
  - [ ] POST /auth/login: authController.login (public route, no auth)
  - [ ] POST /auth/logout: verifyToken, authController.logout
  - [ ] GET /auth/me: verifyToken, authController.getCurrentUser
- [ ] Update server/src/app.ts: Import authRoutes, register: `app.use('/auth', authRoutes)`
- [ ] Test login endpoint:
  - [ ] Create test user in database with hashed password: `INSERT INTO users (id, email, password_hash, role) VALUES (gen_random_uuid(), 'test@example.com', '<bcrypt_hash>', 'patient')`
  - [ ] `curl -X POST http://localhost:3001/auth/login -d '{"email":"test@example.com","password":"password123"}' -H "Content-Type: application/json"`
  - [ ] Verify response: {token, userId, role, email}
  - [ ] Decode JWT: Verify expiry is current_time + 900 seconds
- [ ] Test auth middleware:
  - [ ] `curl http://localhost:3001/auth/me` → 401 Unauthorized
  - [ ] `curl http://localhost:3001/auth/me -H "Authorization: Bearer <valid_token>"` → 200 OK with user data
- [ ] Test role-based access: Create protected admin route → patient token → 403 forbidden
- [ ] Test logout: `curl -X POST http://localhost:3001/auth/logout -H "Authorization: Bearer <token>"` → Redis session deleted
- [ ] Test rate limiting: Make 5 failed login attempts → 6th attempt → 429 Too Many Requests
- [ ] Document authentication flow in server/README.md: Login process, JWT structure, session management, RBAC
