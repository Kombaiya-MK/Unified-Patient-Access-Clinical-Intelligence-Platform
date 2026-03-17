# Task - TASK_001_FE_ADMIN_USER_MANAGEMENT_UI

## Requirement Reference
- User Story: US_035
- Story Location: `.propel/context/tasks/us_035/us_035.md`
- Acceptance Criteria:
    - AC1: Table showing users (Email, Role, Department, Status, Last Login, Actions), "Create User" button opens modal, form validation (email, password strength, role dropdown, department for patients), updates invalidate active sessions on role change, deactivate sets active=false
- Edge Cases:
    - Duplicate email: Error "User already exists"
    - Self-deactivation: Disable button, tooltip "Cannot deactivate your own account"
    - Patient without department: Validation error "Department required for Patient role"
    - Password complexity: Min 8 chars, 1 uppercase, 1 number, 1 special

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-013 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-013-user-management.html |
| **Screen Spec** | SCR-013 (User Management), SCR-004 (Admin Dashboard) |
| **UXR Requirements** | UXR-101 (WCAG AA), UXR-103 (Keyboard nav), UXR-201 (Mobile-first), UXR-501 (Inline validation), UXR-502 (Clear errors) |
| **Design Tokens** | Create button: primary #007BFF, Status: Active green, Inactive gray, Modal: 600px width, Table: zebra striping, Action icons: edit blue, deactivate red |

> **Wireframe Components:**
> - User table: Sortable, search bar, pagination (20/page)
> - Create User button: Top-right, opens modal
> - Create/Edit modal: Email, Password (show/hide, strength indicator), Confirm Password, Role dropdown, Department dropdown (conditional), Submit + Cancel
> - Deactivate confirmation: "Are you sure?" with Cancel + Deactivate
> - Status badges: Green "Active", Gray "Inactive"
> - Responsive: Mobile cards, desktop table

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | React | 18.2.x |
| Frontend | TypeScript | 5.3.x |
| Frontend | Formik | 2.x |
| Frontend | Yup | 1.x |
| Backend | Express | 4.x |
| Database | PostgreSQL | 16.x |
| AI/ML | N/A | N/A |

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | Yes (Responsive) |
| **Platform Target** | Web |
| **Min OS Version** | iOS 14+, Android 10+ |
| **Mobile Framework** | React |

## Task Overview
Implement admin user management UI: (1) UserManagement page with table (Email, Role, Department, Status, Last Login, Actions), (2) Search bar filters by email/name, (3) "Create User" button opens modal with Formik form, (4) Form validation: Email format, password strength (min 8, 1 upper, 1 number, 1 special), confirm password match, role dropdown (Patient/Staff/Admin), department dropdown (visible only if role=Patient), (5) useCreateUser hook: POST /api/admin/users, (6) Edit modal pre-fills current values, password optional (blank = no change), (7) Deactivate button: Confirmation dialog, calls PATCH /api/admin/users/:id/deactivate, (8) Self-deactivation prevention: Disable button if current user, tooltip "Cannot deactivate your own account", (9) Status badges with color coding, (10) WCAG AA compliant.

## Dependent Tasks
- US_009 Task 001: JWT auth (admin role required)
- US_010 Task 001: RBAC middleware (requireRole admin)
- US_035 Task 002: User management API (POST, PATCH endpoints)

## Impacted Components
**New:**
- app/src/pages/UserManagement.tsx (User management page)
- app/src/components/UserTable.tsx (Table component)
- app/src/components/CreateUserModal.tsx (Create/edit modal)
- app/src/components/DeactivateUserDialog.tsx (Confirmation dialog)
- app/src/hooks/useUserManagement.ts (CRUD mutations)

## Implementation Plan
1. Create UserManagement page: Header with "Create User" button, UserTable, search bar
2. UserTable: Displays users with columns, sortable by email/role/status, pagination, action buttons (Edit, Deactivate)
3. Search bar: Debounced input (300ms), filters by email or name
4. CreateUserModal: Formik with Yup validation
   - Email: Yup.string().email().required()
   - Password: Yup.string().min(8).matches(/(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/).required()
   - Confirm password: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match')
   - Role: Yup.string().oneOf(['patient', 'staff', 'admin']).required()
   - Department: Yup.string().when('role', {is: 'patient', then: Yup.string().required('Department required for patients')})
5. Password strength indicator: Visual bar (red/yellow/green) updates as user types
6. useCreateUser hook: POST /api/admin/users with form data
7. Edit flow: Pre-fill form, password field optional (placeholder "Leave blank to keep current")
8. Deactivate: DeactivateUserDialog confirmation, PATCH /api/admin/users/:id/deactivate
9. Self-deactivation check: If userId === currentUserId, disable button, show tooltip
10. Status badges: Green "Active", Gray "Inactive" with styled components

## Current Project State
```
ASSIGNMENT/app/src/
├── pages/ (dashboard exists)
└── (user management to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/pages/UserManagement.tsx | User management page |
| CREATE | app/src/components/UserTable.tsx | Table with users |
| CREATE | app/src/components/CreateUserModal.tsx | Create/edit modal |
| CREATE | app/src/components/DeactivateUserDialog.tsx | Confirmation dialog |
| CREATE | app/src/hooks/useUserManagement.ts | CRUD hooks |

## External References
- [React Table](https://tanstack.com/table/v8)
- [Formik Validation](https://formik.org/docs/guides/validation)
- [FR-015 User Management](../../../.propel/context/docs/spec.md#FR-015)
- [UC-005 Admin Operations](../../../.propel/context/docs/spec.md#UC-005)

## Build Commands
```bash
cd app
npm run dev
```

## Implementation Validation Strategy
- [ ] Unit tests: CreateUserModal validates password strength
- [ ] Integration tests: Create user → appears in table
- [ ] User management page renders: Navigate to /admin/users → see table
- [ ] Table displays users: Shows email, role, department, status, last login
- [ ] Search works: Type email → table filters results
- [ ] Sort works: Click "Email" header → sorts alphabetically
- [ ] Pagination: 25 users → shows page 1, 2 (20 per page)
- [ ] Create button: Click "Create User" → modal opens
- [ ] Form validation: Submit empty → errors "Email required", "Password required"
- [ ] Email validation: Enter "invalid" → error "Invalid email address"
- [ ] Password strength: Type "weak" → red bar, "Weak8Pass!" → green bar
- [ ] Confirm password: Mismatched → error "Passwords must match"
- [ ] Role dropdown: Select role → options Patient/Staff/Admin
- [ ] Department conditional: Select Patient → department dropdown appears, required
- [ ] Department not required: Select Staff → no department field
- [ ] Create success: Valid form → user created, modal closes, table refreshes
- [ ] Edit pre-fills: Click "Edit" → modal shows current values
- [ ] Password optional: Leave password blank → keeps existing (backend validates)
- [ ] Deactivate confirmation: Click "Deactivate" → dialog "Are you sure?"
- [ ] Self-deactivation blocked: Current admin user → button disabled, tooltip shown
- [ ] Status badge: Active user → green badge, Inactive → gray badge
- [ ] Responsive: Mobile → cards instead of table
- [ ] WCAG AA: Keyboard Tab navigation, ARIA labels, 4.5:1 contrast

## Implementation Checklist
- [ ] Create UserManagement.tsx page container
- [ ] Create UserTable.tsx with sorting + pagination
- [ ] Create CreateUserModal.tsx with Formik + Yup validation
- [ ] Create DeactivateUserDialog.tsx confirmation
- [ ] Implement useUserManagement.ts hooks (create, edit, deactivate)
- [ ] Add routing: /admin/users → UserManagement (requireRole admin)
- [ ] Conditional department field logic
- [ ] Password strength indicator visual
- [ ] Self-deactivation prevention logic
- [ ] Test user management flow end-to-end
- [ ] Validate WCAG AA compliance
- [ ] Document user management in app/README.md
