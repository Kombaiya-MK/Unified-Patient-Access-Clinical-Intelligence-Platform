# Task - task_002_fe_css_custom_properties

## Requirement Reference
- User Story: us_045
- Story Location: .propel/context/tasks/EP-009/us_045/us_045.md
- Acceptance Criteria:
    - **AC-1 CSS Custom Properties**: Implements design tokens using CSS custom properties (CSS variables) for easy theming potential
    - **AC-1 Token Usage**: All components reference tokens via var(--color-primary-main), var(--spacing-md), etc.
    - **AC-1 Dark Mode Structure**: Semantic token structure enables future dark mode (--color-text-primary maps to different values)
- Edge Case:
    - **Token Value Changes**: All components automatically update via CSS variables, no manual updates needed

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | ALL wireframes in .propel/context/wireframes/Hi-Fi/ (use design tokens for styling) |
| **Screen Spec** | .propel/context/docs/figma_spec.md (all screens use token-based styling) |
| **UXR Requirements** | NFR-UX02 (Design system consistency via CSS variables), UXR-305 (Contrast compliance) |
| **Design Tokens** | .propel/context/docs/designsystem.md, app/src/design-tokens/tokens.json (from task_001) |

> **Wireframe Status Legend:**
> - **AVAILABLE**: Wireframes demonstrate consistent styling using design tokens

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- **MUST** generate CSS custom properties from tokens.json created in task_001
- **MUST** implement :root selector for global CSS variables
- **MUST** validate all token categories (colors, typography, spacing, radius, shadows) are converted to CSS variables
- **MUST** test CSS variable inheritance and theming capability
- Run `/analyze-ux` after implementation to verify CSS variable application

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.x |
| Library | Style Dictionary | latest |
| Build | PostCSS | latest |

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
Transform design tokens from tokens.json into CSS custom properties (CSS variables) that can be consumed by all React components. This task uses Style Dictionary to automatically generate CSS variables in :root selector from the token definitions, implements semantic token mapping for dark mode readiness, creates utility classes for common token usage patterns, and validates CSS variable cascade and inheritance. The generated CSS variables enable centralized design system management where token value changes automatically propagate to all components without code modifications.

## Dependent Tasks
- task_001_fe_design_token_definition (requires tokens.json source file)

## Impacted Components
- **NEW**: `src/styles/tokens.css` - Generated CSS custom properties from tokens.json
- **NEW**: `src/styles/utilities.css` - Utility classes using token CSS variables
- **MODIFY**: `src/styles/index.css` - Import tokens.css and utilities.css
- **MODIFY**: `src/design-tokens/config.js` - Configure Style Dictionary with CSS output
- **NEW**: `src/design-tokens/build.js` - Build script to generate CSS from tokens
- **MODIFY**: `package.json` - Add tokens:build script

## Implementation Plan
1. **Install Style Dictionary** as dev dependency for token transformation
2. **Configure Style Dictionary** in config.js with CSS output format targeting src/styles/tokens.css
3. **Create build script** (build.js) that runs Style Dictionary transformation: tokens.json → tokens.css
4. **Generate CSS custom properties** in :root selector: --color-primary-main, --spacing-md, --font-size-base
5. **Implement semantic token mapping** for dark mode: --color-text-primary: var(--color-neutral-900) in light, can override in [data-theme="dark"]
6. **Create utility classes** using tokens: .text-primary { color: var(--color-text-primary); }, .p-md { padding: var(--spacing-md); }
7. **Add tokens:build npm script** to package.json running node design-tokens/build.js
8. **Import tokens.css** in src/styles/index.css to make variables globally available
9. **Validate CSS variable inheritance** in browser DevTools (check :root, body, component elements)
10. **Test theming capability** by overriding variables in a scoped selector [data-theme="dark"]

**Focus on how to implement**:
- Style Dictionary transforms tokens.json format into CSS variables automatically
- Configure CSS/variables format in Style Dictionary with prefix "token-" (optional)
- Use semantic tokens in components: var(--color-text-primary) not var(--color-neutral-900)
- Create data-theme attribute infrastructure for future dark mode implementation
- Reference generated tokens.css in index.css @import or <link> in HTML

## Current Project State
```
app/src/
├── design-tokens/
│   ├── tokens.json (from task_001)
│   ├── config.js (to be modified)
│   └── build.js (to be created)
├── styles/
│   ├── index.css (to be modified)
│   ├── tokens.css (to be generated)
│   └── utilities.css (to be created)
└── package.json (to be modified)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/styles/tokens.css | Generated CSS custom properties: :root selector with --color-*, --spacing-*, --font-*, --radius-*, --shadow-* variables (auto-generated by Style Dictionary) |
| CREATE | app/src/styles/utilities.css | Utility classes using tokens: .text-primary, .bg-secondary, .p-md, .mt-lg, .rounded-md, .shadow-sm classes |
| MODIFY | app/src/styles/index.css | Add @import './tokens.css'; @import './utilities.css'; at top to load CSS variables globally |
| MODIFY | app/src/design-tokens/config.js | Configure Style Dictionary: { source: ['tokens.json'], platforms: { css: { transformGroup: 'css', buildPath: 'src/styles/', files: [{ destination: 'tokens.css', format: 'css/variables' }] } } } |
| CREATE | app/src/design-tokens/build.js | Style Dictionary build script: const StyleDictionary = require('style-dictionary').extend('./config.js'); StyleDictionary.buildAllPlatforms(); |
| MODIFY | app/package.json | Add scripts: "tokens:build": "node src/design-tokens/build.js", "tokens:watch": "nodemon --watch src/design-tokens/tokens.json --exec npm run tokens:build" |
| CREATE | app/src/styles/theme-setup.css | Data-theme infrastructure: [data-theme="light"] { /* default */ }, [data-theme="dark"] { /* override semantic tokens */ } for future dark mode |

## External References
- **Style Dictionary CSS Format**: https://amzn.github.io/style-dictionary/#/formats?id=cssvariables (CSS custom properties output format)
- **MDN CSS Custom Properties**: https://developer.mozilla.org/en-US/docs/Web/CSS/--* (CSS variable syntax and usage)
- **CSS Theming with Custom Properties**: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties (Theming patterns)
- **Style Dictionary Transforms**: https://amzn.github.io/style-dictionary/#/transforms (Token transformation pipeline)
- **PostCSS Custom Properties**: https://github.com/postcss/postcss-custom-properties (Fallback support for older browsers)
- **Designsystem.md Reference**: .propel/context/docs/designsystem.md (Design token specifications)

## Build Commands
```bash
# Development
cd app
npm run dev

# Build CSS from tokens (run after token changes)
npm run tokens:build

# Watch tokens for changes (auto-rebuild)
npm run tokens:watch

# Production build
npm run build
```

## Implementation Checklist
- [x] Install Style Dictionary and configure config.js for CSS output to src/styles/tokens.css using css/variables format
- [x] Create build.js to run StyleDictionary transformation and add npm scripts: "tokens:build" and "tokens:watch" to package.json
- [x] Run npm run tokens:build to generate tokens.css with :root selector containing all CSS variables (--color-*, --spacing-*, --font-*, --radius-*, --shadow-*)
- [x] Create utilities.css with helper classes: .text-primary, .bg-secondary, .p-md using var() references to tokens
- [x] Create theme-setup.css with [data-theme="light"] and [data-theme="dark"] selectors overriding semantic tokens for dark mode
- [x] Import tokens.css and utilities.css in index.css to make variables globally available
- [x] Validate CSS variable generation: Inspect :root in browser DevTools, verify all tokens present and semantic variables reference primitives correctly
- [x] Test theming: Add data-theme="dark" to <html>, verify semantic tokens override correctly and components update automatically
