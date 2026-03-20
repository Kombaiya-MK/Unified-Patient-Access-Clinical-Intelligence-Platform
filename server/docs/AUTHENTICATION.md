# Authentication & Authorization System

**Version:** 1.0.0  
**Date:** March 18, 2026  
**User Story:** US_009  
**Task:** TASK_001_BE_JWT_AUTHENTICATION_RBAC

## Table of Contents

- [Overview](#overview)
- [Authentication Flow](#authentication-flow)
- [JWT Token Structure](#jwt-token-structure)
- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Session Management](#session-management)
- [Security Features](#security-features)
- [API Endpoints](#api-endpoints)
- [Error Handling](#error-handling)
- [Audit Logging](#audit-logging)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Clinical Appointment Platform uses JWT-based authentication with role-based access control (RBAC) for secure user access.

**Key Features:**
- JWT tokens with 15-minute expiry (AC1, AC3)
- Role-based authorization (Patient, Staff, Admin) (AC2)
- Session management with Redis
- Token blacklisting for logout (AC4)
- HIPAA-compliant audit logging (NFR-003)
- Graceful Redis failover

**Technology Stack:**
- jsonwebtoken 9.x - JWT generation and verification
- bcrypt 5.x - Password hashing (10 salt rounds)
- Redis (Upstash) - Session storage and token blacklist
- PostgreSQL 15+ - User data and audit logs

---

## Authentication Flow

### Login Flow (AC1)

```
┌──────────┐                ┌──────────┐                ┌──────────┐                ┌──────────┐
│  Client  │                │  Server  │                │  Redis   │                │PostgreSQL│
└─────┬────┘                └─────┬────┘                └─────┬────┘                └─────┬────┘
      │                           │                           │                           │
      │ 1. POST /api/auth/login   │                           │                           │
      │ { email, password }       │                           │                           │
      ├──────────────────────────>│                           │                           │
      │                           │                           │                           │
      │                           │ 2. Query user by email    │                           │
      │                           ├──────────────────────────────────────────────────────>│
      │                           │                           │                           │
      │                           │ 3. User record with       │                           │
      │                           │    password_hash          │                           │
      │                           │<──────────────────────────────────────────────────────┤
      │                           │                           │                           │
      │                           │ 4. Validate password      │                           │
      │                           │    with bcrypt.compare()  │                           │
      │                           │                           │                           │
      │                           │ 5. Generate JWT token     │                           │
      │                           │    (userId, email, role,  │                           │
      │                           │     exp: now + 900s)      │                           │
      │                           │                           │                           │
      │                           │ 6. Store session in Redis │                           │
      │                           │    session:{userId}       │                           │
      │                           ├──────────────────────────>│                           │
      │                           │                           │                           │
      │                           │ 7. SET session:1          │                           │
      │                           │    TTL 900 seconds        │                           │
      │                           │<──────────────────────────┤                           │
      │                           │                           │                           │
      │                           │ 8. Log to audit_logs      │                           │
      │                           │    (LOGIN, success)       │                           │
      │                           ├──────────────────────────────────────────────────────>│
      │                           │                           │                           │
      │ 9. Response with token    │                           │                           │
      │    { success, token,      │                           │                           │
      │      expiresIn: 900,      │                           │                           │
      │      user: {...} }        │                           │                           │
      │<──────────────────────────┤                           │                           │
      │                           │                           │                           │
      │ 10. Store token           │                           │                           │
      │     (localStorage or      │                           │                           │
      │      httpOnly cookie)     │                           │                           │
      │                           │                           │                           │
```

### Protected Route Access (AC2)

```
┌──────────┐                ┌──────────┐                ┌──────────┐
│  Client  │                │  Server  │                │  Redis   │
└─────┬────┘                └─────┬────┘                └─────┬────┘
      │                           │                           │
      │ 1. GET /api/patients/123  │                           │
      │ Authorization: Bearer JWT │                           │
      ├──────────────────────────>│                           │
      │                           │                           │
      │                           │ 2. Extract token from     │
      │                           │    Authorization header   │
      │                           │                           │
      │                           │ 3. Check blacklist        │
      │                           │    blacklist:{hash}       │
      │                           ├──────────────────────────>│
      │                           │<──────────────────────────┤
      │                           │                           │
      │                           │ 4. Verify JWT signature   │
      │                           │    and expiry             │
      │                           │                           │
      │                           │ 5. Check session exists   │
      │                           │    session:{userId}       │
      │                           ├──────────────────────────>│
      │                           │<──────────────────────────┤
      │                           │                           │
      │                           │ 6. Attach user to req     │
      │                           │    req.user = payload     │
      │                           │                           │
      │                           │ 7. Refresh session TTL    │
      │                           ├──────────────────────────>│
      │                           │<──────────────────────────┤
      │                           │                           │
      │                           │ 8. Execute route handler  │
      │                           │                           │
      │ 9. Response with data     │                           │
      │<──────────────────────────┤                           │
      │                           │                           │
```

### Logout Flow (AC4)

```
┌──────────┐                ┌──────────┐                ┌──────────┐                ┌──────────┐
│  Client  │                │  Server  │                │  Redis   │                │PostgreSQL│
└─────┬────┘                └─────┬────┘                └─────┬────┘                └─────┬────┘
      │                           │                           │                           │
      │ 1. POST /api/auth/logout  │                           │                           │
      │ Authorization: Bearer JWT │                           │                           │
      ├──────────────────────────>│                           │                           │
      │                           │                           │                           │
      │                           │ 2. Authenticate token     │                           │
      │                           │    (middleware)           │                           │
      │                           │                           │                           │
      │                           │ 3. Delete session         │                           │
      │                           │    DEL session:{userId}   │                           │
      │                           ├──────────────────────────>│                           │
      │                           │<──────────────────────────┤                           │
      │                           │                           │                           │
      │                           │ 4. Blacklist token        │                           │
      │                           │    Hash token (SHA-256)   │                           │
      │                           │    SET blacklist:{hash}   │                           │
      │                           │    TTL = remaining expiry │                           │
      │                           ├──────────────────────────>│                           │
      │                           │<──────────────────────────┤                           │
      │                           │                           │                           │
      │                           │ 5. Log to audit_logs      │                           │
      │                           │    (LOGOUT, success)      │                           │
      │                           ├──────────────────────────────────────────────────────>│
      │                           │                           │                           │
      │ 6. Response               │                           │                           │
      │    { success: true,       │                           │                           │
      │      message: "Logged     │                           │                           │
      │      out successfully" }  │                           │                           │
      │<──────────────────────────┤                           │                           │
      │                           │                           │                           │
      │ 7. Clear token from       │                           │                           │
      │    client storage         │                           │                           │
      │                           │                           │                           │
```

---

## JWT Token Structure

### Token Format

JWT tokens consist of three Base64URL-encoded parts separated by dots:

```
Header.Payload.Signature
```

### Example Token

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoicGF0aWVudEBleGFtcGxlLmNvbSIsInJvbGUiOiJwYXRpZW50IiwiaWF0IjoxNzEwNzc3NjAwLCJleHAiOjE3MTA3Nzg1MDB9.1234567890abcdefghijklmnopqrstuvwxyz
```

### Header

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Fields:**
- `alg` - Algorithm (HS256 = HMAC with SHA-256)
- `typ` - Token type (JWT)

### Payload

```json
{
  "userId": 1,
  "email": "patient@example.com",
  "role": "patient",
  "iat": 1710777600,
  "exp": 1710778500
}
```

**Fields:**
- `userId` (number) - User ID from database
- `email` (string) - User email address
- `role` (string) - User role: "patient" | "staff" | "admin"
- `iat` (number) - Issued At timestamp (Unix epoch)
- `exp` (number) - Expiry timestamp (iat + 900 seconds)

### Signature

```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  JWT_SECRET
)
```

**Purpose:**
- Verifies token integrity
- Prevents token tampering
- Authenticated with JWT_SECRET from environment

---

## Role-Based Access Control (RBAC)

### User Roles

| Role    | Description                          | Permissions                          |
|---------|--------------------------------------|--------------------------------------|
| patient | Patients booking appointments        | View/manage own appointments         |
| staff   | Front desk and call center staff     | Manage all appointments, patient data|
| admin   | System administrators                | Full access, user management         |

### Authorization Middleware

```typescript
// Single role
router.get('/admin/users', authenticate, authorize('admin'), userController.list);

// Multiple roles (OR logic)
router.get('/appointments', authenticate, authorize('staff', 'admin'), appointmentController.list);
```

### Access Control Matrix

| Endpoint                        | Patient | Staff | Admin |
|---------------------------------|---------|-------|-------|
| POST /api/auth/login            | ✓       | ✓     | ✓     |
| POST /api/auth/logout           | ✓       | ✓     | ✓     |
| GET /api/patients/me            | ✓       | -     | -     |
| GET /api/patients/:id           | -       | ✓     | ✓     |
| POST /api/appointments          | ✓       | ✓     | ✓     |
| PUT /api/appointments/:id/status| -       | ✓     | ✓     |
| GET /api/admin/users            | -       | -     | ✓     |
| POST /api/admin/users           | -       | -     | ✓     |

---

## Session Management

### Redis Session Storage

**Key Pattern:** `session:{userId}`

**Data Structure:**
```json
{
  "userId": 1,
  "email": "patient@example.com",
  "role": "patient",
  "createdAt": 1710777600000,
  "lastActivity": 1710777600000,
  "deviceInfo": "Mozilla/5.0 ...",
  "ipAddress": "192.168.1.100"
}
```

**TTL:** 900 seconds (15 minutes)

**Operations:**
- **Create:** On successful login
- **Read:** On each authenticated request
- **Update:** Refresh TTL on activity
- **Delete:** On logout or expiry

### Token Blacklist

**Key Pattern:** `blacklist:{tokenHash}`

**Value:** `"1"` (simple flag)

**TTL:** Remaining token expiry time

**Purpose:**
- Prevent reuse of logged-out tokens
- Token revocation before natural expiry
- Security for compromised tokens

**Hash Function:** SHA-256
```typescript
const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
```

### Concurrent Sessions

**Behavior:** Multiple active sessions allowed per user

**Rationale:**
- Users can login from multiple devices
- Each session has independent JWT token
- Each logout only invalidates one token

**Monitoring:**
- Last login timestamp tracked
- Device info logged for security
- Suspicious activity detection

---

## Security Features

### Password Security

**Hashing:**
- Algorithm: bcrypt
- Salt rounds: 10 (2^10 = 1024 iterations)
- Automatic salt generation
- Timing-attack resistant comparison

**Validation:**
- Minimum 8 characters
- Maximum 72 characters (bcrypt limit)
- Must contain: lowercase, uppercase, number, special character
- Common password check

### Token Security

**JWT Secret:**
- Minimum 64 characters
- Randomly generated hex string
- Stored in .env file
- Never committed to version control

**Token Expiry:**
- 15 minutes (900 seconds) per AC3
- Short lifetime reduces attack window
- Automatic expiry verification
- Manual revocation via blacklist

### Audit Logging

**Logged Events:**
- LOGIN - Successful authentication
- LOGIN_FAILED - Failed login attempt
- LOGOUT - User logout
- TOKEN_EXPIRED - Expired token usage
- TOKEN_INVALID - Invalid token usage

**Audit Log Fields:**
- user_id (nullable for failed attempts)
- action (LOGIN | LOGOUT | LOGIN_FAILED | TOKEN_EXPIRED | TOKEN_INVALID)
- ip_address
- user_agent
- timestamp
- success (boolean)
- error_message (for failures)

**HIPAA Compliance:**
- Immutable logs (INSERT only, no UPDATE/DELETE)
- Persistent storage in PostgreSQL
- Tamper-proof audit trail
- Failed attempt tracking for brute-force detection

### Redis Failover

**Behavior:**
- If Redis unavailable: Graceful degradation to JWT-only authentication
- Session validation skipped
- Blacklist check skipped
- Login returns 503 Service Unavailable if Redis down during login
- Protected routes return 503 if critical Redis operations fail

**Rationale:**
- High availability over perfect security
- JWT expiry still enforced (15 minutes)
- Audit logging continues (PostgreSQL)
- Clear error messages for debugging

---

## API Endpoints

### POST /api/auth/login

**Description:** Authenticate user and generate JWT token

**Access:** Public

**Request:**
```json
{
  "email": "patient@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": 1,
    "email": "patient@example.com",
    "role": "patient",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Errors:**
- 400 - Email and password required
- 401 - Invalid email or password
- 401 - Account is inactive
- 503 - Authentication service unavailable

---

### POST /api/auth/logout

**Description:** Logout user and invalidate token

**Access:** Private (requires authentication)

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "timestamp": "2026-03-18T10:30:00.000Z"
}
```

**Errors:**
- 401 - Authentication required
- 401 - Token required for logout
- 503 - Logout service unavailable

---

### GET /api/auth/me

**Description:** Get current authenticated user info

**Access:** Private (requires authentication)

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "email": "patient@example.com",
    "role": "patient",
    "iat": 1710777600,
    "exp": 1710778500
  },
  "timestamp": "2026-03-18T10:30:00.000Z"
}
```

**Errors:**
- 401 - Authentication required

---

### POST /api/auth/verify

**Description:** Verify if current token is valid

**Access:** Private (requires authentication)

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "expiresAt": "2026-03-18T10:45:00.000Z",
    "remainingSeconds": 600,
    "userId": 1,
    "role": "patient"
  },
  "timestamp": "2026-03-18T10:30:00.000Z"
}
```

**Errors:**
- 401 - Invalid or expired token

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 401,
  "timestamp": "2026-03-18T10:30:00.000Z"
}
```

### Common Errors

| Status | Error Message                     | Cause                                |
|--------|-----------------------------------|--------------------------------------|
| 400    | Email and password are required   | Missing credentials                  |
| 400    | Invalid email format              | Malformed email                      |
| 401    | Invalid email or password         | Incorrect credentials                |
| 401    | Account is inactive               | User account disabled                |
| 401    | Authentication required           | Missing or invalid token             |
| 401    | Token has expired                 | Token older than 15 minutes          |
| 401    | Token has been revoked            | Token blacklisted after logout       |
| 401    | Session has expired               | Redis session not found              |
| 403    | Insufficient permissions          | User role not authorized             |
| 503    | Authentication service unavailable| Redis down or database error         |

---

## Audit Logging

### Audit Log Schema

```sql
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  table_name VARCHAR(100),
  record_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Query Examples

**Recent authentication events for a user:**
```sql
SELECT 
  action,
  ip_address,
  new_values->>'success' as success,
  created_at
FROM audit_logs
WHERE user_id = 1
  AND action IN ('LOGIN', 'LOGIN_FAILED', 'LOGOUT')
ORDER BY created_at DESC
LIMIT 10;
```

**Detect brute-force attacks (5+ failed attempts in 1 hour):**
```sql
SELECT 
  ip_address,
  new_values->>'metadata' as attempted_email,
  COUNT(*) as attempt_count,
  MAX(created_at) as last_attempt
FROM audit_logs
WHERE action = 'LOGIN_FAILED'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address, new_values->>'metadata'
HAVING COUNT(*) > 5
ORDER BY attempt_count DESC;
```

---

## Testing

### Manual Testing with cURL

**1. Login:**
```bash
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@example.com","password":"password123"}' \
  -s | jq -r '.token')

echo "Token: $TOKEN"
```

**2. Access protected route:**
```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq
```

**3. Test RBAC (patient accessing admin route):**
```bash
curl http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq
# Expected: 403 Forbidden
```

**4. Logout:**
```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq
```

**5. Use token after logout:**
```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq
# Expected: 401 Unauthorized (token revoked)
```

### Integration Test Checklist

- [ ] Login with valid credentials → 200 with token
- [ ] Login with invalid email → 401 Unauthorized
- [ ] Login with invalid password → 401 Unauthorized
- [ ] Login with inactive account → 401 Unauthorized
- [ ] Token includes userId, email, role, iat, exp
- [ ] Token expiry is 15 minutes from iat
- [ ] Session created in Redis with 900s TTL
- [ ] Protected route with valid token → 200
- [ ] Protected route with expired token → 401
- [ ] Protected route with blacklisted token → 401
- [ ] Protected route without token → 401
- [ ] RBAC: patient accessing admin route → 403
- [ ] RBAC: admin accessing admin route → 200
- [ ] Logout deletes session from Redis
- [ ] Logout adds token to blacklist
- [ ] Audit log contains LOGIN event
- [ ] Audit log contains LOGOUT event
- [ ] Audit log contains LOGIN_FAILED event
- [ ] Redis down: login returns 503
- [ ] Redis down: protected routes work with JWT only

---

## Troubleshooting

### Token Issues

**Problem:** "Invalid or expired token"

**Solutions:**
1. Check token expiry: `jwt.decode(token).exp` < current timestamp
2. Verify JWT_SECRET matches between token generation and verification
3. Ensure Authorization header format: `Bearer <token>`
4. Check if token is blacklisted in Redis: `GET blacklist:{hash}`

---

**Problem:** "Token has been revoked"

**Solutions:**
1. Token was logged out - user must login again
2. Clear blacklist in Redis: `DEL blacklist:{hash}` (dev only)

---

### Session Issues

**Problem:** "Session has expired"

**Solutions:**
1. Check Redis connection: `redis-cli PING`
2. Verify session exists: `GET session:{userId}`
3. Check session TTL: `TTL session:{userId}` (should be ~900)
4. User must login again if TTL expired

---

### Authentication Issues

**Problem:** "Authentication service unavailable"

**Solutions:**
1. Check Redis status: `redis-cli PING`
2. Check PostgreSQL connection: `psql -U user -d database`
3. Review server logs for connection errors
4. Verify .env configuration (REDIS_URL, DB_URL)

---

### Authorization Issues

**Problem:** "Insufficient permissions"

**Solutions:**
1. Verify user role in database: `SELECT role FROM users WHERE id = ?`
2. Check route authorization: `authorize('admin')` matches user role
3. Ensure authenticate middleware runs before authorize

---

### Development Tips

**Generate JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Decode JWT token (without verification):**
```bash
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." | \
  cut -d. -f2 | \
  base64 -d 2>/dev/null | jq
```

**Monitor Redis keys:**
```bash
redis-cli --scan --pattern "session:*"
redis-cli --scan --pattern "blacklist:*"
```

**Test token expiry:**
```typescript
// Manually create expired token for testing
const payload = {
  userId: 1,
  email: "test@example.com",
  role: "patient",
  iat: Math.floor(Date.now() / 1000) - 1000, // 1000 seconds ago
  exp: Math.floor(Date.now() / 1000) - 100,  // 100 seconds ago (expired)
};
const expiredToken = jwt.sign(payload, process.env.JWT_SECRET);
```

---

## References

- [RFC 7519 - JSON Web Token (JWT)](https://tools.ietf.org/html/rfc7519)
- [RFC 8725 - JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [bcrypt npm package](https://www.npmjs.com/package/bcrypt)
- [jsonwebtoken npm package](https://www.npmjs.com/package/jsonwebtoken)

---

**Document Status:** Complete  
**Last Updated:** March 18, 2026  
**Review Date:** June 18, 2026
