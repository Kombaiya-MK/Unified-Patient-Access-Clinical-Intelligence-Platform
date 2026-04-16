# Task - task_004_fe_eslint_token_enforcement

## Requirement Reference
- User Story: us_045
- Story Location: .propel/context/tasks/EP-009/us_045/md
- Acceptance Criteria:
    - **AC-1 ESLint Enforcement**: Enforces token usage via ESLint plugin (no hardcoded colors/spacing in component files, must reference tokens)
    - **AC-1 No Hardcoded Values**: ESLint fails build if hardcoded hex colors (#FFFFFF), px values (padding: 16px), or hardcoded font sizes detected
    - **AC-1 Token References Required**: Components must use var(--token-name) for CSS or token imports for styled-components
- Edge Case:
    - **Exceptions**: Allow hardcoded values in tokens.css itself and Storybook stories (configure ESLint ignorePatterns)

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A (Tooling task, no UI) |
| **Screen Spec** | N/A |
| **UXR Requirements** | NFR-UX02 (Design system consistency enforcement) |
| **Design Tokens** | app/src/design-tokens/tokens.json (reference for allowed token names) |

> **Wireframe Status Legend:**
> - **N/A**: Tooling task, no user-facing UI

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- N/A (Tooling task)

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.x |
| Library | ESLint | 8.x |
| Library | eslint-plugin-no-hardcoded-values (custom or stylelint) | latest |

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
Implement ESLint rules to enforce design token usage and prevent hardcoded design values in component code. This task creates custom ESLint rules or configures existing plugins (stylelint, eslint-plugin-styled-components) to detect hardcoded colors (hex, rgb, rgba), spacing (px, rem), font sizes, and other design values. The linter fails the build when violations are found and suggests using design tokens (var(--color-primary-main) instead of #0056B3). Exceptions are configured for tokens.css itself and Storybook documentation files where hardcoded values are intentional.

## Dependent Tasks
- task_001_fe_design_token_definition (requires tokens.json for rule validation)
- task_002_fe_css_custom_properties (requires tokens.css as exception)

## Impacted Components
- **NEW**: `.eslintrc.js` or `.eslintrc.json` - ESLint configuration with custom rules
- **NEW**: `eslint-rules/no-hardcoded-design-values.js` - Custom ESLint rule detecting hardcoded values
- **NEW**: `.stylelintrc.json` - Stylelint configuration for CSS linting (complementary to ESLint)
- **MODIFY**: `package.json` - Add lint:tokens script and pre-commit hook
- **NEW**: `.eslintignore` - Ignore patterns for tokens.css and Storybook files

## Implementation Plan
1. **Choose linting strategy**: Custom ESLint rule OR stylelint for CSS + eslint-plugin-styled-components for JS
2. **Install dependencies**: stylelint, stylelint-config-standard, eslint-plugin-styled-components (if using styled-components)
3. **Create custom ESLint rule** (no-hardcoded-design-values.js) detecting: hex colors (#[0-9A-F]{6}), px values in non-token contexts, hardcoded font-size
4. **Configure ESLint** to load custom rule and apply to .tsx, .jsx, .ts, .js files
5. **Set up Stylelint** for .css files with rules: color-no-hex, declaration-property-value-disallowed-list for hardcoded px
6. **Define exceptions** in .eslintignore: tokens.css, *.stories.*, Storybook config files
7. **Add lint:tokens npm script**: "eslint src --ext .tsx,.ts,.jsx,.js" and "stylelint 'src/**/*.css'"
8. **Integrate with CI/CD**: Add lint:tokens to CI pipeline, fail build on violations
9. **Test rule**: Create test file with hardcoded color, verify ESLint error with helpful message
10. **Document exceptions**: README explaining when hardcoded values are allowed (tokens.css, Storybook)

**Focus on how to implement**:
- Custom ESLint rule uses AST (Abstract Syntax Tree) to detect Literal nodes with hex color patterns
- Stylelint color-no-hex rule catches CSS hex colors: color: #FFFFFF; → error, suggest var(--color-bg-primary)
- Use ESLint rule suggestions to provide auto-fix: replace #0056B3 with var(--color-primary-main)
- Configure ignorePatterns in .eslintrc.js for exceptions
- Reference tokens.json to validate suggested token names exist

## Current Project State
```
app/
├── .eslintrc.js (to be modified)
├── .eslintignore (to be created)
├── .stylelintrc.json (to be created)
├── eslint-rules/
│   └── no-hardcoded-design-values.js (to be created)
├── src/
│   ├── design-tokens/
│   │   └── tokens.json (from task_001)
│   └── components/
└── package.json (to be modified)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/eslint-rules/no-hardcoded-design-values.js | Custom ESLint rule: Detect hex colors (#FFFFFF), hardcoded px (padding: 16px), font-size: 14px, suggest using design tokens |
| MODIFY | app/.eslintrc.js | Add custom rule: { rules: { 'custom/no-hardcoded-design-values': 'error', 'styled-components/no-inline-styles': 'warn' }, rulesDirectory: ['eslint-rules'] } |
| CREATE | app/.stylelintrc.json | Stylelint config: { extends: 'stylelint-config-standard', rules: { 'color-no-hex': true, 'declaration-property-value-disallowed-list': { '/^(padding|margin|font-size)/': [/^\d+px$/] } } } |
| CREATE | app/.eslintignore | Ignore exceptions: src/styles/tokens.css, src/stories/**, .storybook/** (allow hardcoded values in documentation) |
| MODIFY | app/package.json | Add scripts: "lint:tokens": "eslint src --ext .tsx,.ts && stylelint 'src/**/*.css'", "lint:tokens:fix": "eslint src --ext .tsx,.ts --fix && stylelint 'src/**/*.css' --fix" |
| CREATE | app/eslint-rules/README.md | Document custom ESLint rule: Purpose, detected patterns, exceptions, how to fix violations |

## External References
- **ESLint Custom Rules**: https://eslint.org/docs/latest/extend/custom-rules (Creating custom linting rules)
- **Stylelint**: https://stylelint.io/user-guide/get-started (CSS linting tool)
- **stylelint color-no-hex**: https://stylelint.io/user-guide/rules/color-no-hex (Disallow hex colors)
- **eslint-plugin-styled-components**: https://github.com/styled-components/eslint-plugin-styled-components (Styled-components linting)
- **AST Explorer**: https://astexplorer.net/ (Tool for exploring ESLint AST patterns)
- **ESLint Rule Testing**: https://eslint.org/docs/latest/extend/custom-rules#rule-unit-tests (Testing custom rules)

## Build Commands
```bash
# Run token usage linting
cd app
npm run lint:tokens

# Run with auto-fix
npm run lint:tokens:fix

# Run in CI/CD
npm run lint:tokens # (exits with code 1 if violations found)

# Development
npm run dev
```

## Implementation Checklist
- [x] Install Stylelint and dependencies (stylelint, stylelint-config-standard) for CSS linting
- [x] Create custom ESLint rule (no-hardcoded-design-values.js) using AST parsing to detect hex colors (/#[0-9A-Fa-f]{6}/) and hardcoded px values (/\d+px/)
- [x] Configure .eslintrc.js with custom rule and .stylelintrc.json with color-no-hex rule to enforce token usage
- [x] Create .eslintignore to exclude tokens.css, Storybook files, and .storybook/** from linting (intentional hardcoded values)
- [x] Add npm scripts: "lint:tokens" (run ESLint + Stylelint) and "lint:tokens:fix" (auto-fix violations) to package.json
- [x] Write test cases for custom ESLint rule verifying error detection on hardcoded values and auto-fix replacing hex with var(--token-name)
- [x] Test linting: Run npm run lint:tokens on file with color: #FF0000, verify error shows "Use design token var(--color-primary-main)"
- [x] Integrate with CI: Add "npm run lint:tokens" step to pipeline, verify build fails when violations found and passes with compliant code
