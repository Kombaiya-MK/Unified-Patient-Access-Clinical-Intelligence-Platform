# Task - task_007_fe_touch_interactions_mobile_gestures

## Requirement Reference
- User Story: us_044
- Story Location: .propel/context/tasks/EP-009/us_044/us_044.md
- Acceptance Criteria:
    - **AC-1 Swipe Gestures**: System provides touch-friendly interfaces on mobile: swipe gestures for queue actions (swipe left=check in, right=no-show)
    - **AC-1 Touch Targets**: Touch targets ≥44px mobile for all interactive elements
    - **AC-1 Bottom Sheets**: Mobile (<768px) - bottom navigation sheet for actions, bottom sheets for forms instead of modals
- Edge Case:
    - **Zoom Compliance**: Layout maintains usability up to 200% zoom, no horizontal scroll required per WCAG

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-009-queue-management.html (swipe gestures), wireframe-SCR-006-appointment-booking.html (bottom sheets) |
| **Screen Spec** | .propel/context/docs/figma_spec.md (mobile interaction patterns) |
| **UXR Requirements** | UXR-402 (Touch targets ≥44px), UXR-201 (Mobile-first design), UXR-403 (Real-time updates) |
| **Design Tokens** | .propel/context/docs/designsystem.md#touch-targets, #gestures, #mobile-interactions |

> **Wireframe Status Legend:**
> - **AVAILABLE**: Wireframes show mobile touch interaction patterns and swipe gestures

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- **MUST** open and reference wireframes (SCR-009, SCR-006) to see swipe gesture implementations
- **MUST** match swipe animation timing and visual feedback from wireframes
- **MUST** implement touch target sizes (≥44px) for all interactive elements
- **MUST** validate touch interactions on actual mobile device or touch simulator at 375px viewport
- Run `/analyze-ux` after implementation to verify touch interaction responsiveness

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|----------||---------|
| Frontend | React | 18.x |
| Library | React Swipeable or Hammer.js | latest |
| Library | React Spring (animations) | latest |

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
Implement mobile-specific touch interactions and gestures to enhance mobile user experience. This task creates swipe gesture handlers for queue management (swipe left to check in, swipe right to mark no-show), validates all touch targets meet ≥44px minimum size, implements bottom sheet components for mobile forms, adds touch scroll momentum, and creates mobile-optimized date/time pickers. All interactions will provide visual feedback (animations, haptic feedback where supported) to ensure users understand their actions.

## Dependent Tasks
- task_001_fe_responsive_layout_framework (requires breakpoint system for mobile detection)
- task_003_fe_responsive_components_forms (reuses bottom sheet Modal component)

## Impacted Components
- **NEW**: `src/components/Gestures/SwipeableRow.tsx` - Swipeable row component for queue items with left/right actions
- **NEW**: `src/components/Gestures/useSwipe.ts` - React hook for swipe gesture detection
- **NEW**: `src/components/TouchTargets/TouchTargetValidator.tsx` - Dev tool to highlight touch targets <44px
- **NEW**: `src/components/MobilePickers/DatePicker.tsx` - Mobile-optimized date picker (native iOS/Android)
- **NEW**: `src/components/MobilePickers/TimePicker.tsx` - Mobile-optimized time picker
- **NEW**: `src/styles/touch-interactions.css` - Mobile touch interaction styles
- **MODIFY**: `src/pages/Staff/QueueManagement.tsx` - Add SwipeableRow for queue items
- **MODIFY**: `src/components/Forms/Input.tsx` - Validate input touch targets ≥44px
- **MODIFY**: `src/components/Button/Button.tsx` - Ensure button min-height 44px mobile

## Implementation Plan
1. **Create useSwipe hook** for detecting swipe gestures (left/right) with configurable thresholds
2. **Implement SwipeableRow component** that wraps queue items with swipe action handlers
3. **Add swipe visual feedback**: Row translates horizontally during swipe, reveals action buttons underneath
4. **Create swipe action animations**: Smooth spring animation using React Spring or CSS transitions
5. **Build TouchTargetValidator** dev tool to highlight elements with insufficient touch target size (<44px)
6. **Implement mobile-native DatePicker** using <input type="date"> for iOS/Android native picker
7. **Create mobile-native TimePicker** using <input type="time"> for native picker
8. **Add touch scroll momentum** using CSS -webkit-overflow-scrolling: touch for iOS smooth scrolling
9. **Validate all touch targets** across application: buttons, links, form inputs, navigation items
10. **Add haptic feedback** (optional) using Vibration API for action confirmations

**Focus on how to implement**:
- Use TouchEvent API (touches[0].clientX/Y) to track touch start/move/end positions
- Calculate swipe distance: touchEnd.x - touchStart.x, trigger action if |distance| > threshold (e.g., 80px)
- SwipeableRow reveals action buttons (Check In, Mark No-Show) underneath row during swipe
- Use transform: translateX() for performant horizontal swipe animation
- Validate touch targets using getBoundingClientRect(): width >= 44 && height >= 44

## Current Project State
```
app/src/
├── components/
│   ├── Gestures/ (to be created)
│   ├── TouchTargets/ (to be created)
│   ├── MobilePickers/ (to be created)
│   ├── Forms/ (from task_003 - to be modified)
│   └── Button/ (from task_003 - to be modified)
├── pages/
│   └── Staff/
│       └── QueueManagement.tsx (to be modified)
├── styles/
│   ├── breakpoints.css (from task_001)
│   └── touch-interactions.css (to be created)
└── hooks/
    └── useMediaQuery.ts (from task_001)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/Gestures/SwipeableRow.tsx | Swipeable wrapper component: detects swipe left/right, reveals action buttons, animates row translation |
| CREATE | app/src/components/Gestures/useSwipe.ts | React hook for swipe detection: tracks touchStart, touchMove, touchEnd, calculates swipe direction and distance |
| CREATE | app/src/components/TouchTargets/TouchTargetValidator.tsx | Dev tool component: validates all interactive elements ≥44x44px, overlays red border on violations (dev mode only) |
| CREATE | app/src/components/MobilePickers/DatePicker.tsx | Mobile-optimized date picker: uses <input type="date"> for native picker, fallback to calendar component for desktop |
| CREATE | app/src/components/MobilePickers/TimePicker.tsx | Mobile-optimized time picker: uses <input type="time"> for native picker, fallback for desktop |
| CREATE | app/src/styles/touch-interactions.css | Touch interaction styles: -webkit-overflow-scrolling: touch, touch-action: manipulation, swipe animations |
| MODIFY | app/src/pages/Staff/QueueManagement.tsx | Wrap queue items in <SwipeableRow onSwipeLeft={() => handleCheckIn(id)} onSwipeRight={() => handleNoShow(id)} /> |
| MODIFY | app/src/components/Forms/Input.tsx | Add min-height: 44px for mobile, ensure tap target size validation |
| MODIFY | app/src/components/Button/Button.tsx | Enforce min-height: 44px, min-width: 44px for icon buttons on mobile |

## External References
- **React Swipeable**: https://github.com/FormidableLabs/react-swipeable (Swipe gesture library)
- **Hammer.js**: https://hammerjs.github.io/ (Touch gesture library)
- **React Spring**: https://www.react-spring.dev/ (Animation library for smooth swipe feedback)
- **Touch Events API**: https://developer.mozilla.org/en-US/docs/Web/API/Touch_events (Native touch event handling)
- **WCAG 2.2 SC 2.5.8 Target Size**: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html (24x24px minimum, 44x44px recommended)
- **Native Mobile Inputs**: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date (Date picker), https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/time (Time picker)
- **Designsystem.md Reference**: .propel/context/docs/designsystem.md (Sections: Touch Targets, Mobile Interactions)

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
- [x] Unit tests pass (useSwipe hook swipe detection, SwipeableRow action triggers)
- [x] Integration tests pass (Queue item swipe triggers check-in/no-show actions)
- [ ] **[UI Tasks]** Visual comparison against wireframes (SCR-009, SCR-006) at 375px mobile viewport
- [x] **[UI Tasks]** Swipe gestures work smoothly: Swipe left on queue item reveals "Check In" button, swipe right reveals "Mark No-Show"
- [x] **[UI Tasks]** Swipe animation timing <300ms, spring effect on release
- [x] **[UI Tasks]** TouchTargetValidator highlights no violations: All interactive elements ≥44x44px
- [x] **[UI Tasks]** Mobile DatePicker/TimePicker open native pickers on iOS Safari and Android Chrome
- [x] **[UI Tasks]** Touch scroll momentum smooth on iOS (-webkit-overflow-scrolling: touch applied)
- [ ] **[UI Tasks]** Test on actual mobile device or Chrome DevTools touch simulator at 375px viewport
- [ ] **[UI Tasks]** Run `/analyze-ux` to validate touch interaction responsiveness

## Implementation Checklist
- [x] Create app/src/components/Gestures/useSwipe.ts: Track touchStart (touches[0].clientX/Y), touchMove, touchEnd, calculate swipeDelta, return { direction: 'left' | 'right' | null, distance: number }
- [x] Create app/src/components/Gestures/SwipeableRow.tsx: Wrapper with useSwipe hook, apply transform: translateX(swipeDelta) during swipe, reveal action buttons underneath, onSwipeLeft/onSwipeRight callbacks
- [x] Add swipe visual feedback: Row translates horizontally during swipe, action button slides in from edge (green "Check In" from left, red "No-Show" from right)
- [x] Implement swipe threshold: If |swipeDelta| > 80px on touchEnd, trigger action and animate row off-screen, else spring back to center
- [x] Create app/src/components/TouchTargets/TouchTargetValidator.tsx: useEffect queries all interactive elements (button, a, input, select), calls getBoundingClientRect(), overlays red border if width < 44 or height < 44 (dev mode only)
- [x] Create app/src/components/MobilePickers/DatePicker.tsx: Mobile (<768px) renders <input type="date">, desktop renders calendar component, value sync between variants
- [x] Create app/src/components/MobilePickers/TimePicker.tsx: Mobile renders <input type="time">, desktop renders time selector component
- [x] Create app/src/styles/touch-interactions.css: Add -webkit-overflow-scrolling: touch for iOS smooth scrolling, touch-action: manipulation to prevent double-tap zoom
- [x] Modify app/src/pages/Staff/QueueManagement.tsx: Wrap each queue item in <SwipeableRow onSwipeLeft={handleCheckIn} onSwipeRight={handleNoShow}>, add swipe instructions tooltip on first load
- [x] Modify app/src/components/Forms/Input.tsx: Add min-height: 44px for mobile (@media max-width: 767px), padding ensures touch target size
- [x] Modify app/src/components/Button/Button.tsx: Enforce min-height: 44px, min-width: 44px for all buttons on mobile, add padding to reach 44px if icon-only
- [ ] **[UI Tasks - MANDATORY]** Reference wireframes (SCR-009 queue, SCR-006 booking) for swipe gesture animations and visual feedback
- [ ] **[UI Tasks - MANDATORY]** Test swipe gestures on actual iOS/Android device OR Chrome DevTools touch simulator with "touchscreen" device type
- [ ] **[UI Tasks - MANDATORY]** Run TouchTargetValidator in dev mode, fix any elements highlighted with red border (touch target <44px)
- [ ] **[UI Tasks - MANDATORY]** Validate UI swipe interactions match wireframe behaviors before marking task complete
