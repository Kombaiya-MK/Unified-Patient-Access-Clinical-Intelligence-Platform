# Role-Based Access Control (RBAC) Guide

**Task**: US_010 TASK_001 - RBAC Middleware Enhancement  
**Version**: 1.0.0  
**Last Updated**: 2025-01-01  
**Status**: ✅ Complete

---

## Table of Contents

1. [Overview](#overview)
2. [Role Definitions](#role-definitions)
3. [Role Hierarchy](#role-hierarchy)
4. [Permission Model](#permission-model)
5. [Implementation](#implementation)
6. [Usage Examples](#usage-examples)
7. [Resource-Based Permissions](#resource-based-permissions)
8. [Special Access Patterns](#special-access-patterns)
9. [Error Handling](#error-handling)
10. [Security Best Practices](#security-best-practices)
11. [Testing](#testing)
12. [Troubleshooting](#troubleshooting)

---

## Overview

### What is RBAC?

Role-Based Access Control (RBAC) is a security model that restricts system access based on user roles. Instead of assigning permissions to individual users, permissions are assigned to roles, and users are assigned to roles.

### Why RBAC?

- **Security**: Principle of least privilege - users only get access they need
- **Compliance**: HIPAA requires strict access controls for patient data
- **Maintainability**: Easier to manage permissions at role level vs. individual users
- **Audit Trail**: Clear record of who accessed what resources

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      API Request                             │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│              authenticate() Middleware                       │
│  • Verify JWT signature                                     │
│  • Check token blacklist                                    │
│  • Validate session                                         │
│  • Attach req.user                                          │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│              authorize(...roles) Middleware                  │
│  • Validate role claim                                      │
│  • Check role hierarchy                                     │
│  • Verify permissions                                       │
│  • Log authorization failures                               │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│              Route Handler                                   │
│  • Business logic                                           │
│  • Database operations                                      │
│  • Response                                                 │
└─────────────────────────────────────────────────────────────┘
```

### Key Features

✅ **Role Hierarchy**: Admin inherits staff and patient permissions  
✅ **Multi-Role Endpoints**: Single endpoint can accept multiple roles  
✅ **Special Roles**: Public (`*`) and any-authenticated (`**`) access  
✅ **Resource Ownership**: Patients can only access their own data  
✅ **Comprehensive Logging**: All authorization failures logged to audit_logs  
✅ **Detailed Errors**: 403 responses include required roles and user's role  
✅ **Type Safety**: TypeScript enums prevent typos and invalid roles

---

## Role Definitions

### UserRole Enum

```typescript
export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  PATIENT = 'patient',
}
```

### Admin Role

**Access Level**: 3 (Highest)

**Capabilities**:
- Full system access
- User management (create, update, delete users)
- System configuration
- View all audit logs
- Access all patient records
- Manage appointments for all patients
- Override staff decisions
- Generate system reports

**Use Cases**:
- Hospital IT administrators
- Compliance officers
- System operators

**Example Users**:
- `admin@hospital.com`
- `sysadmin@hospital.com`

### Staff Role

**Access Level**: 2 (Medium)

**Capabilities**:
- Manage patient appointments
- View and update clinical records
- Access queue management
- View patient profiles
- Add medications and allergies
- Generate clinical insights using AI
- Check drug interactions
- Cannot: Delete users, change system settings, view audit logs

**Use Cases**:
- Nurses
- Physician assistants
- Medical technicians
- Reception staff

**Example Users**:
- `nurse.smith@hospital.com`
- `receptionist@hospital.com`

### Patient Role

**Access Level**: 1 (Lowest)

**Capabilities**:
- View own profile
- Book own appointments
- Cancel own appointments
- View own medical history
- View own prescriptions
- Update own contact information
- View notifications
- Cannot: Access other patients' data, view staff dashboards

**Use Cases**:
- Hospital patients
- Outpatients
- Emergency patients

**Example Users**:
- `john.doe@email.com`
- `jane.smith@email.com`

---

## Role Hierarchy

### Hierarchy Model

```
       ┌─────────────┐
       │   ADMIN     │  Level 3 (Highest)
       │  (admin)    │
       └──────┬──────┘
              │ inherits
       ┌──────▼──────┐
       │   STAFF     │  Level 2
       │  (staff)    │
       └──────┬──────┘
              │ inherits
       ┌──────▼──────┐
       │  PATIENT    │  Level 1 (Lowest)
       │  (patient)  │
       └─────────────┘
```

### Inheritance Rules

1. **Admin** (level 3) can access:
   - All admin endpoints
   - All staff endpoints (inherited)
   - All patient endpoints (inherited)

2. **Staff** (level 2) can access:
   - All staff endpoints
   - All patient endpoints (inherited)
   - Cannot access admin endpoints

3. **Patient** (level 1) can access:
   - Only patient endpoints
   - Cannot access staff or admin endpoints

### Implementation

```typescript
// Role hierarchy mapping
const roleHierarchy = {
  admin: 3,
  staff: 2,
  patient: 1,
};

// Check if userRole can access requiredRole
function hasHigherOrEqualRole(userRole: string, requiredRole: string): boolean {
  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;
  return userLevel >= requiredLevel;
}

// Check if user can access endpoint requiring any of the roles
function canAccessRole(userRole: string, requiredRoles: string[]): boolean {
  // Exact match
  if (requiredRoles.includes(userRole)) return true;
  
  // Hierarchy check
  return requiredRoles.some(role => hasHigherOrEqualRole(userRole, role));
}
```

### Examples

```typescript
// Admin accessing staff endpoint
canAccessRole('admin', ['staff']) // ✅ true (level 3 >= level 2)

// Admin accessing patient endpoint
canAccessRole('admin', ['patient']) // ✅ true (level 3 >= level 1)

// Staff accessing admin endpoint
canAccessRole('staff', ['admin']) // ❌ false (level 2 < level 3)

// Staff accessing patient endpoint
canAccessRole('staff', ['patient']) // ✅ true (level 2 >= level 1)

// Patient accessing staff endpoint
canAccessRole('patient', ['staff']) // ❌ false (level 1 < level 2)

// Admin accessing multi-role endpoint
canAccessRole('admin', ['staff', 'admin']) // ✅ true (exact match)

// Staff accessing multi-role endpoint
canAccessRole('staff', ['staff', 'admin']) // ✅ true (exact match)

// Patient accessing multi-role endpoint
canAccessRole('patient', ['staff', 'admin']) // ❌ false (level 1 < level 2)
```

---

## Permission Model

### Permission Components

1. **Role**: User's assigned role (admin, staff, patient)
2. **Resource**: API endpoint or data entity
3. **Action**: HTTP method (GET, POST, PUT, DELETE)
4. **Ownership**: Resource belongs to user (for resource-based)

### Permission Check Flow

```
┌──────────────────────┐
│  Request Received    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Extract User Role   │
│  from JWT            │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Get Required Roles  │
│  for Endpoint        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐     YES    ┌──────────────────┐
│  Special Role?       │────────────▶│  Grant Access    │
│  (* or **)           │             └──────────────────┘
└──────────┬───────────┘
           │ NO
           ▼
┌──────────────────────┐
│  Validate Role       │
│  Claim Exists        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐     FAIL   ┌──────────────────┐
│  Is Valid Role?      │────────────▶│  403 Invalid     │
│                      │             │  Role            │
└──────────┬───────────┘             └──────────────────┘
           │ PASS
           ▼
┌──────────────────────┐
│  Check Permission    │
│  (Hierarchy)         │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐     NO     ┌──────────────────┐
│  Authorized?         │────────────▶│  403 Insufficient│
│                      │             │  Permissions     │
└──────────┬───────────┘             │  + Log Failure   │
           │ YES                     └──────────────────┘
           ▼
┌──────────────────────┐
│  Resource-Based?     │
│  Check Ownership     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Grant Access        │
└──────────────────────┘
```

### Permission Matrix

Centralized configuration in `src/config/permissions.ts`:

```typescript
export const permissionMatrix: PermissionMatrix = {
  '/api/admin/*': [
    { method: 'GET', roles: [UserRole.ADMIN] },
    { method: 'POST', roles: [UserRole.ADMIN] },
  ],
  '/api/appointments': [
    { method: 'GET', roles: [UserRole.STAFF, UserRole.ADMIN, UserRole.PATIENT] },
    { method: 'POST', roles: [UserRole.STAFF, UserRole.ADMIN, UserRole.PATIENT] },
  ],
  '/api/patient/dashboard': [
    { method: 'GET', roles: [UserRole.PATIENT] },
  ],
};
```

---

## Implementation

### Type Definitions

**File**: `src/types/rbac.types.ts`

```typescript
/**
 * User Role Enum
 */
export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  PATIENT = 'patient',
}

/**
 * Special Roles
 */
export const SpecialRoles = {
  PUBLIC: '*',              // No authentication required
  ANY_AUTHENTICATED: '**',  // Any logged-in user
} as const;

/**
 * Role Configuration
 */
export interface RoleConfig {
  allowedRoles: UserRole[];
  requireAll?: boolean;    // Require all roles (AND) vs. any role (OR)
  resourceBased?: boolean; // Check resource ownership
}

/**
 * Authorization Result
 */
export interface AuthorizationResult {
  authorized: boolean;
  reason?: string;
}

/**
 * Resource Permission
 */
export interface ResourcePermission {
  resourceType: string;
  resourceId: string;
  ownerId: number;
}

/**
 * Permission Matrix
 */
export interface PermissionMatrix {
  [endpoint: string]: Array<{
    method: string;
    roles: string[];
  }>;
}
```

### Role Hierarchy Utilities

**File**: `src/utils/roleHierarchy.ts`

```typescript
import { UserRole } from '../types/rbac.types';

/**
 * Role Hierarchy Mapping
 * Higher number = more privileges
 */
export const roleHierarchy: Record<string, number> = {
  [UserRole.ADMIN]: 3,
  [UserRole.STAFF]: 2,
  [UserRole.PATIENT]: 1,
};

/**
 * Get Role Level
 */
export function getRoleLevel(role: string): number {
  return roleHierarchy[role] || 0;
}

/**
 * Check Role Hierarchy
 */
export function hasHigherOrEqualRole(
  userRole: string,
  requiredRole: string,
): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
}

/**
 * Check Access Permission
 */
export function canAccessRole(
  userRole: string,
  requiredRoles: string[],
): boolean {
  // Empty array = allow all authenticated users
  if (requiredRoles.length === 0) return true;
  
  // Exact match
  if (requiredRoles.includes(userRole)) return true;
  
  // Hierarchy check
  return requiredRoles.some(role => hasHigherOrEqualRole(userRole, role));
}

/**
 * Validate Role
 */
export function isValidRole(role: string): boolean {
  return Object.values(UserRole).includes(role as UserRole);
}
```

### Permission Checker

**File**: `src/utils/permissionChecker.ts`

```typescript
import { UserRole, SpecialRoles, AuthorizationResult } from '../types/rbac.types';
import { canAccessRole, isValidRole } from './roleHierarchy';

/**
 * Check Permission
 */
export function checkPermission(
  userRole: string,
  requiredRoles: string[],
): AuthorizationResult {
  // Handle special roles
  if (requiredRoles.includes(SpecialRoles.PUBLIC)) {
    return { authorized: true };
  }
  
  if (requiredRoles.includes(SpecialRoles.ANY_AUTHENTICATED)) {
    return { authorized: true };
  }
  
  // Validate user role
  if (!isValidRole(userRole)) {
    return {
      authorized: false,
      reason: `Invalid role: ${userRole}`,
    };
  }
  
  // Check access
  if (canAccessRole(userRole, requiredRoles)) {
    return { authorized: true };
  }
  
  return {
    authorized: false,
    reason: `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`,
  };
}

/**
 * Check Resource Ownership
 */
export function checkResourceOwnership(
  userId: number,
  resource: { ownerId: number },
): boolean {
  return userId === resource.ownerId;
}

/**
 * Combined Authorization Check
 */
export function isAuthorized(
  user: { userId: number; role: string },
  config: RoleConfig,
  resource?: { ownerId: number },
): AuthorizationResult {
  // Role-based check
  const roleCheck = checkPermission(user.role, config.allowedRoles);
  if (!roleCheck.authorized) {
    return roleCheck;
  }
  
  // Resource-based check (if enabled)
  if (config.resourceBased && resource) {
    // Patients must own the resource
    if (user.role === UserRole.PATIENT) {
      if (!checkResourceOwnership(user.userId, resource)) {
        return {
          authorized: false,
          reason: 'Access denied: resource belongs to another user',
        };
      }
    }
    // Staff and admin can access any resource (clinical context)
  }
  
  return { authorized: true };
}
```

### Authorization Middleware

**File**: `src/middleware/auth.ts`

```typescript
import { UserRole, SpecialRoles } from '../types/rbac.types';
import { checkPermission } from '../utils/permissionChecker';
import { isValidRole } from '../utils/roleHierarchy';
import { logAuthorizationFailure } from '../middleware/roleValidator';

/**
 * Authorization Middleware Factory
 */
export const authorize = (...allowedRoles: Array<string>) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Handle public access
      if (allowedRoles.includes(SpecialRoles.PUBLIC)) {
        return next();
      }

      // Check authentication
      if (!req.user) {
        return next(new ApiError(401, 'Authentication required'));
      }

      // Get client info
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip;
      const userAgent = req.headers['user-agent'] || 'unknown';

      // Validate role claim
      if (!req.user.role) {
        return next(new ApiError(403, 'Invalid token: missing role claim'));
      }

      if (!isValidRole(req.user.role)) {
        return next(new ApiError(403, `Invalid role: ${req.user.role}`));
      }

      // Check permission
      const { authorized, reason } = checkPermission(req.user.role, allowedRoles);

      if (authorized) {
        return next();
      }

      // Log failure
      await logAuthorizationFailure(
        req.user.userId,
        req.path,
        req.user.role,
        allowedRoles,
        ipAddress,
        userAgent,
      );

      // Return detailed error
      return res.status(403).json({
        success: false,
        error: reason || 'Insufficient permissions',
        requiredRoles: allowedRoles,
        userRole: req.user.role,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return next(new ApiError(500, 'Authorization check failed'));
    }
  };
};
```

---

## Usage Examples

### Single Role Authorization

```typescript
import { authorize } from '../middleware/auth';
import { UserRole } from '../types/rbac.types';

// Admin-only endpoint
router.get(
  '/admin/users',
  authenticate,
  authorize(UserRole.ADMIN),
  adminController.getUsers,
);

// Staff-only endpoint
router.get(
  '/staff/dashboard',
  authenticate,
  authorize(UserRole.STAFF),
  staffController.getDashboard,
);

// Patient-only endpoint
router.get(
  '/patient/profile',
  authenticate,
  authorize(UserRole.PATIENT),
  patientController.getProfile,
);
```

### Multi-Role Authorization

```typescript
// Staff and admin can access
router.get(
  '/appointments',
  authenticate,
  authorize(UserRole.STAFF, UserRole.ADMIN),
  appointmentController.getAppointments,
);

// All roles can access (with hierarchy)
router.get(
  '/notifications',
  authenticate,
  authorize(UserRole.PATIENT, UserRole.STAFF, UserRole.ADMIN),
  notificationController.getNotifications,
);
```

### Public Endpoints

```typescript
import { SpecialRoles } from '../types/rbac.types';

// No authentication required
router.post(
  '/auth/login',
  authorize(SpecialRoles.PUBLIC),
  authController.login,
);

router.post(
  '/auth/register',
  authorize(SpecialRoles.PUBLIC),
  authController.register,
);

router.get(
  '/health',
  authorize(SpecialRoles.PUBLIC),
  healthController.check,
);
```

### Any Authenticated User

```typescript
// Any logged-in user can access
router.get(
  '/auth/me',
  authenticate,
  authorize(SpecialRoles.ANY_AUTHENTICATED),
  authController.getCurrentUser,
);

router.post(
  '/auth/logout',
  authenticate,
  authorize(SpecialRoles.ANY_AUTHENTICATED),
  authController.logout,
);
```

### Resource-Based Authorization

```typescript
// Custom middleware for resource ownership
export const authorizeResource = (resourceType: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Admin and staff can access any resource
      if (req.user.role === UserRole.ADMIN || req.user.role === UserRole.STAFF) {
        return next();
      }

      // Patient must own the resource
      if (req.user.role === UserRole.PATIENT) {
        const resourceId = req.params.id;
        const resource = await getResource(resourceType, resourceId);
        
        if (!resource) {
          return next(new ApiError(404, 'Resource not found'));
        }
        
        if (resource.userId !== req.user.userId) {
          return next(new ApiError(403, 'Access denied: resource belongs to another user'));
        }
        
        return next();
      }

      return next(new ApiError(403, 'Insufficient permissions'));
    } catch (error) {
      return next(new ApiError(500, 'Authorization check failed'));
    }
  };
};

// Usage
router.get(
  '/patients/:id/records',
  authenticate,
  authorize(UserRole.PATIENT, UserRole.STAFF, UserRole.ADMIN),
  authorizeResource('patient_record'),
  recordController.getRecords,
);
```

### Dynamic Authorization

```typescript
import { applyDynamicAuthorization } from '../config/permissions';

// Apply to all routes
app.use(applyDynamicAuthorization);

// Routes are automatically protected based on permission matrix
// No need to manually add authorize() to each route
```

---

## Resource-Based Permissions

### Concept

Resource-based permissions ensure users can only access resources they own or have explicit access to. This is critical for patient data in healthcare systems (HIPAA compliance).

### Implementation Pattern

```typescript
/**
 * Check if user owns resource
 */
async function checkOwnership(
  userId: number,
  resourceId: string,
  resourceType: string,
): Promise<boolean> {
  const resource = await db.query(
    `SELECT user_id FROM ${resourceType} WHERE id = $1`,
    [resourceId],
  );
  
  return resource.rows[0]?.user_id === userId;
}

/**
 * Authorize resource access
 */
export const authorizeResourceAccess = (resourceType: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { role, userId } = req.user;
      const resourceId = req.params.id;

      // Admin has full access
      if (role === UserRole.ADMIN) {
        return next();
      }

      // Staff can access for clinical context
      if (role === UserRole.STAFF) {
        // Optional: Log staff access for auditing
        await logResourceAccess(userId, resourceType, resourceId, 'STAFF_ACCESS');
        return next();
      }

      // Patient must own resource
      if (role === UserRole.PATIENT) {
        const owns = await checkOwnership(userId, resourceId, resourceType);
        if (!owns) {
          await logResourceAccess(userId, resourceType, resourceId, 'ACCESS_DENIED');
          return next(new ApiError(403, 'Access denied: resource belongs to another user'));
        }
        return next();
      }

      return next(new ApiError(403, 'Insufficient permissions'));
    } catch (error) {
      return next(new ApiError(500, 'Authorization check failed'));
    }
  };
};
```

### Usage Examples

```typescript
// Patient records - resource-based
router.get(
  '/patients/:id/records',
  authenticate,
  authorize(UserRole.PATIENT, UserRole.STAFF, UserRole.ADMIN),
  authorizeResourceAccess('medical_records'),
  recordController.getRecords,
);

// Appointments - resource-based
router.get(
  '/appointments/:id',
  authenticate,
  authorize(UserRole.PATIENT, UserRole.STAFF, UserRole.ADMIN),
  authorizeResourceAccess('appointments'),
  appointmentController.getAppointment,
);

// Patient profile - resource-based
router.put(
  '/patients/:id',
  authenticate,
  authorize(UserRole.PATIENT, UserRole.STAFF, UserRole.ADMIN),
  authorizeResourceAccess('patients'),
  patientController.updatePatient,
);
```

---

## Special Access Patterns

### Public Access (`*`)

No authentication required. Anyone can access.

```typescript
// Health check endpoint
router.get('/health', authorize('*'), healthController.check);

// Login endpoint
router.post('/auth/login', authorize('*'), authController.login);

// Public documentation
router.get('/api/docs', authorize('*'), docsController.serve);
```

### Any Authenticated (`**`)

Any logged-in user regardless of role.

```typescript
// Current user info
router.get('/auth/me', authenticate, authorize('**'), authController.getCurrentUser);

// Logout
router.post('/auth/logout', authenticate, authorize('**'), authController.logout);

// Change password
router.post('/auth/change-password', authenticate, authorize('**'), authController.changePassword);

// Notifications (all users have notifications)
router.get('/notifications', authenticate, authorize('**'), notificationController.getNotifications);
```

### Conditional Authorization

```typescript
/**
 * Authorize based on request context
 */
export const conditionalAuthorize = (condition: (req: AuthRequest) => boolean) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (condition(req)) {
      return next();
    }
    return next(new ApiError(403, 'Conditional authorization failed'));
  };
};

// Usage: Admin or resource owner
router.put(
  '/users/:id',
  authenticate,
  conditionalAuthorize(req => 
    req.user.role === UserRole.ADMIN || 
    req.user.userId === parseInt(req.params.id)
  ),
  userController.updateUser,
);
```

---

## Error Handling

### Error Response Format

All authorization failures return consistent 403 responses:

```json
{
  "success": false,
  "error": "Insufficient permissions. Required roles: staff, admin",
  "requiredRoles": ["staff", "admin"],
  "userRole": "patient",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

### Error Types

#### 401 Unauthorized

User is not authenticated.

```json
{
  "success": false,
  "error": "Authentication required",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

**Causes**:
- No JWT token provided
- Invalid JWT signature
- Expired JWT token
- Token in blacklist

**Resolution**: User must log in.

#### 403 Forbidden - Missing Role Claim

JWT is valid but missing role claim.

```json
{
  "success": false,
  "error": "Invalid token: missing role claim",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

**Causes**:
- Malformed JWT (generated without role claim)
- JWT from old system version
- Manual JWT manipulation

**Resolution**: User must log in again to get valid token.

#### 403 Forbidden - Invalid Role

JWT has invalid role value.

```json
{
  "success": false,
  "error": "Invalid role: superuser",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

**Causes**:
- Role value not in UserRole enum
- JWT manipulation attempt
- Database role data corruption

**Resolution**: Contact administrator to fix user role.

#### 403 Forbidden - Insufficient Permissions

User lacks required role.

```json
{
  "success": false,
  "error": "Insufficient permissions. Required roles: admin",
  "requiredRoles": ["admin"],
  "userRole": "staff",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

**Causes**:
- User role not in endpoint's allowed roles
- Role hierarchy check failed

**Resolution**: Request admin to upgrade user role.

#### 403 Forbidden - Resource Ownership

User doesn't own resource.

```json
{
  "success": false,
  "error": "Access denied: resource belongs to another user",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

**Causes**:
- Patient accessing another patient's record
- URL manipulation attempt

**Resolution**: Access only your own resources.

### Audit Logging

All authorization failures are logged to `audit_logs` table:

```sql
INSERT INTO audit_logs (
  user_id,
  action,
  resource_type,
  resource_id,
  details,
  ip_address,
  user_agent,
  created_at
) VALUES (
  123,
  'AUTHORIZATION_FAILED',
  'endpoint',
  '/api/admin/users',
  '{"userRole":"staff","requiredRoles":["admin"],"reason":"Insufficient permissions"}',
  '192.168.1.100',
  'Mozilla/5.0...',
  NOW()
);
```

Query failed authorization attempts:

```sql
-- Recent authorization failures
SELECT 
  user_id,
  resource_id AS endpoint,
  details->>'userRole' AS user_role,
  details->>'requiredRoles' AS required_roles,
  ip_address,
  created_at
FROM audit_logs
WHERE action = 'AUTHORIZATION_FAILED'
ORDER BY created_at DESC
LIMIT 50;

-- Failed attempts by user
SELECT 
  resource_id AS endpoint,
  COUNT(*) AS attempts,
  MAX(created_at) AS last_attempt
FROM audit_logs
WHERE user_id = 123 
  AND action = 'AUTHORIZATION_FAILED'
GROUP BY resource_id
ORDER BY attempts DESC;

-- Potential privilege escalation attempts
SELECT 
  user_id,
  resource_id AS endpoint,
  COUNT(*) AS attempts,
  MAX(created_at) AS last_attempt
FROM audit_logs
WHERE action = 'AUTHORIZATION_FAILED'
  AND details->>'requiredRoles' LIKE '%admin%'
  AND details->>'userRole' != 'admin'
GROUP BY user_id, resource_id
HAVING COUNT(*) > 10
ORDER BY attempts DESC;
```

---

## Security Best Practices

### 1. Always Use `authenticate` Before `authorize`

❌ **Wrong**:
```typescript
router.get('/admin/users', authorize('admin'), handler);
```

✅ **Correct**:
```typescript
router.get('/admin/users', authenticate, authorize('admin'), handler);
```

### 2. Use UserRole Enum, Not Strings

❌ **Wrong**:
```typescript
router.get('/admin/users', authorize('admin'), handler); // Typo risk
```

✅ **Correct**:
```typescript
import { UserRole } from '../types/rbac.types';
router.get('/admin/users', authorize(UserRole.ADMIN), handler);
```

### 3. Resource-Based for User Data

❌ **Wrong**:
```typescript
// Patient can access other patients' data
router.get('/patients/:id', authorize('patient'), handler);
```

✅ **Correct**:
```typescript
router.get('/patients/:id', 
  authenticate,
  authorize('patient', 'staff', 'admin'),
  authorizeResourceAccess('patients'),
  handler
);
```

### 4. Log All Authorization Failures

✅ **Already implemented** in enhanced `authorize` middleware.

### 5. Review Permission Matrix Regularly

```typescript
// Run validation on startup
const errors = validatePermissionMatrix();
if (errors.length > 0) {
  logger.error('Permission matrix validation failed', { errors });
  process.exit(1);
}
```

### 6. Use Least Privilege Principle

- Don't assign admin role unless absolutely necessary
- Use staff role for clinical users
- Use patient role for end users

### 7. Implement Rate Limiting for Privilege Escalation Attempts

See `RATE_LIMITING.md` for details.

### 8. Monitor Audit Logs

```sql
-- Weekly security review query
SELECT 
  user_id,
  COUNT(*) AS failed_attempts,
  ARRAY_AGG(DISTINCT resource_id) AS endpoints,
  MAX(created_at) AS last_attempt
FROM audit_logs
WHERE action = 'AUTHORIZATION_FAILED'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY user_id
HAVING COUNT(*) > 50
ORDER BY failed_attempts DESC;
```

### 9. Rotate Admin Credentials

- Change admin passwords every 90 days
- Use strong passwords (12+ characters, mixed case, numbers, symbols)
- Enable MFA for admin accounts (future enhancement)

### 10. Principle of Defense in Depth

Layer multiple security controls:

```
HTTP Request
    ↓
1. Rate Limiting (IP-based)
    ↓
2. authenticate() (JWT verification)
    ↓
3. authorize() (Role checking)
    ↓
4. authorizeResource() (Ownership checking)
    ↓
5. Input Validation
    ↓
6. Business Logic
    ↓
7. Audit Logging
```

---

## Testing

### Unit Tests

**File**: `tests/unit/rbac.test.ts`

```typescript
import { canAccessRole, hasHigherOrEqualRole } from '../../src/utils/roleHierarchy';
import { checkPermission } from '../../src/utils/permissionChecker';
import { UserRole } from '../../src/types/rbac.types';

describe('Role Hierarchy', () => {
  describe('hasHigherOrEqualRole', () => {
    it('should allow admin to access staff endpoints', () => {
      expect(hasHigherOrEqualRole(UserRole.ADMIN, UserRole.STAFF)).toBe(true);
    });

    it('should allow admin to access patient endpoints', () => {
      expect(hasHigherOrEqualRole(UserRole.ADMIN, UserRole.PATIENT)).toBe(true);
    });

    it('should deny staff to access admin endpoints', () => {
      expect(hasHigherOrEqualRole(UserRole.STAFF, UserRole.ADMIN)).toBe(false);
    });

    it('should allow staff to access patient endpoints', () => {
      expect(hasHigherOrEqualRole(UserRole.STAFF, UserRole.PATIENT)).toBe(true);
    });

    it('should deny patient to access staff endpoints', () => {
      expect(hasHigherOrEqualRole(UserRole.PATIENT, UserRole.STAFF)).toBe(false);
    });
  });

  describe('canAccessRole', () => {
    it('should allow exact role match', () => {
      expect(canAccessRole(UserRole.STAFF, [UserRole.STAFF])).toBe(true);
    });

    it('should allow higher role access', () => {
      expect(canAccessRole(UserRole.ADMIN, [UserRole.STAFF])).toBe(true);
    });

    it('should deny lower role access', () => {
      expect(canAccessRole(UserRole.PATIENT, [UserRole.STAFF])).toBe(false);
    });

    it('should allow multi-role endpoints', () => {
      expect(canAccessRole(UserRole.STAFF, [UserRole.STAFF, UserRole.ADMIN])).toBe(true);
      expect(canAccessRole(UserRole.ADMIN, [UserRole.STAFF, UserRole.ADMIN])).toBe(true);
    });
  });
});

describe('Permission Checker', () => {
  describe('checkPermission', () => {
    it('should authorize valid role', () => {
      const result = checkPermission(UserRole.ADMIN, [UserRole.ADMIN]);
      expect(result.authorized).toBe(true);
    });

    it('should authorize higher role', () => {
      const result = checkPermission(UserRole.ADMIN, [UserRole.STAFF]);
      expect(result.authorized).toBe(true);
    });

    it('should deny lower role', () => {
      const result = checkPermission(UserRole.PATIENT, [UserRole.STAFF]);
      expect(result.authorized).toBe(false);
      expect(result.reason).toContain('Insufficient permissions');
    });

    it('should handle special roles', () => {
      const result = checkPermission(UserRole.PATIENT, ['*']);
      expect(result.authorized).toBe(true);
    });
  });
});
```

### Integration Tests

**File**: `tests/integration/authorization.test.ts`

```typescript
import request from 'supertest';
import app from '../../src/app';

describe('Authorization Integration', () => {
  let adminToken: string;
  let staffToken: string;
  let patientToken: string;

  beforeAll(async () => {
    // Login as admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin123!' });
    adminToken = adminRes.body.token;

    // Login as staff
    const staffRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'staff@test.com', password: 'Staff123!' });
    staffToken = staffRes.body.token;

    // Login as patient
    const patientRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'patient@test.com', password: 'Patient123!' });
    patientToken = patientRes.body.token;
  });

  describe('Admin Endpoints', () => {
    it('should allow admin access', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('should deny staff access', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(403);
      expect(res.body.requiredRoles).toContain('admin');
    });

    it('should deny patient access', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Staff Endpoints', () => {
    it('should allow admin access (hierarchy)', async () => {
      const res = await request(app)
        .get('/api/staff/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('should allow staff access', async () => {
      const res = await request(app)
        .get('/api/staff/dashboard')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(200);
    });

    it('should deny patient access', async () => {
      const res = await request(app)
        .get('/api/staff/dashboard')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Patient Endpoints', () => {
    it('should allow all roles access (hierarchy)', async () => {
      const adminRes = await request(app)
        .get('/api/patient/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);

      const staffRes = await request(app)
        .get('/api/patient/dashboard')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(staffRes.status).toBe(200);

      const patientRes = await request(app)
        .get('/api/patient/dashboard')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(patientRes.status).toBe(200);
    });
  });

  describe('Public Endpoints', () => {
    it('should allow unauthenticated access', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
    });
  });

  describe('Multi-Role Endpoints', () => {
    it('should allow staff and admin', async () => {
      const staffRes = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(staffRes.status).toBe(200);

      const adminRes = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);
    });
  });
});
```

### Manual Testing with cURL

```bash
# Login as admin
ADMIN_TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123!"}' \
  | jq -r '.token')

# Login as staff
STAFF_TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staff@test.com","password":"Staff123!"}' \
  | jq -r '.token')

# Login as patient
PATIENT_TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@test.com","password":"Patient123!"}' \
  | jq -r '.token')

# Test admin endpoint with admin token (should succeed)
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Test admin endpoint with staff token (should fail with 403)
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer $STAFF_TOKEN"

# Test staff endpoint with admin token (should succeed - hierarchy)
curl http://localhost:3000/api/staff/dashboard \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Test staff endpoint with staff token (should succeed)
curl http://localhost:3000/api/staff/dashboard \
  -H "Authorization: Bearer $STAFF_TOKEN"

# Test staff endpoint with patient token (should fail with 403)
curl http://localhost:3000/api/staff/dashboard \
  -H "Authorization: Bearer $PATIENT_TOKEN"

# Test public endpoint (no token, should succeed)
curl http://localhost:3000/api/health
```

---

## Troubleshooting

### Issue: "Invalid token: missing role claim"

**symptom**: 403 error when accessing protected endpoint after login.

**Cause**: JWT token doesn't contain `role` field.

**Solution**:
1. Check JWT payload with https://jwt.io
2. Verify `signToken()` includes role:
   ```typescript
   const payload: JwtPayload = {
     userId: user.id,
     email: user.email,
     role: user.role, // ← Must include this
     iat: Math.floor(Date.now() / 1000),
     exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS,
   };
   ```
3. Log out and log back in to get new token

### Issue: "Invalid role: undefined"

**Symptom**: 403 error with "Invalid role: undefined" message.

**Cause**: User record in database has NULL role.

**Solution**:
```sql
-- Check user's role
SELECT id, email, role FROM users WHERE email = 'user@example.com';

-- Update role
UPDATE users SET role = 'patient' WHERE email = 'user@example.com';
```

### Issue: Staff can't access staff endpoints

**Symptom**: Staff user gets 403 on `/api/staff/dashboard`.

**Cause**: Route uses wrong role constant or typo.

**Solution**:
```typescript
// Wrong
router.get('/staff/dashboard', authorize('staf'), handler); // Typo

// Correct
router.get('/staff/dashboard', authorize(UserRole.STAFF), handler);
```

### Issue: Patient accessing other patients' data

**Symptom**: Patient can view other patients' appointments.

**Cause**: Missing resource-based authorization.

**Solution**:
```typescript
// Add resource ownership check
router.get('/appointments/:id',
  authenticate,
  authorize(UserRole.PATIENT, UserRole.STAFF, UserRole.ADMIN),
  authorizeResourceAccess('appointments'), // ← Add this
  handler
);
```

### Issue: Admin can't access staff endpoints

**Symptom**: Admin gets 403 on staff endpoint.

**Cause**: Role hierarchy not working.

**Solution**:
1. Check `authorize()` uses enhanced version with `checkPermission()`
2. Verify `canAccessRole()` imported from `roleHierarchy.ts`
3. Check console logs for debugging info

### Issue: Too many authorization failures logged

**Symptom**: audit_logs table filling up quickly.

**Cause**: Frontend retrying failed requests.

**Solution**:
1. Fix frontend to handle 403 properly (don't retry)
2. Add rate limiting for failed authorization attempts
3. Archive old audit logs:
   ```sql
   -- Move to archive table
   INSERT INTO audit_logs_archive
   SELECT * FROM audit_logs
   WHERE created_at < NOW() - INTERVAL '90 days';

   -- Delete old logs
   DELETE FROM audit_logs
   WHERE created_at < NOW() - INTERVAL '90 days';
   ```

---

## Appendix

### Permission Matrix Reference

See `src/config/permissions.ts` or generate markdown:

```typescript
import { exportPermissionMatrixMarkdown } from './config/permissions';
console.log(exportPermissionMatrixMarkdown());
```

### Role Comparison Table

| Role      | Level | Can Access Admin | Can Access Staff | Can Access Patient | Can Manage Users |
|-----------|-------|------------------|------------------|--------------------|------------------|
| ADMIN     | 3     | ✅               | ✅ (inherited)   | ✅ (inherited)     | ✅               |
| STAFF     | 2     | ❌               | ✅               | ✅ (inherited)     | ❌               |
| PATIENT   | 1     | ❌               | ❌               | ✅                 | ❌               |

### Audit Log Actions

| Action                  | Description                       | Logged By                |
|-------------------------|-----------------------------------|--------------------------|
| LOGIN                   | Successful login                  | authService.login()      |
| LOGIN_FAILED            | Failed login attempt              | authService.login()      |
| LOGOUT                  | User logout                       | authService.logout()     |
| AUTHORIZATION_FAILED    | Failed role check                 | authorize() middleware   |
| MISSING_ROLE_CLAIM      | JWT missing role field            | validateRoleClaim()      |
| INVALID_ROLE_CLAIM      | JWT has invalid role value        | validateRoleClaim()      |
| RESOURCE_ACCESS_DENIED  | Failed ownership check            | authorizeResourceAccess()|

### Related Documentation

- [AUTHENTICATION.md](./AUTHENTICATION.md) - JWT authentication and session management
- [RATE_LIMITING.md](./RATE_LIMITING.md) - Rate limiting and brute force protection
- [DATABASE_INTEGRATION.md](./DATABASE_INTEGRATION.md) - Database schema and migrations
- [API_REFERENCE.md](./API_REFERENCE.md) - Complete API endpoint documentation

---

## Changelog

### Version 1.0.0 (2025-01-01)

✅ **Initial Release** - US_010 TASK_001

**Features**:
- Role hierarchy (admin > staff > patient)
- Multi-role endpoint support
- Special roles (public, any-authenticated)
- Resource-based permissions
- Comprehensive error messages
- Audit logging for all failures
- Permission matrix configuration
- Type-safe implementation with TypeScript

**Files Added**:
- `src/types/rbac.types.ts` - Type definitions
- `src/utils/roleHierarchy.ts` - Hierarchy utilities
- `src/utils/permissionChecker.ts` - Permission logic
- `src/middleware/roleValidator.ts` - Role validation
- `src/config/permissions.ts` - Permission matrix
- `docs/RBAC_GUIDE.md` - This documentation

**Files Modified**:
- `src/middleware/auth.ts` - Enhanced `authorize()` function

---

**Author**: AI Assistant  
**Task**: US_010 TASK_001 - RBAC Middleware Enhancement  
**Date**: 2025-01-01  
**Status**: ✅ Complete
