#!/usr/bin/env node

/**
 * Contrast Report Generator
 *
 * Reads the axe-core contrast-report.json produced by Playwright a11y tests
 * and generates a human-readable HTML report with failing components,
 * current vs required contrast ratios, and suggested token fixes.
 *
 * Usage:
 *   node scripts/contrast-report.js
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const INPUT_PATH = resolve(ROOT, 'test-results/a11y/contrast-report.json');
const OUTPUT_DIR = resolve(ROOT, 'test-results/a11y');
const HTML_OUTPUT = resolve(OUTPUT_DIR, 'contrast-report.html');
const MD_OUTPUT = resolve(OUTPUT_DIR, 'contrast-report.md');

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateHtml(report) {
  const rows = [];

  for (const screen of report.screens) {
    for (const v of screen.violations) {
      rows.push(`
        <tr class="${v.impact === 'critical' ? 'critical' : 'serious'}">
          <td>${escapeHtml(screen.page)}</td>
          <td><code>${escapeHtml(v.component)}</code></td>
          <td>${escapeHtml(v.currentRatio)}</td>
          <td>${escapeHtml(v.expectedRatio)}</td>
          <td>${escapeHtml(v.impact)}</td>
          <td>${escapeHtml(v.suggestion)}</td>
          <td><code>${escapeHtml(v.html)}</code></td>
        </tr>`);
    }
  }

  const statusColor = report.totalViolations === 0 ? '#00A145' : '#DC3545';
  const statusText = report.totalViolations === 0 ? 'PASS' : 'FAIL';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contrast Validation Report</title>
  <style>
    body { font-family: 'Inter', -apple-system, sans-serif; margin: 2rem; color: #1A1A1A; }
    h1 { font-size: 24px; }
    .summary { padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; }
    .summary.pass { background: #E6F9EF; border: 1px solid #00A145; }
    .summary.fail { background: #FCE8EA; border: 1px solid #DC3545; }
    .status { font-weight: 700; color: ${statusColor}; font-size: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { background: #F5F5F5; padding: 10px 12px; text-align: left; border-bottom: 2px solid #CCCCCC; }
    td { padding: 8px 12px; border-bottom: 1px solid #E5E5E5; vertical-align: top; }
    tr.critical td { background: #FCE8EA; }
    tr.serious td { background: #FFF2E6; }
    code { font-size: 12px; word-break: break-all; }
    .meta { color: #666666; font-size: 13px; margin-bottom: 0.5rem; }
  </style>
</head>
<body>
  <h1>WCAG AA Contrast Validation Report</h1>
  <p class="meta">Generated: ${report.generatedAt}</p>
  <div class="summary ${report.totalViolations === 0 ? 'pass' : 'fail'}">
    <span class="status">${statusText}</span> &mdash;
    ${report.totalScreens} screens tested,
    ${report.totalViolations} contrast violation(s) found
  </div>
  ${rows.length === 0
    ? '<p>All pages meet WCAG AA contrast requirements (≥4.5:1 text, ≥3:1 UI).</p>'
    : `<table>
    <thead>
      <tr>
        <th>Page</th>
        <th>Component</th>
        <th>Current Ratio</th>
        <th>Required</th>
        <th>Impact</th>
        <th>Suggested Fix</th>
        <th>HTML</th>
      </tr>
    </thead>
    <tbody>${rows.join('')}
    </tbody>
  </table>`}
</body>
</html>`;
}

function generateMarkdown(report) {
  const lines = [
    '# WCAG AA Contrast Validation Report',
    '',
    `**Status:** ${report.totalViolations === 0 ? '✅ PASS' : '❌ FAIL'}`,
    `**Screens Tested:** ${report.totalScreens}`,
    `**Violations Found:** ${report.totalViolations}`,
    `**Generated:** ${report.generatedAt}`,
    '',
  ];

  if (report.totalViolations === 0) {
    lines.push('All pages meet WCAG AA contrast requirements.');
  } else {
    lines.push('| Page | Component | Current | Required | Impact | Suggestion |');
    lines.push('|------|-----------|---------|----------|--------|------------|');

    for (const screen of report.screens) {
      for (const v of screen.violations) {
        lines.push(
          `| ${screen.page} | \`${v.component}\` | ${v.currentRatio} | ${v.expectedRatio} | ${v.impact} | ${v.suggestion} |`,
        );
      }
    }
  }

  return lines.join('\n') + '\n';
}

// ── Main ─────────────────────────────────────────────────────────────────────

if (!existsSync(INPUT_PATH)) {
  console.error(`No contrast report found at ${INPUT_PATH}`);
  console.error('Run "npm run test:a11y" first to generate the report.');
  process.exit(1);
}

const report = JSON.parse(readFileSync(INPUT_PATH, 'utf-8'));

mkdirSync(OUTPUT_DIR, { recursive: true });

writeFileSync(HTML_OUTPUT, generateHtml(report), 'utf-8');
console.log(`HTML report: ${HTML_OUTPUT}`);

writeFileSync(MD_OUTPUT, generateMarkdown(report), 'utf-8');
console.log(`Markdown report: ${MD_OUTPUT}`);

if (report.totalViolations > 0) {
  console.error(`\n❌ ${report.totalViolations} contrast violation(s) detected.`);
  process.exit(1);
}

console.log('\n✅ All pages pass WCAG AA contrast validation.');
