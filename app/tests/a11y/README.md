# Accessibility Testing — Contrast Validation

Automated WCAG AA contrast validation integrated into the CI/CD pipeline.

## What It Does

Runs [axe-core](https://github.com/dequelabs/axe-core) color-contrast checks against every application page via Playwright. Fails the build when any element violates WCAG AA contrast thresholds:

- **≥ 4.5:1** for normal text (< 18pt or < 14pt bold)
- **≥ 3:1** for large text (≥ 18pt or ≥ 14pt bold) and UI components

## Running Locally

```bash
# Start the dev server first
npm run dev

# In another terminal, run a11y tests
npm run test:a11y

# Generate HTML/Markdown report from test results
npm run test:a11y:report
```

Reports are written to `test-results/a11y/`:

- `contrast-report.json` — raw data
- `contrast-report.html` — visual HTML report
- `contrast-report.md` — Markdown summary

## How the CI Pipeline Works

The GitHub Actions workflow (`.github/workflows/accessibility.yml`) runs on every PR targeting `main` or `develop`:

1. Installs dependencies and Playwright browsers
2. Builds the app (`npm run build`)
3. Starts the preview server on port 5173
4. Runs `npx playwright test tests/a11y/` with axe-core
5. Generates contrast report artifacts
6. Fails the build if violations are detected
7. Comments on the PR with violation details

## Adding New Pages

Edit `tests/a11y/pages.json` to add routes:

```json
{
  "path": "/new-page",
  "name": "New Page",
  "auth": false
}
```

For authenticated pages, set `"auth": true` and specify a `"role"`.

## Fixing Violations

When a violation is reported, the output provides:

- **Component**: CSS selector of the failing element
- **Current Ratio**: The contrast ratio found (e.g., 3.2:1)
- **Required Ratio**: The minimum needed (4.5:1 or 3:1)
- **Suggestion**: Recommended design token to use

Common fixes:

| Problem | Solution |
|---------|----------|
| Light text on light background | Use `var(--color-text-primary)` (#1A1A1A, 19.56:1) |
| Low-contrast link | Use `var(--color-text-link)` (#0066CC) on white |
| Placeholder too faint | Use `var(--color-text-secondary)` (#666666, 5.74:1) |

## Excluded Elements

Elements with `[disabled]`, `[aria-disabled="true"]`, or `.skeleton-loader` are excluded from contrast checks since they represent intentionally dimmed states.

## Configuration

- **pa11y-ci**: `.pa11yci.json` (WCAG2AA standard, axe runner, zero threshold)
- **Playwright**: `playwright.config.ts` (chromium project, `tests/a11y/` test dir)
- **Pages**: `tests/a11y/pages.json`
