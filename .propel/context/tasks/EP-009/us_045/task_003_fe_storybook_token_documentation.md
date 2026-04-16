# Task - task_003_fe_storybook_token_documentation

## Requirement Reference
- User Story: us_045
- Story Location: .propel/context/tasks/EP-009/us_045.md
- Acceptance Criteria:
    - **AC-1 Token Documentation**: Provides token documentation in Storybook showing all available tokens with visual examples and code snippets
    - **AC-1 Visual Examples**: Storybook displays color swatches, typography specimens, spacing scales, and shadow examples
    - **AC-1 Code Snippets**: Each token shows CSS variable usage (var(--color-primary-main)) and SCSS variable usage ($color-primary-main)
- Edge Case:
    - N/A (documentation task)

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A (Storybook documentation, no wireframe) |
| **Screen Spec** | .propel/context/docs/figma_spec.md (design token specifications) |
| **UXR Requirements** | NFR-UX02 (Design system documentation) |
| **Design Tokens** | app/src/design-tokens/tokens.json (source for Storybook stories) |

> **Wireframe Status Legend:**
> - **N/A**: Storybook documentation task, no user-facing wireframe

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- N/A (Storybook documentation task)

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.x |
| Library | Storybook | 7.x |
| Library | @storybook/addon-docs | 7.x |

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
Create comprehensive Storybook documentation for all design tokens with visual examples, code snippets, and usage guidelines. This task sets up Storybook (if not already initialized), creates token stories showing color swatches with hex values and contrast ratios, typography specimens with font sizes and weights, spacing scale visualizations, border radius examples, and shadow elevation samples. Each token category includes copy-to-clipboard code snippets for CSS variables (var(--token-name)) and SCSS variables ($token-name), making it easy for developers to reference and use tokens correctly.

## Dependent Tasks
- task_001_fe_design_token_definition (requires tokens.json)
- task_002_fe_css_custom_properties (requires tokens.css generated CSS variables)

## Impacted Components
- **NEW**: `.storybook/main.js` - Storybook configuration (if not exists)
- **NEW**: `.storybook/preview.js` - Global Storybook styles importing tokens.css
- **NEW**: `src/stories/DesignTokens/Colors.stories.mdx` - Color token documentation with swatches
- **NEW**: `src/stories/DesignTokens/Typography.stories.mdx` - Typography token documentation with specimens
- **NEW**: `src/stories/DesignTokens/Spacing.stories.mdx` - Spacing token documentation with visual scale
- **NEW**: `src/stories/DesignTokens/BorderRadius.stories.mdx` - Border radius examples
- **NEW**: `src/stories/DesignTokens/Shadows.stories.mdx` - Shadow elevation examples
- **NEW**: `src/stories/DesignTokens/components/TokenTable.tsx` - Reusable component for token display tables

## Implementation Plan
1. **Initialize Storybook** (if not exists): npx storybook@latest init, configure for React + Vite
2. **Import tokens.css** in .storybook/preview.js to make CSS variables available in stories
3. **Create TokenTable component**: Reusable React component displaying token name, value, visual example, code snippet
4. **Build Colors.stories.mdx**: Color swatches organized by category (primary, secondary, semantic, neutral), show hex values and contrast ratios
5. **Create Typography.stories.mdx**: Typography specimens showing font families, sizes (12-48px), weights (400-700), line heights
6. **Develop Spacing.stories.mdx**: Visual spacing scale with boxes showing 4px grid (4, 8, 12, 16, 24, 32, 48, 64px)
7. **Implement BorderRadius.stories.mdx**: Border radius examples with boxes showing 0px, 4px, 8px, 16px corners
8. **Create Shadows.stories.mdx**: Shadow elevation samples showing levels 0-5 with cards demonstrating depth
9. **Add code snippet copy buttons**: Click-to-copy for CSS variables (var(--color-primary-main)) and SCSS ($color-primary-main)
10. **Organize Storybook sidebar**: Group token stories under "Design Tokens" category

**Focus on how to implement**:
- Use Storybook MDX format for rich documentation combining Markdown and React components
- TokenTable component accepts props: tokens array, renderExample function for visual display
- Import tokens.json in stories to programmatically generate token displays
- Use @storybook/addon-docs for enhanced documentation features
- Add contrast ratio annotations to color swatches using WebAIM contrast calculator

## Current Project State
```
app/
├── .storybook/ (to be created or modified)
├── src/
│   ├── design-tokens/
│   │   └── tokens.json (from task_001)
│   ├── styles/
│   │   └── tokens.css (from task_002)
│   └── stories/
│       └── DesignTokens/ (to be created)
└── package.json (to be modified for Storybook scripts)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/.storybook/main.js | Storybook config: { stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'], addons: ['@storybook/addon-docs', '@storybook/addon-essentials'], framework: '@storybook/react-vite' } |
| CREATE | app/.storybook/preview.js | Import tokens.css globally: import '../src/styles/tokens.css'; export const parameters = { ... } |
| CREATE | app/src/stories/DesignTokens/Colors.stories.mdx | Color token documentation: Primary palette, Secondary, Semantic (success/warning/error), Neutral grayscale, show hex + contrast ratios |
| CREATE | app/src/stories/DesignTokens/Typography.stories.mdx | Typography specimens: Font families (Inter), sizes (12-48px grid), weights (400/500/600/700), line heights (1.2-1.8) |
| CREATE | app/src/stories/DesignTokens/Spacing.stories.mdx | Spacing scale visualization: 4px grid boxes showing 4, 8, 12, 16, 24, 32, 48, 64px with measurements |
| CREATE | app/src/stories/DesignTokens/BorderRadius.stories.mdx | Border radius examples: Boxes with 0px (none), 4px (sm), 8px (md), 16px (lg) corners |
| CREATE | app/src/stories/DesignTokens/Shadows.stories.mdx | Shadow elevation samples: Cards showing shadow levels 0-5, demonstrate depth hierarchy |
| CREATE | app/src/stories/DesignTokens/components/TokenTable.tsx | Reusable token display component: <TokenTable tokens={colorTokens} renderExample={(token) => <ColorSwatch color={token.value} />} /> |
| MODIFY | app/package.json | Add Storybook scripts: "storybook": "storybook dev -p 6006", "build-storybook": "storybook build" |

## External References
- **Storybook for React**: https://storybook.js.org/docs/react/get-started/install (Installation and setup guide)
- **Storybook MDX**: https://storybook.js.org/docs/react/writing-docs/mdx (MDX documentation format)
- **@storybook/addon-docs**: https://storybook.js.org/docs/react/writing-docs/docs-page (Enhanced documentation addon)
- **Design System Storybook Examples**: https://5ccbc373887ca40020446347-gebnhxpuqo.chromatic.com/ (Atlassian Design System reference)
- **Token Documentation Best Practices**: https://www.lightningdesignsystem.com/design-tokens/ (Salesforce Lightning example)
- **Storybook Vite Integration**: https://storybook.js.org/docs/react/builders/vite (Vite builder configuration)

## Build Commands
```bash
# Install Storybook (if not exists)
cd app
npx storybook@latest init

# Run Storybook development server
npm run storybook

# Build Storybook static site
npm run build-storybook

# Production build (main app)
npm run build
```

## Implementation Checklist
- [x] Initialize Storybook (npx storybook@latest init) and configure main.js for MDX stories and preview.js to import tokens.css globally
- [x] Create TokenTable.tsx component to display token name, value, visual example, and copyable code snippet (CSS/SCSS syntax)
- [x] Create Colors.stories.mdx with color swatches showing all categories (Primary, Secondary, Semantic, Neutral), hex values, and contrast ratios
- [x] Create Typography.stories.mdx with font specimens demonstrating Inter font family, sizes 12-48px, and weights 400/500/600/700
- [x] Create Spacing.stories.mdx with visual 4px grid scale (4, 8, 12, 16, 24, 32, 48, 64px) and measurement labels
- [x] Create BorderRadius.stories.mdx and Shadows.stories.mdx showing visual examples of radius values (0, 4, 8, 16px) and elevation levels (0-5)
- [x] Add click-to-copy functionality for code snippets using navigator.clipboard.writeText() for CSS variables and SCSS variables
- [x] Test Storybook (npm run storybook) and validate all token stories render correctly at http://localhost:6006 with accurate visual representation
