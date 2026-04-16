# Task - task_001_fe_design_token_definition

## Requirement Reference
- User Story: us_045
- Story Location: .propel/context/tasks/EP-009/us_045/us_045.md
- Acceptance Criteria:
    - **AC-1 Token Categories**: System provides design tokens with categories: Colors (primary, secondary, success, warning, error, neutral), Typography (font families, sizes 12px-48px, weights 400/500/600/700, line heights 1.2-1.8), Spacing (4px grid: 4, 8, 12, 16, 24, 32, 48, 64px), Border Radius (0, 4, 8, 16px), Shadows (elevation 0-5)
    - **AC-1 Medical-Grade Contrast**: Enforces medical-grade color contrast per UXR-305: Primary text #1A1A1A on #FFFFFF (contrast 19.56:1 - exceeds AAA), Secondary text #666666 on #FFFFFF (5.74:1 - AA compliant), Primary button bg #0056B3 text #FFFFFF (8.59:1 - AAA), Success green #2E7D32 on #FFFFFF (4.95:1 - AA), Error red #C62828 on #FFFFFF (7.28:1 - AA), Warning yellow #F57C00 on #000000 (5.91:1 - AA inverted)
    - **AC-1 Dark Mode Readiness**: Implements dark mode readiness with semantic token structure (e.g., --color-text-primary maps to different values in light/dark themes)
- Edge Case:
    - **Token Value Changes**: All components automatically update via CSS variables, no manual updates needed

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | ALL wireframes in .propel/context/wireframes/Hi-Fi/ (demonstrate design token application) |
| **Screen Spec** | .propel/context/docs/figma_spec.md (design tokens applied to all screens) |
| **UXR Requirements** | NFR-UX02 (Design system consistency), UXR-305 (Contrast ≥4.5:1), UXR-201 (Typography/spacing), UXR-202 (Medical color palette) |
| **Design Tokens** | .propel/context/docs/designsystem.md (source of truth for all token values) |

> **Wireframe Status Legend:**
> - **AVAILABLE**: All wireframes demonstrate consistent application of design tokens

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- **MUST** reference designsystem.md for all token values (colors, typography, spacing, shadows)
- **MUST** validate token values match designsystem.md specifications exactly
- **MUST** implement semantic token naming for dark mode readiness
- **MUST** validate contrast ratios using WebAIM Contrast Checker or similar tool
- Run `/analyze-ux` after implementation to verify token consistency across application

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.x |
| Library | Style Dictionary | latest |
| Library | Polished (color utilities) | latest |

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
Create a centralized design token definition file (tokens.json) that serves as the single source of truth for all design values across the application. This task defines tokens for colors (with medical-grade contrast ratios), typography (Inter font family, 12px-48px scale), spacing (4px grid system), border radius (0-16px), and elevation shadows (levels 0-5). The token structure implements semantic naming for dark mode readiness (e.g., color.text.primary vs color.neutral.900) and validates all contrast ratios meet WCAG AA/AAA standards. This foundational task enables automated CSS variable generation, multi-platform exports, and consistent design system enforcement across all components.

## Dependent Tasks
- None (foundational task, no dependencies)

## Impacted Components
- **NEW**: `src/design-tokens/tokens.json` - Master design token definition file in JSON format
- **NEW**: `src/design-tokens/tokens.scss` - SCSS variable version of tokens (for SCSS users)
- **NEW**: `src/design-tokens/README.md` - Token documentation with usage guidelines
- **NEW**: `src/design-tokens/scripts/validate-contrast.js` - Script to validate color contrast ratios
- **NEW**: `src/design-tokens/config.js` - Style Dictionary configuration
- **NEW**: `.propel/context/docs/DESIGN_TOKENS.md` - Design token reference documentation

## Implementation Plan
1. **Create tokens.json structure** with top-level categories: color, typography, spacing, radius, shadow, size
2. **Define color tokens** from designsystem.md with semantic naming: color.primary.main, color.text.primary, color.bg.primary
3. **Add medical-grade color palette** with documented contrast ratios: #1A1A1A (19.56:1), #666666 (5.74:1), #0056B3 (8.59:1)
4. **Implement typography tokens**: font families (Inter), sizes (12-48px scale), weights (400/500/600/700), line heights (1.2-1.8)
5. **Define spacing tokens**: 4px grid system (4, 8, 12, 16, 24, 32, 48, 64px) with semantic names (spacing.xs, spacing.sm, spacing.md)
6. **Create border radius tokens**: 0px (none), 4px (sm), 8px (md), 16px (lg)
7. **Define shadow tokens**: elevation levels 0-5 with box-shadow values for depth hierarchy
8. **Add component-specific tokens**: button heights (40px, 48px), input heights (44px), breakpoints (768px, 1024px, 1440px)
9. **Validate contrast ratios** using automated script (polished library or custom calculator)
10. **Document semantic vs primitive split**: Primitive tokens (color.neutral.900), Semantic tokens (color.text.primary → color.neutral.900)

**Focus on how to implement**:
- Use Style Dictionary JSON format with category.type.item structure
- Reference designsystem.md for exact color hex values, font sizes, spacing scale
- Implement semantic color tokens that reference primitive tokens (enables dark mode)
- Calculate contrast ratios using (L1 + 0.05) / (L2 + 0.05) formula or polished library
- Document token usage patterns and naming conventions in README.md

## Current Project State
```
app/src/
├── design-tokens/ (to be created)
├── styles/
│   └── index.css (will import generated CSS variables)
├── components/
└── pages/
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/design-tokens/tokens.json | Master design token definition: colors (primary, secondary, semantic, neutral), typography (fonts, sizes, weights), spacing (4px grid), radius (0-16px), shadows (0-5), sizes (component dimensions) |
| CREATE | app/src/design-tokens/tokens.scss | SCSS version of tokens for SCSS users: $color-primary-main, $spacing-md, $font-size-base variables |
| CREATE | app/src/design-tokens/README.md | Token usage documentation: naming conventions, semantic vs primitive tokens, dark mode structure, contrast ratios |
| CREATE | app/src/design-tokens/scripts/validate-contrast.js | Contrast validation script: reads tokens.json, calculates ratios, asserts AA/AAA compliance, fails if < 4.5:1 for text |
| CREATE | app/src/design-tokens/config.js | Style Dictionary config: input tokens.json, output CSS/SCSS/JS formats, transform groups |
| CREATE | app/.propel/context/docs/DESIGN_TOKENS.md | Comprehensive token reference: all categories with examples, semantic token mappings, contrast ratios table |

## External References
- **Style Dictionary**: https://amzn.github.io/style-dictionary/ (Token transformation platform)
- **Polished Color Utilities**: https://polished.js.org/ (Color manipulation and contrast calculation)
- **WCAG Contrast Ratio**: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html (4.5:1 normal text, 3:1 large text)
- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/ (Manual contrast validation)
- **Design Tokens Community Group**: https://www.w3.org/community/design-tokens/ (W3C design token standards)
- **Designsystem.md Reference**: .propel/context/docs/designsystem.md (Source of truth for all token values)

## Build Commands
```bash
# Development
cd app
npm run dev

# Generate CSS from tokens (after Style Dictionary setup in task_002)
npm run tokens:build

# Validate contrast ratios
npm run tokens:validate

# Type check
npm run type-check
```

## Implementation Checklist
- [x] Create tokens.json with all token categories (color, typography, spacing, radius, shadow) and primitive/semantic color structure from designsystem.md
- [x] Define typography tokens: Inter font family, sizes 12-48px, weights 400/500/600/700, line heights 1.2-1.8
- [x] Define spacing tokens using 4px grid: 4, 8, 12, 16, 24, 32, 48, 64px with semantic names (xs, sm, md, lg, xl, 2xl)
- [x] Define radius (0, 4, 8, 16px) and shadow tokens (elevation 0-5) for UI depth and hierarchy
- [x] Create validate-contrast.js script to verify all color pairs meet WCAG AA/AAA standards (≥4.5:1 text, ≥3:1 large text)
- [x] Document medical-grade contrast ratios in comments: Primary text 19.56:1, Secondary 5.74:1, Button 8.59:1, Success/Error/Warning ≥4.5:1
- [x] Create README.md documenting token naming conventions, semantic vs primitive tokens, dark mode structure, and usage examples
- [x] Validate all token values match designsystem.md exactly and run `/analyze-ux` to verify token structure and WCAG compliance
