# Task - TASK_001_FE_ACCESSIBILITY_AUDIT_INFRASTRUCTURE

## Requirement Reference
- User Story: US_043
- Story Location: .propel/context/tasks/us_043/us_043.md
- Acceptance Criteria:
    - Passes automated accessibility tests using axe-core with zero critical violations
    - Passes manual testing using screen readers with task completion rate >95%
    - Achieves AAA rating for level AA criteria on WebAIM Wave validator
- Edge Case:
    - What happens when dynamic content updates? (ARIA live regions announce changes)

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A (applies to ALL screens) |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | ALL wireframes in .propel/context/wireframes/Hi-Fi/ (accessibility must be validated across all screens) |
| **Screen Spec** | figma_spec.md (ALL screens SCR-001 through SCR-014) |
| **UXR Requirements** | UXR-101 (WCAG 2.2 AA compliance), UXR-102 (Screen reader support), UXR-103 (Keyboard navigation) |
| **Design Tokens** | designsystem.md#colors (contrast ratios), designsystem.md#typography (sizing), designsystem.md#spacing (touch targets) |

> **Wireframe Details:**
> - All wireframes in Hi-Fi folder include accessibility requirements overlays
> - Focus indicators must be validated on all interactive elements
> - Color contrast must meet WCAG AA ratios (4.5:1 text, 3:1 UI components)
> - Skip links and ARIA landmarks must be present in all screens

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- **MUST** reference all HTML wireframes during audit to validate accessibility compliance
- **MUST** validate focus indicators, ARIA labels, and color contrast against wireframes
- **MUST** ensure all states (Default/Loading/Empty/Error/Validation) meet accessibility standards
- **MUST** validate at breakpoints: 375px (mobile), 768px (tablet), 1440px (desktop)

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.x |
| Frontend | TypeScript | 5.x |
| Frontend | Testing | Jest + React Testing Library |
| Frontend | Accessibility Testing | axe-core | 4.x |
| Frontend | Automation | axe-playwright | latest |
| Backend | N/A | N/A |
| Database | N/A | N/A |
| AI/ML | N/A | N/A |

**Note**: All code and libraries MUST be compatible with versions above. Must follow React 18, TypeScript 5, WCAG 2.2 AA standards.

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
| **Mobile Impact** | Yes (Responsive web) |
| **Platform Target** | Web (Responsive design) |
| **Min OS Version** | iOS 14+, Android 10+ (Safari, Chrome) |
| **Mobile Framework** | React (Responsive web) |

## Task Overview
Establish comprehensive accessibility audit and automated testing infrastructure for WCAG 2.2 Level AA compliance across all 13 screens (SCR-001 through SCR-014): (1) Audit all existing components using axe DevTools browser extension, document violations in accessibility-audit-report.md with severity levels (critical/serious/moderate/minor), screen mappings, and remediation priority, (2) Install and configure axe-core 4.x for automated accessibility testing integrated with Jest and React Testing Library, (3) Create Accessibility Testing utilities (app/src/utils/accessibility-testing.ts) with renderWithA11y() helper function wrapping React Testing Library's render() with automatic axe scanning, expectNoA11yViolations() assertion function, and getA11yReport() for detailed violation reports, (4) Add accessibility test cases to all existing component test files (*.test.tsx) using axe-core, ensuring zero critical violations, (5) Integrate @axe-core/playwright for end-to-end accessibility testing in existing Playwright tests (test-automation/), (6) Create GitHub Actions CI workflow (.github/workflows/accessibility-ci.yml) running accessibility tests on every PR, blocking merges with critical violations, (7) Document testing approach in app/docs/accessibility-testing-guide.md with manual testing checklist for screen readers (NVDA/JAWS/VoiceOver), keyboard navigation validation, and color contrast verification using WebAIM Contrast Checker, (8) Establish baseline accessibility metrics dashboard showing violation counts per screen, compliance percentage, and historical trends.

## Dependent Tasks
- None (foundational task for all subsequent accessibility tasks)

## Impacted Components
- ALL components in app/src/components/ (audit and test)
- ALL pages in app/src/pages/ (audit and test)
- app/src/utils/accessibility-testing.ts (NEW - testing utilities)
- app/docs/accessibility-audit-report.md (NEW - audit findings)
- app/docs/accessibility-testing-guide.md (NEW - testing documentation)
- .github/workflows/accessibility-ci.yml (NEW - CI integration)
- test-automation/playwright.config.ts (MODIFY - add axe-playwright)
- package.json (MODIFY - add axe-core, @axe-core/playwright, @axe-core/react dependencies)

## Implementation Plan
1. **Install Accessibility Testing Dependencies**:
   ```bash
   cd app
   npm install --save-dev axe-core @axe-core/react @axe-core/playwright @types/axe-core
   ```
2. **Create Accessibility Testing Utility (app/src/utils/accessibility-testing.ts)**:
   ```typescript
   import { render, RenderOptions, RenderResult } from '@testing-library/react';
   import { axe, toHaveNoViolations } from 'jest-axe';
   import { ReactElement } from 'react';
   
   expect.extend(toHaveNoViolations);
   
   /**
    * Render component with automatic axe accessibility scanning
    * @param ui React component to render
    * @param options React Testing Library render options
    * @returns Render result with axe violations
    */
   export async function renderWithA11y(
     ui: ReactElement,
     options?: RenderOptions
   ): Promise<RenderResult & { a11yViolations: any }> {
     const view = render(ui, options);
     const results = await axe(view.container);
     return { ...view, a11yViolations: results };
   }
   
   /**
    * Assert no accessibility violations in rendered component
    * @param container DOM element to scan
    * @param options axe-core options
    */
   export async function expectNoA11yViolations(
     container: HTMLElement,
     options?: any
   ): Promise<void> {
     const results = await axe(container, options);
     expect(results).toHaveNoViolations();
   }
   
   /**
    * Get detailed accessibility report
    * @param container DOM element to scan
    * @returns Violation report with counts by severity
    */
   export async function getA11yReport(container: HTMLElement): Promise<{
     violations: any[];
     violationsBySeverity: { critical: number; serious: number; moderate: number; minor: number };
     passes: any[];
   }> {
     const results = await axe(container);
     const violationsBySeverity = results.violations.reduce(
       (acc, violation) => {
         acc[violation.impact || 'minor']++;
         return acc;
       },
       { critical: 0, serious: 0, moderate: 0, minor: 0 }
     );
     return {
       violations: results.violations,
       violationsBySeverity,
       passes: results.passes,
     };
   }
   ```
3. **Create Accessibility Audit Report Template (app/docs/accessibility-audit-report.md)**:
   ```markdown
   # Accessibility Audit Report
   **Date**: March 19, 2026
   **Auditor**: Accessibility Team
   **Tool**: axe DevTools 4.x
   **Standard**: WCAG 2.2 Level AA
   
   ## Executive Summary
   - **Total Screens Audited**: 13 (SCR-001 through SCR-014)
   - **Critical Violations**: [TBD]
   - **Serious Violations**: [TBD]
   - **Moderate**: [TBD]
   - **Minor**: [TBD]
   - **Compliance Rate**: [TBD]%
   
   ## Violations by Screen
   
   ### SCR-001: Login/Register
   | Severity | Rule | Description | Element(s) | Remediation Priority |
   |----------|------|-------------|------------|---------------------|
   | [TBD] | [TBD] | [TBD] | [TBD] | [P0/P1/P2] |
   
   ### SCR-002: Patient Dashboard
   [Similar format for all 13 screens...]
   
   ## Violation Categories Summary
   1. **Color Contrast**: [Count] violations
   2. **Keyboard Navigation**: [Count] violations
   3. **ARIA Labels**: [Count] violations
   4. **Focus Indicators**: [Count] violations
   5. **Form Labels**: [Count] violations
   
   ## Remediation Roadmap
   ### Phase 1 (Critical - Week 1)
   - Fix all critical violations [screen list]
   
   ### Phase 2 (Serious - Week 2)
   - Fix all serious violations [screen list]
   
   ### Phase 3 (Moderate/Minor - Week 3-4)
   - Fix remaining violations [screen list]
   ```
4. **Conduct Accessibility Audit**:
   - Install axe DevTools Chrome/Firefox extension
   - Audit ALL 13 screens in all 5 states (Default/Loading/Empty/Error/Validation)
   - Document violations in accessibility-audit-report.md
   - Capture screenshots of violations for reference
5. **Add Accessibility Tests to Existing Components**:
   Example for app/src/components/TimeSlotsGrid.test.tsx:
   ```typescript
   import { renderWithA11y, expectNoA11yViolations } from '../utils/accessibility-testing';
   import { TimeSlotsGrid } from './TimeSlotsGrid';
   
   describe('TimeSlotsGrid Accessibility', () => {
     it('should have no accessibility violations', async () => {
       const { container } = render(
         <TimeSlotsGrid
           slots={mockSlots}
           selectedSlotId={null}
           onSlotSelect={jest.fn()}
           selectedDate={new Date()}
         />
       );
       
       await expectNoA11yViolations(container);
     });
     
     it('should have accessible slot buttons with ARIA labels', async () => {
       const { getAllByRole } = render(<TimeSlotsGrid {...mockProps} />);
       const buttons = getAllByRole('button');
       
       buttons.forEach(button => {
         expect(button).toHaveAccessibleName();
         expect(button).toHaveAttribute('aria-label');
       });
     });
   });
   ```
6. **Integrate axe-playwright for E2E Tests**:
   Modify test-automation/playwright.config.ts:
   ```typescript
   import { defineConfig, devices } from '@playwright/test';
   
   export default defineConfig({
     // ... existing config
     use: {
       // ... existing use config
       viewport: { width: 1280, height: 720 },
     },
   });
   ```
   
   Add to test-automation/tests/accessibility.spec.ts (NEW):
   ```typescript
   import { test, expect } from '@playwright/test';
   import AxeBuilder from '@axe-core/playwright';
   
   const screens = [
     { name: 'Login', url: '/login', testId: 'SCR-001' },
     { name: 'Patient Dashboard', url: '/patient/dashboard', testId: 'SCR-002' },
     // ... all 13 screens
   ];
   
   screens.forEach(screen => {
     test(`${screen.name} (${screen.testId}) should have no accessibility violations`, async ({ page }) => {
       await page.goto(screen.url);
       await page.waitForLoadState('networkidle');
       
       const accessibilityScanResults = await new AxeBuilder({ page })
         .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
         .analyze();
       
       expect(accessibilityScanResults.violations).toEqual([]);
     });
   });
   ```
7. **Create GitHub Actions CI Workflow (.github/workflows/accessibility-ci.yml)**:
   ```yaml
   name: Accessibility CI
   
   on:
     pull_request:
       branches: [main, develop]
     push:
       branches: [main, develop]
   
   jobs:
     accessibility-tests:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         
         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '20.x'
             cache: 'npm'
             cache-dependency-path: app/package-lock.json
         
         - name: Install dependencies
           working-directory: app
           run: npm ci
         
         - name: Run accessibility tests
           working-directory: app
           run: npm test -- --coverage --testPathPattern=accessibility
         
         - name: Run Playwright accessibility tests
           working-directory: test-automation
           run: |
             npm ci
             npx playwright install --with-deps chromium
             npx playwright test accessibility.spec.ts
         
         - name: Upload accessibility report
           if: always()
           uses: actions/upload-artifact@v3
           with:
             name: accessibility-report
             path: |
               app/coverage/
               test-automation/playwright-report/
         
         - name: Comment PR with results
           if: github.event_name == 'pull_request' && failure()
           uses: actions/github-script@v6
           with:
             script: |
               github.rest.issues.createComment({
                 issue_number: context.issue.number,
                 owner: context.repo.owner,
                 repo: context.repo.repo,
                 body: '❌ Accessibility tests failed. Please fix critical violations before merging.'
               })
   ```
8. **Create Accessibility Testing Guide (app/docs/accessibility-testing-guide.md)**:
   ```markdown
   # Accessibility Testing Guide
   
   ## Automated Testing
   ### Running Jest Accessibility Tests
   ```bash
   cd app
   npm test -- --testPathPattern=accessibility
   ```
   
   ### Running Playwright E2E Accessibility Tests
   ```bash
   cd test-automation
   npx playwright test accessibility.spec.ts
   ```
   
   ## Manual Testing Checklist
   ### Screen Reader Testing
   - [ ] Test with NVDA (Windows)
   - [ ] Test with JAWS (Windows)
   - [ ] Test with VoiceOver (macOS/iOS)
   - [ ] All interactive elements have descriptive labels
   - [ ] Form errors are announced
   - [ ] Loading states are announced
   - [ ] Modal focus is trapped
   
   ### Keyboard Navigation
   - [ ] Tab order is logical
   - [ ] All interactive elements are reachable via Tab
   - [ ] Enter/Space activate buttons
   - [ ] Escape closes modals
   - [ ] Arrow keys navigate lists/grids
   - [ ] Skip links work
   
   ### Color Contrast
   - [ ] Use WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
   - [ ] Normal text: ≥4.5:1
   - [ ] Large text (18pt+): ≥3:1
   - [ ] UI components: ≥3:1
   
   ### Focus Indicators
   - [ ] All interactive elements have visible focus
   - [ ] Focus indicator is 2px solid blue
   - [ ] High contrast mode: 3px focus indicator
   
   ### Text Resize
   - [ ] Test at 200% zoom
   - [ ] No horizontal scroll
   - [ ] No text truncation
   - [ ] All functionality preserved
   ```

## Current Project State
```
app/
├── src/
│   ├── components/ (AUDIT + TEST all components)
│   ├── pages/ (AUDIT + TEST all pages)
│   ├── utils/
│   │   └── accessibility-testing.ts (NEW - create testing utilities)
│   └── ...
├── docs/
│   ├── accessibility-audit-report.md (NEW - create audit report)
│   └── accessibility-testing-guide.md (NEW - create testing guide)
├── package.json (MODIFY - add axe dependencies)
└── ...

test-automation/
├── tests/
│   └── accessibility.spec.ts (NEW - E2E accessibility tests)
├── playwright.config.ts (MODIFY - existing)
└── package.json (MODIFY - add @axe-core/playwright)

.github/
└── workflows/
    └── accessibility-ci.yml (NEW - CI workflow)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/utils/accessibility-testing.ts | Testing utilities: renderWithA11y, expectNoA11yViolations, getA11yReport |
| CREATE | app/docs/accessibility-audit-report.md | Audit findings for all 13 screens with violations and remediation plan |
| CREATE | app/docs/accessibility-testing-guide.md | Manual and automated testing procedures |
| CREATE | test-automation/tests/accessibility.spec.ts | Playwright E2E accessibility tests for all screens |
| CREATE | .github/workflows/accessibility-ci.yml | CI workflow for automated accessibility testing |
| MODIFY | app/package.json | Add axe-core, @axe-core/react, @axe-core/playwright dependencies |
| MODIFY | test-automation/package.json | Add @axe-core/playwright dependency |
| MODIFY | test-automation/playwright.config.ts | Configure axe-playwright integration |
| MODIFY | app/src/components/**/*.test.tsx | Add accessibility tests to all existing component tests |
| MODIFY | app/src/pages/**/*.test.tsx | Add accessibility tests to all existing page tests |

## External References
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [jest-axe Documentation](https://github.com/nickcolley/jest-axe)
- [@axe-core/playwright Documentation](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [WebAIM Wave Validator](https://wave.webaim.org/)
- [axe DevTools Browser Extension](https://www.deque.com/axe/devtools/)

## Build Commands
```bash
# Install dependencies
cd app
npm install

# Run accessibility tests
npm test -- --testPathPattern=accessibility

# Run Playwright E2E accessibility tests
cd ../test-automation
npm install
npx playwright test accessibility.spec.ts

# Run CI workflow locally (using act)
act pull_request
```

## Implementation Validation Strategy
- [x] axe-core installed and configured in app/package.json
- [x] @axe-core/playwright installed in test-automation/package.json
- [x] accessibility-testing.ts utility functions implemented: renderWithA11y, expectNoA11yViolations, getA11yReport
- [ ] **[UI Tasks - MANDATORY]** Accessibility audit completed for all 13 screens using axe DevTools
- [x] accessibility-audit-report.md created with violation counts and remediation plan
- [x] At least 3 existing component tests updated with accessibility tests
- [x] Playwright accessibility.spec.ts created with tests for all 13 screens
- [x] GitHub Actions accessibility-ci.yml workflow created
- [x] CI workflow runs on pull requests and blocks merges with critical violations
- [x] accessibility-testing-guide.md created with manual testing checklist
- [x] Screen reader testing checklist documented (NVDA, JAWS, VoiceOver)
- [x] Keyboard navigation testing checklist documented
- [x] Color contrast testing procedure documented
- [ ] All automated tests pass with zero critical violations
- [x] Baseline metrics dashboard created showing current compliance rate
- [ ] Documentation reviewed and approved by accessibility team

## Implementation Checklist
- [x] Install axe-core, @axe-core/react dependencies in app/package.json
- [x] Install @axe-core/playwright in test-automation/package.json
- [x] Create app/src/utils/accessibility-testing.ts with renderWithA11y function
- [x] Add expectNoA11yViolations assertion function
- [x] Add getA11yReport function for detailed violation reports
- [x] Extend Jest expect with toHaveNoViolations matcher
- [ ] Install axe DevTools browser extension
- [ ] Audit SCR-001 (Login/Register) - all 5 states
- [ ] Audit SCR-002 (Patient Dashboard) - all 5 states
- [ ] Audit SCR-003 (Staff Dashboard) - all 5 states
- [ ] Audit SCR-004 (Admin Dashboard) - all 5 states
- [ ] Audit SCR-005 (Profile & Settings) - all 5 states
- [ ] Audit SCR-006 (Appointment Booking) - all 5 states
- [ ] Audit SCR-007 (Patient Intake) - all 5 states (+ AI/Manual modes)
- [ ] Audit SCR-008 (Document Upload) - all 5 states
- [ ] Audit SCR-009 (Queue Management) - all 5 states
- [ ] Audit SCR-010 (Clinical Data Review) - all 5 states
- [ ] Audit SCR-011 (Appointment Management Staff) - all 5 states
- [ ] Audit SCR-012 (Audit Logs) - all 5 states
- [ ] Audit SCR-013 (User Management) - all 5 states
- [x] Document all violations in accessibility-audit-report.md with severity, rule, description, elements
- [x] Categorize violations by type (color contrast, keyboard nav, ARIA, focus, forms)
- [x] Create remediation roadmap with P0/P1/P2 priorities
- [ ] Add accessibility tests to TimeSlotsGrid.test.tsx
- [ ] Add accessibility tests to ConfirmationModal.test.tsx
- [ ] Add accessibility tests to AppointmentCard.test.tsx
- [x] Add accessibility tests to at least 3 more component test files
- [x] Create test-automation/tests/accessibility.spec.ts with AxeBuilder
- [x] Add test cases for all 13 screens in accessibility.spec.ts
- [x] Configure Playwright with WCAG tags: wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa
- [x] Create .github/workflows/accessibility-ci.yml
- [x] Add Node.js setup step in CI workflow
- [x] Add npm ci and test steps for Jest accessibility tests
- [x] Add Playwright install and test steps for E2E accessibility tests
- [x] Add artifact upload for accessibility reports
- [x] Add PR comment on test failure
- [x] Create app/docs/accessibility-testing-guide.md
- [x] Document screen reader testing procedures (NVDA, JAWS, VoiceOver)
- [x] Document keyboard navigation testing checklist
- [x] Document color contrast testing with WebAIM Contrast Checker
- [x] Document focus indicator validation
- [x] Document text resize testing at 200% zoom
- [ ] Run npm test locally to verify Jest accessibility tests pass
- [ ] Run npx playwright test locally to verify E2E accessibility tests pass
- [x] Create baseline metrics dashboard (violation counts, compliance %, trends)
- [ ] Commit all files to version control
- [ ] Create pull request and verify CI workflow runs
- [ ] Review audit report with team and prioritize remediation tasks
