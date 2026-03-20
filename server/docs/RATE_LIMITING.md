# Rate Limiting & Brute Force Protection

**Version:** 1.0.0  
**Date:** March 18, 2026  
**User Story:** US_009  
**Task:** TASK_003_BE_RATE_LIMITING_BRUTE_FORCE_PROTECTION

## Table of Contents

- [Overview](#overview)
- [Rate Limit Implementation](#rate-limit-implementation)
- [Brute Force Protection](#brute-force-protection)
- [Progressive Delays](#progressive-delays)
- [Distributed Attack Detection](#distributed-attack-detection)
- [Redis Storage](#redis-storage)
- [Error Responses](#error-responses)
- [Monitoring & Alerts](#monitoring--alerts)
- [Configuration](#configuration)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Clinical Appointment Platform implements comprehensive rate limiting and brute force protection to defend against automated attacks while maintaining usability for legitimate users.

**Security Layers:**

1. **Global Rate Limiter** - 100 requests per 15 minutes per IP (all endpoints)
2. **Login Rate Limiter** - 5 failed attempts per 15 minutes per IP
3. **Progressive Delays** - Exponential backoff on repeated failures
4. **Email-Based Tracking** - Detect distributed attacks across IPs
5. **Account Lockout** - Lock account after 10 failures in 1 hour

**Technology Stack:**
- express-rate-limit 7.x - Rate limiting middleware
- rate-limit-redis 4.x - Redis storage for distributed systems
- Redis (Upstash) - Persistent counter storage
- PostgreSQL - Audit logging

---

## Rate Limit Implementation

### Global Rate Limiter

**Applied to:** All API endpoints  
**Limit:** 100 requests per 15 minutes per IP address  
**Purpose:** Prevent API abuse and DoS attacks

**Implementation:**
```typescript
// server/src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP. Please try again later.',
  standardHeaders: true, // RateLimit-* headers
  legacyHeaders: false,
  store: new RedisStore({
    client: redisClient,
    prefix: 'ratelimit:global:',
  }),
});
```

**Usage:**
```typescript
// server/src/app.ts
import { globalRateLimiter } from './middleware/rateLimiter';

// Apply to all routes
app.use(globalRateLimiter);
```

**Headers Sent:**
- `RateLimit-Limit: 100` - Maximum requests allowed
- `RateLimit-Remaining: 95` - Requests remaining in window
- `RateLimit-Reset: 1710778500` - Unix timestamp when limit resets
- `Retry-After: 840` - Seconds until reset (when exceeded)

---

### Login Rate Limiter

**Applied to:** Authentication endpoints  
**Limit:** 5 failed login attempts per 15 minutes per IP  
**Purpose:** Protect against brute force password attacks

**Endpoints Protected:**
- `POST /api/auth/login` - 5 failed attempts per 15 min
- `POST /api/auth/register` - 5 attempts per 15 min
- `POST /api/auth/forgot-password` - 3 attempts per 15 min (stricter)

**Implementation:**
```typescript
// server/src/middleware/loginRateLimiter.ts
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 failed attempts
  skipSuccessfulRequests: true, // Don't count successful logins
  store: new RedisStore({
    client: redisClient,
    prefix: 'ratelimit:login:',
  }),
});
```

**Usage:**
```typescript
// server/src/routes/auth.routes.ts
import { loginRateLimiter } from '../middleware/loginRateLimiter';

router.post(
  '/login',
  loginRateLimiter, // Apply rate limiter
  applyProgressiveDelay, // Add delays
  authController.login
);
```

**Key Feature:** Only failed requests count toward limit. Successful logins don't increment counter.

---

## Brute Force Protection

### Multi-Layer Defense

**Layer 1: IP-Based Rate Limiting**
- Tracks requests per IP address
- Blocks after 5 failed attempts in 15 minutes
- Resets automatically after window expires

**Layer 2: Email-Based Tracking**
- Tracks failed attempts per email address
- Detects attacks distributed across multiple IPs
- Locks account after 10 failed attempts in 1 hour

**Layer 3: Progressive Delays**
- Adds exponential backoff delays
- Slows down automated attacks
- Minimal impact on legitimate users

### Email-Based Tracking

**Purpose:** Detect distributed brute force attacks where attackers use multiple IPs to bypass IP-based rate limiting.

**Implementation:**
```typescript
// server/src/utils/bruteForceDetection.ts
export const trackFailedLogin = async (
  email: string,
  ip: string
): Promise<number> => {
  // Increment failed attempt counter for email
  const emailKey = `failed_login:email:${email}`;
  await redis.incr(emailKey);
  await redis.expire(emailKey, 3600); // 1 hour TTL

  // Track unique IPs
  const ipSetKey = `failed_login:ips:${email}`;
  await redis.sadd(ipSetKey, ip);
  await redis.expire(ipSetKey, 3600);

  // Check for distributed attack
  const uniqueIPs = await redis.scard(ipSetKey);
  if (uniqueIPs >= 3) {
    await logDistributedAttack(email, uniqueIPs);
  }

  return attempts;
};
```

**Distributed Attack Detection:**
- Threshold: 3+ unique IPs targeting same email
- Alert: Logged to audit_logs with DISTRIBUTED_ATTACK action
- Response: Security team notified for manual review

### Account Lockout

**Trigger:** 10 failed login attempts in 1 hour  
**Duration:** 1 hour (3600 seconds)  
**Unlock:** Automatic after expiry OR manual admin unlock

**Implementation:**
```typescript
export const checkAccountLocked = async (
  email: string
): Promise<boolean> => {
  const attempts = await getFailedLoginCount(email);
  return attempts >= 10;
};
```

**User Experience:**
- Clear error message: "Account temporarily locked due to too many failed attempts. Please try again in 1 hour."
- Status code: 429 Too Many Requests
- Audit log entry: ACCOUNT_LOCKED action

---

## Progressive Delays

### Exponential Backoff

**Purpose:** Add friction for automated attacks while keeping legitimate users comfortable.

**Delay Schedule:**
| Attempt | Delay | Formula |
|---------|-------|---------|
| 1 | 0ms | Instant |
| 2 | 1000ms (1s) | 2^1 * 1000ms |
| 3 | 2000ms (2s) | 2^2 * 1000ms |
| 4 | 4000ms (4s) | 2^3 * 1000ms |
| 5 | 8000ms (8s) | 2^4 * 1000ms |
| 6+ | 429 Error | Rate limit exceeded |

**Implementation:**
```typescript
// server/src/utils/progressiveDelay.ts
export const calculateDelay = (attempts: number): number => {
  if (attempts === 0) return 0;
  
  // Exponential backoff: 2^(attempts-1) * 1000ms
  const delay = Math.pow(2, attempts - 1) * 1000;
  
  // Cap at 30 seconds
  return Math.min(delay, 30000);
};

export const applyProgressiveDelay = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const ip = req.ip;
  const attempts = await getFailedAttempts(ip);
  const delay = calculateDelay(attempts);

  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  next();
};
```

**Redis Storage:**
- Key: `failed_attempts:{ip}`
- Value: Integer count
- TTL: 900 seconds (15 minutes)

**Reset on Success:**
```typescript
// In authService.login after successful authentication
await resetFailedAttempts(ipAddress);
```

---

## Distributed Attack Detection

### Attack Patterns

**Pattern 1: Single IP Brute Force**
- Detection: IP-based rate limiter (5 attempts/15min)
- Response: 429 Too Many Requests

**Pattern 2: Distributed Brute Force**
- Detection: Email-based tracking (3+ unique IPs)
- Response: Alert to audit_logs, continue blocking per-IP

**Pattern 3: Credential Stuffing**
- Detection: Multiple emails from same IP
- Response: Global rate limiter (100 req/15min)

### Monitoring

**Query Distributed Attacks:**
```sql
SELECT 
  new_values->>'email' as email,
  new_values->>'uniqueIPs' as unique_ips,
  new_values->>'totalAttempts' as attempts,
  created_at
FROM audit_logs
WHERE action = 'DISTRIBUTED_ATTACK'
ORDER BY created_at DESC
LIMIT 10;
```

**Query Locked Accounts:**
```sql
SELECT 
  new_values->>'email' as email,
  new_values->>'failedAttempts' as attempts,
  created_at as locked_at
FROM audit_logs
WHERE action = 'ACCOUNT_LOCKED'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

---

## Redis Storage

### Key Patterns

**Global Rate Limiter:**
```
Key: ratelimit:global:{ip}
Value: Request count (integer)
TTL: 900 seconds (15 minutes)
Example: ratelimit:global:192.168.1.100 = 45
```

**Login Rate Limiter:**
```
Key: ratelimit:login:{ip}
Value: Failed attempt count (integer)
TTL: 900 seconds (15 minutes)
Example: ratelimit:login:192.168.1.100 = 3
```

**Progressive Delay Tracker:**
```
Key: failed_attempts:{ip}
Value: Failed attempt count (integer)
TTL: 900 seconds (15 minutes)
Example: failed_attempts:192.168.1.100 = 4
```

**Email-Based Tracking:**
```
Key: failed_login:email:{email}
Value: Failed attempt count (integer)
TTL: 3600 seconds (1 hour)
Example: failed_login:email:user@example.com = 7

Key: failed_login:ips:{email}
Value: Comma-separated IP list (string)
TTL: 3600 seconds (1 hour)
Example: failed_login:ips:user@example.com = "192.168.1.100,10.0.0.5,172.16.0.10"
```

### Redis Commands

**Check Rate Limit:**
```bash
redis-cli -u $REDIS_URL --tls

# Global rate limit for IP
GET ratelimit:global:192.168.1.100

# Login rate limit for IP
GET ratelimit:login:192.168.1.100

# Failed attempts (progressive delay)
GET failed_attempts:192.168.1.100

# Email-based attempts
GET failed_login:email:user@example.com
GET failed_login:ips:user@example.com
```

**Check TTL:**
```bash
TTL ratelimit:login:192.168.1.100
# Returns: seconds until expiry (e.g., 742)
```

**Manual Reset:**
```bash
# Reset login rate limit for IP
DEL ratelimit:login:192.168.1.100

# Reset failed attempts
DEL failed_attempts:192.168.1.100

# Reset email-based tracking
DEL failed_login:email:user@example.com
DEL failed_login:ips:user@example.com
```

**List All Rate Limit Keys:**
```bash
KEYS ratelimit:*
KEYS failed_attempts:*
KEYS failed_login:*
```

---

## Error Responses

### 429 Too Many Requests

**Global Rate Limit Exceeded:**
```json
{
  "success": false,
  "error": "Too many requests from this IP. Please try again later.",
  "retryAfter": 840,
  "timestamp": "2026-03-18T10:30:00.000Z"
}
```

**Login Rate Limit Exceeded:**
```json
{
  "success": false,
  "error": "Too many login attempts. Please try again in 15 minutes.",
  "retryAfter": 900,
  "resetTime": "2026-03-18T10:45:00.000Z",
  "timestamp": "2026-03-18T10:30:00.000Z"
}
```

**Account Locked:**
```json
{
  "success": false,
  "error": "Account temporarily locked due to too many failed attempts. Please try again in 1 hour.",
  "timestamp": "2026-03-18T10:30:00.000Z"
}
```

**Headers:**
- `RateLimit-Limit: 5` - Maximum allowed
- `RateLimit-Remaining: 0` - None remaining
- `RateLimit-Reset: 1710778500` - Unix timestamp
- `Retry-After: 900` - Seconds until reset

---

## Monitoring & Alerts

### Key Metrics

**Rate Limit Violations:**
```sql
SELECT 
  COUNT(*) as violations,
  DATE_TRUNC('hour', created_at) as hour
FROM audit_logs
WHERE action = 'RATE_LIMIT_EXCEEDED'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

**Distributed Attacks:**
```sql
SELECT 
  new_values->>'email' as email,
  new_values->>'uniqueIPs' as unique_ips,
  COUNT(*) as attack_count
FROM audit_logs
WHERE action = 'DISTRIBUTED_ATTACK'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY email, unique_ips
ORDER BY attack_count DESC;
```

**Account Lockouts:**
```sql
SELECT 
  COUNT(*) as lockouts,
  DATE_TRUNC('hour', created_at) as hour
FROM audit_logs
WHERE action = 'ACCOUNT_LOCKED'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

**Top Offending IPs:**
```sql
SELECT 
  ip_address,
  COUNT(*) as violations,
  MAX(created_at) as last_violation
FROM audit_logs
WHERE action IN ('RATE_LIMIT_EXCEEDED', 'LOGIN_FAILED')
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
HAVING COUNT(*) > 10
ORDER BY violations DESC
LIMIT 20;
```

### Alert Thresholds

| Event | Threshold | Action |
|-------|-----------|--------|
| Rate limit exceeded | >100/hour from single IP | Log, monitor |
| Distributed attack | 3+ IPs, same email | Alert security team |
| Account lockouts | >10/hour system-wide | Investigate pattern |
| Failed logins | >1000/hour system-wide | Possible attack |

---

## Configuration

### Environment Variables

```bash
# .env file

# Rate Limit Whitelist (comma-separated IPs or CIDR ranges)
RATE_LIMIT_WHITELIST=127.0.0.1,10.0.0.0/8,192.168.1.0/24

# Redis Configuration (for rate limit storage)
REDIS_URL=rediss://your-redis-url
REDIS_TOKEN=your-redis-token
```

### Whitelist Configuration

**Whitelisted IPs bypass ALL rate limits.**

**Use Cases:**
- Internal monitoring systems
- CI/CD pipelines
- Admin access from trusted networks
- Health check endpoints

**Example:**
```typescript
// server/src/middleware/rateLimiter.ts
const isWhitelisted = (ip: string): boolean => {
  const whitelist = process.env.RATE_LIMIT_WHITELIST || '';
  const whitelistedIPs = whitelist.split(',');
  
  return whitelistedIPs.includes(ip);
};
```

**Security Warning:** Only whitelist trusted IP addresses. Compromised whitelisted IPs can bypass all rate limiting.

---

## Testing

### Manual Testing with cURL

**Test Progressive Delays:**
```bash
# First attempt (instant)
time curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'
# Expected: ~0 seconds

# Second attempt (1 second delay)
time curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'
# Expected: ~1 second

# Third attempt (2 second delay)
time curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'
# Expected: ~2 seconds

# Continue testing delays...
```

**Test Rate Limit:**
```bash
# Attempt 6 (should be blocked)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}' \
  -v
# Expected: 429 Too Many Requests
# Header: Retry-After: 900
```

**Test Successful Login Reset:**
```bash
# Login with correct password
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"correct"}' \
  -s | jq

# Verify counter reset in Redis
redis-cli GET failed_attempts:127.0.0.1
# Expected: (nil) - key deleted
```

**Test Distributed Attack:**
```bash
# Simulate attacks from multiple IPs (requires multiple network interfaces)
# IP 1
curl --interface 192.168.1.100 -X POST http://localhost:3001/api/auth/login \
  -d '{"email":"victim@example.com","password":"wrong"}'

# IP 2
curl --interface 192.168.1.101 -X POST http://localhost:3001/api/auth/login \
  -d '{"email":"victim@example.com","password":"wrong"}'

# IP 3
curl --interface 192.168.1.102 -X POST http://localhost:3001/api/auth/login \
  -d '{"email":"victim@example.com","password":"wrong"}'

# Check audit logs
psql -c "SELECT * FROM audit_logs WHERE action = 'DISTRIBUTED_ATTACK' ORDER BY created_at DESC LIMIT 1;"
```

### Integration Tests

**Test Checklist:**
- [ ] 5 failed login attempts allowed
- [ ] 6th attempt blocked with 429
- [ ] Retry-After header present
- [ ] Progressive delays increase exponentially
- [ ] Successful login resets counters
- [ ] Email-based tracking works
- [ ] Distributed attack detection works
- [ ] Account lockout after 10 attempts
- [ ] Rate limits reset after 15 minutes
- [ ] Whitelisted IPs bypass limits
- [ ] Audit logs record violations

---

## Troubleshooting

### Issue: Rate Limit Not Working

**Symptoms:**
- More than 5 failed attempts allowed
- No 429 errors returned

**Solutions:**
1. Check Redis connection: `redis-cli PING`
2. Verify rate limiter middleware applied to route
3. Check Redis keys exist: `KEYS ratelimit:*`
4. Verify IP extraction: Check logs for correct IP address
5. Check whitelist: IP might be whitelisted

---

### Issue: Rate Limit Too Strict

**Symptoms:**
- Legitimate users blocked
- False positives

**Solutions:**
1. Check if IP is shared (NAT, proxy, VPN)
2. Increase limits in configuration (not recommended)
3. Add trusted IPs to whitelist
4. Implement user-specific tracking (not just IP)

---

### Issue: Progressive Delays Not Applied

**Symptoms:**
- All attempts respond instantly
- No delays observed

**Solutions:**
1. Check middleware order: `applyProgressiveDelay` before `authController.login`
2. Verify Redis keys: `GET failed_attempts:{ip}`
3. Check logs for delay application
4. Ensure failed attempts increment

---

### Issue: Account Stuck Locked

**Symptoms:**
- Account still locked after 1 hour
- User cannot login

**Solutions:**
1. Check Redis TTL: `TTL failed_login:email:{email}`
2. Manual unlock: `DEL failed_login:email:{email}`
3. Check server time synchronization
4. Verify TTL configuration (3600 seconds)

---

### Issue: Distributed Attacks Not Detected

**Symptoms:**
- No DISTRIBUTED_ATTACK logs
- Attacks bypass detection

**Solutions:**
1. Verify email-based tracking: `GET failed_login:ips:{email}`
2. Check threshold (default: 3 IPs)
3. Ensure IPs are unique (check for IP collisions)
4. Review audit logs for DISTRIBUTED_ATTACK action

---

## Best Practices

1. **Monitor Regularly:** Check audit logs daily for unusual patterns
2. **Adjust Thresholds:** Balance security and usability based on metrics
3. **Whitelist Carefully:** Only trusted IPs, review periodically
4. **Test Thoroughly:** Validate rate limiting before production
5. **Document Incidents:** Record attack patterns for future reference
6. **Update Dependencies:** Keep express-rate-limit and Redis updated
7. **Backup Configuration:** Version control for rate limit settings
8. **User Communication:** Clear error messages with retry guidance

---

## References

- [OWASP Brute Force Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#protect-against-automated-attacks)
- [express-rate-limit Documentation](https://www.npmjs.com/package/express-rate-limit)
- [rate-limit-redis Documentation](https://www.npmjs.com/package/rate-limit-redis)
- [Redis TTL Documentation](https://redis.io/commands/ttl/)
- [Exponential Backoff](https://en.wikipedia.org/wiki/Exponential_backoff)

---

**Document Status:** Complete  
**Last Updated:** March 18, 2026  
**Review Date:** June 18, 2026
