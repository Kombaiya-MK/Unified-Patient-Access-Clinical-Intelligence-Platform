# Task - TASK_003_BE_SESSION_MANAGEMENT_REDIS

## Requirement Reference
- User Story: US_004  
- Story Location: `.propel/context/tasks/us_004/us_004.md`
- Acceptance Criteria:
    - AC3: User logs in successfully, JWT token generated, session stored in Redis with 15-minute TTL and user_id as key
- Edge Cases:
    - Cache TTL expires during multi-step booking: Use optimistic locking, verify slot availability at final booking step

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

> **Note**: Backend session management - no UI

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.x |
| Backend | jsonwebtoken | 9.x |
| Backend | ioredis | 5.x |
| Backend | TypeScript | 5.3.x |
| Database | Upstash Redis | Cloud |
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

> **Note**: Authentication/session only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend API only

## Task Overview
Implement JWT-based authentication with Redis session storage, 15-minute session TTL, automatic session refresh on activity, and session invalidation on logout. Store session data (user_id, role, permissions) in Redis with user_id as key. Implement session validation middleware and token blacklisting for logout. Handle edge case of TTL expiration during multi-step operations with optimistic locking.

## Dependent Tasks
- TASK_001_BE_REDIS_CONNECTION_SETUP: Redis client must be configured
- US_003: Users table must exist in database

## Impacted Components
**New:**
- server/src/services/authService.ts (Login, token generation, session creation)
- server/src/services/sessionService.ts (Redis session operations)
- server/src/middleware/authenticate.ts (JWT validation + session check)
- server/src/middleware/refreshSession.ts (Extend session TTL on activity)
- server/src/controllers/authController.ts (Login, logout handlers)
- server/src/routes/auth.routes.ts (Authentication endpoints)
- server/src/utils/jwtHelper.ts (Sign, verify JWT tokens)
- server/src/types/session.types.ts (Session, JwtPayload interfaces)

**Modified:**
- server/package.json (add jsonwebtoken, bcrypt dependencies)
- server/.env.example (add JWT_SECRET, JWT_EXPIRES_IN, SESSION_TTL)
- server/src/routes/index.ts (Register auth routes)

## Implementation Plan
1. **Install Dependencies**: Add jsonwebtoken@9.x, bcrypt@5.x to package.json
2. **JWT Configuration**: Set JWT_SECRET, JWT_EXPIRES_IN (15m) in environment variables
3. **Session Service**: Create sessionService.ts with createSession, getSession, deleteSession, refreshSession functions
4. **Session Storage**: Use Redis key format: `session:{userId}` with 900s (15 minutes) TTL
5. **Session Data**: Store JSON: { userId, email, role, permissions, createdAt, lastActivity }
6. **Login Flow**: Validate credentials → generate JWT → create Redis session → return token
7. **JWT Payload**: Include { userId, email, role, iat, exp } in token
8. **Authentication Middleware**: Verify JWT → check session exists in Redis → attach user to req.user
9. **Session Refresh**: On each authenticated request, update lastActivity and extend TTL by 15 minutes
10. **Logout**: Add token to blacklist in Redis, delete session, return success
11. **Token Blacklist**: Store revoked tokens with TTL equal to original expiration
12. **Optimistic Locking**: For multi-step operations, include version/timestamp in session, verify unchanged before commit

## Current Project State
```
ASSIGNMENT/
├── app/                     # Frontend (US_001)
├── server/                  # Backend API (US_002, US_003, US_004 Tasks 1-2)
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   └── redis.ts
│   │   ├── services/
│   │   │   └── timeSlotCache.ts
│   │   └── middleware/
└── database/                # Users table exists
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| MODIFY | server/package.json | Add jsonwebtoken@9.x, bcrypt@5.x |
| MODIFY | server/.env.example | Add JWT_SECRET, JWT_EXPIRES_IN=15m, SESSION_TTL=900 (seconds) |
| CREATE | server/src/services/authService.ts | login(email, password), validateCredentials, generateTokens |
| CREATE | server/src/services/sessionService.ts | createSession, getSession, deleteSession, refreshSession with Redis |
| CREATE | server/src/controllers/authController.ts | login, logout, refreshToken handlers |
| CREATE | server/src/routes/auth.routes.ts | POST /api/auth/login, /api/auth/logout, /api/auth/refresh |
| CREATE | server/src/middleware/authenticate.ts | Verify JWT, check session in Redis, attach req.user |
| CREATE | server/src/middleware/refreshSession.ts | Extend session TTL on each request |
| CREATE | server/src/utils/jwtHelper.ts | signToken, verifyToken, decodeToken functions |
| CREATE | server/src/utils/blacklist.ts | addToBlacklist, isBlacklisted using Redis |
| CREATE | server/src/types/session.types.ts | Session, JwtPayload, AuthRequest interfaces |
| MODIFY | server/src/routes/index.ts | Import and register auth routes |
| CREATE | server/tests/integration/auth.test.ts | Login, logout, session management tests |

> 3 modified files, 10 new files created

## External References
- [jsonwebtoken Documentation](https://www.npmjs.com/package/jsonwebtoken)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Redis Session Store Pattern](https://redis.io/glossary/session-store/)
- [bcrypt Hashing](https://www.npmjs.com/package/bcrypt)
- [Optimistic Locking](https://en.wikipedia.org/wiki/Optimistic_concurrency_control)
- [Token Blacklisting Strategies](https://redis.io/docs/manual/patterns/distributed-locks/)
- [Express Authentication Middleware](https://expressjs.com/en/guide/using-middleware.html)

## Build Commands
```bash
# Install dependencies
cd server
npm install jsonwebtoken bcrypt
npm install --save-dev @types/jsonwebtoken @types/bcrypt

# Generate JWT secret (add to .env)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Update .env
echo "JWT_SECRET=<generated-secret>" >> .env
echo "JWT_EXPIRES_IN=15m" >> .env
echo "SESSION_TTL=900" >> .env

# Start server
npm run dev

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
# Expected: {"token":"eyJhbGc...", "expiresIn":900}

# Test authenticated request
curl http://localhost:3001/api/protected-endpoint \
  -H "Authorization: Bearer <token>"
# Expected: 200 OK with user data

# Check session in Redis
redis-cli -u $REDIS_URL --tls
GET session:1
# Expected: JSON session data

# Check TTL
TTL session:1
# Expected: ~900 seconds

# Test logout
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer <token>"
# Expected: {"success":true}

# Verify session deleted
GET session:1
# Expected: (nil)

# Verify token blacklisted
GET blacklist:<token-hash>
# Expected: "1"

# Test token refresh
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Authorization: Bearer <token>"
# Expected: New token with extended expiration

# Run tests
npm test -- auth.test.ts
```

## Implementation Validation Strategy
- [ ] Unit tests pass (auth service mocking)
- [ ] Integration tests pass (Redis + JWT together)
- [ ] jsonwebtoken and bcrypt installed: `npm list jsonwebtoken bcrypt`
- [ ] JWT_SECRET in .env: at least 64 characters
- [ ] Login endpoint created: POST /api/auth/login returns token
- [ ] Token structure valid: JWT with header, payload, signature
- [ ] Payload contains: userId, email, role, iat, exp
- [ ] Session created in Redis: key=session:{userId}, value=JSON
- [ ] Session TTL set: redis.ttl() returns ~900 seconds
- [ ] Authentication middleware works: Protected route requires valid token
- [ ] Session validation: Invalid/expired token → 401 Unauthorized
- [ ] Session refresh works: Activity extends TTL to 900s
- [ ] Logout deletes session: Redis key removed
- [ ] Token blacklisting works: Reusing logged-out token → 401
- [ ] Concurrent sessions: Same user can have multiple active sessions (different devices)
- [ ] Optimistic locking: Include session version in multi-step operations

## Implementation Checklist
- [ ] Install jsonwebtoken and bcrypt: `npm install jsonwebtoken bcrypt @types/jsonwebtoken @types/bcrypt`
- [ ] Generate JWT secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- [ ] Update server/.env.example with JWT_SECRET, JWT_EXPIRES_IN, SESSION_TTL
- [ ] Create server/src/types/session.types.ts with interfaces
- [ ] Define Session: { userId, email, role, permissions, createdAt, lastActivity, version }
- [ ] Define JwtPayload: { userId, email, role, iat, exp }
- [ ] Define AuthRequest extends Request: { user: JwtPayload }
- [ ] Create server/src/utils/jwtHelper.ts
- [ ] Implement signToken(payload: JwtPayload): string using jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })
- [ ] Implement verifyToken(token: string): JwtPayload using jwt.verify(token, JWT_SECRET)
- [ ] Wrap in try/catch: return null on invalid/expired tokens
- [ ] Create server/src/utils/blacklist.ts
- [ ] Implement addToBlacklist(token: string, ttl: number): hash token, redis.setex(`blacklist:${hash}`, ttl, '1')
- [ ] Implement isBlacklisted(token: string): redis.exists(`blacklist:${hash}`)
- [ ] Create server/src/services/sessionService.ts
- [ ] Implement createSession(userId, sessionData): redis.setex(`session:${userId}`, 900, JSON.stringify(sessionData))
- [ ] Implement getSession(userId): redis.get(`session:${userId}`), parse JSON
- [ ] Implement deleteSession(userId): redis.del(`session:${userId}`)
- [ ] Implement refreshSession(userId): redis.expire(`session:${userId}`, 900)
- [ ] Create server/src/services/authService.ts
- [ ] Implement login(email, password): query user from database
- [ ] Validate password: bcrypt.compare(password, user.password_hash)
- [ ] If valid: generate JWT, create session in Redis, return token
- [ ] If invalid: throw error "Invalid credentials"
- [ ] Create server/src/middleware/authenticate.ts
- [ ] Extract token from Authorization header: Bearer <token>
- [ ] Verify token: const payload = jwtHelper.verifyToken(token)
- [ ] Check if blacklisted: if (await blacklist.isBlacklisted(token)) return 401
- [ ] Get session: const session = await sessionService.getSession(payload.userId)
- [ ] If no session: return 401 Unauthorized
- [ ] Attach to request: req.user = payload, next()
- [ ] Create server/src/middleware/refreshSession.ts
- [ ] Update lastActivity in session: session.lastActivity = Date.now()
- [ ] Extend TTL: await sessionService.refreshSession(req.user.userId)
- [ ] Call next()
- [ ] Create server/src/controllers/authController.ts
- [ ] Implement login handler: extract email, password from body
- [ ] Call authService.login(email, password)
- [ ] Return: res.json({ token, expiresIn: 900 })
- [ ] Implement logout handler: extract userId from req.user
- [ ] Delete session: await sessionService.deleteSession(userId)
- [ ] Add token to blacklist with remaining TTL
- [ ] Return: res.json({ success: true })
- [ ] Implement refresh handler: generate new token, extend session TTL
- [ ] Create server/src/routes/auth.routes.ts
- [ ] Define: router.post('/login', authController.login)
- [ ] Define: router.post('/logout', authenticate, authController.logout)
- [ ] Define: router.post('/refresh', authenticate, authController.refresh)
- [ ] Export router
- [ ] Modify server/src/routes/index.ts: import auth routes, app.use('/api/auth', authRouter)
- [ ] Test login: POST /api/auth/login with valid credentials → receive token
- [ ] Test session created: Check Redis for session:{userId} key
- [ ] Test authentication: Call protected route with token → 200 OK
- [ ] Test invalid token: Call protected route with wrong token → 401
- [ ] Test session refresh: Wait 1 minute, call endpoint → TTL refreshed to 900s
- [ ] Test logout: POST /api/auth/logout → session deleted, token blacklisted
- [ ] Test logout token reuse: Use same token → 401 Unauthorized
- [ ] Create server/tests/integration/auth.test.ts
- [ ] Test: "should login and create session with 15-minute TTL"
- [ ] Test: "should validate JWT and check session exists"
- [ ] Test: "should refresh session TTL on activity"
- [ ] Test: "should logout and invalidate session"
- [ ] Test: "should reject blacklisted tokens"
- [ ] Run tests: npm test -- auth.test.ts → all pass
