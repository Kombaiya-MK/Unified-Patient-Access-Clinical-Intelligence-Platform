# Task - task_006_fe_token_export_system

## Requirement Reference
- User Story: us_045
- Story Location: .propel/context/tasks/EP-009/us_045/us_045.md
- Acceptance Criteria:
    - **AC-1 Multi-Platform Exports**: Generates design token exports for multiple platforms (CSS, SCSS, JavaScript, iOS JSON, Android XML) for future mobile apps
    - **AC-1 Automated Generation**: Token exports automatically generated from tokens.json source on build
    - **AC-1 Platform-Specific Formats**: CSS (.css), SCSS (.scss), JavaScript (.js), iOS JSON (.json), Android XML (.xml) formats with platform naming conventions
- Edge Case:
    - N/A (export generation task)

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A (Build tooling, no UI) |
| **Screen Spec** | N/A |
| **UXR Requirements** | NFR-UX02 (Design system multi-platform support) |
| **Design Tokens** | app/src/design-tokens/tokens.json (source for all platform exports) |

> **Wireframe Status Legend:**
> - **N/A**: Build tooling task, no user-facing UI

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- N/A (Build tooling task)

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.x |
| Library | Style Dictionary | latest |
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
Create automated design token export system generating platform-specific files from tokens.json for CSS, SCSS, JavaScript, iOS JSON, and Android XML. This task extends Style Dictionary configuration to output multiple platform formats with appropriate naming conventions (--color-primary-main for CSS, $colorPrimaryMain for SCSS, colorPrimaryMain for JS, color_primary_main for Android). The export system enables future mobile app development to use the same design tokens as the web application, ensuring cross-platform design consistency. Exports are automatically generated on npm run tokens:build and checked into version control.

## Dependent Tasks
- task_001_fe_design_token_definition (requires tokens.json source)
- task_002_fe_css_custom_properties (extends Style Dictionary config)

## Impacted Components
- **MODIFY**: `src/design-tokens/config.js` - Extend Style Dictionary with multiple platform outputs
- **NEW**: `dist/tokens/tokens.css` - CSS custom properties output
- **NEW**: `dist/tokens/tokens.scss` - SCSS variables output
- **NEW**: `dist/tokens/tokens.js` - JavaScript ES6 module output
- **NEW**: `dist/tokens/tokens.ios.json` - iOS JSON output (ColorTokens dictionary)
- **NEW**: `dist/tokens/tokens.android.xml` - Android XML resources output
- **NEW**: `src/design-tokens/transforms/` - Custom Style Dictionary transforms for naming conventions
- **MODIFY**: `package.json` - Update tokens:build to generate all platforms

## Implementation Plan
1. **Extend Style Dictionary config** with multiple platform targets: css, scss, javascript, ios, android
2. **Configure CSS platform**: Output tokens.css with CSS custom properties (--token-name)
3. **Configure SCSS platform**: Output tokens.scss with SCSS variables ($token-name)
4. **Configure JavaScript platform**: Output tokens.js as ES6 module exporting token constants
5. **Configure iOS platform**: Output tokens.ios.json with iOS naming (ColorTokens.primaryMain)
6. **Configure Android platform**: Output tokens.android.xml with Android resources (<color name="color_primary_main">...</color>)
7. **Create custom transforms**: Add naming convention transforms (camelCase for JS, snake_case for Android)
8. **Update build script**: Modify build.js to generate all platforms in single command
9. **Test exports**: Validate generated files match platform conventions and values are correct
10. **Document export usage**: README explaining how to use tokens in iOS (Swift), Android (Kotlin), and JavaScript

**Focus on how to implement**:
- Style Dictionary platforms: { css: {}, scss: {}, javascript: {}, ios: {}, android: {} }
- Use built-in transforms: css uses 'css' transform group, javascript uses 'js' group
- Android XML format: <resources><color name="color_primary_main">#0056B3</color></resources>
- iOS JSON format: { "ColorTokens": { "primaryMain": "#0056B3" } }
- Custom transform for Android: Convert camelCase to snake_case (colorPrimaryMain → color_primary_main)
- Reference Style Dictionary documentation for platform-specific configurations

## Current Project State
```
app/src/
├── design-tokens/
│   ├── tokens.json (from task_001)
│   ├── config.js (from task_002 - to be extended)
│   ├── build.js (from task_002 - to be modified)
│   └── transforms/ (to be created)
└── dist/
    └── tokens/ (to be created - generated exports)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| MODIFY | app/src/design-tokens/config.js | Extend with platforms: { css: { transformGroup: 'css', buildPath: 'dist/tokens/', files: [{ destination: 'tokens.css', format: 'css/variables' }] }, scss: { ... }, javascript: { ... }, ios: { ... }, android: { ... } } |
| CREATE | app/src/design-tokens/transforms/android-snake-case.js | Custom transform: Convert camelCase to snake_case for Android naming (colorPrimaryMain → color_primary_main) |
| CREATE | app/src/design-tokens/transforms/ios-capitalize.js | Custom transform: Capitalize first letter for iOS naming (colorPrimaryMain → ColorPrimaryMain) |
| MODIFY | app/src/design-tokens/build.js | Modify to build all platforms: StyleDictionary.extend(config).buildAllPlatforms() (already supports multiple platforms) |
| CREATE | app/dist/tokens/tokens.css | Generated CSS: :root { --color-primary-main: #0056B3; --spacing-md: 16px; } |
| CREATE | app/dist/tokens/tokens.scss | Generated SCSS: $color-primary-main: #0056B3; $spacing-md: 16px; |
| CREATE | app/dist/tokens/tokens.js | Generated JavaScript: export const colorPrimaryMain = '#0056B3'; export const spacingMd = '16px'; |
| CREATE | app/dist/tokens/tokens.ios.json | Generated iOS JSON: { "ColorTokens": { "primaryMain": "#0056B3" }, "SpacingTokens": { "md": 16 } } |
| CREATE | app/dist/tokens/tokens.android.xml | Generated Android XML: <resources><color name="color_primary_main">#0056B3</color><dimen name="spacing_md">16dp</dimen></resources> |
| CREATE | app/dist/tokens/README.md | Document token usage per platform: iOS (Swift UIColor), Android (Kotlin R.color), JavaScript (import { colorPrimaryMain }) |

## External References
- **Style Dictionary Platforms**: https://amzn.github.io/style-dictionary/#/config?id=platforms (Configuring multiple output platforms)
- **Style Dictionary Transforms**: https://amzn.github.io/style-dictionary/#/transforms (Built-in and custom transforms)
- **Android Resources**: https://developer.android.com/guide/topics/resources/more-resources#Color (Android color resource format)
- **iOS Asset Catalogs**: https://developer.apple.com/documentation/xcode/asset-management (iOS design resource management)
- **JavaScript ES6 Modules**: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules (Exporting constants)
- **SCSS Variables**: https://sass-lang.com/documentation/variables (SCSS variable syntax)

## Build Commands
```bash
# Generate all platform exports
cd app
npm run tokens:build

# Build and deploy (includes token generation)
npm run build

# Watch for token changes (auto-rebuild all platforms)
npm run tokens:watch
```

## Implementation Checklist
- [x] Extend config.js with platforms object containing 5 platforms: CSS (css/variables format), SCSS (scss/variables), JavaScript (javascript/es6), iOS (ios/plist or JSON), Android (android/resources)
- [x] Create custom transforms: android-snake-case.js (convert camelCase to snake_case for Android) and configure platform-specific transform groups
- [x] Configure build paths and file destinations for all platforms: dist/tokens/tokens.{css,scss,js,ios.json,android.xml}
- [x] Run npm run tokens:build to generate all 5 platform exports and verify dist/tokens/ directory created with correct file outputs
- [x] Create dist/tokens/README.md documenting platform-specific usage: iOS (UIColor), Android (R.color), JavaScript (ES6 imports), CSS (var(--token)), SCSS ($token)
- [x] Validate CSS export: Verify :root selector with --color-*, --spacing-*, --font-* CSS custom properties
- [x] Validate mobile exports: Android XML with <color name="color_primary_main"> snake_case naming, iOS JSON with nested ColorTokens structure
- [x] Cross-platform value consistency: Verify #0056B3 hex value identical across all platform exports (CSS, SCSS, JS, iOS, Android)
