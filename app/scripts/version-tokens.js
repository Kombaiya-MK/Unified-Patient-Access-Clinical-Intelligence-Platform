#!/usr/bin/env node

/**
 * Token Version Bumper
 *
 * Bumps the design token version using semver and prepends a new entry
 * to CHANGELOG.md following Keep a Changelog format.
 *
 * Usage:
 *   node scripts/version-tokens.js patch   # 1.0.0 -> 1.0.1
 *   node scripts/version-tokens.js minor   # 1.0.0 -> 1.1.0
 *   node scripts/version-tokens.js major   # 1.0.0 -> 2.0.0
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CHANGELOG_PATH = resolve(ROOT, 'DESIGN_TOKENS_CHANGELOG.md');
const VERSION_FILE = resolve(ROOT, '.token-version.json');
const TOKENS_JSON_PATH = resolve(ROOT, 'src/design-tokens/tokens.json');
const TOKENS_PKG_PATH = resolve(ROOT, 'src/design-tokens/package.json');

const VALID_BUMPS = ['major', 'minor', 'patch'];

function readVersion() {
  // Prefer tokens.json $version field
  if (existsSync(TOKENS_JSON_PATH)) {
    try {
      const tokens = JSON.parse(readFileSync(TOKENS_JSON_PATH, 'utf8'));
      if (tokens.$version) return tokens.$version;
    } catch { /* fall through */ }
  }

  if (existsSync(VERSION_FILE)) {
    const data = JSON.parse(readFileSync(VERSION_FILE, 'utf8'));
    return data.version;
  }

  // Parse from DESIGN_TOKENS_CHANGELOG.md header
  if (existsSync(CHANGELOG_PATH)) {
    const changelog = readFileSync(CHANGELOG_PATH, 'utf8');
    const match = changelog.match(/## \[(\d+\.\d+\.\d+)\]/);
    if (match) return match[1];
  }

  return '1.0.0';
}

function syncVersionToTokens(newVersion) {
  // Update $version in tokens.json
  if (existsSync(TOKENS_JSON_PATH)) {
    try {
      const tokens = JSON.parse(readFileSync(TOKENS_JSON_PATH, 'utf8'));
      tokens.$version = newVersion;
      tokens.$lastUpdated = formatDate();
      writeFileSync(TOKENS_JSON_PATH, JSON.stringify(tokens, null, 2) + '\n', 'utf8');
    } catch (err) {
      console.warn(`Warning: Could not update tokens.json version: ${err.message}`);
    }
  }

  // Update version in design-tokens package.json
  if (existsSync(TOKENS_PKG_PATH)) {
    try {
      const pkg = JSON.parse(readFileSync(TOKENS_PKG_PATH, 'utf8'));
      pkg.version = newVersion;
      writeFileSync(TOKENS_PKG_PATH, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    } catch (err) {
      console.warn(`Warning: Could not update design-tokens package.json version: ${err.message}`);
    }
  }
}

function bumpVersion(current, type) {
  const parts = current.split('.').map(Number);

  switch (type) {
    case 'major':
      return `${parts[0] + 1}.0.0`;
    case 'minor':
      return `${parts[0]}.${parts[1] + 1}.0`;
    case 'patch':
      return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    default:
      throw new Error(`Invalid bump type: ${type}`);
  }
}

function formatDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function detectChanges() {
  // Attempt to detect token changes by comparing current tokens with a snapshot
  const sections = { added: [], changed: [], removed: [] };

  const snapshotPath = resolve(ROOT, '.token-snapshot.json');
  const tokensDir = resolve(ROOT, 'src/styles/tokens');
  const tokenFiles = ['colors.json', 'typography.json', 'spacing.json'];

  // Build current token map
  const currentTokens = {};
  for (const file of tokenFiles) {
    const filePath = resolve(tokensDir, file);
    if (existsSync(filePath)) {
      try {
        const data = JSON.parse(readFileSync(filePath, 'utf8'));
        flattenTokens(data, '', currentTokens);
      } catch {
        // Skip malformed files
      }
    }
  }

  if (!existsSync(snapshotPath)) {
    // No previous snapshot — save current and report as initial
    writeFileSync(snapshotPath, JSON.stringify(currentTokens, null, 2), 'utf8');
    sections.added.push('Token snapshot initialized for future change detection');
    return sections;
  }

  // Compare with snapshot
  let previousTokens;
  try {
    previousTokens = JSON.parse(readFileSync(snapshotPath, 'utf8'));
  } catch {
    previousTokens = {};
  }

  const prevKeys = new Set(Object.keys(previousTokens));
  const currKeys = new Set(Object.keys(currentTokens));

  for (const key of currKeys) {
    if (!prevKeys.has(key)) {
      sections.added.push(`Token \`${key}\``);
    } else if (previousTokens[key] !== currentTokens[key]) {
      sections.changed.push(`Token \`${key}\` value changed from \`${previousTokens[key]}\` to \`${currentTokens[key]}\``);
    }
  }

  for (const key of prevKeys) {
    if (!currKeys.has(key)) {
      sections.removed.push(`Token \`${key}\``);
    }
  }

  // Update snapshot
  writeFileSync(snapshotPath, JSON.stringify(currentTokens, null, 2), 'utf8');

  return sections;
}

function flattenTokens(obj, prefix, result) {
  for (const [key, val] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object' && 'value' in val) {
      result[path] = val.value;
    } else if (val && typeof val === 'object') {
      flattenTokens(val, path, result);
    }
  }
}

function updateChangelog(newVersion, sections) {
  const date = formatDate();
  const changelog = readFileSync(CHANGELOG_PATH, 'utf8');

  const sectionBlocks = [];

  if (sections.added.length > 0) {
    sectionBlocks.push(`### Added\n\n${sections.added.map((s) => `- ${s}`).join('\n')}`);
  }
  if (sections.changed.length > 0) {
    sectionBlocks.push(`### Changed\n\n${sections.changed.map((s) => `- ${s}`).join('\n')}`);
  }
  if (sections.removed.length > 0) {
    sectionBlocks.push(`### Removed\n\n${sections.removed.map((s) => `- ${s}`).join('\n')}`);
  }

  if (sectionBlocks.length === 0) {
    sectionBlocks.push('### Changed\n\n- Token version bump (no token value changes detected)');
  }

  const newEntry = `## [${newVersion}] - ${date}\n\n${sectionBlocks.join('\n\n')}`;

  // Insert after the changelog header (before first ## entry)
  const insertPoint = changelog.indexOf('\n## ');
  let updatedChangelog;
  if (insertPoint !== -1) {
    updatedChangelog =
      changelog.slice(0, insertPoint) + '\n\n' + newEntry + '\n' + changelog.slice(insertPoint);
  } else {
    updatedChangelog = changelog + '\n\n' + newEntry + '\n';
  }

  writeFileSync(CHANGELOG_PATH, updatedChangelog, 'utf8');
  return date;
}

// ── Main ─────────────────────────────────────────────────────────────────────

const bumpType = process.argv[2];

if (!bumpType || !VALID_BUMPS.includes(bumpType)) {
  console.error(`Usage: node scripts/version-tokens.js <${VALID_BUMPS.join('|')}>`);
  process.exit(1);
}

const currentVersion = readVersion();
const newVersion = bumpVersion(currentVersion, bumpType);

console.log(`Bumping token version: ${currentVersion} -> ${newVersion} (${bumpType})`);

// Detect token changes
const changes = detectChanges();

// Update CHANGELOG.md
const date = updateChangelog(newVersion, changes);

// Save version to all locations
writeFileSync(VERSION_FILE, JSON.stringify({ version: newVersion }, null, 2) + '\n', 'utf8');
syncVersionToTokens(newVersion);

console.log(`Updated DESIGN_TOKENS_CHANGELOG.md with [${newVersion}] - ${date}`);

if (changes.added.length > 0) {
  console.log(`  Added: ${changes.added.length} entries`);
}
if (changes.changed.length > 0) {
  console.log(`  Changed: ${changes.changed.length} entries`);
}
if (changes.removed.length > 0) {
  console.log(`  Removed: ${changes.removed.length} entries`);
}

console.log('Done.');
