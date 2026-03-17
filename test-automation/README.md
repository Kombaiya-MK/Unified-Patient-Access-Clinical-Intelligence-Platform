# UPACI Platform - Test Automation Suite

Production-ready end-to-end test automation for the Unified Patient Access & Clinical Intelligence (UPACI) Platform using Playwright and TypeScript.

## Project Structure

```
test-automation/
├── tests/                          # Feature test specifications
│   ├── appointment-booking.spec.ts
│   ├── patient-intake.spec.ts
│   ├── staff-queue-management.spec.ts
│   ├── patient-dashboard.spec.ts
│   ├── admin-user-management.spec.ts
│   └── medication-conflicts.spec.ts
├── e2e/                            # End-to-end journey tests
│   ├── patient-complete-journey.spec.ts
│   └── staff-queue-management.spec.ts
├── pages/                          # Page Object Models
│   ├── login.page.ts
│   ├── appointment-booking.page.ts
│   ├── my-appointments.page.ts
│   ├── patient-intake.page.ts
│   ├── queue-management.page.ts
│   ├── patient-dashboard.page.ts
│   ├── user-management.page.ts
│   └── patient-profile.page.ts
├── data/                           # Test data fixtures
│   ├── appointment-booking.json
│   ├── patient-intake.json
│   ├── admin-user-management.json
│   └── e2e-journeys.json
├── playwright.config.ts            # Playwright configuration
├── package.json                    # Project dependencies
├── tsconfig.json                   # TypeScript configuration
└── README.md                       # This file
```

## Features

✅ **37 Feature Tests** across 6 test suites  
✅ **2 E2E Journey Tests** validating complete user workflows  
✅ **8 Page Object Models** promoting code reusability  
✅ **Role-based Locators** (getByRole priority for accessibility)  
✅ **Test Data Fixtures** for maintainable test data  
✅ **Multi-browser Support** (Chromium, Firefox, WebKit, Mobile)  
✅ **TypeScript-first** for type safety and IDE support

## Prerequisites

- Node.js 18+ or 20+
- npm or yarn package manager

## Installation

1. Install dependencies:
```bash
cd test-automation
npm install
```

2. Install Playwright browsers:
```bash
npm run install:browsers
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run feature tests only
```bash
npm run test:feature
```

### Run E2E tests only
```bash
npm run test:e2e
```

### Run tests in headed mode (visible browser)
```bash
npm run test:headed
```

### Run tests in debug mode
```bash
npm run test:debug
```

### Run tests with UI mode
```bash
npm run test:ui
```

### Run tests on specific browser
```bash
npm run test:chromium
npm run test:firefox
npm run test:webkit
```

### Run tests on mobile browsers
```bash
npm run test:mobile
```

## Viewing Test Reports

After running tests, view the HTML report:
```bash
npm run report
```

## Test Coverage

### Feature Tests (6 test suites, 37 test cases)
- **Appointment Booking** (5 tests) - UC-001
  - TC-UC-001-HP-001: Book Available Appointment Slot
  - TC-UC-001-EC-001: Join Waitlist When Slot Unavailable
  - TC-UC-001-ER-001: Booking Fails with Past Date
  - TC-UC-001-EC-002: Reschedule Existing Appointment
  - TC-UC-001-EC-003: Cancel Appointment

- **Patient Intake** (5 tests) - UC-002
  - TC-UC-002-HP-001: Complete AI-Assisted Intake
  - TC-UC-002-HP-002: Complete Manual Form Intake
  - TC-UC-002-EC-001: Switch from AI to Manual Mid-Process
  - TC-UC-002-ER-001: Incomplete Intake Submission Blocked
  - TC-UC-002-EC-002: Switch from Manual to AI Mid-Process

- **Staff Queue Management** (7 tests) - UC-007
  - TC-UC-007-HP-001: Add Walk-in Patient to Queue
  - TC-UC-007-HP-002: Mark Patient as Arrived
  - TC-UC-007-HP-003: Update Status to In Progress
  - TC-UC-007-HP-004: Update Status to Completed
  - TC-UC-007-EC-001: Queue Full Warning
  - TC-UC-007-ER-001: Invalid Patient ID
  - TC-UC-007-EC-002: Status Transition Validation

- **Patient Dashboard** (7 tests) - UC-012
  - TC-UC-012-HP-001: Access Dashboard and View Appointments
  - TC-UC-012-HP-002: Upload Clinical Documents
  - TC-UC-012-HP-003: Complete Intake from Dashboard
  - TC-UC-012-HP-004: View and Dismiss Notifications
  - TC-UC-012-EC-001: Dashboard with No Appointments
  - TC-UC-012-ER-001: Unauthorized Dashboard Access
  - TC-UC-012-EC-002: Dashboard Session Timeout

- **Admin User Management** (6 tests) - UC-006
  - TC-UC-006-HP-001: Create New User Account
  - TC-UC-006-HP-002: Update Existing User Role
  - TC-UC-006-HP-003: Deactivate User Account
  - TC-UC-006-EC-001: Duplicate User Email
  - TC-UC-006-ER-001: Invalid Email Format
  - TC-UC-006-ER-002: Unauthorized Access

- **Medication Conflicts** (6 tests) - UC-010
  - TC-UC-010-HP-001: Detect and Highlight Conflicts
  - TC-UC-010-HP-002: Resolve Conflict
  - TC-UC-010-EC-001: No Conflicts Detected
  - TC-UC-010-ER-001: Missing Medication Data
  - TC-UC-010-EC-002: Critical Conflict Alert
  - TC-UC-010-ER-002: Service Unavailable

### E2E Journey Tests (2 test suites)
- **Patient Complete Journey** - UC-008 → UC-001 → UC-002 → UC-012
  - TC-E2E-PATIENT-001: Login → Book → Intake → Upload → Verify
  
- **Staff Queue Management Journey** - UC-008 → UC-007 → UC-011
  - TC-E2E-STAFF-001: Login → Queue → Arrivals → Status Updates → No-Show

## Page Object Pattern

All tests use the Page Object Model (POM) pattern for maintainability:

- **Locators as getters** - Centralized element selectors
- **Actions as methods** - Reusable user actions
- **No assertions in page objects** - Tests handle assertions
- **Role-based locators** - Accessibility-first approach

Example:
```typescript
export class LoginPage {
  get emailInput(): Locator {
    return this.page.getByLabel('Email');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
```

## Best Practices

✅ **Test Independence** - Each test can run independently  
✅ **Web-First Assertions** - Auto-waiting built into Playwright  
✅ **Role-Based Locators** - Accessibility compliance  
✅ **No Hard Waits** - Avoid `waitForTimeout`  
✅ **Checkpoints in E2E** - State validation at each phase  
✅ **Session Management** - Proper authentication handling

## Configuration

### Base URL
Default: `http://localhost:3000`  
Override: Set `BASE_URL` environment variable

Example:
```bash
BASE_URL=https://staging.upaci.com npm test
```

### Timeouts
- Action timeout: 10 seconds
- Navigation timeout: 30 seconds
- Test timeout: 60 seconds
- Assertion timeout: 5 seconds

## CI/CD Integration

Tests are CI-ready with:
- Automatic retries (2 on CI)
- HTML, JSON, and list reporters
- Screenshot on failure
- Video on failure
- Trace on first retry

## Troubleshooting

### TypeScript compilation errors
```bash
npx tsc --noEmit
```

### List all tests without running
```bash
npx playwright test --list
```

### Clear test cache
```bash
rm -rf test-results/ playwright-report/
```

## Contributing

1. Follow the Page Object Model pattern
2. Use role-based locators (getByRole, getByLabel, getByTestId)
3. Add test data to JSON fixtures
4. Update README when adding new test suites

## License

ISC

---

**Generated on:** March 17, 2026  
**Playwright Version:** ^1.40.0  
**TypeScript Version:** ^5.3.0
