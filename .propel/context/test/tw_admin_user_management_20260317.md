# Test Workflow: Admin User Management

## Metadata
| Field | Value |
|-------|-------|
| Feature | Admin User Management |
| Source | .propel/context/docs/spec.md |
| Use Case | UC-006 |
| Base URL | http://localhost:3000 |

## Test Cases

### TC-UC-006-HP-001: Create New User Account
**Type:** happy_path | **Priority:** P0

**Preconditions:**
- Admin is logged in and authorized
- Admin Operations interface is accessible
- User email does not already exist in system

**Steps:**
```yaml
steps:
  - step_id: "001"
    action: navigate
    target: "/admin/user-management"
    expect: "user management page loads successfully"

  - step_id: "002"
    action: click
    target: "getByRole('button', {name: 'Create New User'})"
    expect: "user creation form modal opens"

  - step_id: "003"
    action: fill
    target: "getByLabel('Full Name')"
    value: "Jane Smith"
    expect: "name field accepts input"

  - step_id: "004"
    action: fill
    target: "getByLabel('Email')"
    value: "jane.smith@example.com"
    expect: "email field accepts input"

  - step_id: "005"
    action: fill
    target: "getByLabel('Role')"
    value: "Staff"
    expect: "role selected from dropdown"

  - step_id: "006"
    action: fill
    target: "getByLabel('Department')"
    value: "Cardiology"
    expect: "department selected"

  - step_id: "007"
    action: fill
    target: "getByLabel('Phone Number')"
    value: "+1-555-0123"
    expect: "phone number entered"

  - step_id: "008"
    action: click
    target: "getByRole('button', {name: 'Create User'})"
    expect: "user creation submitted"

  - step_id: "009"
    action: verify
    target: "getByText('User created successfully')"
    expect: "visible"

  - step_id: "010"
    action: verify
    target: "getByRole('row', {name: /jane.smith@example.com/})"
    expect: "new user visible in user list"
```

**Test Data:**
```yaml
test_data:
  full_name: "Jane Smith"
  email: "jane.smith@example.com"
  role: "Staff"
  department: "Cardiology"
  phone: "+1-555-0123"
```

---

### TC-UC-006-HP-002: Update Existing User Role
**Type:** happy_path | **Priority:** P0

**Preconditions:**
- Admin is logged in
- Target user exists in system
- Admin has permissions to modify user roles

**Steps:**
```yaml
steps:
  - step_id: "001"
    action: navigate
    target: "/admin/user-management"
    expect: "user management page loads"

  - step_id: "002"
    action: fill
    target: "getByLabel('Search Users')"
    value: "jane.smith@example.com"
    expect: "search field accepts input"

  - step_id: "003"
    action: click
    target: "getByRole('button', {name: 'Search'})"
    expect: "search executes and user found"

  - step_id: "004"
    action: click
    target: "getByRole('row', {name: /jane.smith@example.com/})"
    expect: "user row selected"

  - step_id: "005"
    action: click
    target: "getByRole('button', {name: 'Edit User'})"
    expect: "edit user form opens"

  - step_id: "006"
    action: verify
    target: "getByLabel('Role')"
    expect: "current role is 'Staff'"

  - step_id: "007"
    action: fill
    target: "getByLabel('Role')"
    value: "Admin"
    expect: "role updated to Admin"

  - step_id: "008"
    action: click
    target: "getByRole('button', {name: 'Save Changes'})"
    expect: "changes saved"

  - step_id: "009"
    action: verify
    target: "getByText('User role updated successfully')"
    expect: "visible"

  - step_id: "010"
    action: verify
    target: "getByText('Role: Admin')"
    expect: "updated role visible in user list"
```

**Test Data:**
```yaml
test_data:
  email: "jane.smith@example.com"
  current_role: "Staff"
  new_role: "Admin"
```

---

### TC-UC-006-HP-003: Deactivate User Account
**Type:** happy_path | **Priority:** P0

**Preconditions:**
- Admin is logged in
- Target user exists and is currently active
- User has no active appointments or critical ongoing tasks

**Steps:**
```yaml
steps:
  - step_id: "001"
    action: navigate
    target: "/admin/user-management"
    expect: "user management page loads"

  - step_id: "002"
    action: click
    target: "getByRole('row', {name: /jane.smith@example.com/})"
    expect: "user row selected"

  - step_id: "003"
    action: verify
    target: "getByText('Status: Active')"
    expect: "user is currently active"

  - step_id: "004"
    action: click
    target: "getByRole('button', {name: 'Deactivate User'})"
    expect: "deactivation confirmation dialog appears"

  - step_id: "005"
    action: verify
    target: "getByText('Are you sure you want to deactivate jane.smith@example.com?')"
    expect: "confirmation message visible"

  - step_id: "006"
    action: fill
    target: "getByLabel('Reason for Deactivation')"
    value: "Employee left organization"
    expect: "reason entered"

  - step_id: "007"
    action: click
    target: "getByRole('button', {name: 'Confirm Deactivation'})"
    expect: "user deactivated"

  - step_id: "008"
    action: verify
    target: "getByText('User deactivated successfully')"
    expect: "visible"

  - step_id: "009"
    action: verify
    target: "getByText('Status: Inactive')"
    expect: "status updated in user list"

  - step_id: "010"
    action: verify
    target: "getByText('Deactivation logged immutably')"
    expect: "audit log confirmation visible"
```

**Test Data:**
```yaml
test_data:
  email: "jane.smith@example.com"
  current_status: "Active"
  new_status: "Inactive"
  deactivation_reason: "Employee left organization"
```

---

### TC-UC-006-EC-001: Attempt to Create Duplicate User Email
**Type:** edge_case | **Priority:** P1

**Scenario:** Admin attempts to create a new user with an email that already exists in the system

**Steps:**
```yaml
steps:
  - step_id: "EC001"
    action: navigate
    target: "/admin/user-management"
    expect: "user management page loads"

  - step_id: "EC002"
    action: click
    target: "getByRole('button', {name: 'Create New User'})"
    expect: "user creation form opens"

  - step_id: "EC003"
    action: fill
    target: "getByLabel('Full Name')"
    value: "John Duplicate"
    expect: "name entered"

  - step_id: "EC004"
    action: fill
    target: "getByLabel('Email')"
    value: "existing.user@example.com"
    expect: "duplicate email entered"

  - step_id: "EC005"
    action: fill
    target: "getByLabel('Role')"
    value: "Patient"
    expect: "role selected"

  - step_id: "EC006"
    action: click
    target: "getByRole('button', {name: 'Create User'})"
    expect: "submission attempted"

  - step_id: "EC007"
    action: verify
    target: "getByRole('alert')"
    expect: "error alert visible"

  - step_id: "EC008"
    action: verify
    target: "getByText('Email already exists. Please use a different email address.')"
    expect: "visible"

  - step_id: "EC009"
    action: verify
    target: "getByLabel('Email')"
    expect: "field has error styling (red border)"
```

---

### TC-UC-006-ER-001: Create User with Invalid Email Format
**Type:** error | **Priority:** P1

**Trigger:** Admin attempts to create user with malformed email address

**Steps:**
```yaml
steps:
  - step_id: "ER001"
    action: navigate
    target: "/admin/user-management"
    expect: "user management page loads"

  - step_id: "ER002"
    action: click
    target: "getByRole('button', {name: 'Create New User'})"
    expect: "user creation form opens"

  - step_id: "ER003"
    action: fill
    target: "getByLabel('Full Name')"
    value: "Test User"
    expect: "name entered"

  - step_id: "ER004"
    action: fill
    target: "getByLabel('Email')"
    value: "invalid-email-format"
    expect: "invalid email entered"

  - step_id: "ER005"
    action: fill
    target: "getByLabel('Role')"
    value: "Staff"
    expect: "role selected"

  - step_id: "ER006"
    action: click
    target: "getByRole('button', {name: 'Create User'})"
    expect: "validation triggered"

  - step_id: "ER007"
    action: verify
    target: "getByRole('alert')"
    expect: "visible"

  - step_id: "ER008"
    action: verify
    target: "getByText('Please enter a valid email address.')"
    expect: "visible"

  - step_id: "ER009"
    action: verify
    target: "getByRole('button', {name: 'Create User'})"
    expect: "button remains enabled for correction"
```

---

### TC-UC-006-ER-002: Unauthorized User Access to Admin Operations
**Type:** error | **Priority:** P1

**Trigger:** Non-admin user attempts to access Admin Operations interface

**Steps:**
```yaml
steps:
  - step_id: "ER010"
    action: navigate
    target: "/login"
    expect: "login page loads"

  - step_id: "ER011"
    action: fill
    target: "getByLabel('Email')"
    value: "patient.user@example.com"
    expect: "patient email entered"

  - step_id: "ER012"
    action: fill
    target: "getByLabel('Password')"
    value: "PatientPass123!"
    expect: "password entered"

  - step_id: "ER013"
    action: click
    target: "getByRole('button', {name: 'Log In'})"
    expect: "patient logged in"

  - step_id: "ER014"
    action: navigate
    target: "/admin/user-management"
    expect: "attempt to access admin page"

  - step_id: "ER015"
    action: verify
    target: "url contains '/access-denied' or '/patient/dashboard'"
    expect: "redirected away from admin page"

  - step_id: "ER016"
    action: verify
    target: "getByRole('alert')"
    expect: "visible"

  - step_id: "ER017"
    action: verify
    target: "getByText('Access Denied. You do not have permission to view this page.')"
    expect: "visible"
```

---

## Page Objects
```yaml
pages:
  - name: "UserManagementPage"
    file: "pages/user-management.page.ts"
    elements:
      - createUserButton: "getByRole('button', {name: 'Create New User'})"
      - fullNameInput: "getByLabel('Full Name')"
      - emailInput: "getByLabel('Email')"
      - roleSelect: "getByLabel('Role')"
      - departmentSelect: "getByLabel('Department')"
      - phoneInput: "getByLabel('Phone Number')"
      - createUserSubmitButton: "getByRole('button', {name: 'Create User'})"
      - editUserButton: "getByRole('button', {name: 'Edit User'})"
      - deactivateUserButton: "getByRole('button', {name: 'Deactivate User'})"
      - saveChangesButton: "getByRole('button', {name: 'Save Changes'})"
      - searchUsersInput: "getByLabel('Search Users')"
      - searchButton: "getByRole('button', {name: 'Search'})"
      - userRow: "getByRole('row', {name: /Email/})"
      - successMessage: "getByText(/successfully/)"
      - errorAlert: "getByRole('alert')"
      - deactivationReasonInput: "getByLabel('Reason for Deactivation')"
    actions:
      - createUser(name, email, role, department, phone): "Create new user account"
      - updateUserRole(email, newRole): "Update user role"
      - deactivateUser(email, reason): "Deactivate user account with reason"
      - searchUser(email): "Search for user by email"
```

## Success Criteria
- [x] All happy path steps execute without errors
- [x] Edge case validations pass (duplicate email detection)
- [x] Error scenarios handled correctly (invalid email, unauthorized access)
- [x] Test runs independently (no shared state)
- [x] All assertions use web-first patterns
- [x] Role-based access control enforced (only admins can access)
- [x] User creation validates all required fields
- [x] Deactivation is logged immutably for audit
- [x] All user management actions are secure and auditable

## Locator Reference
| Priority | Method | Example |
|----------|--------|---------|
| 1st | getByRole | `getByRole('button', {name: 'Create New User'})` |
| 2nd | getByTestId | `getByTestId('user-management-form')` |
| 3rd | getByLabel | `getByLabel('Email')` |
| AVOID | CSS | `.user-table`, `#user-row-123` |

---
*Template: automated-testing-template.md | Output: .propel/context/test/tw_admin_user_management_20260317.md*
