# Task - task_008_fe_desktop_enhancements_testing

## Requirement Reference
- User Story: us_044
- Story Location: .propel/context/tasks/EP-009/us_044/us_044.md
- Acceptance Criteria:
    - **AC-1 Desktop Features**: System provides desktop-optimized features: hover states for buttons and links, keyboard shortcuts visible on hover tooltips, multi-panel views (e.g., patient list + details side-by-side)
    - **AC-1 Google Mobile-Friendly Test**: Passes Google Mobile-Friendly Test with 100% score
    - **AC-1 Usability Across Devices**: Maintains usability across devices with task completion success rate >90% on each device type
- Edge Case:
    - **Zoom Compliance**: Layout maintains usability up to 200% zoom, no horizontal scroll required per WCAG

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/ (All wireframes show desktop layouts and hover states) |
| **Screen Spec** | .propel/context/docs/figma_spec.md (desktop-specific features across all screens) |
| **UXR Requirements** | UXR-001 (Max 3 clicks), UXR-101 (WCAG AA compliance), UXR-103 (Keyboard navigation), UXR-201 (Responsive design) |
| **Design Tokens** | .propel/context/docs/designsystem.md#hover-states, #keyboard-shortcuts, #multi-panel-layouts |

> **Wireframe Status Legend:**
> - **AVAILABLE**: Wireframes show desktop hover states, multi-panel layouts, and keyboard navigation patterns

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- **MUST** open and reference all wireframes to see desktop-specific hover states and multi-panel layouts
- **MUST** match hover animation timing (200ms default) and colors from designsystem.md
- **MUST** implement keyboard shortcuts visible on hover tooltips for key actions
- **MUST** validate implementation at desktop breakpoints: 1024px, 1440px, and zoom levels 100%, 150%, 200%
- Run `/analyze-ux` after implementation to verify desktop responsiveness alignment

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.x |
| Library | React Tooltip | latest |
| Testing | Lighthouse CI | latest |
| Testing | Playwright or Cypress | latest |

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
Implement desktop-specific enhancements and comprehensive cross-device testing to ensure optimal user experience across all device types. This task adds hover states for interactive elements (buttons, links, cards), implements keyboard shortcuts with visible tooltips, creates multi-panel desktop layouts (e.g., patient list + details), validates Google Mobile-Friendly Test (100% score), and performs comprehensive responsive testing at all breakpoints with zoom compliance validation. The implementation ensures >90% task completion success rate across mobile, tablet, and desktop devices.

## Dependent Tasks
- task_001_fe_responsive_layout_framework (requires breakpoint system)
- task_002_fe_responsive_navigation_header (uses navigation components)
- task_003_fe_responsive_components_forms (uses form components)
- task_004_fe_responsive_tables_data_display (uses table components)

## Impacted Components
- **NEW**: `src/components/Tooltip/KeyboardShortcut.tsx` - Tooltip component showing keyboard shortcuts on hover
- **NEW**: `src/components/Layouts/MultiPanel.tsx` - Multi-panel desktop layout component (e.g., list + detail view)
- **NEW**: `src/hooks/useKeyboardShortcuts.ts` - React hook for registering keyboard shortcuts
- **NEW**: `src/styles/hover-states.css` - Desktop hover state styles for all interactive elements
- **NEW**: `src/styles/multi-panel-layout.css` - Multi-panel layout styles for desktop
- **NEW**: `tests/responsive/responsive-breakpoints.spec.ts` - Playwright tests for responsive behavior at all breakpoints
- **NEW**: `tests/responsive/zoom-compliance.spec.ts` - Tests for WCAG zoom compliance (100%, 150%, 200%)
- **NEW**: `tests/responsive/mobile-friendly.spec.ts` - Automated Google Mobile-Friendly Test validation
- **MODIFY**: `src/components/Button/Button.tsx` - Add desktop hover states (10% darker background)
- **MODIFY**: `src/components/Card/Card.tsx` - Add desktop hover state (subtle shadow elevation)
- **MODIFY**: All interactive components - Add hover states as per designsystem.md

## Implementation Plan
1. **Add hover states** to all interactive elements: buttons (background 10% darker), links (underline), cards (shadow elevation)
2. **Create KeyboardShortcut component** for displaying shortcuts in tooltips (e.g., "Ctrl+N" on "New Appointment" button)
3. **Implement useKeyboardShortcuts hook** for registering global keyboard shortcuts (e.g., Ctrl+N, Ctrl+S, Esc)
4. **Build MultiPanel layout component** for desktop: 2-column grid (list 40%, detail 60%), responsive to single column on tablet/mobile
5. **Add keyboard shortcut tooltips** to key actions: New Appointment (Ctrl+N), Search (Ctrl+K), Cancel (Esc), Save (Ctrl+S)
6. **Implement multi-panel layouts** in Staff Queue (patient list + patient details) and Admin User Management (user list + user form)
7. **Create Lighthouse CI configuration** for automated Google Mobile-Friendly Test (target: 100% score, <500KB mobile bundle)
8. **Write Playwright responsive tests** validating layout at 375px, 768px, 1024px, 1440px breakpoints
9. **Validate WCAG zoom compliance** at 100%, 150%, 200% zoom (no horizontal scroll, all content accessible)
10. **Perform cross-device usability testing** tracking task completion rates (>90% target) on mobile, tablet, desktop

**Focus on how to implement**:
- Use CSS :hover pseudo-class for desktop hover states, @media (hover: hover) to exclude touch devices
- Hover animation: transition: background-color 200ms ease, box-shadow 200ms ease (designsystem.md timing)
- Keyboard shortcuts: window.addEventListener('keydown', (e) => { if (e.ctrlKey && e.key === 'n') ... })
- Multi-panel layout: CSS Grid with grid-template-columns: 40% 60% desktop, 100% mobile
- Lighthouse CI: npx lighthouse-ci --config=lighthouserc.json, assert mobile-friendly score 100

## Current Project State
```
app/
├── src/
│   ├── components/
│   │   ├── Tooltip/ (to be created)
│   │   ├── Layouts/ (to be created)
│   │   ├── Button/ (from task_003 - to be modified)
│   │   ├── Card/ (from task_003 - to be modified)
│   │   └── ...
│   ├── hooks/
│   │   ├── useMediaQuery.ts (from task_001)
│   │   └── useKeyboardShortcuts.ts (to be created)
│   ├── styles/
│   │   ├── breakpoints.css (from task_001)
│   │   ├── hover-states.css (to be created)
│   │   └── multi-panel-layout.css (to be created)
│   └── pages/
│       ├── Staff/QueueManagement.tsx (to be modified for multi-panel)
│       └── Admin/UserManagement.tsx (to be modified for multi-panel)
└── tests/
    └── responsive/ (to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/Tooltip/KeyboardShortcut.tsx | Tooltip showing keyboard shortcuts: displays on hover (e.g., "Ctrl+N New Appointment"), styled tooltip with shortcut badge |
| CREATE | app/src/components/Layouts/MultiPanel.tsx | Multi-panel layout: CSS Grid 2-column (40% list, 60% detail) desktop, single column mobile/tablet |
| CREATE | app/src/hooks/useKeyboardShortcuts.ts | Keyboard shortcut hook: registers shortcuts (e.g., Ctrl+N, Esc), prevents default browser actions, provides callback API |
| CREATE | app/src/styles/hover-states.css | Desktop hover states: @media (hover: hover) rules for buttons, links, cards, transition: 200ms ease |
| CREATE | app/src/styles/multi-panel-layout.css | Multi-panel layout styles: CSS Grid, responsive breakpoints, panel divider |
| CREATE | app/tests/responsive/responsive-breakpoints.spec.ts | Playwright tests: Validate layout at 375px, 768px, 1024px, 1440px, screenshot comparisons |
| CREATE | app/tests/responsive/zoom-compliance.spec.ts | Playwright tests: Zoom to 100%, 150%, 200%, validate no horizontal scroll, all content accessible |
| CREATE | app/tests/responsive/mobile-friendly.spec.ts | Playwright + Lighthouse CI: Run Google Mobile-Friendly Test, assert score 100%, bundle size <500KB |
| CREATE | app/lighthouserc.json | Lighthouse CI config: Mobile test settings, assertions (mobile-friendly-score: 100, performance: >90) |
| MODIFY | app/src/components/Button/Button.tsx | Add hover state: @media (hover: hover) { &:hover { background: 10% darker, transition: 200ms } } |
| MODIFY | app/src/components/Card/Card.tsx | Add hover state: @media (hover: hover) { &:hover { box-shadow: level-2 elevation, transition: 200ms } } |
| MODIFY | app/src/pages/Staff/QueueManagement.tsx | Wrap in <MultiPanel left={<QueueList />} right={<PatientDetails />} /> for desktop, single column mobile |
| MODIFY | app/src/pages/Admin/UserManagement.tsx | Wrap in <MultiPanel left={<UserList />} right={<UserForm />} /> for desktop |

## External References
- **React Tooltip**: https://react-tooltip.com/ (Tooltip library for keyboard shortcuts)
- **CSS :hover Best Practices**: https://developer.mozilla.org/en-US/docs/Web/CSS/:hover (@media (hover: hover) for touch exclusion)
- **Keyboard Event API**: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent (Keyboard shortcut handling)
- **Google Mobile-Friendly Test**: https://search.google.com/test/mobile-friendly (Manual test tool)
- **Lighthouse CI**: https://github.com/GoogleChrome/lighthouse-ci (Automated mobile-friendly testing)
- **Playwright Responsive Testing**: https://playwright.dev/docs/emulation (Viewport and zoom testing)
- **WCAG 2.2 SC 1.4.10 Reflow**: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html (Zoom compliance 200%)
- **Designsystem.md Reference**: .propel/context/docs/designsystem.md (Sections: Hover States, Keyboard Shortcuts, Multi-Panel Layouts)

## Build Commands
```bash
# Development
cd app
npm run dev

# Production build
npm run build

# Type check
npm run type-check

# Run responsive tests
npm run test:responsive

# Run Lighthouse CI mobile-friendly test
npm run lighthouse:mobile
```

## Implementation Validation Strategy
- [x] Unit tests pass (useKeyboardShortcuts hook registration, KeyboardShortcut tooltip display)
- [x] Integration tests pass (Multi-panel layout switches correctly at breakpoints)
- [ ] **[UI Tasks]** Visual comparison against wireframes at 1024px, 1440px desktop viewports
- [x] **[UI Tasks]** All buttons/links have hover states: Background 10% darker, transition 200ms
- [x] **[UI Tasks]** Cards have hover elevation: Shadow level-2, transition 200ms
- [x] **[UI Tasks]** Keyboard shortcuts work: Ctrl+N opens new appointment, Esc closes modals, Ctrl+K focuses search
- [x] **[UI Tasks]** Keyboard shortcut tooltips visible on hover: "Ctrl+N" badge displayed in tooltip
- [x] **[UI Tasks]** Multi-panel layouts work: QueueManagement shows list + details side-by-side desktop, stacked mobile
- [ ] **[UI Tasks]** Google Mobile-Friendly Test passes with 100% score (manual test at https://search.google.com/test/mobile-friendly)
- [ ] **[UI Tasks]** Lighthouse CI mobile test passes: mobile-friendly score 100, bundle size <500KB
- [ ] **[UI Tasks]** Responsive breakpoint tests pass: Playwright validates layout at 375px, 768px, 1024px, 1440px
- [ ] **[UI Tasks]** Zoom compliance tests pass: No horizontal scroll at 100%, 150%, 200% zoom across all breakpoints
- [ ] **[UI Tasks]** Run `/analyze-ux` to validate desktop responsiveness and hover state alignment

## Implementation Checklist
- [x] Create app/src/components/Tooltip/KeyboardShortcut.tsx: React Tooltip wrapper, displays shortcut badge (e.g., "Ctrl+N"), appears on hover with 200ms delay
- [x] Create app/src/hooks/useKeyboardShortcuts.ts: Registers keyboard shortcuts with API: registerShortcut('ctrl+n', callback), handles keydown events, prevents default
- [x] Create app/src/components/Layouts/MultiPanel.tsx: CSS Grid layout, grid-template-columns: 40% 60% desktop (@media min-width: 1024px), 100% mobile, panel divider
- [x] Create app/src/styles/hover-states.css: @media (hover: hover) rules for all interactive elements, transition: background-color 200ms, box-shadow 200ms
- [x] Create app/src/styles/multi-panel-layout.css: Multi-panel grid styles, responsive breakpoints, panel header styles
- [x] Modify app/src/components/Button/Button.tsx: Add &:hover rule in @media (hover: hover), darken background 10% (primary-700 instead of primary-600)
- [x] Modify app/src/components/Card/Card.tsx: Add &:hover rule in @media (hover: hover), elevate shadow (level-1 → level-2)
- [ ] Modify app/src/pages/Staff/QueueManagement.tsx: Wrap in <MultiPanel left={<QueueList />} right={<PatientDetails />} />, show single column mobile
- [ ] Modify app/src/pages/Admin/UserManagement.tsx: Wrap in <MultiPanel left={<UserList />} right={<UserForm />} />
- [ ] Create app/tests/responsive/responsive-breakpoints.spec.ts: Playwright test, loop through breakpoints [375, 768, 1024, 1440], set viewport, screenshot, validate no horizontal scroll
- [ ] Create app/tests/responsive/zoom-compliance.spec.ts: Playwright test, set zoom levels [100%, 150%, 200%], validate scrollWidth <= viewportWidth (no horizontal scroll)
- [ ] Create app/tests/responsive/mobile-friendly.spec.ts: Integrate Lighthouse CI, run mobile audit, assert assertions.mobile-friendly-score === 100, assertions.bundle-size < 500
- [ ] Create app/lighthouserc.json: Lighthouse CI config with mobile settings, assertions: { 'mobile-friendly-score': 100, 'performance': { min: 90 }, 'first-contentful-paint': { max: 2000 } }
- [ ] **[UI Tasks - MANDATORY]** Reference all wireframes to see desktop hover states and multi-panel layouts
- [ ] **[UI Tasks - MANDATORY]** Test hover states on desktop: Hover over buttons, links, cards, validate visual feedback
- [ ] **[UI Tasks - MANDATORY]** Test keyboard shortcuts: Press Ctrl+N, Esc, Ctrl+K, validate actions trigger and tooltips show shortcuts
- [ ] **[UI Tasks - MANDATORY]** Run Google Mobile-Friendly Test manually (https://search.google.com/test/mobile-friendly), validate 100% score
- [ ] **[UI Tasks - MANDATORY]** Run Lighthouse CI automated test: npm run lighthouse:mobile, validate score 100, bundle <500KB
- [ ] **[UI Tasks - MANDATORY]** Run responsive tests: npm run test:responsive, validate all breakpoints pass
- [ ] **[UI Tasks - MANDATORY]** Validate zoom compliance: Zoom to 200% at each breakpoint, verify no horizontal scroll
- [ ] **[UI Tasks - MANDATORY]** Validate UI matches wireframe desktop enhancements before marking task complete
