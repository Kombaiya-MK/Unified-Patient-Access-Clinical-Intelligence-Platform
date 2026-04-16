import type { Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';

/* ── Types ── */

export interface ContrastViolation {
  component: string;
  html: string;
  currentRatio: string;
  expectedRatio: string;
  suggestion: string;
  impact: string;
}

export interface ContrastReport {
  timestamp: string;
  url: string;
  totalViolations: number;
  violations: ContrastViolation[];
}

/* ── Axe scan runner ── */

export async function runAxeContrastScan(
  page: Page,
  options?: { exclude?: string[] },
): Promise<ContrastReport> {
  let builder = new AxeBuilder({ page }).withRules(['color-contrast']);

  if (options?.exclude) {
    for (const selector of options.exclude) {
      builder = builder.exclude(selector);
    }
  }

  const results = await builder.analyze();

  const violations = filterContrastViolations(results.violations);

  return {
    timestamp: new Date().toISOString(),
    url: page.url(),
    totalViolations: violations.length,
    violations,
  };
}

/* ── Filter to contrast-only violations ── */

function filterContrastViolations(
  violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations'],
): ContrastViolation[] {
  const contrastViolations: ContrastViolation[] = [];

  for (const violation of violations) {
    if (violation.id !== 'color-contrast') {
      continue;
    }

    for (const node of violation.nodes) {
      const selector = node.target.join(' > ');
      const data = (node.any[0]?.data ?? {}) as Record<string, unknown>;

      const fgColor = String(data.fgColor ?? 'unknown');
      const bgColor = String(data.bgColor ?? 'unknown');
      const contrastRatio = String(data.contrastRatio ?? 'unknown');
      const expectedRatio = String(data.expectedContrastRatio ?? '4.5');
      const fontSize = String(data.fontSize ?? '');
      const fontWeight = String(data.fontWeight ?? '');

      contrastViolations.push({
        component: selector,
        html: node.html.substring(0, 200),
        currentRatio: `${contrastRatio}:1`,
        expectedRatio: `${expectedRatio}:1`,
        suggestion: buildSuggestion(fgColor, bgColor, fontSize, fontWeight),
        impact: violation.impact ?? 'serious',
      });
    }
  }

  return contrastViolations;
}

/* ── Suggestion builder ── */

function buildSuggestion(
  fgColor: string,
  bgColor: string,
  fontSize: string,
  fontWeight: string,
): string {
  const parts: string[] = [];
  parts.push(`Foreground ${fgColor} on background ${bgColor}.`);

  if (fontSize && fontWeight) {
    parts.push(`Font: ${fontSize} / weight ${fontWeight}.`);
  }

  parts.push('Consider using --color-text-primary (#1A1A1A, 19.56:1) or --color-text-secondary (#666666, 5.74:1).');

  return parts.join(' ');
}

/* ── Console formatter ── */

export function formatViolationsForConsole(report: ContrastReport): string {
  if (report.totalViolations === 0) {
    return `✓ No contrast violations found on ${report.url}`;
  }

  const lines: string[] = [
    `✗ ${report.totalViolations} contrast violation(s) on ${report.url}`,
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

/* ── Report writer ── */

export function writeContrastReport(
  reports: ContrastReport[],
  outputDir: string,
): void {
  const outPath = path.resolve(outputDir, 'contrast-report.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const merged = {
    generatedAt: new Date().toISOString(),
    totalScreens: reports.length,
    totalViolations: reports.reduce((sum, r) => sum + r.totalViolations, 0),
    screens: reports,
  };

  fs.writeFileSync(outPath, JSON.stringify(merged, null, 2), 'utf-8');
}

/* ── Config loader ── */

export function loadExclusions(configPath: string): string[] {
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(raw) as { exclude?: string[] };
    return config.exclude ?? [];
  } catch {
    return [];
  }
}
