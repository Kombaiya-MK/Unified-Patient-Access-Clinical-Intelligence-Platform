# Task - US_045_TASK_003

## Requirement Reference
- User Story: US_045
- Story Location: .propel/context/tasks/EP-009/us_045/us_045.md
- Acceptance Criteria:
    - AC-1: Enforces token usage via ESLint plugin (no hardcoded colors/spacing in component files, must reference tokens)
- Edge Cases:
    - None specific to linting

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
| Frontend | React | 18.x |
| Tooling | ESLint | 8.x |
| Library | eslint-plugin-design-tokens | Latest |

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
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Implement ESLint rules and plugins to enforce design token usage across all component files. Prevent developers from using hardcoded color values (hex, rgb), hardcoded spacing/sizing (px, rem), or hardcoded font properties. Create custom ESLint rules that detect violations and suggest token replacements. Configure ESLint to fail CI builds when hardcoded values are detected, with exceptions for specific files (tokens.css, variable definitions).

## Dependent Tasks
- task_001_fe_design_token_system.md (requires tokens to be defined)

## Impacted Components
- NEW: `app/.eslintrc.js` - ESLint configuration (if not exists)
- NEW: `app/eslint-rules/no-hardcoded-colors.js` - Custom rule for color enforcement
- NEW: `app/eslint-rules/no-hardcoded-spacing.js` - Custom rule for spacing enforcement
- NEW: `app/eslint-rules/use-design-tokens.js` - General token enforcement rule
- MODIFY: `app/package.json` - Add ESLint plugins and scripts
- MODIFY: `app/.eslintignore` - Exclude token definition files from linting
- MODIFY: `app/vite.config.ts` - Integrate ESLint with Vite dev server

## Implementation Plan
1. **Install ESLint Plugins**: Add `eslint-plugin-no-literal-css-values` or similar, configure custom rule support
2. **Custom Rule: No Hardcoded Colors**: Create ESLint rule to detect hex codes (#FFFFFF), rgb/rgba, named colors (red, blue) in CSS/JSX
3. **Custom Rule: No Hardcoded Spacing**: Detect hardcoded px/rem values in padding, margin, width, height properties (except 0, 1px)
4. **Custom Rule: Font Properties**: Detect hardcoded font-family, font-size, font-weight outside token files
5. **Whitelist Token Files**: Configure `.eslintignore` to exclude `tokens.css`, `tokens.scss`, `tokens.json` from these rules
6. **ESLint Configuration**: Add rules to `.eslintrc.js`, set severity to "error" to fail builds
7. **Autofix Suggestions**: Where possible, provide ESLint autofix suggestions mapping hardcoded values to token equivalents (e.g., `#0056B3` -> `var(--color-primary-main)`)
8. **CI Integration**: Add `npm run lint` to CI pipeline, fail builds on violations

## Current Project State
```
app/
├── src/
│   ├── components/
│   └── styles/
│       └── generated/
│           └── tokens.css (from task_001)
├── .eslintrc.js (may exist)
└── package.json
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/eslint-rules/no-hardcoded-colors.js | Custom ESLint rule to detect hex/rgb/named colors |
| CREATE | app/eslint-rules/no-hardcoded-spacing.js | Custom ESLint rule to detect hardcoded spacing |
| CREATE | app/eslint-rules/use-design-tokens.js | General rule enforcing token usage |
| MODIFY | app/.eslintrc.js | Add custom rules, configure severity, exceptions |
| MODIFY | app/.eslintignore | Add `src/styles/tokens/**`, `src/styles/generated/**` |
| MODIFY | app/package.json | Add `eslint`, `eslint-plugin-react`, scripts for linting |
| MODIFY | app/vite.config.ts | Add ESLint plugin for dev-time feedback |

## External References
- [ESLint: Custom Rules](https://eslint.org/docs/latest/extend/custom-rules)
- [ESLint: Writing Plugins](https://eslint.org/docs/latest/extend/plugins)
- [eslint-plugin-no-literal-css-values](https://www.npmjs.com/package/eslint-plugin-no-literal-css-values)
- [AST Explorer](https://astexplorer.net/) - Tool for writing ESLint rules
- [vite-plugin-eslint](https://www.npmjs.com/package/vite-plugin-eslint)

## Build Commands
```bash
cd app
npm install eslint eslint-plugin-react vite-plugin-eslint --save-dev
npm run lint         # Run ESLint across all files
npm run lint:fix     # Auto-fix violations where possible
npm run dev          # Dev server with ESLint feedback
```

## Implementation Validation Strategy
- [ ] Hardcoded color `#FF0000` in component triggers ESLint error
- [ ] Hardcoded spacing `padding: 16px` triggers ESLint error
- [ ] Token usage `var(--color-primary-main)` passes without error
- [ ] Token definition files (tokens.css) exempt from rules
- [ ] ESLint autofix suggests token replacement where applicable
- [ ] CI pipeline fails when violations detected
- [ ] Dev server shows ESLint warnings/errors in real-time

## Implementation Checklist
- [ ] Install ESLint deps: `npm install eslint eslint-plugin-react vite-plugin-eslint --save-dev`
- [ ] Create `eslint-rules/no-hardcoded-colors.js`: detect regex patterns `/#[0-9A-Fa-f]{3,6}\b/, /rgb\(/, /rgba\(/` in JSX and CSS
- [ ] Create `eslint-rules/no-hardcoded-spacing.js`: detect hardcoded px/rem in `padding`, `margin`, `width`, `height` (except 0, 1px for borders)
- [ ] Create custom ESLint rule loader in `.eslintrc.js`: `rulesdir: ['./eslint-rules']`
- [ ] Configure `.eslintrc.js` rules: `"no-hardcoded-colors": "error"`, `"no-hardcoded-spacing": "error"`, `"no-hardcoded-fonts": "warn"`
- [ ] Add `.eslintignore`: `src/styles/tokens/`, `src/styles/generated/`, `*.config.js`
- [ ] Add ESLint scripts to package.json: `"lint": "eslint src --ext .ts,.tsx,.js,.jsx"`, `"lint:fix": "eslint src --ext .ts,.tsx --fix"`
- [ ] Integrate ESLint with Vite: import `eslint` plugin in `vite.config.ts`, show warnings in dev server
- [ ] Test ESLint: create test file with `color: #FF0000`, verify ESLint error appears
