# Task - US_044_TASK_003

## Requirement Reference
- User Story: US_044
- Story Location: .propel/context/tasks/EP-009/us_044/us_044.md
- Acceptance Criteria:
    - AC-1: Provides touch-friendly interfaces on mobile: touch targets ≥44px, larger form inputs (min-height 48px), bottom sheets for forms instead of modals
    - AC-1: Mobile - collapsible sections for long forms
    - AC-1: Desktop - hover states for buttons and links
- Edge Cases:
    - User zooms in on mobile → Layout maintains usability up to 200% zoom, no horizontal scroll required per WCAG

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-001-login.html, wireframe-SCR-006-appointment-booking.html, wireframe-SCR-007-patient-intake.html |
| **Screen Spec** | figma_spec.md#SCR-001, SCR-006, SCR-007, SCR-008, SCR-013 |
| **UXR Requirements** | UXR-402, UXR-501, NFR-UX01 |
| **Design Tokens** | designsystem.md#forms, designsystem.md#spacing |

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- **MUST** reference form wireframes to match input sizing and bottom sheet behavior
- **MUST** implement touch-friendly tap targets (≥44px height for buttons/inputs)
- **MUST** validate form layouts at breakpoints: 375px, 768px, 1440px
- Run `/analyze-ux` after implementation to verify form responsiveness

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.x |
| Library | React Hook Form | 7.x |

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
Implement responsive form components with touch-optimized inputs for mobile (min-height 48px, font-size ≥16px to prevent iOS zoom), bottom sheets for mobile forms (slide up from bottom), and standard modal overlays for desktop. Create collapsible accordion sections for long forms on mobile to reduce scrolling. Implement proper focus states, error validation displays that work across breakpoints, and hover states for desktop. All form components must be touch-friendly with tap targets ≥44px.

## Dependent Tasks
- task_001_fe_responsive_design_system.md (requires responsive hooks and CSS variables)

## Impacted Components
- NEW: `app/src/components/Forms/ResponsiveInput.tsx` - Touch-optimized input component
- NEW: `app/src/components/Forms/ResponsiveTextarea.tsx` - Touch-optimized textarea
- NEW: `app/src/components/Forms/ResponsiveSelect.tsx` - Touch-optimized select/dropdown
- NEW: `app/src/components/Forms/BottomSheet.tsx` - Mobile bottom sheet container
- NEW: `app/src/components/Forms/ResponsiveModal.tsx` - Switches between bottom sheet (mobile) and modal (desktop)
- NEW: `app/src/components/Forms/CollapsibleSection.tsx` - Accordion for long forms on mobile
- MODIFY: `app/src/pages/Login.tsx` - Use ResponsiveInput components
- MODIFY: `app/src/pages/AppointmentBooking.tsx` - Use ResponsiveModal and touch-optimized inputs
- MODIFY: `app/src/pages/PatientIntake.tsx` - Use CollapsibleSection for long forms

## Implementation Plan
1. **Responsive Input Components**: Create `ResponsiveInput.tsx`, `ResponsiveTextarea.tsx`, `ResponsiveSelect.tsx` with min-height 48px on mobile, font-size 16px (prevents iOS zoom), increased padding for touch
2. **Bottom Sheet Component**: Create `BottomSheet.tsx` with slide-up animation (transform: translateY(100%) -> 0), backdrop overlay, drag-to-dismiss on mobile
3. **Responsive Modal**: Create `ResponsiveModal.tsx` that uses `useBreakpoint()` to render `BottomSheet` on mobile, standard centered modal on desktop/tablet
4. **Collapsible Sections**: Create `CollapsibleSection.tsx` accordion component for mobile forms (expand/collapse with smooth animation, chevron icon indicator)
5. **Touch-Optimized Buttons**: Ensure all form buttons have min-height 44px, adequate padding, visible focus/active states
6. **Desktop Hover States**: Add hover states for buttons, links, and interactive elements (only visible on non-touch devices using `@media (hover: hover)`)
7. **Integration**: Update existing form pages (Login, Appointment Booking, Patient Intake) to use responsive components

## Current Project State
```
app/
├── src/
│   ├── components/
│   │   └── (existing components)
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── AppointmentBooking.tsx
│   │   └── PatientIntake.tsx
│   └── hooks/
│       └── useBreakpoint.ts (from task_001)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/Forms/ResponsiveInput.tsx | Input with touch-friendly sizing (min-height 48px, font-size ≥16px) |
| CREATE | app/src/components/Forms/ResponsiveTextarea.tsx | Textarea with touch-friendly sizing |
| CREATE | app/src/components/Forms/ResponsiveSelect.tsx | Select dropdown with touch-friendly tap targets |
| CREATE | app/src/components/Forms/BottomSheet.tsx | Mobile bottom sheet with slide-up animation |
| CREATE | app/src/components/Forms/ResponsiveModal.tsx | Switches between BottomSheet (mobile) and Modal (desktop) |
| CREATE | app/src/components/Forms/CollapsibleSection.tsx | Accordion for long forms on mobile |
| MODIFY | app/src/pages/Login.tsx | Replace standard inputs with ResponsiveInput |
| MODIFY | app/src/pages/AppointmentBooking.tsx | Use ResponsiveModal and touch-optimized form components |
| MODIFY | app/src/pages/PatientIntake.tsx | Use CollapsibleSection for long form sections |

## External References
- [MDN: Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [MDN: Interaction Media Features (hover, pointer)](https://developer.mozilla.org/en-US/docs/Web/CSS/@media#interaction_media_features)
- [WCAG 2.2: Target Size (2.5.5)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced)
- [iOS: Preventing Auto-Zoom on Input Focus](https://stackoverflow.com/questions/2989263/disable-auto-zoom-in-input-text-tag-safari-on-iphone)
- [React Hook Form: Responsive Forms](https://react-hook-form.com/)

## Build Commands
```bash
cd app
npm run dev    # Development with hot reload
npm run build  # Production build
```

## Implementation Validation Strategy
- [x] All form inputs have min-height 48px and font-size ≥16px on mobile (<768px)
- [x] Bottom sheet slides up from bottom on mobile, modal centered on desktop
- [x] Collapsible sections expand/collapse smoothly on mobile
- [x] Touch targets ≥44px for all buttons, checkboxes, radio buttons
- [x] Hover states only visible on devices with hover capability (`@media (hover: hover)`)
- [x] Form validation errors display correctly at all breakpoints
- [x] iOS zoom prevention verified (font-size ≥16px on inputs)
- [ ] Run `/analyze-ux` to validate form responsiveness

## Implementation Checklist
- [x] Create `ResponsiveInput.tsx` with min-height 48px, font-size 16px, increased padding (12px vertical) for mobile
- [x] Create `ResponsiveTextarea.tsx` with same touch-friendly sizing
- [x] Create `ResponsiveSelect.tsx` with native select on mobile, custom dropdown on desktop
- [x] Create `BottomSheet.tsx` with slide-up animation: `transform: translateY(100%)` -> `translateY(0)`, backdrop overlay, close on backdrop click
- [x] Create `ResponsiveModal.tsx` using `useBreakpoint()` to switch between BottomSheet and Modal
- [x] Create `CollapsibleSection.tsx` with expand/collapse animation, chevron icon, accessible button (aria-expanded)
- [x] Add hover states with `@media (hover: hover)` to prevent hover on touch devices
- [x] Update `Login.tsx` to use ResponsiveInput for email and password fields
- [x] **[UI Tasks - MANDATORY]** Reference form wireframes to match input sizing and layout
- [x] **[UI Tasks - MANDATORY]** Validate forms match wireframe specifications at all breakpoints before marking complete
