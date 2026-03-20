# Task - task_007_fe_token_versioning_changelog

## Requirement Reference
- User Story: us_045
- Story Location: .propel/context/tasks/EP-009/us_045/us_045.md
- Acceptance Criteria:
    - **AC-1 Token Change Log**: Provides token change log tracking version history of design system updates
    - **AC-1 Semantic Versioning**: Tokens follow semantic versioning (MAJOR.MINOR.PATCH) for breaking changes, new tokens, and bug fixes
    - **AC-1 Migration Guides**: Change log includes migration guides for breaking changes (e.g., token renamed --color-primary → --color-primary-main)
- Edge Case:
    - **Token Value Changes**: All components automatically update via CSS variables, changelog documents the change for awareness

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A (Documentation task, no UI) |
| **Screen Spec** | N/A |
| **UXR Requirements** | NFR-UX02 (Design system versioning and documentation) |
| **Design Tokens** | app/src/design-tokens/tokens.json (source with version metadata) |

> **Wireframe Status Legend:**
> - **N/A**: Documentation task, no user-facing UI

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- N/A (Documentation task)

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.x |
| Library | Semantic Release | latest |
| Build | Node.js | 20.x |

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
Implement design token versioning and automated changelog generation to track design system evolution over time. This task adds version metadata to tokens.json (version: "1.0.0"), creates CHANGELOG.md with semantic versioning (MAJOR for breaking changes, MINOR for new tokens, PATCH for value updates), generates automated changelog entries from Git commits using Conventional Commits, provides migration guides for breaking changes (token renames, removals), and publishes token versions as npm package (optional for consumption by other projects). The versioning system enables teams to track design system changes and plan updates accordingly.

## Dependent Tasks
- task_001_fe_design_token_definition (requires tokens.json to version)
- task_002_fe_css_custom_properties (generated CSS includes version comment)

## Impacted Components
- **MODIFY**: `src/design-tokens/tokens.json` - Add version metadata field
- **NEW**: `DESIGN_TOKENS_CHANGELOG.md` - Design token change log
- **NEW**: `src/design-tokens/package.json` - npm package metadata for token publishing (optional)
- **NEW**: `scripts/generate-token-changelog.js` - Script to generate changelog from Git commits
- **NEW**: `.changelogrc.json` - Changelog generation configuration
- **MODIFY**: `package.json` - Add changelog generation script

## Implementation Plan
1. **Add version field** to tokens.json metadata: { "version": "1.0.0", "tokens": { ... } }
2. **Create DESIGN_TOKENS_CHANGELOG.md** with initial entry (v1.0.0 - Initial release)
3. **Implement Conventional Commits** for token changes: feat(tokens): Add new color token, fix(tokens): Update primary color hex
4. **Set up changelog generation script** using conventional-changelog or custom script parsing Git log
5. **Define versioning rules**: MAJOR (token removed/renamed), MINOR (new token added), PATCH (token value changed)
6. **Create migration guide template**: For breaking changes, document old → new token mapping
7. **Add npm scripts**: "tokens:version": bump version in tokens.json, "tokens:changelog": generate changelog entry
8. **Optional: Publish as npm package**: Create design-tokens package.json, publish to npm registry for consumption
9. **Automate changelog on release**: CI workflow generates changelog entry when token version bumped
10. **Document versioning workflow**: README explaining how to version tokens, generate changelog, publish updates

**Focus on how to implement**:
- Use semantic-release or standard-version for automated versioning
- Conventional Commits format: type(scope): message (feat(tokens): ..., fix(tokens): ..., BREAKING CHANGE: ...)
- Parse Git log: git log --pretty=format:"%s|%b" --grep="tokens:" to filter token-related commits
- Changelog format: ## [1.1.0] - 2026-03-20 ### Added - New color token `--color-accent` ### Changed - Updated `--color-primary-main` from #0066CC to #0056B3
- Migration guide: **Breaking:** `--color-primary` renamed to `--color-primary-main`. Replace all instances.

## Current Project State
```
app/
├── src/
│   └── design-tokens/
│       ├── tokens.json (to be modified)
│       └── package.json (to be created)
├── scripts/
│   └── generate-token-changelog.js (to be created)
├── DESIGN_TOKENS_CHANGELOG.md (to be created)
├── .changelogrc.json (to be created)
└── package.json (to be modified)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| MODIFY | app/src/design-tokens/tokens.json | Add version metadata: { "$version": "1.0.0", "$description": "Unified Patient Access Design Tokens", "color": { ... }, "typography": { ... } } |
| CREATE | app/DESIGN_TOKENS_CHANGELOG.md | Initial changelog: # Design Tokens Changelog ## [1.0.0] - 2026-03-19 ### Added - Initial design token system with colors, typography, spacing, radius, shadows |
| CREATE | app/scripts/generate-token-changelog.js | Script parsing Git log for token commits, generates markdown changelog entries with semantic versioning |
| CREATE | app/.changelogrc.json | Configuration for changelog generation: { "types": [{ "type": "feat", "section": "Added" }, { "type": "fix", "section": "Changed" }, { "type": "BREAKING CHANGE", "section": "Breaking Changes" }] } |
| CREATE | app/src/design-tokens/package.json | npm package metadata: { "name": "@upaci/design-tokens", "version": "1.0.0", "main": "tokens.json", "files": ["tokens.json", "dist/"] } |
| MODIFY | app/package.json | Add scripts: "tokens:version": "npm version <major|minor|patch> --prefix src/design-tokens", "tokens:changelog": "node scripts/generate-token-changelog.js" |
| CREATE | app/docs/TOKEN_VERSIONING.md | Document versioning workflow: How to version tokens, generate changelog, publish npm package, migration guides |

## External References
- **Semantic Versioning**: https://semver.org/ (MAJOR.MINOR.PATCH versioning specification)
- **Conventional Commits**: https://www.conventionalcommits.org/ (Commit message format for automated changelog)
- **semantic-release**: https://github.com/semantic-release/semantic-release (Automated versioning and changelog)
- **standard-version**: https://github.com/conventional-changelog/standard-version (Alternative versioning tool)
- **npm Package Publishing**: https://docs.npmjs.com/cli/v9/commands/npm-publish (Publishing design tokens as npm package)
- **Keep a Changelog**: https://keepachangelog.com/ (Changelog format best practices)

## Build Commands
```bash
# Bump token version (PATCH: value change)
cd app
npm run tokens:version patch

# Bump token version (MINOR: new token added)
npm run tokens:version minor

# Bump token version (MAJOR: breaking change)
npm run tokens:version major

# Generate changelog entry
npm run tokens:changelog

# Publish tokens as npm package (optional)
cd src/design-tokens
npm publish
```

## Implementation Checklist
- [ ] Add metadata to tokens.json: Insert { "$version": "1.0.0", "$description": "UPACI Design Tokens", "$author": "Design System Team" } at top before token categories
- [ ] Create DESIGN_TOKENS_CHANGELOG.md with initial v1.0.0 entry following Keep a Changelog format (## [Version] - Date, ### Added/Changed/Removed sections)
- [ ] Create generate-token-changelog.js script to parse Git log (--grep="tokens:"), extract Conventional Commits, and generate markdown sections for changelog
- [ ] Configure .changelogrc.json with commit types mapping: feat(tokens) → Added, fix(tokens) → Changed, BREAKING CHANGE → Breaking Changes section
- [ ] Add npm scripts: "tokens:version" (bump version in tokens.json), "tokens:changelog" (generate changelog from Git log) to package.json
- [ ] Create TOKEN_VERSIONING.md documenting semantic versioning rules (MAJOR: breaking changes, MINOR: new tokens, PATCH: fixes), Conventional Commit format, and migration guide template
- [ ] Test versioning workflow: Run npm run tokens:version patch (1.0.0 → 1.0.1), make token change with feat(tokens) commit, run npm run tokens:changelog, verify entry generated
- [ ] Validate changelog structure: Verify DESIGN_TOKENS_CHANGELOG.md follows Keep a Changelog format and includes migration guide for breaking changes (token renamed, code update instructions)
