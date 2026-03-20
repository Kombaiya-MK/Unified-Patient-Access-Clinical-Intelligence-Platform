# Task - TASK_003_BE_RATE_LIMITING_BRUTE_FORCE_PROTECTION

## Requirement Reference
- User Story: US_009  
- Story Location: `.propel/context/tasks/us_009/us_009.md`
- Acceptance Criteria:
    - N/A (Edge case implementation)
- Edge Cases:
    - Brute force attacks: Rate limit max 5 failed login attempts per 15 minutes per IP address
    - Concurrent login attempts: Track per IP and per email separately

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

> **Note**: Backend security middleware - no UI

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.x |
| Backend | express-rate-limit | 7.x |
| Backend | TypeScript | 5.3.x |
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

> **Note**: Security middleware only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend API only

## Task Overview
Implement comprehensive rate limiting and brute force protection for authentication endpoints using express-rate-limit with Redis store. Limit failed login attempts to 5 per 15 minutes per IP address, track attempts per email address separately to detect distributed attacks, implement progressive delays on repeated failures, provide clear error messages with retry-after information, and log suspicious activity to audit logs for security monitoring.

## Dependent Tasks
- US_009 TASK_001: Backend authentication must be implemented
- US_004 TASK_001: Redis connection for rate limit storage

## Impacted Components
**New:**
- server/src/middleware/rateLimiter.ts (express-rate-limit configuration)
- server/src/middleware/loginRateLimiter.ts (Specialized rate limiter for login endpoint)
- server/src/utils/bruteForceDetection.ts (Track failed attempts by IP and email)
- server/src/types/rateLimiter.types.ts (RateLimitOptions, BruteForceRecord interfaces)

**Modified:**
- server/package.json (add express-rate-limit, rate-limit-redis)
- server/src/routes/auth.routes.ts (Apply rate limiter middleware to login endpoint)
- server/src/services/authService.ts (Track failed login attempts)

## Implementation Plan
1. **Global Rate Limiter**: 100 requests per 15 minutes per IP for all API endpoints
2. **Login Rate Limiter**: 5 failed attempts per 15 minutes per IP for /api/auth/login
3. **Email-based Tracking**: Track failed attempts per email address (prevent distributed brute force)
4. **Redis Storage**: Store rate limit counters in Redis with TTL (15 minutes = 900 seconds)
5. **Progressive Delays**: First failure: immediate, 2nd: 1s delay, 3rd: 2s, 4th: 4s, 5th: 8s, 6th: 429 Too Many Requests
6. **Clear Error Messages**: "Too many login attempts. Please try again in X minutes"
7. **Retry-After Header**: Include Retry-After header with seconds until reset
8. **Whitelist IPs**: Allow whitelisting trusted IPs (e.g., internal monitoring)
9. **Audit Logging**: Log rate limit violations to audit_logs table
10. **Account Lockout**: Optional: Lock account after 10 failed attempts in 1 hour (requires email verification to unlock)
11. **Reset on Success**: Clear failed attempt counter on successful login
12. **Distributed Attack Detection**: If same email has failures from >3 IPs, raise alert

## Current Project State
```
ASSIGNMENT/
├── app/                     # Frontend (US_001)
├── server/                  # Backend API with auth (US_009 TASK_001)
│   ├── src/
│   │   ├── middleware/
│   │   ├── routes/
│   │   │   └── auth.routes.ts
│   │   └── services/
│   │       └── authService.ts
└── database/                # Database setup
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| MODIFY | server/package.json | Add express-rate-limit@7.x, rate-limit-redis@4.x |
| CREATE | server/src/types/rateLimiter.types.ts | RateLimitOptions, BruteForceRecord, RateLimitInfo interfaces |
| CREATE | server/src/middleware/rateLimiter.ts | Global rate limiter: 100 req/15min per IP |
| CREATE | server/src/middleware/loginRateLimiter.ts | Login-specific: 5 failed attempts/15min per IP |
| CREATE | server/src/utils/bruteForceDetection.ts | Track failed attempts by email, detect distributed attacks |
| MODIFY | server/src/routes/auth.routes.ts | Apply loginRateLimiter to POST /login endpoint |
| MODIFY | server/src/services/authService.ts | Increment failed attempt counter, reset on success |
| CREATE | server/src/utils/progressiveDelay.ts | Implement exponential backoff delays |
| CREATE | server/docs/RATE_LIMITING.md | Rate limit configuration, attack prevention strategies |

> 3 modified files, 6 new files created

## External References
- [express-rate-limit Documentation](https://www.npmjs.com/package/express-rate-limit)
- [rate-limit-redis](https://www.npmjs.com/package/rate-limit-redis)
- [OWASP Brute Force Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#protect-against-automated-attacks)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
- [Progressive Delays](https://en.wikipedia.org/wiki/Exponential_backoff)
- [Redis TTL](https://redis.io/commands/ttl/)

## Build Commands
```bash
# Install dependencies
cd server
npm install express-rate-limit rate-limit-redis

# Start development server
npm run dev

# Test rate limiting (normal usage - should succeed)
for i in {1..5}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrongpassword"}'
  echo ""
done
# Expected: First 5 requests return 401 Unauthorized

# Test rate limit exceeded (6th request)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpassword"}'
# Expected: 429 Too Many Requests
# Response: {"error":"Too many login attempts. Please try again in 14 minutes"}
# Header: Retry-After: 840 (seconds)

# Check Redis for rate limit data
redis-cli -u $REDIS_URL --tls
KEYS ratelimit:*
# Expected: ratelimit:login:<ip-address>

# Get rate limit info
GET ratelimit:login:127.0.0.1
# Expected: Current count

# Check TTL
TTL ratelimit:login:127.0.0.1
# Expected: ~900 seconds (15 minutes)

# Test progressive delays
# Use curl with timing
for i in {1..5}; do
  echo "Attempt $i:"
  time curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrongpassword"}' \
    -w "\nTime: %{time_total}s\n"
done
# Expected delays: ~0s, ~1s, ~2s, ~4s, ~8s

# Test email-based tracking (distributed attack simulation)
# From IP 1
curl --interface 192.168.1.100 -X POST http://localhost:3001/api/auth/login \
  -d '{"email":"victim@example.com","password":"wrong"}'
# From IP 2
curl --interface 192.168.1.101 -X POST http://localhost:3001/api/auth/login \
  -d '{"email":"victim@example.com","password":"wrong"}'
# From IP 3
curl --interface 192.168.1.102 -X POST http://localhost:3001/api/auth/login \
  -d '{"email":"victim@example.com","password":"wrong"}'
# Expected: Alert logged (distributed attack detected)

# Test reset on successful login
curl -X POST http://localhost:3001/api/auth/login \
  -d '{"email":"test@example.com","password":"correctpassword"}'
# Expected: Success, failed attempt counter reset

# Check audit logs for rate limit violations
psql -U upaci_user -d upaci -c "
SELECT * FROM audit_logs 
WHERE action = 'RATE_LIMIT_EXCEEDED' 
ORDER BY created_at DESC 
LIMIT 10;
"

# Test global rate limiter (100 req/15min)
# Generate 101 requests to any endpoint
for i in {1..101}; do
  curl http://localhost:3001/api/health
done
# Expected: First 100 succeed, 101st returns 429
```

## Implementation Validation Strategy
- [ ] Unit tests pass (rate limiter configuration)
- [ ] Integration tests pass (full rate limiting flow)
- [ ] express-rate-limit installed: `npm list express-rate-limit`
- [ ] Global rate limiter active: 101st request to any endpoint → 429
- [ ] Login rate limiter active: 6th failed login → 429
- [ ] Rate limit window correct: TTL = 900 seconds (15 minutes)
- [ ] Redis storage works: Rate limit counters stored in Redis with TTL
- [ ] Error message clear: "Too many login attempts. Please try again in X minutes"
- [ ] Retry-After header present: Response includes Retry-After: <seconds>
- [ ] Progressive delays work: Delays increase exponentially (1s, 2s, 4s, 8s)
- [ ] Email-based tracking: Failed attempts tracked per email address
- [ ] Distributed attack detection: >3 IPs targeting same email → alert logged
- [ ] Reset on success: Successful login clears failed attempt counter
- [ ] Audit logging: Rate limit violations logged to audit_logs table
- [ ] IP whitelisting: Trusted IPs bypass rate limits
- [ ] Multiple endpoints protected: /register, /forgot-password also rate-limited

## Implementation Checklist

### Dependencies Installation
- [ ] Install express-rate-limit: `npm install express-rate-limit`
- [ ] Install rate-limit-redis: `npm install rate-limit-redis`
- [ ] Install types: `npm install --save-dev @types/express-rate-limit`

### Type Definitions (server/src/types/rateLimiter.types.ts)
- [ ] Define RateLimitOptions interface: { windowMs: number, max: number, message: string, standardHeaders: boolean, legacyHeaders: boolean }
- [ ] Define BruteForceRecord interface: { email: string, ipAddresses: string[], failedAttempts: number, lastAttempt: Date, isLocked: boolean }
- [ ] Define RateLimitInfo interface: { limit: number, current: number, remaining: number, resetTime: Date }
- [ ] Export all types

### Global Rate Limiter (server/src/middleware/rateLimiter.ts)
- [ ] Import rateLimit from 'express-rate-limit'
- [ ] Import RedisStore from 'rate-limit-redis'
- [ ] Import redisClient from '../config/redis'
- [ ] Create RedisStore instance: const store = new RedisStore({ client: redisClient, prefix: 'ratelimit:global:' })
- [ ] Configure rate limiter: const globalRateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: 'Too many requests. Please try again later.', standardHeaders: true, legacyHeaders: false, store, keyGenerator: (req) => req.ip })
- [ ] Export globalRateLimiter

### Login Rate Limiter (server/src/middleware/loginRateLimiter.ts)
- [ ] Import rateLimit, RedisStore, redisClient
- [ ] Import progressiveDelay function
- [ ] Create RedisStore: const store = new RedisStore({ client: redisClient, prefix: 'ratelimit:login:' })
- [ ] Configure: const loginRateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: 'Too many login attempts. Please try again in 15 minutes.', standardHeaders: true, legacyHeaders: false, store, keyGenerator: (req) => req.ip, handler: (req, res) => { const resetTime = new Date(Date.now() + 15 * 60 * 1000); res.set('Retry-After', String(Math.ceil(15 * 60))); res.status(429).json({ error: 'Too many login attempts', retryAfter: resetTime }); }, skip: (req) => { /* Check if IP is whitelisted */ return false; } })
- [ ] Export loginRateLimiter

### Progressive Delay Utility (server/src/utils/progressiveDelay.ts)
- [ ] Import redisClient
- [ ] Implement async getFailedAttempts(ip: string): Promise<number>
- [ ] const key = `failed_attempts:${ip}`
- [ ] const attempts = await redisClient.get(key)
- [ ] Return parseInt(attempts || '0')
- [ ] Implement async incrementFailedAttempts(ip: string): Promise<number>
- [ ] const key = `failed_attempts:${ip}`
- [ ] await redisClient.incr(key)
- [ ] await redisClient.expire(key, 900) // 15 minutes TTL
- [ ] Return await getFailedAttempts(ip)
- [ ] Implement async resetFailedAttempts(ip: string): Promise<void>
- [ ] await redisClient.del(`failed_attempts:${ip}`)
- [ ] Implement async calculateDelay(ip: string): Promise<number>
- [ ] const attempts = await getFailedAttempts(ip)
- [ ] if (attempts === 0) return 0
- [ ] const delay = Math.min(Math.pow(2, attempts - 1) * 1000, 30000) // Max 30s
- [ ] Return delay
- [ ] Implement applyProgressiveDelay middleware: async (req, res, next) => {}
- [ ] const delay = await calculateDelay(req.ip)
- [ ] if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay))
- [ ] next()
- [ ] Export all functions

### Brute Force Detection (server/src/utils/bruteForceDetection.ts)
- [ ] Import redisClient, auditLogger
- [ ] Implement async trackFailedLogin(email: string, ip: string): Promise<void>
- [ ] const emailKey = `failed_login:email:${email}`
- [ ] const ipSetKey = `failed_login:ips:${email}`
- [ ] await redisClient.incr(emailKey)
- [ ] await redisClient.sadd(ipSetKey, ip) // Add IP to set
- [ ] await redisClient.expire(emailKey, 3600) // 1 hour TTL
- [ ] await redisClient.expire(ipSetKey, 3600)
- [ ] Check for distributed attack
- [ ] const ipCount = await redisClient.scard(ipSetKey) // Count unique IPs
- [ ] if (ipCount >= 3) { await auditLogger.logSecurityEvent('DISTRIBUTED_ATTACK', { email, ipCount, ips: await redisClient.smembers(ipSetKey) }) }
- [ ] Implement async checkAccountLocked(email: string): Promise<boolean>
- [ ] const attempts = await redisClient.get(`failed_login:email:${email}`)
- [ ] Return parseInt(attempts || '0') >= 10 // Lock after 10 attempts
- [ ] Implement async resetFailedLogins(email: string): Promise<void>
- [ ] await redisClient.del(`failed_login:email:${email}`)
- [ ] await redisClient.del(`failed_login:ips:${email}`)
- [ ] Export functions

### Auth Service Modification (server/src/services/authService.ts)
- [ ] Import progressiveDelay, bruteForceDetection
- [ ] In login function, before password validation:
- [ ] Check if account locked: if (await checkAccountLocked(email)) throw new Error('Account temporarily locked due to too many failed attempts')
- [ ] After failed password validation:
- [ ] await trackFailedLogin(email, ipAddress)
- [ ] await incrementFailedAttempts(ipAddress)
- [ ] After successful login:
- [ ] await resetFailedLogins(email)
- [ ] await resetFailedAttempts(ipAddress)

### Auth Routes Modification (server/src/routes/auth.routes.ts)
- [ ] Import loginRateLimiter, applyProgressiveDelay
- [ ] Apply to login route: router.post('/login', loginRateLimiter, applyProgressiveDelay, authController.login)
- [ ] Apply rate limiter to other auth endpoints:
- [ ] router.post('/register', loginRateLimiter, authController.register)
- [ ] router.post('/forgot-password', loginRateLimiter, authController.forgotPassword)

### App-wide Rate Limiter Application
- [ ] In server/src/app.ts: Import globalRateLimiter
- [ ] Apply globally: app.use(globalRateLimiter)
- [ ] Place before route definitions to apply to all endpoints

### Documentation (server/docs/RATE_LIMITING.md)
- [ ] Document rate limiting strategy
- [ ] Global: 100 requests per 15 minutes per IP
- [ ] Login: 5 failed attempts per 15 minutes per IP
- [ ] Progressive delays: Exponential backoff on repeated failures
- [ ] Document brute force prevention
- [ ] Email-based tracking to detect distributed attacks
- [ ] Account lockout after 10 failed attempts in 1 hour
- [ ] Document error responses
- [ ] 429 Too Many Requests with Retry-After header
- [ ] Clear error messages with retry time
- [ ] Document whitelist configuration
- [ ] How to add trusted IPs to whitelist
- [ ] Environment variable: RATE_LIMIT_WHITELIST=127.0.0.1,10.0.0.0/8
- [ ] Document monitoring
- [ ] Check Redis for rate limit counters
- [ ] Query audit_logs for RATE_LIMIT_EXCEEDED and DISTRIBUTED_ATTACK events
- [ ] Document Redis keys
- [ ] ratelimit:global:<ip> - Global rate limit counter
- [ ] ratelimit:login:<ip> - Login rate limit counter
- [ ] failed_attempts:<ip> - Progressive delay counter
- [ ] failed_login:email:<email> - Email-based failed attempt counter
- [ ] failed_login:ips:<email> - Set of IPs that failed for this email

### Testing
- [ ] Create server/tests/integration/rateLimiter.test.ts
- [ ] Test: "should allow 5 failed login attempts"
- [ ] Make 5 requests, all should return 401
- [ ] Test: "should block 6th failed login attempt with 429"
- [ ] Test: "should return Retry-After header on rate limit"
- [ ] Test: "should apply progressive delays"
- [ ] Measure response time for attempts 1-5, verify increasing delays
- [ ] Test: "should reset failed attempts on successful login"
- [ ] Test: "should track email-based failed attempts"
- [ ] Test: "should detect distributed attack"
- [ ] Test: "should lock account after 10 failed attempts"
- [ ] Test: "should allow whitelisted IPs to bypass rate limit"
- [ ] Test: "should log rate limit violations to audit_logs"
- [ ] Run tests: npm test -- rateLimiter.test.ts

### Execution and Validation
- [ ] Start server: npm run dev
- [ ] Test failed login attempts: Make 5 requests with wrong password
- [ ] Verify: All return 401 Unauthorized
- [ ] Test 6th attempt: Should return 429 Too Many Requests
- [ ] Verify Retry-After header present
- [ ] Check Redis: GET ratelimit:login:127.0.0.1 → should show count
- [ ] Test progressive delays: Measure response times, verify exponential increase
- [ ] Test successful login: Failed attempt counter should reset
- [ ] Test distributed attack: Failed logins for same email from 3+ IPs
- [ ] Check audit_logs: DISTRIBUTED_ATTACK event logged
- [ ] Wait 15 minutes, verify rate limit reset
- [ ] Test global rate limiter: Make 101 requests to /api/health → 101st returns 429
- [ ] Run all tests: npm test -- rateLimiter.test.ts → all pass
- [ ] Document findings in RATE_LIMITING.md
