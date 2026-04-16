# Task - task_005_ci_contrast_validation

## Requirement Reference
- User Story: us_045
- Story Location: .propel/context/tasks/EP-009/us_045/us_045.md
- Acceptance Criteria:
    - **AC-1 CI/CD Contrast Validation**: Validates contrast ratios in CI/CD pipeline using automated tools (e.g., axe-core, pa11y)
    - **AC-1 Build Failure**: CI pipeline fails build if contrast ratio falls below AA (< 4.5:1 for text, < 3:1 for UI components)
    - **AC-1 Failing Component Report**: Displays failing component and required contrast adjustment when violation detected
- Edge Case:
    - **Contrast Falls Below AA**: CI pipeline fails build, displays failing component and required contrast adjustment

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A (CI/CD tooling, no UI) |
| **Screen Spec** | N/A |
| **UXR Requirements** | UXR-305 (Contrast ≥4.5:1 for text, ≥3:1 for UI) |
| **Design Tokens** | app/src/design-tokens/tokens.json (color tokens validated for contrast) |

> **Wireframe Status Legend:**
> - **N/A**: CI/CD tooling task, no user-facing UI

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- N/A (CI/CD tooling task)

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.x |
| Testing | Playwright or Puppeteer | latest |
| Library | axe-core | latest |
| Library | pa11y-ci | latest |

**Note**: All code, and libraries, MUST be compatible with versions above.

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
Integrate automated accessibility testing focused on color contrast validation into the CI/CD pipeline. This task sets up axe-core and pa11y to automatically test all application pages for WCAG AA contrast compliance (≥4.5:1 for text, ≥3:1 for UI components), configures CI pipeline to run accessibility tests on every pull request, fails builds when contrast violations are detected, and generates detailed reports showing failing components with actual vs. required contrast ratios. The CI gate ensures no color contrast regressions are merged, enforcing medical-grade accessibility standards.

## Dependent Tasks
- task_001_fe_design_token_definition (requires defined color tokens with contrast ratios)
- task_002_fe_css_custom_properties (requires implemented CSS variables in components)

## Impacted Components
- **NEW**: `tests/a11y/contrast-validation.spec.ts` - Playwright test running axe-core contrast checks
- **NEW**: `.pa11yci.json` - pa11y-ci configuration for multiple page testing
- **NEW**: `scripts/contrast-report.js` - Script to generate human-readable contrast violation reports
- **NEW**: `.github/workflows/accessibility.yml` - GitHub Actions workflow for a11y testing (or equivalent CI config)
- **MODIFY**: `package.json` - Add test:a11y script
- **NEW**: `tests/a11y/pages.json` - List of pages to test for contrast violations

## Implementation Plan
1. **Install accessibility testing tools**: axe-core, @axe-core/playwright, pa11y-ci
2. **Create Playwright contrast test** (contrast-validation.spec.ts) that navigates to each page and runs axe-core checks
3. **Configure axe-core rules**: Focus on color-contrast, color-contrast-enhanced (AAA), disable non-contrast rules for this test
4. **Set up pa11y-ci** configuration (.pa11yci.json) with threshold: 0 (fail on any violation), standard: WCAG2AA
5. **Create pages.json**: List all application pages to test (/, /dashboard, /appointments, etc.)
6. **Generate contrast report script**: Parse axe/pa11y JSON output, create readable HTML/Markdown report with failing components
7. **Integrate CI workflow**: GitHub Actions workflow running "npm run test:a11y" on every PR, fail CI if violations found
8. **Add failure annotations**: CI comments on PR with failing component details and required contrast adjustments
9. **Test CI integration**: Create intentional contrast violation, verify CI fails with clear error message
10. **Document CI workflow**: README explaining how contrast validation works and how to fix violations

**Focus on how to implement**:
- Use Playwright axe integration: await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze()
- Filter axe results for color-contrast violations only: violations.filter(v => v.id === 'color-contrast')
- pa11y-ci runs headless Chromium, tests multiple pages concurrently
- CI workflow uses ubuntu-latest runner, installs dependencies, builds app, runs tests
- Contrast report shows: Component selector, Current contrast (e.g., 3.2:1), Required contrast (4.5:1), Suggested fix

## Current Project State
```
app/
├── tests/
│   └── a11y/ (to be created)
├── scripts/
│   └── contrast-report.js (to be created)
├── .github/
│   └── workflows/
│       └── accessibility.yml (to be created)
├── .pa11yci.json (to be created)
└── package.json (to be modified)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/tests/a11y/contrast-validation.spec.ts | Playwright test: Navigate to pages, run axe-core with wcag2aa tags, filter color-contrast violations, fail if count > 0 |
| CREATE | app/.pa11yci.json | pa11y-ci config: { defaults: { standard: 'WCAG2AA', runners: ['axe'], threshold: 0 }, urls: ['http://localhost:5173/', 'http://localhost:5173/dashboard'] } |
| CREATE | app/tests/a11y/pages.json | Page list: [ "/", "/dashboard", "/appointments", "/profile" ] for comprehensive contrast testing |
| CREATE | app/scripts/contrast-report.js | Parse axe/pa11y JSON output, generate HTML report: Failing component, current contrast, required contrast, suggested token |
| CREATE | app/.github/workflows/accessibility.yml | CI workflow: Install deps, build app, start dev server, run npm run test:a11y, upload contrast report artifact |
| MODIFY | app/package.json | Add scripts: "test:a11y": "playwright test tests/a11y", "test:a11y:report": "node scripts/contrast-report.js" |
| CREATE | app/tests/a11y/README.md | Document CI accessibility testing: How it works, how to run locally, how to fix violations |

## External References
- **axe-core Playwright Integration**: https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright (Running axe in Playwright tests)
- **pa11y-ci**: https://github.com/pa11y/pa11y-ci (Automated accessibility testing for CI)
- **GitHub Actions Accessibility Testing**: https://github.com/marketplace/actions/lighthouse-ci-action (Example CI workflow)
- **WCAG 2.1 Color Contrast**: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html (4.5:1 normal, 3:1 large/UI)
- **axe-core Rules Reference**: https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md (color-contrast rule details)
- **Playwright CI Integration**: https://playwright.dev/docs/ci (Running tests in CI/CD)

## Build Commands
```bash
# Install accessibility testing tools
cd app
npm install --save-dev @axe-core/playwright pa11y-ci

# Run accessibility tests locally
npm run test:a11y

# Generate contrast report
npm run test:a11y:report

# Run in CI (automatically on PR)
# CI runs: npm run build && npm run test:a11y
```

## Implementation Checklist
- [x] Install accessibility testing dependencies: @axe-core/playwright and pa11y-ci for automated WCAG AA contrast validation
- [x] Create contrast-validation.spec.ts Playwright test using AxeBuilder with wcag2aa tags, filtering for color-contrast violations only
- [x] Create .pa11yci.json config with WCAG2AA standard and urls list covering all app routes (/, /dashboard, /appointments, /profile, /admin)
- [x] Create contrast-report.js script to parse axe violations and generate HTML report showing component selector, current contrast, required ratio, and suggested token fix
- [x] Create GitHub Actions workflow (accessibility.yml) to run tests on PR: checkout → setup Node → npm ci → npm run build → npm run dev (background) → npm run test:a11y
- [x] Add CI failure annotations using actions/github-script to comment on PR with contrast violation details (component, contrast ratio, fix)
- [x] Add npm scripts: "test:a11y" (run Playwright a11y tests) and "test:a11y:report" (generate contrast report) to package.json
- [x] Test validation: Run npm run test:a11y locally on compliant app (pass), then test with intentional low contrast color #888888 on #FFFFFF (fail with clear error)
