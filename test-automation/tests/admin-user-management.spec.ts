import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { UserManagementPage } from '../pages/user-management.page';

import testFixtures from '../data/admin-user-management.json';

const newUser = testFixtures.users[0];
const roleUpdate = testFixtures.role_update;
const deactivation = testFixtures.deactivation;

const ADMIN_EMAIL = 'admin@upaci.com';
const ADMIN_PASSWORD = 'AdminSecure123!';

test.describe('Admin User Management', () => {
  let userManagementPage: UserManagementPage;

  test.beforeEach(async ({ page }) => {
    userManagementPage = new UserManagementPage(page);

    // Authenticate as admin before each test
    const loginPage = new LoginPage(page);
    await page.goto('/login');
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/admin|dashboard/);

    // Navigate to user management
    await page.goto('/admin/user-management');
  });

  test.afterEach(async ({ page }) => {
    // Cleanup: attempt to remove test user data
    const baseURL = process.env.BASE_URL || 'http://localhost:3000';
    try {
      await fetch(`${baseURL}/api/test/cleanup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newUser.email }),
      });
    } catch {
      // Cleanup endpoint may not be available — non-blocking
    }
    await page.close();
  });

  test('TC-UC-006-HP-001: Create New User Account', async ({ page }) => {
    // 001: User management page loads
    await expect(page).toHaveURL(/admin\/user-management/);

    // 002: Open creation form
    await userManagementPage.createUserButton.click();

    // 003–007: Fill user details using page object
    await userManagementPage.fullNameInput.fill(newUser.full_name);
    await userManagementPage.emailInput.fill(newUser.email);
    await userManagementPage.roleSelect.selectOption(newUser.role);
    await userManagementPage.departmentSelect.selectOption(newUser.department);
    await userManagementPage.phoneInput.fill(newUser.phone);

    // 008: Submit creation
    await userManagementPage.createUserSubmitButton.click();

    // 009: Success message visible
    await expect(page.getByText('User created successfully')).toBeVisible();

    // 010: New user visible in list
    await expect(page.getByRole('row', { name: new RegExp(newUser.email) })).toBeVisible();
  });

  test('TC-UC-006-HP-002: Update Existing User Role', async ({ page }) => {
    // 001: Page loaded (beforeEach)

    // 002–003: Search for user
    await userManagementPage.searchUser(roleUpdate.email);

    // 004: Select user row
    await page.getByRole('row', { name: new RegExp(roleUpdate.email) }).click();

    // 005: Open edit form
    await userManagementPage.editUserButton.click();

    // 006: Verify current role
    await expect(userManagementPage.roleSelect).toHaveValue(roleUpdate.current_role);

    // 007: Update role
    await userManagementPage.roleSelect.selectOption(roleUpdate.new_role);

    // 008: Save changes
    await userManagementPage.saveChangesButton.click();

    // 009: Success message
    await expect(page.getByText('User role updated successfully')).toBeVisible();

    // 010: Updated role visible
    await expect(page.getByText(`Role: ${roleUpdate.new_role}`)).toBeVisible();
  });

  test('TC-UC-006-HP-003: Deactivate User Account', async ({ page }) => {
    // 001: Page loaded (beforeEach)

    // 002: Select user
    await page.getByRole('row', { name: new RegExp(deactivation.email) }).click();

    // 003: Verify active status
    await expect(page.getByText(`Status: ${deactivation.current_status}`)).toBeVisible();

    // 004: Click deactivate
    await userManagementPage.deactivateUserButton.click();

    // 005: Confirmation dialog
    await expect(
      page.getByText(`Are you sure you want to deactivate ${deactivation.email}?`),
    ).toBeVisible();

    // 006: Enter reason
    await userManagementPage.deactivationReasonInput.fill(deactivation.reason);

    // 007: Confirm deactivation
    await userManagementPage.confirmDeactivationButton.click();

    // 008: Success message
    await expect(page.getByText('User deactivated successfully')).toBeVisible();

    // 009: Status updated
    await expect(page.getByText(`Status: ${deactivation.new_status}`)).toBeVisible();

    // 010: Audit log confirmation
    await expect(page.getByText('Deactivation logged immutably')).toBeVisible();
  });

  test('TC-UC-006-EC-001: Attempt to Create Duplicate User Email', async ({ page }) => {
    // EC001: Page loaded (beforeEach)

    // EC002: Open creation form
    await userManagementPage.createUserButton.click();

    // EC003: Fill name
    await userManagementPage.fullNameInput.fill('John Duplicate');

    // EC004: Fill duplicate email
    await userManagementPage.emailInput.fill('existing.user@example.com');

    // EC005: Select role
    await userManagementPage.roleSelect.selectOption('Patient');

    // EC006: Attempt to create
    await userManagementPage.createUserSubmitButton.click();

    // EC007: Error alert visible
    await expect(userManagementPage.errorAlert).toBeVisible();

    // EC008: Specific duplicate error message
    await expect(
      page.getByText('Email already exists. Please use a different email address.'),
    ).toBeVisible();

    // EC009: Email field has error styling
    await expect(userManagementPage.emailInput).toHaveAttribute('aria-invalid', 'true');
  });

  test('TC-UC-006-ER-001: Create User with Invalid Email Format', async ({ page }) => {
    // ER001: Page loaded (beforeEach)

    // ER002: Open creation form
    await userManagementPage.createUserButton.click();

    // ER003: Fill name
    await userManagementPage.fullNameInput.fill('Test User');

    // ER004: Fill invalid email
    await userManagementPage.emailInput.fill('invalid-email-format');

    // ER005: Select role
    await userManagementPage.roleSelect.selectOption('Staff');

    // ER006: Attempt to create — triggers validation
    await userManagementPage.createUserSubmitButton.click();

    // ER007: Error alert visible
    await expect(userManagementPage.errorAlert).toBeVisible();

    // ER008: Validation error message
    await expect(page.getByText('Please enter a valid email address.')).toBeVisible();

    // ER009: Button remains enabled for correction
    await expect(userManagementPage.createUserSubmitButton).toBeEnabled();
  });
});

test.describe('Admin User Management — Authorization', () => {
  test('TC-UC-006-ER-002: Unauthorized User Access to Admin Operations', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // ER010: Navigate to login
    await page.goto('/login');

    // ER011–ER012: Login as patient
    await loginPage.login('patient.user@example.com', 'PatientPass123!');

    // ER013: Patient logged in
    await expect(page).toHaveURL(/patient|dashboard/);

    // ER014: Attempt to access admin page
    await page.goto('/admin/user-management');

    // ER015: Redirected away from admin page
    await expect(page).toHaveURL(/access-denied|patient\/dashboard/);

    // ER016–ER017: Access denied message
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(
      page.getByText('Access Denied. You do not have permission to view this page.'),
    ).toBeVisible();
  });
});
