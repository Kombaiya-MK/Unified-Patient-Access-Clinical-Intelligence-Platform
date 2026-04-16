#!/usr/bin/env node

/**
 * Generate Token Changelog
 *
 * Parses Git log for token-related Conventional Commits and generates
 * markdown changelog entries grouped by semantic version sections.
 *
 * Usage:
 *   node scripts/generate-token-changelog.js           # Show pending changes
 *   node scripts/generate-token-changelog.js --write   # Append to DESIGN_TOKENS_CHANGELOG.md
 *
 * Commit format:
 *   feat(tokens): Add new accent color token      → "Added" section
 *   fix(tokens): Correct primary-600 hex value     → "Changed" section
 *   BREAKING CHANGE: Rename --color-primary        → "Breaking Changes" section
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CHANGELOG_PATH = resolve(ROOT, 'DESIGN_TOKENS_CHANGELOG.md');
const CHANGELOGRC_PATH = resolve(ROOT, '.changelogrc.json');

/**
 * Load changelog type configuration from .changelogrc.json
 */
function loadConfig() {
  const defaults = {
    types: [
      { type: 'feat', section: 'Added' },
      { type: 'fix', section: 'Changed' },
      { type: 'refactor', section: 'Changed' },
      { type: 'perf', section: 'Changed' },
      { type: 'docs', section: 'Documentation' },
      { type: 'BREAKING CHANGE', section: 'Breaking Changes' }
    ],
    scope: 'tokens',
    changelogFile: 'DESIGN_TOKENS_CHANGELOG.md'
  };

  if (existsSync(CHANGELOGRC_PATH)) {
    try {
      const custom = JSON.parse(readFileSync(CHANGELOGRC_PATH, 'utf8'));
      return { ...defaults, ...custom };
    } catch {
      console.warn('Warning: Could not parse .changelogrc.json, using defaults');
    }
  }
  return defaults;
}

/**
 * Get the last tagged token version from the changelog
 */
function getLastVersion() {
  if (!existsSync(CHANGELOG_PATH)) {
    return null;
  }
  const changelog = readFileSync(CHANGELOG_PATH, 'utf8');
  const match = changelog.match(/## \[(\d+\.\d+\.\d+)\]/);
  return match ? match[1] : null;
}

/**
 * Get the date of the last changelog entry to filter commits
 */
function getLastChangelogDate() {
  if (!existsSync(CHANGELOG_PATH)) {
    return null;
  }
  const changelog = readFileSync(CHANGELOG_PATH, 'utf8');
  const match = changelog.match(/## \[\d+\.\d+\.\d+\] - (\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

/**
 * Parse Git log for token-related commits
 */
function getTokenCommits(sinceDate) {
  const scope = loadConfig().scope;
  const sinceArg = sinceDate ? `--since="${sinceDate}"` : '';

  let log;
  try {
    log = execSync(
      `git log ${sinceArg} --pretty=format:"%H|%s|%b|%aI" --grep="${scope}:"`,
      { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
  } catch {
    // No matching commits or git not available
    return [];
  }

  if (!log.trim()) {
    return [];
  }

  return log
    .trim()
    .split('\n')
    .map((line) => {
      const [hash, subject, body, date] = line.split('|');
      return { hash: hash?.trim(), subject: subject?.trim(), body: body?.trim(), date: date?.trim() };
    })
    .filter((c) => c.subject);
}

/**
 * Parse a Conventional Commit subject into type, scope, and description
 */
function parseConventionalCommit(subject) {
  // Match: type(scope): description  or  type(scope)!: description
  const match = subject.match(/^(\w+)\(([^)]+)\)(!)?:\s*(.+)$/);
  if (!match) {
    return null;
  }
  return {
    type: match[1],
    scope: match[2],
    breaking: !!match[3],
    description: match[4]
  };
}

/**
 * Group commits by changelog section
 */
function groupCommitsBySection(commits, config) {
  const sections = {};

  for (const commit of commits) {
    const parsed = parseConventionalCommit(commit.subject);
    if (!parsed) continue;

    // Check for BREAKING CHANGE in body
    const isBreaking = parsed.breaking || (commit.body && commit.body.includes('BREAKING CHANGE'));

    let sectionName;
    if (isBreaking) {
      sectionName = 'Breaking Changes';
    } else {
      const typeConfig = config.types.find((t) => t.type === parsed.type);
      sectionName = typeConfig ? typeConfig.section : null;
    }

    if (!sectionName) continue;

    if (!sections[sectionName]) {
      sections[sectionName] = [];
    }

    let entry = parsed.description;
    if (isBreaking && commit.body) {
      // Extract migration note from BREAKING CHANGE body
      const bcMatch = commit.body.match(/BREAKING CHANGE:\s*(.+)/s);
      if (bcMatch) {
        entry += `\n  - **Migration:** ${bcMatch[1].trim()}`;
      }
    }

    sections[sectionName].push(entry);
  }

  return sections;
}

/**
 * Format sections into markdown
 */
function formatMarkdown(sections) {
  const sectionOrder = ['Breaking Changes', 'Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Documentation'];
  const blocks = [];

  for (const name of sectionOrder) {
    if (sections[name] && sections[name].length > 0) {
      blocks.push(`### ${name}\n\n${sections[name].map((e) => `- ${e}`).join('\n')}`);
    }
  }

  // Any sections not in the predefined order
  for (const [name, entries] of Object.entries(sections)) {
    if (!sectionOrder.includes(name) && entries.length > 0) {
      blocks.push(`### ${name}\n\n${entries.map((e) => `- ${e}`).join('\n')}`);
    }
  }

  return blocks.join('\n\n');
}

/**
 * Format today's date as YYYY-MM-DD
 */
function formatDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ── Main ─────────────────────────────────────────────────────────────────────

const writeMode = process.argv.includes('--write');
const config = loadConfig();

console.log('Scanning Git log for token-related commits...\n');

const lastDate = getLastChangelogDate();
const lastVersion = getLastVersion() || '1.0.0';
const commits = getTokenCommits(lastDate);

if (commits.length === 0) {
  console.log('No new token-related commits found since last changelog entry.');
  console.log(`Last version: ${lastVersion}`);
  console.log(`Last date: ${lastDate || 'N/A'}`);
  process.exit(0);
}

console.log(`Found ${commits.length} token-related commit(s):\n`);
for (const c of commits) {
  console.log(`  - ${c.subject}`);
}

const sections = groupCommitsBySection(commits, config);
const markdown = formatMarkdown(sections);

if (!markdown) {
  console.log('\nNo changelog-worthy entries found (commits may not follow Conventional Commits format).');
  process.exit(0);
}

console.log('\n--- Generated Changelog Entry ---\n');
console.log(markdown);
console.log('\n---------------------------------\n');

if (writeMode) {
  if (!existsSync(CHANGELOG_PATH)) {
    console.error(`Error: ${CHANGELOG_PATH} not found. Create it first.`);
    process.exit(1);
  }

  const changelog = readFileSync(CHANGELOG_PATH, 'utf8');
  const date = formatDate();

  // Placeholder version — use version-tokens.js to set the actual version
  const entry = `## [Unreleased] - ${date}\n\n${markdown}`;

  const insertPoint = changelog.indexOf('\n## ');
  let updated;
  if (insertPoint !== -1) {
    updated = changelog.slice(0, insertPoint) + '\n\n' + entry + '\n' + changelog.slice(insertPoint);
  } else {
    updated = changelog + '\n\n' + entry + '\n';
  }

  writeFileSync(CHANGELOG_PATH, updated, 'utf8');
  console.log(`Changelog written to ${CHANGELOG_PATH}`);
} else {
  console.log('Run with --write to append to DESIGN_TOKENS_CHANGELOG.md');
}
