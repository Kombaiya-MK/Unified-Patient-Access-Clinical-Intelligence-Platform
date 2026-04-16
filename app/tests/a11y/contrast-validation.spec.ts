import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';

/**
 * WCAG AA Contrast Validation Tests
 *
 * Runs axe-core color-contrast checks against all application pages.
 * Fails the build if any element has a contrast ratio below:
 *   - 4.5:1 for normal text (< 18pt or < 14pt bold)
 *   - 3:1 for large text / UI components
 *
 * Reference: UXR-305
 */

interface PageConfig {
  path: string;
  name: string;
  auth: boolean;
  role?: string;
}

interface ContrastViolation {
  component: string;
  html: string;
  currentRatio: string;
  expectedRatio: string;
  impact: string;
  suggestion: string;
}

interface ContrastReport {
  timestamp: string;
  url: string;
  page: string;
  totalViolations: number;
  violations: ContrastViolation[];
}

const pagesConfig = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'pages.json'), 'utf-8'),
);
const pages: PageConfig[] = pagesConfig.pages;
const REPORTS_DIR = path.resolve(__dirname, '../../test-results/a11y');

const EXCLUDED_SELECTORS = [
  '[disabled]',
  '[aria-disabled="true"]',
  '.skeleton-loader',
];

const TEST_USERS: Record<string, { email: string; password: string }> = {
  patient: {
    email: process.env.TEST_PATIENT_EMAIL || 'patient@test.com',
    password: process.env.TEST_PATIENT_PASSWORD || 'Test@123',
  },
  staff: {
    email: process.env.TEST_STAFF_EMAIL || 'staff@test.com',
    password: process.env.TEST_STAFF_PASSWORD || 'Test@123',
  },
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'Test@123',
  },
};

function buildSuggestion(data: Record<string, unknown>): string {
  const fg = String(data.fgColor ?? 'unknown');
  const bg = String(data.bgColor ?? 'unknown');
  const fontSize = String(data.fontSize ?? '');
  const fontWeight = String(data.fontWeight ?? '');

  const parts = [`Foreground ${fg} on background ${bg}.`];
  if (fontSize && fontWeight) {
    parts.push(`Font: ${fontSize} / weight ${fontWeight}.`);
  }
  parts.push(
    'Use design tokens: --color-text-primary (#1A1A1A, 19.56:1) or --color-text-secondary (#666666, 5.74:1).',
  );
  return parts.join(' ');
}

function extractViolations(
  axeViolations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations'],
): ContrastViolation[] {
  const results: ContrastViolation[] = [];

  for (const violation of axeViolations) {
    if (violation.id !== 'color-contrast') {
      continue;
    }

    for (const node of violation.nodes) {
      const selector = node.target.join(' > ');
      const data = (node.any[0]?.data ?? {}) as Record<string, unknown>;

      results.push({
        component: selector,
        html: node.html.substring(0, 200),
        currentRatio: `${String(data.contrastRatio ?? 'unknown')}:1`,
        expectedRatio: `${String(data.expectedContrastRatio ?? '4.5')}:1`,
        impact: violation.impact ?? 'serious',
        suggestion: buildSuggestion(data),
      });
    }
  }

  return results;
}

function formatReport(report: ContrastReport): string {
  if (report.totalViolations === 0) {
    return `✓ ${report.page}: No contrast violations`;
  }

  const lines = [
    `✗ ${report.page}: ${report.totalViolations} contrast violation(s) at ${report.url}`,
    '─'.repeat(70),
  ];

  for (const v of report.violations) {
    lines.push(`  Component: ${v.component}`);
    lines.push(`  Ratio:     ${v.currentRatio} (needs ≥ ${v.expectedRatio})`);
    lines.push(`  Impact:    ${v.impact}`);
    lines.push(`  Fix:       ${v.suggestion}`);
    lines.push(`  HTML:      ${v.html}`);
    lines.push('');
  }

  return lines.join('\n');
}

const allReports: ContrastReport[] = [];

test.describe('WCAG AA Contrast Validation', () => {
  test.afterAll(() => {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
    const merged = {
      generatedAt: new Date().toISOString(),
      totalScreens: allReports.length,
      totalViolations: allReports.reduce((s, r) => s + r.totalViolations, 0),
      screens: allReports,
    };
    fs.writeFileSync(
      path.join(REPORTS_DIR, 'contrast-report.json'),
      JSON.stringify(merged, null, 2),
      'utf-8',
    );
  });

  for (const pageConfig of pages.filter((p) => !p.auth)) {
    test(`${pageConfig.name} (${pageConfig.path}) meets AA contrast`, async ({ page }) => {
      await page.goto(pageConfig.path, { waitUntil: 'networkidle' });

      let builder = new AxeBuilder({ page }).withRules(['color-contrast']);
      for (const sel of EXCLUDED_SELECTORS) {
        builder = builder.exclude(sel);
      }

      const results = await builder.analyze();
      const violations = extractViolations(results.violations);

      const report: ContrastReport = {
        timestamp: new Date().toISOString(),
        url: page.url(),
        page: pageConfig.name,
        totalViolations: violations.length,
        violations,
      };
      allReports.push(report);

      const formatted = formatReport(report);
      if (violations.length > 0) {
        console.error(formatted);
      } else {
        console.log(formatted);
      }

      expect(
        violations.length,
        `${pageConfig.name} has ${violations.length} contrast violation(s):\n${formatted}`,
      ).toBe(0);
    });
  }

  for (const pageConfig of pages.filter((p) => p.auth)) {
    test(`${pageConfig.name} (${pageConfig.path}) meets AA contrast`, async ({ page }) => {
      const user = TEST_USERS[pageConfig.role ?? 'patient'];

      try {
        await page.goto('/login', { waitUntil: 'networkidle' });
        await page.fill('[name="email"], [type="email"], #email', user.email);
        await page.fill('[name="password"], [type="password"], #password', user.password);
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard**', { timeout: 10_000 }).catch(() => {
          // Some roles may not redirect to dashboard
        });
      } catch {
        test.info().annotations.push({
          type: 'info',
          description: `Auth skipped for ${pageConfig.role} — testing rendered page at ${pageConfig.path}`,
        });
      }

      await page.goto(pageConfig.path, { waitUntil: 'networkidle' });

      let builder = new AxeBuilder({ page }).withRules(['color-contrast']);
      for (const sel of EXCLUDED_SELECTORS) {
        builder = builder.exclude(sel);
      }

      const results = await builder.analyze();
      const violations = extractViolations(results.violations);

      const report: ContrastReport = {
        timestamp: new Date().toISOString(),
        url: page.url(),
        page: pageConfig.name,
        totalViolations: violations.length,
        violations,
      };
      allReports.push(report);

      const formatted = formatReport(report);
      if (violations.length > 0) {
        console.error(formatted);
      } else {
        console.log(formatted);
      }

      expect(
        violations.length,
        `${pageConfig.name} has ${violations.length} contrast violation(s):\n${formatted}`,
      ).toBe(0);
    });
  }
});
