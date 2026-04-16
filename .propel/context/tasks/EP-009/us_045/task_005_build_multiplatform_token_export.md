# Task - US_045_TASK_005

## Requirement Reference
- User Story: US_045
- Story Location: .propel/context/tasks/EP-009/us_045/us_045.md
- Acceptance Criteria:
    - AC-1: Generates design token exports for multiple platforms (CSS, SCSS, JavaScript, iOS JSON, Android XML) for future mobile apps
    - AC-1: Provides token change log tracking version history of design system updates
- Edge Cases:
    - None specific to export

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | N/A |
| **UXR Requirements** | NFR-UX02 |
| **Design Tokens** | N/A |

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Build | Node.js | 20.x |
| Library | Style Dictionary | Latest |

**Note**: All code and libraries MUST be compatible with versions above.

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
| **Mobile Impact** | Yes (exports for iOS/Android) |
| **Platform Target** | iOS / Android |
| **Min OS Version** | iOS 14.0 / Android API 26 (8.0) |
| **Mobile Framework** | N/A (token export only, not app development) |

## Task Overview
Configure Style Dictionary to generate multi-platform design token exports from the single source tokens.json file. Generate CSS variables, SCSS variables, JavaScript/TypeScript modules, iOS plist/JSON, and Android XML resources. Implement token versioning with CHANGELOG.md tracking design system updates (added tokens, changed values, deprecated tokens). Automate export generation on token changes, ensure all platforms receive consistent token values.

## Dependent Tasks
- task_001_fe_design_token_system.md (requires tokens.json source file)

## Impacted Components
- MODIFY: `app/config/style-dictionary.config.js` - Add iOS and Android platform exports
- NEW: `app/src/styles/generated/tokens.js` - JavaScript token export
- NEW: `app/src/styles/generated/tokens.d.ts` - TypeScript token type definitions
- NEW: `app/src/styles/generated/ios/tokens.json` - iOS token export
- NEW: `app/src/styles/generated/android/tokens.xml` - Android resource export
- NEW: `app/CHANGELOG.md` - Token changelog with version history
- NEW: `app/scripts/version-tokens.js` - Script to update token versions
- MODIFY: `app/package.json` - Add token versioning script

## Implementation Plan
1. **Configure iOS Export**: Add iOS platform to Style Dictionary config, generate JSON format with color names and hex values
2. **Configure Android Export**: Add Android platform, generate colors.xml with `<color>` resources
3. **JavaScript/TypeScript Export**: Generate ES modules for web use, add TypeScript type definitions for autocomplete
4. **Token Versioning**: Implement semantic versioning for token system (e.g., v1.0.0), increment on breaking changes (removed tokens), minor (new tokens), patch (value tweaks)
5. **Changelog Generation**: Create CHANGELOG.md with sections: Added, Changed, Deprecated, Removed (following Keep a Changelog format)
6. **Automated Changelog**: Build script that compares tokens.json to previous version, auto-generates changelog entries
7. **Build Pipeline**: Add pre-commit hook or CI step to regenerate all platform exports when tokens.json changes
8. **Documentation**: Add README explaining how to consume tokens on each platform (import path, usage examples)

## Current Project State
```
app/
├── config/
│   └── style-dictionary.config.js (from task_001, has CSS/SCSS)
├── src/
│   └── styles/
│       ├── tokens/
│       │   └── tokens.json
│       └── generated/
│           ├── tokens.css
│           └── tokens.scss
└── package.json
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| MODIFY | app/config/style-dictionary.config.js | Add iOS platform (format: json/plist), Android platform (format: xml) |
| CREATE | app/src/styles/generated/tokens.js | JavaScript ES module export of tokens |
| CREATE | app/src/styles/generated/tokens.d.ts | TypeScript type definitions for tokens |
| CREATE | app/src/styles/generated/ios/tokens.json | iOS JSON format (UIColor compatible) |
| CREATE | app/src/styles/generated/android/colors.xml | Android XML resources |
| CREATE | app/CHANGELOG.md | Token system changelog (semver format) |
| CREATE | app/scripts/version-tokens.js | Node script to bump token version and update changelog |
| MODIFY | app/package.json | Add `"version:tokens": "node scripts/version-tokens.js"` script |

## External References
- [Style Dictionary: Platform Configuration](https://amzn.github.io/style-dictionary/#/platforms)
- [Style Dictionary: Custom Formats](https://amzn.github.io/style-dictionary/#/formats)
- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)
- [Android: Color Resources](https://developer.android.com/guide/topics/resources/more-resources#Color)
- [iOS: Asset Catalogs](https://developer.apple.com/documentation/xcode/asset-management)

## Build Commands
```bash
cd app
npm run tokens:build     # Regenerate all platform exports
npm run version:tokens   # Bump token version, update changelog
npm run tokens:changelog # Generate changelog from git diff
```

## Implementation Validation Strategy
- [x] iOS JSON export contains all color tokens in hex format
- [x] Android XML contains `<color>` resources with correct hex values
- [x] JavaScript export allows `import { colorPrimaryMain } from './tokens.js'`
- [x] TypeScript autocomplete works for token imports
- [x] CHANGELOG.md follows Keep a Changelog format
- [x] Version script increments semver correctly (major/minor/patch)
- [x] All platform exports have identical color values (cross-platform consistency)
- [x] Token build regenerates all exports on tokens.json change

## Implementation Checklist
- [x] Modify `style-dictionary.config.js`: add `ios` platform with `format: 'json'`, output path `src/styles/generated/ios/tokens.json`
- [x] Add `android` platform with `format: 'android/resources'`, output path `src/styles/generated/android/colors.xml`
- [x] Add `javascript` platform with `format: 'javascript/es6'`, output `tokens.js`, include const exports for each token
- [x] Add `typescript` platform with custom format generating `.d.ts` type definitions: `export const colorPrimaryMain: string;`
- [x] Create `CHANGELOG.md` with initial entry: `## [1.0.0] - 2026-03-19 ### Added - Initial design token system`
- [x] Create `version-tokens.js` script: read package.json version, increment based on arg (`major`, `minor`, `patch`), update CHANGELOG.md with new section
- [x] Add changelog generation: compare current tokens.json to previous git commit, detect added/changed/removed tokens, append to CHANGELOG
- [x] Add package.json scripts: `"tokens:build": "style-dictionary build"`, `"version:tokens": "node scripts/version-tokens.js"`
- [x] Test iOS export: verify JSON contains `{ "colorPrimaryMain": "#0056B3" }`
