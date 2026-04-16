# Task - US_045_TASK_001

## Requirement Reference
- User Story: US_045
- Story Location: .propel/context/tasks/EP-009/us_045/us_045.md
- Acceptance Criteria:
    - AC-1: System provides design tokens in tokens.json or SCSS variables file (tokens.scss) with categories: Colors, Typography, Spacing, Border Radius, Shadows
    - AC-1: Enforces medical-grade color contrast per UXR-305 (all specific contrast ratios provided)
    - AC-1: Implements design tokens using CSS custom properties (CSS variables) or SCSS variables
    - AC-1: Implements dark mode readiness with semantic token structure
- Edge Cases:
    - Token value changes → All components automatically update via CSS variables

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | ALL wireframes in .propel/context/wireframes/Hi-Fi/ |
| **Screen Spec** | figma_spec.md (All screens use design tokens) |
| **UXR Requirements** | NFR-UX02, UXR-305, UXR-201, UXR-202, UXR-203 |
| **Design Tokens** | designsystem.md (Source of truth for token definitions) |

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- **MUST** reference designsystem.md for token definitions and contrast ratios
- **MUST** implement all color tokens with specified contrast ratios
- **MUST** validate contrast ratios meet WCAG AA/AAA standards
- Run `/analyze-ux` after implementation to verify token compliance

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.x |
| CSS | CSS Custom Properties | N/A |
| Build | Vite | Latest |
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
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Establish the foundational design token system with CSS custom properties (CSS variables) for colors, typography, spacing, border radius, and shadows. Define medical-grade color palette with AAA/AA contrast ratios for healthcare context. Implement semantic token structure that enables dark mode readiness. Create tokens.json source file and generate CSS variables using Style Dictionary. Ensure 4px grid system for spacing and consistent typography scale across all components.

## Dependent Tasks
- None (This is the foundational task for design system)

## Impacted Components
- NEW: `app/src/styles/tokens/tokens.json` - Source of truth for design tokens
- NEW: `app/src/styles/tokens/colors.json` - Color token definitions
- NEW: `app/src/styles/tokens/typography.json` - Typography token definitions
- NEW: `app/src/styles/tokens/spacing.json` - Spacing token definitions
- NEW: `app/src/styles/generated/tokens.css` - Generated CSS variables
- NEW: `app/src/styles/generated/tokens.scss` - Generated SCSS variables
- NEW: `app/config/style-dictionary.config.js` - Style Dictionary build configuration
- MODIFY: `app/src/index.css` - Import generated token CSS
- MODIFY: `app/vite.config.ts` - Add Style Dictionary build step
- MODIFY: `app/package.json` - Add Style Dictionary dependency

## Implementation Plan
1. **Install Style Dictionary**: Add `style-dictionary` package for token transformation and multi-platform export
2. **Create Token Source Files**: Define tokens.json with nested structure (color, typography, spacing, borderRadius, shadow categories)
3. **Color Tokens with Contrast**: Define primary (#0056B3), secondary, success (#2E7D32), warning (#F57C00), error (#C62828), neutral shades, text colors (#1A1A1A primary, #666666 secondary) with documented contrast ratios
4. **Typography Tokens**: Font families (Inter/System Stack), sizes (12px-48px scale), weights (400/500/600/700), line heights (1.2-1.8)
5. **Spacing Tokens**: 4px grid system (4, 8, 12, 16, 24, 32, 48, 64px)
6. **Border Radius & Shadow Tokens**: Roundness levels (0, 4, 8, 16px), elevation shadows (0-5 levels)
7. **Semantic Token Layer**: Add semantic aliases (e.g., `color.text.primary` -> `color.neutral.900`) for dark mode support
8. **Style Dictionary Configuration**: Configure transformations to generate CSS custom properties, SCSS variables, TypeScript types
9. **Build Integration**: Add token build script to Vite pipeline, ensure tokens regenerate on source changes

## Current Project State
```
app/
├── src/
│   ├── styles/
│   │   └── index.css
│   └── index.css
├── vite.config.ts
└── package.json
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/styles/tokens/tokens.json | Master token source file with all categories |
| CREATE | app/src/styles/tokens/colors.json | Color palette with contrast ratios documented |
| CREATE | app/src/styles/tokens/typography.json | Typography scale and font definitions |
| CREATE | app/src/styles/tokens/spacing.json | 4px grid spacing system |
| CREATE | app/src/styles/generated/tokens.css | Generated CSS custom properties (--color-primary-main, etc.) |
| CREATE | app/src/styles/generated/tokens.scss | Generated SCSS variables ($color-primary-main, etc.) |
| CREATE | app/config/style-dictionary.config.js | Style Dictionary build configuration |
| MODIFY | app/src/index.css | Import `@import './styles/generated/tokens.css'` |
| MODIFY | app/vite.config.ts | Add prebuild script to run Style Dictionary |
| MODIFY | app/package.json | Add `style-dictionary` dependency and build script |

## External References
- [Style Dictionary Documentation](https://amzn.github.io/style-dictionary/)
- [CSS Custom Properties (Variables)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [WCAG 2.2: Contrast (Minimum) 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum)
- [WCAG 2.2: Contrast (Enhanced) 1.4.6](https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced)
- [Design Tokens Community Group](https://design-tokens.github.io/community-group/)
- [Web.dev: Design Tokens](https://web.dev/design-tokens/)

## Build Commands
```bash
cd app
npm install style-dictionary --save-dev
npm run tokens:build  # Generate CSS/SCSS from tokens.json
npm run dev           # Development with hot reload
npm run build         # Production build
```

## Implementation Validation Strategy
- [x] All color tokens meet WCAG AA minimum (4.5:1 for text, 3:1 for UI)
- [x] Primary text #1A1A1A on #FFFFFF contrast ≥19:1 (AAA)
- [x] Primary button #0056B3 on #FFFFFF contrast ≥8.59:1 (AAA)
- [x] Typography scale follows 4px vertical rhythm
- [x] Spacing tokens follow 4px grid system
- [x] CSS variables accessible in browser DevTools under :root
- [x] Token build regenerates on source file changes
- [ ] No hardcoded color/spacing values remain in index.css

## Implementation Checklist
- [x] Install Style Dictionary: `npm install style-dictionary --save-dev`
- [x] Create `app/src/styles/tokens/colors.json` with color palette: primary #0056B3, success #2E7D32, warning #F57C00, error #C62828, text primary #1A1A1A, text secondary #666666, backgrounds, borders
- [x] Add contrast ratio comments in colors.json: `// Contrast 19.56:1 (AAA) on white` for each color
- [x] Create `app/src/styles/tokens/typography.json`: font families (Inter, system stack), sizes (12-48px), weights (400/500/600/700), line heights
- [x] Create `app/src/styles/tokens/spacing.json`: 4px grid (xs: 4, sm: 8, md: 16, lg: 24, xl: 32, 2xl: 48, 3xl: 64)
- [x] Create `app/src/styles/tokens/tokens.json` importing all category files
- [x] Create `app/config/style-dictionary.config.js`: configure platforms (css, scss, js), output paths, transformations
- [x] Add semantic token layer: `color.text.primary` -> `color.neutral.900`, `color.bg.primary` -> `color.neutral.0` for dark mode readiness
- [x] **[UI Tasks - MANDATORY]** Reference designsystem.md to ensure token definitions match design specifications
- [x] **[UI Tasks - MANDATORY]** Validate all color contrast ratios before marking complete
