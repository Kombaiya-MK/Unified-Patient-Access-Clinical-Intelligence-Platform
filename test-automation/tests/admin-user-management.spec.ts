import { test, expect } from '@playwright/test';
import { UserManagementPage } from '../pages/user-management.page';

test.describe('Admin User Management', () => {
  let userManagementPage: UserManagementPage;

  test.beforeEach(async ({ page }) => {
    userManagementPage = new UserManagementPage(page);
    // Assume admin is already logged in
    await page.goto('/admin/user-management');
  });

  test('TC-UC-006-HP-001: Create New User Account', async ({ page }) => {
    // Click create user button
    await userManagementPage.createUserButton.click();
    
    // Fill user details
    await userManagementPage.fullNameInput.fill('Jane Smith');
    await userManagementPage.emailInput.fill('jane.smith@example.com');
    await userManagementPage.roleSelect.selectOption('Staff');
    await userManagementPage.departmentSelect.selectOption('Cardiology');
    await userManagementPage.phoneInput.fill('+1-555-0123');
    
    // Create user
    await userManagementPage.createUserSubmitButton.click();
    
    // Verify success message
    await expect(userManagementPage.successMessage).toBeVisible();
    
    // Verify new user visible in list
    await expect(page.getByRole('row', { name: /jane.smith@example.com/ })).toBeVisible();
  });

  test('TC-UC-006-HP-002: Update Existing User Role', async ({ page }) => {
    // Search for user
    await userManagementPage.searchUsersInput.fill('jane.smith@example.com');
    await userManagementPage.searchButton.click();
    
    // Select user row
    await page.getByRole('row', { name: /jane.smith@example.com/ }).click();
    
    // Edit user
    await userManagementPage.editUserButton.click();
    
    // Verify current role
    await expect(userManagementPage.roleSelect).toHaveValue('Staff');
    
    // Update role
    await userManagementPage.roleSelect.selectOption('Admin');
    
    // Save changes
    await userManagementPage.saveChangesButton.click();
    
    // Verify success message
    await expect(page.getByText('User role updated successfully')).toBeVisible();
    
    // Verify updated role visible
    await expect(page.getByText('Role: Admin')).toBeVisible();
  });

  test('TC-UC-006-HP-003: Deactivate User Account', async ({ page }) => {
    // Select user
    await page.getByRole('row', { name: /jane.smith@example.com/ }).click();
    
    // Verify user is active
    await expect(page.getByText('Status: Active')).toBeVisible();
    
    // Deactivate user
    await userManagementPage.deactivateUserButton.click();
    
    // Verify confirmation dialog
    await expect(page.getByText('Are you sure you want to deactivate jane.smith@example.com?')).toBeVisible();
    
    // Enter deactivation reason
    await userManagementPage.deactivationReasonInput.fill('Employee left organization');
    
    // Confirm deactivation
    await page.getByRole('button', { name: 'Confirm Deactivation' }).click();
    
    // Verify success message
    await expect(page.getByText('User deactivated successfully')).toBeVisible();
    
    // Verify status updated
    await expect(page.getByText('Status: Inactive')).toBeVisible();
    
    // Verify audit log confirmation
    await expect(page.getByText('Deactivation logged immutably')).toBeVisible();
  });

  test('TC-UC-006-EC-001: Attempt to Create Duplicate User Email', async ({ page }) => {
    // Click create user
    await userManagementPage.createUserButton.click();
    
    // Fill duplicate email
    await userManagementPage.fullNameInput.fill('John Duplicate');
    await userManagementPage.emailInput.fill('existing.user@example.com');
    await userManagementPage.roleSelect.selectOption('Patient');
    
    // Attempt to create
    await userManagementPage.createUserSubmitButton.click();
    
    // Verify error alert
    await expect(userManagementPage.errorAlert).toBeVisible();
    await expect(page.getByText('Email already exists. Please use a different email address.')).toBeVisible();
    
    // Verify email field has error styling
    await expect(userManagementPage.emailInput).toHaveAttribute('aria-invalid', 'true');
  });

  test('TC-UC-006-ER-001: Create User with Invalid Email Format', async ({ page }) => {
    // Click create user
    await userManagementPage.createUserButton.click();
    
    // Fill invalid email
    await userManagementPage.fullNameInput.fill('Test User');
    await userManagementPage.emailInput.fill('invalid-email-format');
    await userManagementPage.roleSelect.selectOption('Staff');
    
    // Attempt to create
    await userManagementPage.createUserSubmitButton.click();
    
    // Verify validation error
    await expect(userManagementPage.errorAlert).toBeVisible();
    await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
    
    // Verify button remains enabled for correction
    await expect(userManagementPage.createUserSubmitButton).toBeEnabled();
  });

  test('TC-UC-006-ER-002: Unauthorized User Access to Admin Operations', async ({ page }) => {
    // Clear authentication (simulate patient login)
    await page.context().clearCookies();
    
    // Attempt to access admin page
    await page.goto('/admin/user-management');
    
    // Verify redirected or access denied
    await expect(page).toHaveURL(/access-denied|patient\/dashboard/);
    
    // Verify error alert
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText('Access Denied. You do not have permission to view this page.')).toBeVisible();
  });
});
