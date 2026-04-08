# Task - task_003_fe_responsive_components_forms

## Requirement Reference
- User Story: us_044
- Story Location: .propel/context/tasks/EP-009/us_044/us_044.md
- Acceptance Criteria:
    - **AC-1 Touch-Friendly Mobile**: System provides touch-friendly interfaces on mobile: larger form inputs (min-height 48px), collapsible sections for long forms, bottom sheets for forms instead of modals
    - **AC-1 Mobile Column Layout**: Mobile (<768px) - single column layout, touch-optimized tap targets ≥44px
    - **AC-1 Desktop Multi-Column**: Desktop (>1024px) - multi-column layout for forms, traditional modals
- Edge Case:
    - **Zoom Compliance**: Layout maintains usability up to 200% zoom, no horizontal scroll required per WCAG

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-006-appointment-booking.html (forms), wireframe-SCR-007-patient-intake.html (collapsible sections), wireframe-SCR-013-user-management.html (responsive modals) |
| **Screen Spec** | .propel/context/docs/figma_spec.md (responsive component states across all screens) |
| **UXR Requirements** | UXR-201 (Mobile-first responsive), UXR-402 (Touch targets ≥44px), UXR-501 (Inline validation) |
| **Design Tokens** | .propel/context/docs/designsystem.md#inputs, #buttons, #cards, #modal, #spacing |

> **Wireframe Status Legend:**
> - **AVAILABLE**: Wireframes show responsive form layouts and component transformations

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- **MUST** open and reference wireframes (SCR-006, SCR-007, SCR-013) to see form and modal responsive behaviors
- **MUST** match form input heights (48px mobile, 40px desktop), spacing, and validation states
- **MUST** implement bottom sheets for mobile forms, centered modals for desktop
- **MUST** validate implementation at breakpoints: 375px, 768px, 1024px
- Run `/analyze-ux` after implementation to verify responsive component alignment

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.x |
| Library | React Hook Form | latest |
| Library | Framer Motion or CSS Transitions | latest |

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
Implement responsive UI components and form elements that adapt to mobile, tablet, and desktop viewports. This task creates touch-optimized form inputs (min-height 48px mobile), responsive modals (bottom sheets mobile, centered overlays desktop), collapsible accordion sections for long forms, and responsive card layouts. All components will enforce touch-friendly tap targets (≥44px), inline validation with responsive error display, and WCAG zoom compliance up to 200%.

## Dependent Tasks
- task_001_fe_responsive_layout_framework (requires breakpoint system and spacing utilities)

## Impacted Components
- **NEW**: `src/components/Forms/Input.tsx` - Responsive text input with mobile min-height 48px
- **NEW**: `src/components/Forms/Select.tsx` - Responsive dropdown with larger tap targets
- **NEW**: `src/components/Forms/Textarea.tsx` - Responsive multi-line text input
- **NEW**: `src/components/Forms/FormGroup.tsx` - Responsive form field wrapper with label and error display
- **NEW**: `src/components/Modal/Modal.tsx` - Responsive modal (centered desktop, bottom sheet mobile)
- **NEW**: `src/components/Card/Card.tsx` - Responsive card with single/multi-column layouts
- **NEW**: `src/components/Accordion/Accordion.tsx` - Collapsible sections for mobile long forms
- **NEW**: `src/components/Button/Button.tsx` - Responsive button with touch-optimized sizes
- **NEW**: `src/styles/form-responsive.css` - Responsive form styles
- **NEW**: `src/styles/modal-responsive.css` - Responsive modal/bottom sheet styles

## Implementation Plan
1. **Create responsive Input component** with min-height 48px mobile, 40px desktop, font-size 16px (prevents iOS zoom)
2. **Build responsive Select dropdown** with larger touch targets (48px row height mobile)
3. **Implement responsive Textarea** with minimum 3-line height mobile
4. **Create FormGroup wrapper** for responsive label placement (above on mobile, inline on desktop)
5. **Build responsive Modal** component: bottom sheet animation mobile (slides from bottom), centered overlay desktop
6. **Implement responsive Card** component: full-width mobile, grid layout desktop (2-3 columns)
7. **Create Accordion component** for collapsible sections in long forms (mobile optimization)
8. **Build responsive Button** component: full-width mobile option, auto-width desktop, touch-optimized padding
9. **Add inline validation** with responsive error message display
10. **Validate tap target sizes** (≥44px mobile) across all interactive components

**Focus on how to implement**:
- Use font-size: 16px for inputs on mobile to prevent iOS auto-zoom on focus
- Bottom sheet uses transform: translateY(100%) → translateY(0) animation from bottom
- Cards stack single-column mobile, use CSS Grid (grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))) for desktop
- Accordion uses max-height transition for smooth expand/collapse
- Reference designsystem.md for exact button padding, input heights, and spacing values

## Current Project State
```
app/src/
├── components/
│   ├── Forms/ (to be created)
│   ├── Modal/ (to be created)
│   ├── Card/ (to be created)
│   ├── Accordion/ (to be created)
│   ├── Button/ (to be created)
│   └── ...
├── styles/
│   ├── breakpoints.css (from task_001)
│   ├── form-responsive.css (to be created)
│   ├── modal-responsive.css (to be created)
│   └── ...
└── hooks/
    └── useMediaQuery.ts (from task_001)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/Forms/Input.tsx | Responsive text input: min-height 48px mobile, 40px desktop, font-size 16px mobile to prevent zoom |
| CREATE | app/src/components/Forms/Select.tsx | Responsive select dropdown: larger touch targets (48px row height), native select on mobile |
| CREATE | app/src/components/Forms/Textarea.tsx | Responsive textarea: min-height 96px (3 lines) mobile, auto-resize |
| CREATE | app/src/components/Forms/FormGroup.tsx | Form field wrapper: label + input + error message, responsive label placement (top mobile, inline desktop) |
| CREATE | app/src/components/Modal/Modal.tsx | Responsive modal: bottom sheet mobile (slides from bottom), centered overlay desktop (max-width 600px) |
| CREATE | app/src/components/Card/Card.tsx | Responsive card: full-width mobile, CSS Grid layout desktop (2-3 columns), padding 16px mobile, 24px desktop |
| CREATE | app/src/components/Accordion/Accordion.tsx | Collapsible accordion: chevron icon, max-height transition, smooth expand/collapse |
| CREATE | app/src/components/Button/Button.tsx | Responsive button: full-width mobile option, padding 12px 24px desktop, touch-optimized tap target (min-height 44px) |
| CREATE | app/src/styles/form-responsive.css | Responsive form styles: input heights, spacing, validation states |
| CREATE | app/src/styles/modal-responsive.css | Responsive modal styles: bottom sheet animation mobile, centered overlay desktop |

## External References
- **React Hook Form**: https://react-hook-form.com/get-started (Form state and validation)
- **MDN - Input Zoom Disable**: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#preventing_zooming_on_ios (font-size: 16px solution)
- **CSS Transforms for Bottom Sheet**: https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/translateY (Slide animation)
- **Accessible Forms**: https://www.w3.org/WAI/tutorials/forms/ (Form accessibility patterns)
- **Touch Target Sizes**: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html (WCAG 2.2 SC 2.5.8 - 24x24px minimum, 44x44px recommended)
- **Designsystem.md Reference**: .propel/context/docs/designsystem.md (Sections: TextField 2.2, Button 2.1, Card 2.4)

## Build Commands
```bash
# Development
cd app
npm run dev

# Production build
npm run build

# Type check
npm run type-check
```

## Implementation Validation Strategy
- [ ] Unit tests pass (Input validation, Button states, Accordion expand/collapse)
- [ ] Integration tests pass (Form submission with validation)
- [x] **[UI Tasks]** Visual comparison against wireframes (SCR-006, SCR-007, SCR-013) at 375px, 768px, 1024px
- [x] **[UI Tasks]** All form inputs min-height 48px mobile, 40px desktop
- [x] **[UI Tasks]** Tap target validation: Use browser inspector to verify all interactive elements ≥44x44px mobile
- [x] **[UI Tasks]** Modal transforms to bottom sheet on mobile (<768px), centered overlay on desktop (>768px)
- [x] **[UI Tasks]** Cards stack single-column mobile, grid layout desktop
- [x] **[UI Tasks]** Accordion sections collapse/expand smoothly without layout jump
- [x] **[UI Tasks]** Zoom to 200% at each breakpoint - verify forms remain usable without horizontal scroll
- [ ] **[UI Tasks]** Run `/analyze-ux` to validate component responsive alignment

## Implementation Checklist
- [x] Create app/src/components/Forms/Input.tsx: min-height 48px mobile, 40px desktop, font-size 16px mobile (prevents iOS zoom), padding 8px 12px, border-radius 8px
- [x] Create app/src/components/Forms/Select.tsx: native select on mobile, custom dropdown desktop, row height 48px mobile for touch targets
- [x] Create app/src/components/Forms/Textarea.tsx: min-height 96px (3 lines) mobile, auto-resize, font-size 16px
- [x] Create app/src/components/Forms/FormGroup.tsx: label above input (mobile), label inline (desktop if space allows), error message below input (red text, 12px)
- [x] Create app/src/components/Modal/Modal.tsx: bottom sheet mobile (transform: translateY(100%) → translateY(0), transition 300ms), centered desktop (max-width 600px, padding 24px)
- [x] Create app/src/components/Card/Card.tsx: full-width mobile, CSS Grid desktop (grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))), padding 16px mobile, 24px desktop
- [x] Create app/src/components/Accordion/Accordion.tsx: header (chevron icon, 48px height mobile), content (max-height transition), smooth expand/collapse
- [x] Create app/src/components/Button/Button.tsx: min-height 44px (tap target), padding 8px 16px mobile, 12px 24px desktop, full-width mobile option (width: 100%)
- [x] Create app/src/styles/form-responsive.css: responsive input heights, spacing (@media mobile vs desktop), validation styles (error border 2px red)
- [x] Create app/src/styles/modal-responsive.css: bottom sheet styles (position: fixed, bottom: 0, left: 0, right: 0), desktop modal (position: fixed, top: 50%, left: 50%, transform: translate(-50%, -50%))
- [x] **[UI Tasks - MANDATORY]** Reference wireframes (SCR-006, SCR-007, SCR-013) for form and modal responsive layouts
- [x] **[UI Tasks - MANDATORY]** Test forms at 375px, 768px, 1024px breakpoints, validate input heights and spacing
- [x] **[UI Tasks - MANDATORY]** Measure tap targets using browser DevTools - verify all interactive elements ≥44x44px mobile
- [x] **[UI Tasks - MANDATORY]** Validate UI matches wireframe form and modal behaviors before marking task complete
