# Task - TASK_002: Frontend User Management Page (SCR-013)

## Requirement Reference
- User Story: [us_035]
- Story Location: [.propel/context/tasks/us_035/us_035.md]
- Acceptance Criteria:
    - AC1: Display user table with Email, Role, Department, Status, Last Login, Actions columns
    - AC2: Create User modal with email, password (show/hide toggle, strength indicator), confirm password, role dropdown, department dropdown (visible only for Patient role per FR-022)
    - AC3: Edit User modal pre-fills current values, password optional, updates role/department, shows success message
    - AC4: Deactivate confirmation dialog with Cancel and Deactivate buttons, shows "Account deactivated" message
- Edge Case:
    - EC1: Duplicate email error displayed: "User with this email already exists"
    - EC2: Self-deactivation button disabled with tooltip "Cannot deactivate your own account"
    - EC3: Department required for Patient role validation: "Department is required for Patient role"
    - EC4: Password complexity validation: min 8 chars, 1 uppercase, 1 number, 1 special char, real-time strength indicator
- UXR Compliance:
    - UXR-101: WCAG AA compliance
    - UXR-103: Keyboard navigation (Tab through table, Enter to edit/create)
    - UXR-201: Mobile-first design (cards on mobile, table on desktop)
    - UXR-501: Inline form validation with error messages
    - UXR-502: Clear error messages for validation failures

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-013-user-management.html |
| **Screen Spec** | figma_spec.md#SCR-013 |
| **UXR Requirements** | UXR-101, UXR-103, UXR-201, UXR-501, UXR-502 |
| **Design Tokens** | N/A |

> **CRITICAL**: MUST reference wireframe-SCR-013-user-management.html during implementation to match layout, spacing, and component structure.

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.2.x |
| Frontend | TypeScript | 5.3.x |
| Frontend | React Hook Form | 7.x |
| Validation | Zod | 3.x |
| Date Handling | date-fns | 3.x |

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

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Create User Management page (SCR-013) at app/src/pages/UserManagement.tsx for admin user CRUD operations. Display user table with columns: Email, Role (Patient/Staff/Admin), Department, Status (Active/Inactive with badges), Last Login (formatted with date-fns), Actions (Edit/Deactivate icons). Implement sortable columns by clicking headers (email, role, last_login). Add search bar filtering by email or name. Pagination with 20 users per page. "Create User" button in top-right opens modal. Create User modal has fields: email (email validation), password (show/hide toggle button, real-time strength indicator showing Weak/Medium/Strong based on complexity), confirm password (must match), role dropdown (Patient/Staff/Admin), department dropdown (conditionally visible only when role='Patient' per FR-022), first name, last name, optional phone number. Submit button triggers POST /api/admin/users, displays success toast "User created successfully. Verification email sent." or error toast for duplicate email "User with this email already exists", password complexity errors, missing department for Patient role. Edit User modal opens on clicking Edit icon with current values pre-filled, password fields optional (leave blank to keep existing), updates on submit with PUT /api/admin/users/:id, displays success toast "User updated successfully", invalidates user session if role changed. Deactivate confirmation dialog shows "Are you sure you want to deactivate [email]? They will no longer be able to log in." with Cancel and Deactivate buttons. Deactivate button disabled for current admin user with tooltip "Cannot deactivate your own account". Status badges: green "Active", gray "Inactive". Mobile-responsive: cards with expand details on mobile, table layout on tablet/desktop. WCAG AA compliant with ARIA labels, keyboard navigation, focus indicators per UXR-101, UXR-103.

## Dependent Tasks
- US-035 task_001: Backend user management API endpoints

## Impacted Components
- **CREATE** app/src/pages/UserManagement.tsx - Main user management page
- **CREATE** app/src/components/admin/UserTable.tsx - User table with sorting and pagination
- **CREATE** app/src/components/admin/CreateUserModal.tsx - Create user form modal
- **CREATE** app/src/components/admin/EditUserModal.tsx - Edit user form modal
- **CREATE** app/src/components/admin/DeactivateUserDialog.tsx - Deactivate confirmation dialog
- **CREATE** app/src/components/admin/StatusBadge.tsx - Active/Inactive status badge
- **CREATE** app/src/components/admin/PasswordStrengthIndicator.tsx - Password strength meter
- **CREATE** app/src/hooks/useUsers.ts - User management CRUD hooks
- **CREATE** app/src/types/user.ts - User type definitions
- **MODIFY** app/src/pages/index.ts - Export UserManagement

## Implementation Plan
1. **Create user.ts types**: Define User = {id: number, email: string, role: 'patient' | 'doctor' | 'staff' | 'admin', first_name: string, last_name: string, phone_number?: string, department_name?: string, is_active: boolean, last_login_at?: string, created_at: string}, CreateUserInput = {email, password, confirm_password, role, first_name, last_name, phone_number?, department_id?}, UpdateUserInput = {role?, department_id?, first_name?, last_name?, phone_number?, password?}
2. **Create useUsers.ts hook**: Export useUsers() hook: GET /api/admin/users with React Query, useQuery(['users', page, sortBy, filterRole, filterStatus]), return {users, isLoading, error, pagination}, export useCreateUser mutation: POST /api/admin/users, onSuccess invalidate users query and show toast, onError show error toast, export useUpdateUser mutation: PUT /api/admin/users/:id, onSuccess refetch and toast, export useDeactivateUser mutation: DELETE /api/admin/users/:id, onSuccess refetch and toast
3. **Create useDepartments.ts hook**: Export useDepartments() hook: GET /api/admin/departments with React Query, return {departments, isLoading}
4. **Create StatusBadge.tsx**: Accept {isActive: boolean} props, if isActive render green badge "Active" with checkmark icon, else gray badge "Inactive" with x icon, WCAG AA contrast
5. **Create PasswordStrengthIndicator.tsx**: Accept {password: string} props, calculate strength: weak (no requirements met), medium (2-3 requirements), strong (all 4: min 8 chars, uppercase, number, special char), render progress bar with color: red (weak), yellow (medium), green (strong), text label below
6. **Create UserTable.tsx**: Accept {users, sortBy, onSort, currentUserId} props, render table with headers: Email (sortable), Role (sortable), Department, Status, Last Login (sortable), Actions, onClick header toggles sort direction, render StatusBadge for is_active, format last_login_at with date-fns formatDistanceToNow, Actions column: Edit icon button, Deactivate icon button (disabled if user.id === currentUserId with tooltip), mobile view uses cards with expandable details
7. **Create CreateUserModal.tsx**: Use React Hook Form with Zod validation schema: email().email(), password().min(8).regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/), confirm_password().refine(matches password), role().enum(['patient', 'doctor', 'staff', 'admin']), department_id().optional(), first_name().min(1), last_name().min(1), phone_number().optional(), conditional validation: if role='patient' require department_id, render form fields: email input, password input with show/hide toggle (eye icon), confirm password input, role dropdown, department dropdown (visible only if watch('role') === 'patient') fetched from useDepartments, first name, last name, phone number, PasswordStrengthIndicator below password field, Submit button calls useCreateUser, display inline validation errors per UXR-501, Cancel button closes modal
8. **Create EditUserModal.tsx**: Similar to CreateUserModal but pre-fills values with selected user data using defaultValues prop in useForm, password fields optional (show "Leave blank to keep existing password"), omit confirm_password if password blank, Submit calls useUpdateUser, show success toast
9. **Create DeactivateUserDialog.tsx**: Accept {user, onConfirm, onCancel} props, render dialog: title "Deactivate User", body text "Are you sure you want to deactivate {user.email}? They will no longer be able to log in.", Cancel button (secondary), Deactivate button (danger red), onConfirm calls useDeactivateUser(user.id), ARIA role="alertdialog"
10. **Create UserManagement.tsx page**: Use useUsers hook for fetching users, store page state with useState(1), sortBy state with useState('created_at'), filterRole/filterStatus states, render header with "User Management" title and "Create User" button (top-right), render search bar with onChange debounce filtering, render filter dropdowns for role and status, render UserTable with users and currentUserId from useAuth, render CreateUserModal controlled by isCreateModalOpen state, render EditUserModal controlled by isEditModalOpen with selectedUser, render DeactivateUserDialog controlled by isDeactivateDialogOpen, render Pagination component with page/totalPages, keyboard shortcuts: N for new user (opens create modal), Esc to close modals
11. **Pagination component**: Accept {page, totalPages, onPageChange} props, render Previous/Next buttons, page numbers with ellipsis for large counts, disable Previous on page 1, disable Next on last page, keyboard accessible
12. **Error handling**: Catch 409 Conflict from createUser → display "User with this email already exists", catch 403 Forbidden from deactivate → display "Cannot deactivate your own account", catch 400 Bad Request → display validation error messages from server
13. **Accessibility**: WCAG AA focus indicators, ARIA labels for all buttons "Edit user {email}", "Deactivate user {email}", keyboard navigation Tab through table rows/modals, Enter to activate buttons, Esc to close modals, screen reader announcements for success/error toasts
14. **Testing**: Test user table renders and sorts correctly, test search filtering works, test Create User modal validates email/password/department, test Edit User modal pre-fills values, test Deactivate confirms before action, test self-deactivation button disabled, test keyboard navigation, test mobile responsiveness, test accessibility with axe-core

**Focus on how to implement**: User list fetching: `const useUsers = (page: number, sortBy: string, filterRole?: string, filterStatus?: boolean) => { return useQuery(['users', page, sortBy, filterRole, filterStatus], () => axios.get('/api/admin/users', { params: { page, limit: 20, sortBy, role: filterRole, status: filterStatus } }).then(res => res.data), { staleTime: 60000 }); };`. Create user mutation: `const useCreateUser = () => { const queryClient = useQueryClient(); return useMutation((data: CreateUserInput) => axios.post('/api/admin/users', data), { onSuccess: () => { queryClient.invalidateQueries(['users']); toast.success('User created successfully. Verification email sent.'); }, onError: (error: AxiosError) => { if (error.response?.status === 409) toast.error('User with this email already exists'); else if (error.response?.status === 400) toast.error(error.response?.data?.message || 'Validation error'); } }); };`. Password strength: `const calculateStrength = (password: string): 'weak' | 'medium' | 'strong' => { let score = 0; if (password.length >= 8) score++; if (/[A-Z]/.test(password)) score++; if (/\d/.test(password)) score++; if (/[@$!%*?&]/.test(password)) score++; return score <= 1 ? 'weak' : score <= 3 ? 'medium' : 'strong'; };`. Conditional department field: `const role = watch('role'); return (<>{roleField}<br/>{role === 'patient' && <DepartmentDropdown {...register('department_id')} departments={departments} required error={errors.department_id?.message}/>}</>);`. Self-deactivation check: `const currentUserId = useAuth().user?.id; return <UserTable users={users} currentUserId={currentUserId} onEdit={openEditModal} onDeactivate={openDeactivateDialog}/>; const DeactivateButton = ({userId}) => { const isDisabled = userId === currentUserId; return <IconButton icon={<UserXIcon/>} disabled={isDisabled} tooltip={isDisabled ? "Cannot deactivate your own account" : "Deactivate user"} onClick={...}/>; };`.

## Current Project State
```
app/src/
├── pages/
│   ├── UserManagement.tsx (to be created)
│   └── index.ts (to be modified)
├── components/
│   └── admin/
│       ├── UserTable.tsx (to be created)
│       ├── CreateUserModal.tsx (to be created)
│       ├── EditUserModal.tsx (to be created)
│       ├── DeactivateUserDialog.tsx (to be created)
│       ├── StatusBadge.tsx (to be created)
│       └── PasswordStrengthIndicator.tsx (to be created)
├── hooks/
│   ├── useUsers.ts (to be created)
│   └── useDepartments.ts (to be created)
└── types/
    └── user.ts (to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/pages/UserManagement.tsx | Main user management page |
| CREATE | app/src/components/admin/UserTable.tsx | User table with sorting and pagination |
| CREATE | app/src/components/admin/CreateUserModal.tsx | Create user form modal |
| CREATE | app/src/components/admin/EditUserModal.tsx | Edit user form modal |
| CREATE | app/src/components/admin/DeactivateUserDialog.tsx | Deactivate confirmation dialog |
| CREATE | app/src/components/admin/StatusBadge.tsx | Active/Inactive status badge |
| CREATE | app/src/components/admin/PasswordStrengthIndicator.tsx | Password strength meter |
| CREATE | app/src/hooks/useUsers.ts | User management CRUD hooks |
| CREATE | app/src/hooks/useDepartments.ts | Department lookup hook |
| CREATE | app/src/types/user.ts | User type definitions |
| MODIFY | app/src/pages/index.ts | Export UserManagement |

## External References
- **React Hook Form**: https://react-hook-form.com/ - Form handling and validation
- **React Query**: https://tanstack.com/query/latest - Data fetching and mutations
- **Zod**: https://zod.dev/ - Schema validation
- **date-fns**: https://date-fns.org/ - Date formatting (formatDistanceToNow)
- **WCAG AA Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/ - Accessibility compliance
- **Password Strength Validation**: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html - OWASP guidelines
- **Wireframe**: .propel/context/wireframes/Hi-Fi/wireframe-SCR-013-user-management.html

## Build Commands
- Start dev server: `npm run dev` (Vite dev server)
- Build for production: `npm run build`
- Type check: `npm run type-check` (tsc --noEmit)
- Lint: `npm run lint`

## Implementation Validation Strategy
- [x] UserManagement page loads user list successfully
- [x] User table displays Email, Role, Department, Status, Last Login, Actions columns
- [x] Sorting by email/role/last_login works on column header click
- [x] Search bar filters users by email or name
- [x] Filter dropdowns work for role and status
- [x] Pagination displays 20 users per page
- [x] Create User button opens modal
- [x] Create User modal validates email format
- [x] Password show/hide toggle works
- [x] Password strength indicator shows Weak/Medium/Strong
- [x] Confirm password validation ensures match
- [x] Department dropdown visible only for Patient role
- [x] Department required validation for Patient role
- [x] Create user success shows toast "User created successfully"
- [x] Duplicate email error shows "User with this email already exists"
- [x] Edit User modal pre-fills current values
- [x] Edit user updates successfully
- [x] Password optional in edit (leave blank keeps existing)
- [x] Deactivate confirmation dialog shows before action
- [x] Self-deactivation button disabled with tooltip
- [x] Deactivate success shows toast "User deactivated successfully"
- [x] Status badges show green (Active) and gray (Inactive)
- [x] Last login formatted with date-fns
- [x] Mobile view shows cards instead of table
- [x] Keyboard navigation works (Tab, Enter, Esc)
- [x] WCAG AA compliance verified with axe-core
- [x] Visual comparison against wireframe-SCR-013 completed at 375px, 768px, 1440px

## Implementation Checklist
- [x] Create app/src/types/user.ts (interfaces: User with id/email/role/first_name/last_name/phone_number/department_name/is_active/last_login_at/created_at, CreateUserInput with email/password/confirm_password/role/first_name/last_name/phone_number/department_id, UpdateUserInput with optional fields)
- [x] Create app/src/hooks/useUsers.ts (custom hook: useQuery GET /api/admin/users with params page/limit/sortBy/role/status, useMutation for createUser POST, useMutation for updateUser PUT, useMutation for deactivateUser DELETE, return users/isLoading/error/pagination/mutations)
- [x] Create app/src/hooks/useDepartments.ts (custom hook: useQuery GET /api/admin/departments, return departments/isLoading)
- [x] Create app/src/components/admin/StatusBadge.tsx (accept isActive boolean, render green badge "Active" with checkmark icon if true, gray badge "Inactive" with x icon if false, WCAG AA contrast)
- [x] Create app/src/components/admin/PasswordStrengthIndicator.tsx (accept password string, calculate strength: score based on length ≥8, has uppercase, has number, has special char @$!%*?&, render progress bar red/yellow/green, text label Weak/Medium/Strong)
- [x] Create app/src/components/admin/UserTable.tsx (accept users/sortBy/onSort/currentUserId props, render table headers Email/Role/Department/Status/Last Login/Actions, sortable headers with onClick toggle sort direction, render StatusBadge for is_active, format last_login_at with formatDistanceToNow from date-fns, Actions: Edit IconButton and Deactivate IconButton disabled if user.id === currentUserId with tooltip "Cannot deactivate your own account", mobile responsive: cards with expand on <768px, table on ≥768px)
- [x] Create app/src/components/admin/CreateUserModal.tsx (use React Hook Form, Zod validation schema: email().email(), password().min(8).regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/), confirm_password() refine matches password, role() enum patient/doctor/staff/admin, department_id() conditional required if role='patient', first_name() min 1, last_name() min 1, phone_number() optional, render form fields: email input, password input with show/hide toggle eye icon, confirm password, role dropdown, department dropdown visible only if watch('role') === 'patient' using useDepartments, first/last name, phone, PasswordStrengthIndicator below password, Submit button calls useCreateUser, inline validation errors per UXR-501, Cancel closes modal)
- [x] Create app/src/components/admin/EditUserModal.tsx (similar to CreateUserModal but defaultValues pre-filled with selected user, password optional with text "Leave blank to keep existing password", omit confirm_password validation if password blank, Submit calls useUpdateUser, success toast "User updated successfully")
- [x] Create app/src/components/admin/DeactivateUserDialog.tsx (accept user/onConfirm/onCancel props, render dialog with title "Deactivate User", body "Are you sure you want to deactivate {user.email}? They will no longer be able to log in.", Cancel button secondary, Deactivate button danger red, onConfirm calls useDeactivateUser(user.id), ARIA role="alertdialog" for accessibility)
- [x] Create app/src/pages/UserManagement.tsx (use useUsers hook with page/sortBy/filterRole/filterStatus state, render header "User Management" with "Create User" button top-right, search bar with debounce onChange filtering, filter dropdowns for role and status, UserTable with users and currentUserId from useAuth, CreateUserModal controlled by isCreateModalOpen state, EditUserModal with selectedUser, DeactivateUserDialog with isDeactivateDialogOpen, Pagination component with page/totalPages/onPageChange, keyboard shortcuts: N opens create modal, Esc closes modals)
- [x] Implement Pagination component (accept page/totalPages/onPageChange props, render Previous/Next buttons, page numbers with ellipsis if totalPages > 7, disable Previous on page 1, disable Next on last page, keyboard accessible with Tab and Enter)
- [x] Add error handling for mutations (createUser catch 409 Conflict show toast "User with this email already exists", catch 400 Bad Request show validation errors, deactivateUser catch 403 Forbidden show "Cannot deactivate your own account", all errors display clear messages per UXR-502)
- [x] Implement WCAG AA accessibility (focus indicators on all interactive elements, ARIA labels "Edit user {email}" "Deactivate user {email}", keyboard navigation Tab through table rows and modals, Enter to activate buttons, Esc to close modals, screen reader announcements for toasts, verify with axe-core)
- [x] Modify app/src/pages/index.ts (export UserManagement page)
- [x] **[UI MANDATORY]** Reference wireframe-SCR-013-user-management.html during implementation (match table layout, modal structure, button placements, spacing, responsive breakpoints)
- [x] **[UI MANDATORY]** Validate implementation against wireframe at breakpoints 375px, 768px, 1440px (mobile cards, tablet table, desktop table with proper column widths)
- [ ] Write comprehensive tests (test user table renders users correctly, test sorting by columns, test search filtering, test Create User modal validates email/password/department, test password strength indicator shows correct levels, test Edit User modal pre-fills values, test Deactivate confirms and executes, test self-deactivation button disabled, test keyboard navigation Tab/Enter/Esc, test mobile responsiveness, test accessibility with axe-core, test error handling for duplicate email and validation)
