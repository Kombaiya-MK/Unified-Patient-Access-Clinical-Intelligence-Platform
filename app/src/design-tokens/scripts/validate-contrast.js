/**
 * Design Token Contrast Ratio Validator
 *
 * Reads medical-grade contrast pairs from tokens.json and validates
 * each pair meets its declared WCAG standard (AA >= 4.5:1, AAA >= 7:1).
 *
 * Uses the WCAG 2.1 relative luminance formula:
 *   L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 *   Contrast = (L1 + 0.05) / (L2 + 0.05)
 *
 * Usage:
 *   node src/design-tokens/scripts/validate-contrast.js
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16) / 255,
    g: parseInt(clean.substring(2, 4), 16) / 255,
    b: parseInt(clean.substring(4, 6), 16) / 255,
  };
}

function linearize(channel) {
  return channel <= 0.03928
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function contrastRatio(fg, bg) {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const THRESHOLDS = {
  AA: 4.5,
  AAA: 7.0,
};

function validate() {
  const tokensPath = resolve(__dirname, '..', 'tokens.json');
  const tokensRaw = readFileSync(tokensPath, 'utf-8');
  const tokens = JSON.parse(tokensRaw);

  const pairs = tokens.color?.medical?.['contrast-pairs'];
  if (!pairs) {
    console.error('No medical contrast pairs found in tokens.json');
    process.exit(1);
  }

  let hasFailure = false;
  const results = [];

  for (const [name, pair] of Object.entries(pairs)) {
    const { foreground, background, ratio: declaredRatio, standard, usage } = pair;
    const computed = contrastRatio(foreground, background);
    const threshold = THRESHOLDS[standard] || THRESHOLDS.AA;
    const pass = computed >= threshold;

    if (!pass) {
      hasFailure = true;
    }

    results.push({
      name,
      foreground,
      background,
      declaredRatio,
      computedRatio: `${computed.toFixed(2)}:1`,
      standard,
      threshold: `${threshold}:1`,
      status: pass ? 'PASS' : 'FAIL',
      usage,
    });
  }

  console.log('\n=== Design Token Contrast Validation ===\n');
  console.log(
    'Pair'.padEnd(20),
    'FG'.padEnd(10),
    'BG'.padEnd(10),
    'Computed'.padEnd(12),
    'Declared'.padEnd(12),
    'Std'.padEnd(6),
    'Status',
  );
  console.log('-'.repeat(82));

  for (const r of results) {
    const statusIcon = r.status === 'PASS' ? '\u2705' : '\u274C';
    console.log(
      r.name.padEnd(20),
      r.foreground.padEnd(10),
      r.background.padEnd(10),
      r.computedRatio.padEnd(12),
      r.declaredRatio.padEnd(12),
      r.standard.padEnd(6),
      `${statusIcon} ${r.status}`,
    );
  }

  console.log('\n---');
  console.log(`Total: ${results.length} pairs`);
  console.log(`Passed: ${results.filter((r) => r.status === 'PASS').length}`);
  console.log(`Failed: ${results.filter((r) => r.status === 'FAIL').length}`);

  if (hasFailure) {
    console.error('\nContrast validation FAILED. Fix failing pairs before proceeding.');
    process.exit(1);
  }

  console.log('\nAll contrast pairs meet WCAG requirements.');
  process.exit(0);
}

validate();
