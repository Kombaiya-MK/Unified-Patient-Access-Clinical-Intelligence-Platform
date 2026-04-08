# Task - US_044_TASK_001

## Requirement Reference
- User Story: US_044
- Story Location: .propel/context/tasks/EP-009/us_044/us_044.md
- Acceptance Criteria:
    - AC-1: System implements responsive breakpoints using CSS media queries: Mobile (<768px), Tablet (768px-1024px), Medium Desktop (1025px-1440px), Large Desktop (>1440px)
    - AC-1: Implements mobile-first CSS with progressive enhancement (base styles for mobile, media queries add complexity for larger screens)
    - AC-1: Provides touch-friendly interfaces on mobile: touch targets ≥44px, larger form inputs (min-height 48px)
    - AC-1: Loads mobile-optimized assets to reduce bundle size <500KB for mobile
- Edge Cases:
    - Landscape tablet orientation → Uses tablet layout rules, switches to desktop layout if width >1024px
    - User zooms in on mobile → Layout maintains usability up to 200% zoom, no horizontal scroll required per WCAG

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/ (All responsive wireframes) |
| **Screen Spec** | figma_spec.md#SCR-001 through SCR-014 (All screens) |
| **UXR Requirements** | NFR-UX01, UXR-401, UXR-402, UXR-403 |
| **Design Tokens** | designsystem.md |

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- **MUST** open and reference the wireframe files during CSS implementation
- **MUST** match breakpoints, spacing, and responsive behavior from wireframes
- **MUST** validate at breakpoints: 375px, 768px, 1024px, 1440px
- Run `/analyze-ux` after implementation to verify responsive alignment

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.x |
| CSS | CSS Modules / SCSS | N/A |
| Build | Vite | Latest |

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
Establish the foundational responsive design system with mobile-first CSS architecture, breakpoint definitions, and reusable responsive utilities. Create CSS custom properties (CSS variables) for responsive spacing, typography scales, and touch target sizes that adapt across breakpoints. Implement mixins/utilities for common responsive patterns (container queries, media queries, visibility helpers). This task creates the design system foundation that all other responsive components will build upon.

## Dependent Tasks
- None (This is the foundational task for responsive implementation)

## Impacted Components
- NEW: `app/src/styles/responsive.css` - Core responsive utilities and breakpoints
- NEW: `app/src/styles/variables-responsive.css` - Responsive CSS custom properties
- NEW: `app/src/utils/responsive.ts` - TypeScript responsive utility functions
- NEW: `app/src/hooks/useMediaQuery.ts` - React hook for responsive behavior
- NEW: `app/src/hooks/useBreakpoint.ts` - React hook for current breakpoint detection
- MODIFY: `app/src/index.css` - Add mobile-first base styles
- MODIFY: `app/vite.config.ts` - Configure responsive build optimization

## Implementation Plan
1. **Define Responsive Breakpoints**: Establish CSS custom properties for breakpoint values (mobile <768px, tablet 768-1024px, desktop 1025-1440px, large desktop >1440px)
2. **Mobile-First Base Styles**: Update `index.css` with mobile-optimized reset, font sizes adjusted for 16px minimum (prevents iOS zoom), touch-friendly default spacing
3. **Responsive CSS Variables**: Create `variables-responsive.css` with spacing scale (that multiplies for larger screens), typography scale (fluid sizing), touch target minimums (44px mobile, can be smaller on desktop)
4. **Media Query Mixins**: Create `responsive.css` with reusable media query utilities (hide-mobile, hide-desktop, show-tablet-only, etc.)
5. **TypeScript Utilities**: Create `responsive.ts` with helper functions for programmatic breakpoint checks, viewport size detection, touch capability detection
6. **React Hooks**: Build `useMediaQuery` and `useBreakpoint` hooks for component-level responsive behavior (e.g., conditionally render mobile vs desktop components)
7. **Vite Build Optimization**: Configure code splitting and lazy loading for responsive asset delivery

## Current Project State
```
app/
├── src/
│   ├── styles/
│   │   └── index.css (existing)
│   ├── utils/
│   ├── hooks/
│   └── index.css
├── vite.config.ts
└── package.json
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/styles/responsive.css | Core responsive media query utilities and mixins |
| CREATE | app/src/styles/variables-responsive.css | CSS custom properties for responsive spacing, typography, touch targets |
| CREATE | app/src/utils/responsive.ts | TypeScript utility functions for breakpoint detection |
| CREATE | app/src/hooks/useMediaQuery.ts | React hook for media query matching |
| CREATE | app/src/hooks/useBreakpoint.ts | React hook for current breakpoint (mobile/tablet/desktop) |
| MODIFY | app/src/index.css | Add mobile-first base styles (font-size: 16px, touch-friendly defaults) |
| MODIFY | app/vite.config.ts | Configure responsive build optimizations (code splitting) |

## External References
- [MDN: Mobile-First CSS](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Responsive/Mobile_first)
- [MDN: CSS Media Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries)
- [WCAG 2.2: Reflow (1.4.10)](https://www.w3.org/WAI/WCAG22/Understanding/reflow)
- [React: useEffect for window resize](https://react.dev/reference/react/useEffect)
- [CSS Custom Properties (Variables)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)

## Build Commands
```bash
cd app
npm run dev    # Development with hot reload
npm run build  # Production build
npm run preview # Preview production build
```

## Implementation Validation Strategy
- [ ] All breakpoints validated at 375px, 768px, 1024px, 1440px, 1920px
- [ ] Layout maintains usability up to 200% browser zoom (WCAG 1.4.10)
- [ ] No horizontal scroll at any breakpoint
- [ ] Touch targets ≥44px verified on mobile (375px viewport)
- [ ] Font size ≥16px on inputs (prevents iOS auto-zoom)
- [ ] `useMediaQuery` and `useBreakpoint` hooks tested with mock window resizes
- [ ] CSS variables correctly cascade at each breakpoint
- [ ] Run `/analyze-ux` to validate responsive foundation

## Implementation Checklist
- [x] Create `app/src/styles/responsive.css` with breakpoint definitions and media query mixins
- [x] Create `app/src/styles/variables-responsive.css` with responsive CSS custom properties (spacing, typography, touch targets)
- [x] Update `app/src/index.css` with mobile-first reset: `font-size: 16px` on inputs, `box-sizing: border-box`, touch-friendly tap region defaults
- [x] Create `app/src/utils/responsive.ts` with `getBreakpoint()`, `isMobile()`, `isTablet()`, `isDesktop()`, `isTouchDevice()` functions
- [x] Create `app/src/hooks/useMediaQuery.ts` hook: accepts media query string, returns boolean, handles SSR safely
- [x] Create `app/src/hooks/useBreakpoint.ts` hook: returns current breakpoint enum (MOBILE, TABLET, DESKTOP, LARGE_DESKTOP)
- [x] Modify `app/vite.config.ts` to configure code splitting for responsive components and lazy loading
- [ ] **[UI Tasks - MANDATORY]** Reference wireframe files during implementation to match breakpoint behavior
- [ ] **[UI Tasks - MANDATORY]** Validate responsive behavior matches wireframes at all breakpoints before marking complete
