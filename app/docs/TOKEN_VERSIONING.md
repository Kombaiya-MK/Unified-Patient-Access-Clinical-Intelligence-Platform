# Design Token Versioning Guide

This document describes how the design token system is versioned, how to generate changelogs, and how to handle breaking changes with migration guides.

## Semantic Versioning

Design tokens follow [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`):

| Bump    | When to use                                                                 | Example                                         |
|---------|-----------------------------------------------------------------------------|-------------------------------------------------|
| **MAJOR** | Breaking change — token removed, renamed, or value change that breaks layout/contrast | `--color-primary` renamed to `--color-primary-main` |
| **MINOR** | New token added (backward-compatible)                                      | Added `--color-accent-500`                       |
| **PATCH** | Token value tweak, description update, or bug fix                          | `--color-primary-600` changed from `#0066CC` to `#0056B3` |

The current version is stored in:
- `src/design-tokens/tokens.json` → `$version` field
- `.token-version.json` → `version` field (auto-synced)
- `src/design-tokens/package.json` → `version` field (auto-synced)

## Conventional Commits

All token changes **must** use the [Conventional Commits](https://www.conventionalcommits.org/) format with the `tokens` scope:

```
feat(tokens): Add new accent color palette
fix(tokens): Correct primary-600 hex value for AA contrast
refactor(tokens): Restructure shadow token hierarchy
docs(tokens): Update spacing token descriptions

# For breaking changes, add ! or BREAKING CHANGE footer:
feat(tokens)!: Rename --color-primary to --color-primary-main

BREAKING CHANGE: --color-primary has been renamed to --color-primary-main.
Search and replace all usages in CSS/TSX files.
```

## Workflow

### 1. Make Token Changes

Edit `src/design-tokens/tokens.json` as needed (add, modify, or remove tokens).

### 2. Commit with Conventional Commits

```bash
git add src/design-tokens/tokens.json
git commit -m "feat(tokens): Add new accent color palette"
```

### 3. Preview Changelog

Review what will be added to the changelog:

```bash
npm run tokens:changelog
```

### 4. Bump Version

Choose the appropriate bump type based on the change:

```bash
# Token value tweak (1.0.0 → 1.0.1)
npm run tokens:version patch

# New token added (1.0.0 → 1.1.0)
npm run tokens:version minor

# Breaking change (1.0.0 → 2.0.0)
npm run tokens:version major
```

This will:
- Bump the version in `tokens.json`, `.token-version.json`, and `src/design-tokens/package.json`
- Detect token changes by comparing against the snapshot
- Append a new entry to `DESIGN_TOKENS_CHANGELOG.md`

### 5. Write Changelog from Git Log (Optional)

To auto-generate changelog entries from Git commits:

```bash
npm run tokens:changelog:write
```

### 6. Commit and Push

```bash
git add .
git commit -m "chore(tokens): Release v1.1.0"
git push
```

## npm Scripts

| Script                    | Command                                            | Description                          |
|---------------------------|----------------------------------------------------|--------------------------------------|
| `tokens:version`          | `node scripts/version-tokens.js <major\|minor\|patch>` | Bump token version and update changelog |
| `tokens:changelog`        | `node scripts/generate-token-changelog.js`          | Preview pending changelog entries    |
| `tokens:changelog:write`  | `node scripts/generate-token-changelog.js --write`  | Write changelog entries to file      |
| `tokens:build`            | `style-dictionary build`                            | Rebuild CSS/SCSS/JS from tokens      |
| `tokens:validate`         | `node src/design-tokens/scripts/validate-contrast.js` | Validate contrast ratios            |

## Configuration

Changelog generation is configured in `.changelogrc.json`:

```json
{
  "types": [
    { "type": "feat", "section": "Added" },
    { "type": "fix", "section": "Changed" },
    { "type": "refactor", "section": "Changed" },
    { "type": "BREAKING CHANGE", "section": "Breaking Changes" }
  ],
  "scope": "tokens",
  "changelogFile": "DESIGN_TOKENS_CHANGELOG.md"
}
```

## Migration Guide Format

When a **MAJOR** version introduces breaking changes, include a migration guide in the changelog:

```markdown
## [2.0.0] - 2026-04-15

### Breaking Changes

- **Token renamed:** `--color-primary` → `--color-primary-main`
  - **Migration:** Search your codebase for `--color-primary` and replace with `--color-primary-main`

- **Token removed:** `--spacing-xxs`
  - **Migration:** Replace `--spacing-xxs` with `--spacing-xs` (4px)

### Added

- New `--color-accent-*` palette (500, 400, 300, 200, 100)
```

### Migration Steps

1. Read the **Breaking Changes** section in `DESIGN_TOKENS_CHANGELOG.md`
2. Search your codebase for each old token name
3. Replace with the new token name as documented
4. Run `npm run tokens:build` to regenerate CSS/SCSS/JS outputs
5. Run `npm run tokens:validate` to verify contrast ratios
6. Visually verify affected components

## File Structure

```
app/
├── .changelogrc.json                  # Changelog generation config
├── .token-version.json                # Current version tracker (auto-managed)
├── DESIGN_TOKENS_CHANGELOG.md         # Token changelog (Keep a Changelog format)
├── scripts/
│   ├── version-tokens.js              # Version bumper + changelog updater
│   └── generate-token-changelog.js    # Git log → changelog generator
└── src/design-tokens/
    ├── tokens.json                    # Source tokens with $version metadata
    └── package.json                   # npm package metadata
```
