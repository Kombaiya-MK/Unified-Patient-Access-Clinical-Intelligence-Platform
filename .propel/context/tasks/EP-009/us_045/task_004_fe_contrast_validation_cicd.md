# Task - US_045_TASK_004

## Requirement Reference
- User Story: US_045
- Story Location: .propel/context/tasks/EP-009/us_045/us_045.md
- Acceptance Criteria:
    - AC-1: Validates contrast ratios in CI/CD pipeline using automated tools (e.g., axe-core, pa11y)
- Edge Cases:
    - Contrast ratio falls below AA → CI pipeline fails build, displays failing component and required contrast adjustment

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | N/A |
| **UXR Requirements** | UXR-305 |
| **Design Tokens** | N/A |

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.x |
| Tooling | Playwright | Latest |
| Library | axe-core | Latest |

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
Implement automated contrast ratio validation in the CI/CD pipeline using axe-core accessibility testing library. Create Playwright test scripts that scan all screens for color contrast violations, fail builds when WCAG AA minimum (4.5:1 for text, 3:1 for UI) is not met, and generate detailed violation reports showing failing components, current contrast ratio, and required adjustment. Integrate with existing Playwright test suite.

## Dependent Tasks
- task_001_fe_design_token_system.md (requires tokens to be defined with contrast ratios)

## Impacted Components
- NEW: `test-automation/e2e/accessibility/contrast-validation.spec.ts` - Contrast ratio test suite
- NEW: `test-automation/utils/axe-helpers.ts` - Axe-core utility functions
- NEW: `test-automation/reports/contrast-report.json` - Generated contrast violation report
- NEW: `.github/workflows/contrast-check.yml` - CI workflow for contrast validation (if using GitHub Actions)
- MODIFY: `test-automation/playwright.config.ts` - Add accessibility test configuration
- MODIFY: `test-automation/package.json` - Add axe-core, axe-playwright dependencies

## Implementation Plan
1. **Install Accessibility Tools**: Add `axe-core`, `axe-playwright`, `@axe-core/playwright` for contrast checking
2. **Axe Helper Utilities**: Create `axe-helpers.ts` with functions to run axe accessibility scans, filter contrast violations, format violation reports
3. **Contrast Validation Test**: Create `contrast-validation.spec.ts` that navigates to all screens (Login, Dashboards, Forms), runs axe scan, asserts zero contrast violations
4. **Violation Reporting**: Generate detailed JSON report listing failing components, current contrast ratio, expected ratio, suggested token replacement
5. **CI Pipeline Integration**: Add GitHub Actions workflow (or equivalent) that runs contrast tests on every PR, fails merge if violations detected
6. **Console Output Formatting**: Display failing components in CI logs with clear actionable guidance (e.g., "Button text #666666 on #FFFFFF has 5.74:1, needs ≥7:1 for AAA")
7. **Exclusion Configuration**: Allow excluding specific non-critical contrast violations (e.g., disabled buttons) via config file

## Current Project State
```
test-automation/
├── e2e/
│   └── (existing test files)
├── playwright.config.ts
└── package.json
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | test-automation/e2e/accessibility/contrast-validation.spec.ts | Axe-core contrast tests for all screens |
| CREATE | test-automation/utils/axe-helpers.ts | Axe utility functions (runAxe, filterContrast, formatReport) |
| CREATE | test-automation/reports/contrast-report.json | Generated violation report (JSON format) |
| CREATE | .github/workflows/contrast-check.yml | CI workflow for automated contrast validation |
| MODIFY | test-automation/playwright.config.ts | Add axe-playwright plugin, configure reporters |
| MODIFY | test-automation/package.json | Add `axe-core`, `@axe-core/playwright` deps |

## External References
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [axe-playwright Plugin](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)
- [Playwright Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
- [WCAG 2.2: Contrast (Minimum) 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum)
- [WCAG 2.2: Contrast (Enhanced) 1.4.6](https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced)

## Build Commands
```bash
cd test-automation
npm install axe-core @axe-core/playwright --save-dev
npm run test:accessibility  # Run contrast validation tests
npm run test:accessibility:report  # Generate detailed report
```

## Implementation Validation Strategy
- [x] Contrast test runs successfully on all screens (Login, Dashboards, Forms)
- [x] Test detects intentional contrast violation (e.g., text with 3:1 ratio)
- [x] Test passes when all colors meet WCAG AA minimum
- [x] Violation report JSON contains component selector, current ratio, expected ratio
- [x] CI pipeline fails PR when contrast violations detected
- [x] Console output clearly identifies failing components
- [x] Test completes within 60 seconds (performance requirement)

## Implementation Checklist
- [x] Install axe deps: `npm install axe-core @axe-core/playwright --save-dev`
- [x] Create `axe-helpers.ts`: `runAxeContrastScan(page)` wrapping AxeBuilder with color-contrast rule, `filterContrastViolations()`, `formatViolationsForConsole()`, `writeContrastReport()`
- [x] Create `contrast-validation.spec.ts`: tests navigate to each screen, run axe scan, assert violations.length === 0, log violations if found
- [x] Add screens to test: Login (SCR-001), Patient Dashboard (SCR-002), Staff Dashboard (SCR-003), Booking Form (SCR-006), Queue (SCR-009)
- [x] Implement violation formatter: returns component selector, currentRatio, expectedRatio, suggestion with token recommendation
- [x] Configure `playwright.config.ts`: added accessibility project with e2e/accessibility testDir, json+html reporters
- [x] Create `.github/workflows/contrast-check.yml`: runs on PR, builds app, serves static, runs accessibility project, uploads reports
- [x] Add exclusion config: `axe-config.json` with exclude list for disabled elements and skeleton loaders
- [x] Test with intentional violation: spec injects #999999 text on white, verifies axe detects it
