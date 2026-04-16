# Task - US_045_TASK_002

## Requirement Reference
- User Story: US_045
- Story Location: .propel/context/tasks/EP-009/us_045/us_045.md
- Acceptance Criteria:
    - AC-1: Provides token documentation in Storybook showing all available tokens with visual examples and code snippets
- Edge Cases:
    - None specific to documentation

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | N/A |
| **UXR Requirements** | NFR-UX02 |
| **Design Tokens** | designsystem.md |

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
No wireframe reference needed (focuses on documentation, not UI screens).

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.x |
| Library | Storybook | 7.x |

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
Create comprehensive Storybook documentation for the design token system, showcasing all color, typography, spacing, shadow, and border radius tokens with visual examples, code snippets, and usage guidelines. Build interactive stories that demonstrate token usage in real components, display contrast ratios for color tokens, and provide copy-paste ready CSS snippets for developers.

## Dependent Tasks
- task_001_fe_design_token_system.md (requires tokens to be defined)

## Impacted Components
- NEW: `app/src/stories/DesignTokens/Colors.stories.tsx` - Color token documentation
- NEW: `app/src/stories/DesignTokens/Typography.stories.tsx` - Typography token documentation
- NEW: `app/src/stories/DesignTokens/Spacing.stories.tsx` - Spacing token documentation
- NEW: `app/src/stories/DesignTokens/Shadows.stories.tsx` - Shadow token documentation
- NEW: `app/src/stories/DesignTokens/TokenShowcase.tsx` - Reusable token display component
- NEW: `app/.storybook/main.js` - Storybook configuration (if not exists)
- NEW: `app/.storybook/preview.js` - Global Storybook styles
- MODIFY: `app/package.json` - Add Storybook dependencies and scripts

## Implementation Plan
1. **Install Storybook**: Add Storybook 7.x with React preset, configure for Vite
2. **Token Showcase Component**: Create `TokenShowcase.tsx` reusable component for displaying tokens (color swatch + name + CSS variable + code snippet)
3. **Colors Story**: Create `Colors.stories.tsx` showing all color tokens grouped by category (primary, success, error, neutrals), display contrast ratios as badges
4. **Typography Story**: Create `Typography.stories.tsx` showing font families, sizes, weights, line heights with live text examples
5. **Spacing Story**: Create `Spacing.stories.tsx` visualizing spacing scale with boxes representing each size
6. **Shadows Story**: Create `Shadows.stories.tsx` showing elevation levels with cards demonstrating each shadow
7. **Code Snippet Generation**: Add copy-to-clipboard functionality for CSS variable names and usage examples
8. **Contrast Ratio Display**: Add contrast ratio badges to color tokens (AAA/AA/Fail indicators)
9. **Global Storybook Styles**: Import generated tokens.css in preview.js for all stories to use

## Current Project State
```
app/
├── src/
│   ├── styles/
│   │   └── generated/
│   │       └── tokens.css (from task_001)
│   └── stories/ (may not exist yet)
├── .storybook/ (may not exist yet)
└── package.json
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/.storybook/main.js | Storybook configuration for Vite + React |
| CREATE | app/.storybook/preview.js | Global styles import (tokens.css) |
| CREATE | app/src/stories/DesignTokens/Colors.stories.tsx | Color token documentation with swatches |
| CREATE | app/src/stories/DesignTokens/Typography.stories.tsx | Typography token examples |
| CREATE | app/src/stories/DesignTokens/Spacing.stories.tsx | Spacing scale visualization |
| CREATE | app/src/stories/DesignTokens/Shadows.stories.tsx | Shadow elevation examples |
| CREATE | app/src/stories/DesignTokens/TokenShowcase.tsx | Reusable token display component |
| MODIFY | app/package.json | Add Storybook deps: `@storybook/react`, `@storybook/addon-essentials`, scripts |

## External References
- [Storybook 7 Documentation](https://storybook.js.org/docs/react/get-started/introduction)
- [Storybook Vite Plugin](https://storybook.js.org/docs/react/builders/vite)
- [Storybook Addon Essentials](https://storybook.js.org/docs/react/essentials/introduction)
- [Design System Documentation Best Practices](https://bradfrost.com/blog/post/design-system-documentation/)
- [MDN: Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)

## Build Commands
```bash
cd app
npx storybook@latest init --type react --builder vite
npm run storybook  # Start Storybook dev server
npm run build-storybook  # Build static Storybook
```

## Implementation Validation Strategy
- [x] Storybook runs successfully on http://localhost:6006
- [x] All color tokens displayed with swatches, names, and contrast ratios
- [x] Typography examples show all font sizes, weights, families
- [x] Spacing boxes demonstrate 4px grid system visually
- [x] Shadow examples show clear elevation differences
- [x] Copy-to-clipboard functionality works for CSS variable names
- [x] Contrast ratio badges correctly show AAA/AA/Fail for each color
- [x] Storybook builds statically without errors

## Implementation Checklist
- [x] Initialize Storybook: `npx storybook@latest init --type react --builder vite`
- [x] Create `TokenShowcase.tsx`: accepts token name, value, category; displays swatch/example, CSS variable, copy button
- [x] Create `Colors.stories.tsx`: map color tokens from tokens.css, group by category (primary/success/error/text/bg/border), add contrast ratio badges
- [x] Add contrast ratio calculation function: use `relative-luminance` formula, display "AAA (19.56:1)", "AA (5.74:1)", or "Fail" badge
- [x] Create `Typography.stories.tsx`: render text samples at each font size, weight; display CSS variable and font-family
- [x] Create `Spacing.stories.tsx`: render boxes with width/height set to each spacing token, label with pixel value
- [x] Create `Shadows.stories.tsx`: render cards with each shadow token applied, label elevation level
- [x] Add copy-to-clipboard: use `navigator.clipboard.writeText(cssVariable)`, show "Copied!" feedback
- [x] Configure `.storybook/preview.js`: import `../src/styles/generated/tokens.css`
