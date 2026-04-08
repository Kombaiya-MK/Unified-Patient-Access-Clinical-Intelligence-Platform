# Task - task_001_fe_responsive_layout_framework

## Requirement Reference
- User Story: us_044
- Story Location: .propel/context/tasks/EP-009/us_044/us_044.md
- Acceptance Criteria:
    - **AC-1 Responsive Breakpoints**: System implements responsive breakpoints using CSS media queries: Mobile (<768px) - single column layout, Tablet (768px-1024px) - two-column layout, Medium Desktop (1025px-1440px) - three-column layout, Large Desktop (>1440px) - max content width 1600px centered with padding
    - **AC-1 Mobile-First CSS**: System implements mobile-first CSS with progressive enhancement (base styles for mobile, media queries add complexity for larger screens)
    - **AC-1 Max Content Width**: Large Desktop (>1440px) - max content width 1600px centered with padding
- Edge Case:
    - **Landscape Tablet Orientation**: Uses tablet layout rules, switches to desktop layout if width >1024px
    - **Zoom Compliance**: Layout maintains usability up to 200% zoom, no horizontal scroll required per WCAG

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/ (All wireframes SCR-001 through SCR-014 include responsive behavior) |
| **Screen Spec** | .propel/context/docs/figma_spec.md (All screens) |
| **UXR Requirements** | UXR-201 (Mobile-first responsive design), UXR-202 (Breakpoint consistency), UXR-301 (Design token usage) |
| **Design Tokens** | .propel/context/docs/designsystem.md#breakpoints, #spacing, #grid-system |

> **Wireframe Status Legend:**
> - **AVAILABLE**: All wireframes contain responsive behavior built-in at all breakpoints

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- **MUST** open and reference all wireframe files during implementation to understand responsive transformations
- **MUST** match layout, spacing, typography, and colors from wireframes at each breakpoint
- **MUST** implement breakpoint-specific behaviors: mobile (<768px), tablet (768-1024px), desktop (1024-1440px), large (>1440px)
- **MUST** validate implementation against wireframes at breakpoints: 375px, 768px, 1024px, 1440px
- Run `/analyze-ux` after implementation to verify pixel-perfect alignment

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.x |
| Library | CSS Modules or Styled Components | latest |
| Library | CSS Media Query utilities | N/A |

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
Establish the foundational responsive layout framework and CSS breakpoint system that will enable all screens and components to adapt seamlessly across mobile (<768px), tablet (768-1024px), desktop (1024-1440px), and large desktop (>1440px) viewports. This task implements mobile-first CSS methodology with progressive enhancement, creates a responsive grid system (4-col mobile, 8-col tablet, 12-col desktop), and establishes max-width constraints for optimal readability on large displays. The framework will serve as the architectural foundation for all subsequent responsive UI implementations.

## Dependent Tasks
- None (foundational task, no dependencies)

## Impacted Components
- **NEW**: `src/styles/breakpoints.css` - CSS custom properties for breakpoint values and media query mixins
- **NEW**: `src/styles/grid.css` - Responsive grid system implementation
- **NEW**: `src/styles/responsive-utilities.css` - Utility classes for responsive visibility and spacing
- **NEW**: `src/index.css` - Global responsive base styles (mobile-first)
- **MODIFY**: `public/index.html` - Add viewport meta tag for responsive behavior
- **NEW**: `src/hooks/useMediaQuery.ts` - React hook for responsive JavaScript logic

## Implementation Plan
1. **Configure viewport meta tag** in public/index.html for proper mobile rendering
2. **Create CSS breakpoint variables** using CSS custom properties matching designsystem.md specifications
3. **Implement mobile-first base styles** in src/index.css (typography, spacing, container widths for mobile)
4. **Build progressive enhancement media queries** for tablet (768px), desktop (1024px), and large (1440px) breakpoints
5. **Create responsive grid system** with column layouts: 4-col (mobile), 8-col (tablet), 12-col (desktop)
6. **Establish max-width constraints** for content containers (1600px centered on large desktop >1440px)
7. **Create responsive utility classes** for visibility (hide-mobile, show-desktop) and spacing adjustments
8. **Implement useMediaQuery React hook** for JavaScript-based responsive logic
9. **Validate WCAG zoom compliance** (up to 200% zoom without horizontal scroll)
10. **Test breakpoint transitions** across all target viewports (375px, 768px, 1024px, 1440px)

**Focus on how to implement**:
- Use CSS custom properties (--breakpoint-mobile: 768px) for centralized breakpoint management
- Start with mobile styles as base (no media query), progressively enhance with @media (min-width)
- Reference designsystem.md for exact breakpoint values, spacing scale (base 8px), and grid specifications
- Implement container queries where appropriate for component-level responsiveness
- Use clamp() for fluid typography between breakpoints (e.g., font-size: clamp(16px, 2vw, 20px))

## Current Project State
```
app/
├── public/
│   └── index.html (needs viewport meta tag)
├── src/
│   ├── index.css (needs responsive base styles)
│   ├── styles/ (directory to be created)
│   ├── hooks/ (directory to be created)
│   ├── components/
│   └── pages/
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| MODIFY | app/public/index.html | Add viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">` |
| CREATE | app/src/styles/breakpoints.css | CSS custom properties for breakpoints (--breakpoint-mobile: 768px, --breakpoint-tablet: 1024px, --breakpoint-desktop: 1440px) and media query mixins |
| CREATE | app/src/styles/grid.css | Responsive grid system with 4/8/12 column layouts using CSS Grid |
| CREATE | app/src/styles/responsive-utilities.css | Utility classes for responsive visibility (.hide-mobile, .show-desktop) and spacing (.mt-mobile-lg, .p-desktop-xl) |
| MODIFY | app/src/index.css | Add mobile-first base styles (body, container, typography) and import breakpoints.css, grid.css |
| CREATE | app/src/hooks/useMediaQuery.ts | React hook for JavaScript-based media query detection (returns boolean for current breakpoint) |
| CREATE | app/src/styles/responsive-containers.css | Container component styles with max-width 1600px for large desktop, responsive padding |

## External References
- **CSS Media Queries Level 5**: https://www.w3.org/TR/mediaqueries-5/ (Official W3C specification for media queries)
- **MDN Web Docs - Responsive Design**: https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design (Mobile-first methodology guide)
- **CSS Grid Layout Module**: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout (Grid implementation patterns)
- **React Responsive Hooks**: https://github.com/streamich/react-use/blob/master/docs/useMedia.md (useMediaQuery hook patterns)
- **WCAG 2.2 SC 1.4.10 Reflow**: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html (Zoom compliance requirements)
- **Designsystem.md Reference**: .propel/context/docs/designsystem.md (Sections: Breakpoints 1.6, Spacing 1.3, Grid System 1.7)

## Build Commands
```bash
# Development
cd app
npm run dev

# Production build
npm run build

# Type check
npm run type-check

# Lint CSS
npm run lint:css
```

## Implementation Validation Strategy
- [x] Unit tests pass (useMediaQuery hook tests with mock window.matchMedia)
- [x] Integration tests pass (N/A for CSS-only task)
- [x] **[UI Tasks]** Visual comparison against wireframe completed at 375px, 768px, 1024px, 1440px
- [x] **[UI Tasks]** Validate breakpoint transitions are smooth without layout jumps
- [x] **[UI Tasks]** Zoom to 200% in browser - verify no horizontal scroll at all breakpoints
- [x] **[UI Tasks]** Test landscape tablet orientation (width >1024px switches to desktop layout)
- [x] **[UI Tasks]** Run `/analyze-ux` to validate wireframe alignment
- [x] Grid system renders correct column counts: 4 (mobile), 8 (tablet), 12 (desktop)
- [x] Max-width constraint (1600px) applied on viewports >1440px with centered content
- [x] Responsive utility classes work (.hide-mobile hides element on mobile, .show-desktop shows only on desktop)

## Implementation Checklist
- [x] Add viewport meta tag to app/index.html with width=device-width, initial-scale=1.0, maximum-scale=5.0
- [x] Create app/src/styles/breakpoints.css with CSS custom properties: --breakpoint-mobile (768px), --breakpoint-tablet (1024px), --breakpoint-desktop (1440px)
- [x] Create app/src/styles/grid.css implementing 4-column (mobile), 8-column (tablet), 12-column (desktop) grid using CSS Grid
- [x] Create app/src/styles/responsive-utilities.css with visibility classes (.hide-mobile, .show-tablet, .show-desktop) and responsive spacing utilities
- [x] Update app/src/index.css with mobile-first base styles (body font-size: 16px, container 100% width, base spacing from designsystem.md)
- [x] Add progressive enhancement media queries in index.css for tablet (@media min-width: 768px) and desktop (@media min-width: 1024px) breakpoints
- [x] Create app/src/styles/responsive-containers.css with .container class (max-width: 1600px on large desktop, padding: 16px mobile, 32px desktop)
- [x] Create app/src/hooks/useMediaQuery.ts React hook returning { isMobile, isTablet, isDesktop, isLargeDesktop } based on window.matchMedia
- [x] **[UI Tasks - MANDATORY]** Reference all wireframes (SCR-001 to SCR-014) to understand responsive layout transformations at each breakpoint
- [x] **[UI Tasks - MANDATORY]** Test implementation at breakpoints 375px, 768px, 1024px, 1440px using browser DevTools Responsive Design Mode
- [x] **[UI Tasks - MANDATORY]** Validate WCAG zoom compliance: Zoom to 200% at each breakpoint, verify no horizontal scroll
- [x] **[UI Tasks - MANDATORY]** Validate UI matches wireframe responsive behaviors before marking task complete
