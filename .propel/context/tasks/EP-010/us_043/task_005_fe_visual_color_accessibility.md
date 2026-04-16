# Task - TASK_005_FE_VISUAL_COLOR_ACCESSIBILITY

## Requirement Reference
- User Story: US_043
- Story Location: .propel/context/tasks/us_043/us_043.md
- Acceptance Criteria:
    - Maintains color contrast ratio ≥4.5:1 for normal text and ≥3:1 for large text per WCAG Success Criterion 1.4.3
    - Provides text resize support up to 200% without loss of functionality per WCAG 1.4.4
    - System provides keyboard navigation for all interactive elements with visible focus indicators (2px solid blue outline per UXR-303)
- Edge Case:
    - What if user has both visual and motor impairments? (Voice control supported via browser APIs, large click targets ≥44x44px per UXR-304)

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A (applies to ALL screens) |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | ALL wireframes |
| **Screen Spec** | figma_spec.md (ALL screens) |
| **UXR Requirements** | UXR-302 (Medical-grade color contrast), UXR-303 (Focus indicators 2px), UXR-304 (Touch targets ≥44px) |
| **Design Tokens** | designsystem.md#colors, designsystem.md#typography, designsystem.md#spacing |

> **Wireframe Details:**
> - **Color contrast**: Body text #212121 on #FFFFFF (16.1:1), button text #FFFFFF on #007BFF (4.53:1), error text #D32F2F on #FFFFFF (7.37:1)
> - **Focus indicators**: All interactive elements have 2px solid blue (#007BFF) outline on :focus, high contrast mode increases to 3px
> - **Touch targets**: All buttons, links minimum 44x44px (mobile), 40x40px (desktop)
> - **Text resize**: Layout remains functional at 200% zoom, no horizontal scroll, no text truncation

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- **MUST** validate color contrast meets WCAG AA ratios using WebAIM Contrast Checker
- **MUST** ensure focus indicators are visible on all interactive elements
- **MUST** validate at breakpoints AND at 200% zoom: 375px, 768px, 1440px

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.x |
| Frontend | CSS | CSS3 |

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | Yes (Responsive, touch targets) |

## Task Overview
Implement visual accessibility fixes for color contrast, focus indicators, text resize, and touch targets across all screens with ≤8 hour scope:  (1) Audit key color combinations, document in color-contrast-report.md, (2) Fix critical color contrast violations in CSS variables, (3) Implement global focus indicator (2px blue outline), (4) Ensure minimum touch targets (44x44px mobile), (5) Implement text resize support with rem units and 200% zoom testing, (6) Add reduced motion and high contrast mode support.

## Dependent Tasks
- task_001_fe_accessibility_audit_infrastructure.md

## Impacted Components
- app/src/index.css (MODIFY - global styles)
- .propel/context/docs/designsystem.md (MODIFY - colors)
- app/docs/color-contrast-report.md (NEW)

## Implementation Plan
1. **Audit Colors**: Use WebAIM Contrast Checker, document violations
2. **Global Focus Styles**: Add :focus-visible with 2px blue outline
3. **Touch Targets**: Min 44x44px mobile, 40x40px desktop
4. **Text Resize**: Convert px to rem, test at 200% zoom  
5. **Reduced Motion**: @media (prefers-reduced-motion)
6. **High Contrast**: @media (prefers-contrast: high)

## Implementation Validation Strategy
- [x] Color contrast ≥4.5:1 for text, ≥3:1 for UI
- [x] Focus indicator visible on all interactive elements
- [x] Touch targets meet minimum sizes
- [x] Layout functional at 200% zoom
- [x] Animations disabled with prefers-reduced-motion

## Implementation Checklist
- [x] Create color-contrast-report.md
- [x] Add focus-visible styles to index.css
- [x] Update touch target sizes
- [x] Convert font sizes to rem
- [x] Test at 200% zoom
- [x] Add reduced motion support
- [x] Add high contrast support
- [x] Update designsystem.md
