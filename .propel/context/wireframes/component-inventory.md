# Component Inventory - Unified Patient Access & Clinical Intelligence Platform

## Component Specification

**Fidelity Level**: High  
**Screen Type**: Web (Responsive)  
**Viewport**: 1440 x 900  

## Component Summary

| Component Name | Type | Screens Used | Priority | Implementation Status |
|---------------|------|-------------|----------|---------------------|
| Header | Layout | All (SCR-001 to SCR-013) | High | Pending |
| Sidebar | Navigation | SCR-002 to SCR-013 | High | Pending |
| Bottom Nav | Navigation | SCR-002 to SCR-013 (mobile) | High | Pending |
| Card | Content | SCR-002, SCR-003, SCR-004, SCR-010 | High | Pending |
| Table | Content | SCR-003, SCR-004, SCR-009, SCR-011, SCR-012, SCR-013 | High | Pending |
| Button | Interactive | All (SCR-001 to SCR-013) | High | Pending |
| TextField | Interactive | SCR-001, SCR-005, SCR-007, SCR-012 | High | Pending |
| Select | Interactive | SCR-012, SCR-013 | Medium | Pending |
| RadioGroup | Interactive | SCR-006, SCR-007 | Medium | Pending |
| Checkbox | Interactive | SCR-001 | Low | Pending |
| Toggle | Interactive | SCR-007 | Medium | Pending |
| Calendar | Interactive | SCR-006 | High | Pending |
| FileUpload | Interactive | SCR-008 | Medium | Pending |
| Badge | Feedback | SCR-002, SCR-003, SCR-009, SCR-010, SCR-011, SCR-013 | High | Pending |
| Alert | Feedback | SCR-006, SCR-007, SCR-010 | Medium | Pending |
| Toast | Feedback | All screens (transient) | High | Pending |
| Modal | Feedback | SCR-009, SCR-010, SCR-011, SCR-013 | High | Pending |
| Drawer | Feedback | SCR-006, SCR-009, SCR-013 | High | Pending |
| ProgressBar | Feedback | SCR-008 | Medium | Pending |
| Avatar | Content | SCR-002, SCR-005 | Low | Pending |
| Skeleton | Feedback | All screens (loading) | Medium | Pending |
| Pagination | Navigation | SCR-012 | Low | Pending |

## Detailed Component Specifications

### Layout Components

#### Header
- **Type**: Layout
- **Used In Screens**: All screens (SCR-001 through SCR-013)
- **Wireframe References**: All wireframe files
- **Description**: Top application bar with logo, page title, notification bell, and user menu dropdown
- **Variants**: Authenticated (with user menu), Unauthenticated (login page, logo only)
- **Interactive States**: Default, UserMenu-Open, Notification-Open
- **Responsive Behavior**:
  - Desktop (1440px): Full width, logo + page title + notification + user menu
  - Tablet (768px): Full width, hamburger menu replaces sidebar toggle
  - Mobile (375px): Compact header, logo + notification + avatar only
- **Implementation Notes**: Sticky position, z-index 1000, height 64px desktop / 56px mobile

#### Sidebar
- **Type**: Layout
- **Used In Screens**: SCR-002 through SCR-013 (all authenticated screens)
- **Wireframe References**: All authenticated wireframe files
- **Description**: Left navigation panel with role-specific menu items, icons, labels, and active state
- **Variants**: Patient (6 items), Staff (6 items), Admin (4 items)
- **Interactive States**: Default, Collapsed (icon-only), Item-Hover, Item-Active
- **Responsive Behavior**:
  - Desktop (1440px): Persistent, 240px width, expanded with icons and labels
  - Tablet (768px): Collapsible, 64px collapsed (icon-only), 240px expanded overlay
  - Mobile (375px): Hidden, replaced by Bottom Nav
- **Implementation Notes**: Fixed position, z-index 900, transition 200ms ease

### Navigation Components

#### Bottom Nav (Mobile)
- **Type**: Navigation
- **Used In Screens**: SCR-002 through SCR-013 (mobile only)
- **Wireframe References**: All authenticated wireframe files
- **Description**: Mobile bottom navigation bar with 4-5 primary action icons
- **Variants**: Patient (Dashboard, Book, Intake, Profile), Staff (Dashboard, Queue, Clinical, Profile), Admin (Dashboard, Users, Logs, Profile)
- **Interactive States**: Default, Active (primary-600 highlight), Disabled
- **Responsive Behavior**:
  - Desktop (1440px): Hidden
  - Tablet (768px): Hidden
  - Mobile (375px): Visible, fixed bottom, height 56px
- **Implementation Notes**: Fixed position bottom, z-index 800, safe area padding for notch devices

#### Breadcrumb
- **Type**: Navigation
- **Used In Screens**: SCR-005 through SCR-013 (non-dashboard screens, desktop only)
- **Wireframe References**: All non-dashboard wireframe files
- **Description**: Breadcrumb trail showing navigation hierarchy
- **Variants**: 2-level (Dashboard > Page), 3-level (Dashboard > Page > Detail)
- **Interactive States**: Link-hover, Current (non-interactive)
- **Responsive Behavior**:
  - Desktop (1440px): Visible, horizontal breadcrumb trail
  - Tablet (768px): Visible
  - Mobile (375px): Hidden, replaced by back button
- **Implementation Notes**: Use nav element with aria-label="Breadcrumb"

#### Pagination
- **Type**: Navigation
- **Used In Screens**: SCR-012
- **Wireframe References**: wireframe-SCR-012-audit-logs.html
- **Description**: Page navigation for audit log table
- **Variants**: Default (numbered), Compact (prev/next only on mobile)
- **Interactive States**: Default, Page-Active, Page-Hover, Disabled (prev/next at bounds)
- **Responsive Behavior**:
  - Desktop (1440px): Full pagination with page numbers
  - Tablet (768px): Condensed page numbers
  - Mobile (375px): Prev/Next buttons only
- **Implementation Notes**: Use nav element with aria-label="Pagination"

### Content Components

#### Card
- **Type**: Content
- **Used In Screens**: SCR-002, SCR-003, SCR-004, SCR-010
- **Wireframe References**: wireframe-SCR-002, wireframe-SCR-003, wireframe-SCR-004, wireframe-SCR-010
- **Description**: Elevated content container for dashboard widgets and data sections
- **Variants**: Default, Interactive (clickable), Alert (with colored border), Expandable
- **Interactive States**: Default, Hover (elevated shadow), Focus, Loading (skeleton)
- **Responsive Behavior**:
  - Desktop (1440px): Multi-column grid (3 or 4 cards per row)
  - Tablet (768px): 2 cards per row
  - Mobile (375px): Full width, stacked
- **Implementation Notes**: border-radius 8px, elevation level-1, padding 16px, gap 16px

#### Table
- **Type**: Content
- **Used In Screens**: SCR-003, SCR-004, SCR-009, SCR-011, SCR-012, SCR-013
- **Wireframe References**: wireframe-SCR-003, wireframe-SCR-004, wireframe-SCR-009, wireframe-SCR-011, wireframe-SCR-012, wireframe-SCR-013
- **Description**: Data table with sortable columns, row actions, and status badges
- **Variants**: Default, Sortable, Filterable, Real-time (SCR-009 with WebSocket updates)
- **Interactive States**: Default, Row-Hover, Row-Selected, Column-Sort-Asc, Column-Sort-Desc, Loading (skeleton rows)
- **Responsive Behavior**:
  - Desktop (1440px): Full table with all columns visible
  - Tablet (768px): Horizontal scroll or condensed columns
  - Mobile (375px): Card-based list view (table rows become cards)
- **Implementation Notes**: Cell padding 12px 16px, alternate row bg neutral-50, border-bottom neutral-200

#### Avatar
- **Type**: Content
- **Used In Screens**: SCR-002, SCR-005, Header (all screens)
- **Wireframe References**: wireframe-SCR-002, wireframe-SCR-005
- **Description**: User profile image or initials circle
- **Variants**: Small (32px), Medium (40px), Large (64px), XLarge (96px - profile page)
- **Interactive States**: Default, Hover (scale 1.05)
- **Responsive Behavior**: Consistent across all breakpoints
- **Implementation Notes**: border-radius full (9999px), bg primary-100 for initials

### Interactive Components

#### Button
- **Type**: Interactive
- **Used In Screens**: All screens (SCR-001 through SCR-013)
- **Wireframe References**: All wireframe files
- **Description**: Action trigger with multiple visual variants
- **Variants**: Primary (filled primary-600), Secondary (outlined), Tertiary (text-only), Danger (error-600), Icon-only
- **Interactive States**: Default, Hover, Active (pressed), Focus (ring), Disabled, Loading (spinner)
- **Responsive Behavior**:
  - Desktop (1440px): Inline, auto-width
  - Tablet (768px): Inline, auto-width
  - Mobile (375px): Full-width for primary CTAs, inline for secondary
- **Implementation Notes**: border-radius 8px, height 40px (md), min-width 80px, transition 200ms ease

#### TextField
- **Type**: Interactive
- **Used In Screens**: SCR-001, SCR-005, SCR-007, SCR-012
- **Wireframe References**: wireframe-SCR-001, wireframe-SCR-005, wireframe-SCR-007, wireframe-SCR-012
- **Description**: Text input field with label, placeholder, and validation
- **Variants**: Default, Password (with toggle), Search (with icon), Multiline (textarea)
- **Interactive States**: Default, Focus (primary-600 border), Error (error-600 border + message), Disabled (gray bg), Filled
- **Responsive Behavior**:
  - Desktop (1440px): Width follows grid column
  - Tablet (768px): Width follows grid column
  - Mobile (375px): Full width
- **Implementation Notes**: Height 40px, border 1px neutral-300, border-radius 8px, padding 8px 12px

#### Select
- **Type**: Interactive
- **Used In Screens**: SCR-012, SCR-013
- **Wireframe References**: wireframe-SCR-012, wireframe-SCR-013
- **Description**: Dropdown select for role assignment and log filtering
- **Variants**: Default, Multi-select
- **Interactive States**: Default, Open (dropdown visible), Selected, Focus, Disabled, Error
- **Responsive Behavior**:
  - Desktop (1440px): Inline dropdown
  - Tablet (768px): Inline dropdown
  - Mobile (375px): Native select or full-screen picker
- **Implementation Notes**: Height 40px, elevation level-2 for dropdown, max-height 200px with scroll

#### RadioGroup
- **Type**: Interactive
- **Used In Screens**: SCR-006, SCR-007
- **Wireframe References**: wireframe-SCR-006, wireframe-SCR-007
- **Description**: Radio button group for single-option selection (time slots, form choices)
- **Variants**: Vertical list, Horizontal inline, Card-style (slot selection)
- **Interactive States**: Default, Selected, Hover, Focus, Disabled
- **Responsive Behavior**: Consistent across breakpoints; card-style stacks vertically on mobile
- **Implementation Notes**: Gap 8px between options, 20px radio circle, touch target 44px

#### Checkbox
- **Type**: Interactive
- **Used In Screens**: SCR-001
- **Wireframe References**: wireframe-SCR-001
- **Description**: Checkbox for "Remember me" on login
- **Variants**: Default
- **Interactive States**: Unchecked, Checked, Indeterminate, Focus, Disabled
- **Responsive Behavior**: Consistent across all breakpoints
- **Implementation Notes**: 20px checkbox, touch target 44px, gap 8px to label

#### Toggle
- **Type**: Interactive
- **Used In Screens**: SCR-007
- **Wireframe References**: wireframe-SCR-007
- **Description**: AI/Manual mode switch for intake form
- **Variants**: Default (with labels)
- **Interactive States**: Off (Manual), On (AI), Focus, Disabled
- **Responsive Behavior**: Consistent across all breakpoints
- **Implementation Notes**: Width 48px, height 24px, transition 200ms, aria-checked

#### Calendar
- **Type**: Interactive
- **Used In Screens**: SCR-006
- **Wireframe References**: wireframe-SCR-006
- **Description**: Date picker calendar for appointment slot selection
- **Variants**: Month view (default)
- **Interactive States**: Default, Date-Hover, Date-Selected, Date-Today, Date-Disabled (past), Date-Available (has slots)
- **Responsive Behavior**:
  - Desktop (1440px): Inline calendar grid
  - Tablet (768px): Inline calendar grid
  - Mobile (375px): Full-width calendar
- **Implementation Notes**: 7-column grid, cell 44px min height for touch, keyboard arrow navigation

#### FileUpload
- **Type**: Interactive
- **Used In Screens**: SCR-008
- **Wireframe References**: wireframe-SCR-008
- **Description**: Drag-and-drop file upload zone with click fallback
- **Variants**: Default (empty), Uploading (progress), Complete (file list)
- **Interactive States**: Default, Drag-Over (highlighted border), Uploading, Error, Complete
- **Responsive Behavior**: Full width across all breakpoints
- **Implementation Notes**: Dashed border, center-aligned icon and text, accept PDF/JPG/PNG

### Feedback Components

#### Badge
- **Type**: Feedback
- **Used In Screens**: SCR-002, SCR-003, SCR-009, SCR-010, SCR-011, SCR-013
- **Wireframe References**: wireframe-SCR-002, wireframe-SCR-003, wireframe-SCR-009, wireframe-SCR-010, wireframe-SCR-011, wireframe-SCR-013
- **Description**: Status indicator for appointments, queue items, users
- **Variants**: Success (green), Warning (amber), Error (red), Info (blue), Neutral (gray)
- **Interactive States**: Default (static)
- **Responsive Behavior**: Consistent across all breakpoints
- **Implementation Notes**: border-radius full, padding 2px 8px, font overline 12px uppercase, min-width 60px

#### Alert
- **Type**: Feedback
- **Used In Screens**: SCR-006, SCR-007, SCR-010
- **Wireframe References**: wireframe-SCR-006, wireframe-SCR-007, wireframe-SCR-010
- **Description**: Inline alert banner for important messages
- **Variants**: Success, Warning, Error, Info
- **Interactive States**: Default, Dismissable (with close button)
- **Responsive Behavior**: Full width across all breakpoints
- **Implementation Notes**: border-left 4px colored, bg tinted, padding 12px 16px, role="alert"

#### Toast
- **Type**: Feedback
- **Used In Screens**: All screens (transient notifications)
- **Wireframe References**: All wireframe files
- **Description**: Temporary notification message that auto-dismisses
- **Variants**: Success, Warning, Error, Info
- **Interactive States**: Enter (slide-in), Visible, Exit (fade-out)
- **Responsive Behavior**:
  - Desktop (1440px): Top-right corner, 360px width
  - Mobile (375px): Full width, bottom of screen
- **Implementation Notes**: z-index 1100, auto-dismiss 5s, aria-live="polite"

#### Modal
- **Type**: Feedback
- **Used In Screens**: SCR-009, SCR-010, SCR-011, SCR-013
- **Wireframe References**: wireframe-SCR-009, wireframe-SCR-010, wireframe-SCR-011, wireframe-SCR-013
- **Description**: Overlay dialog for confirmations and complex interactions
- **Variants**: Confirmation (small), Form (medium), Detail (large)
- **Interactive States**: Open (visible + backdrop), Closed
- **Responsive Behavior**:
  - Desktop (1440px): Centered modal, max-width 560px
  - Tablet (768px): Centered modal, max-width 480px
  - Mobile (375px): Full-screen bottom sheet
- **Implementation Notes**: border-radius 12px, elevation level-3, backdrop rgba(0,0,0,0.5), focus trap, ESC to close

#### Drawer
- **Type**: Feedback
- **Used In Screens**: SCR-006, SCR-009, SCR-013
- **Wireframe References**: wireframe-SCR-006, wireframe-SCR-009, wireframe-SCR-013
- **Description**: Side panel for detailed views and forms
- **Variants**: Right-side (default), Right-side with form
- **Interactive States**: Open (slide-in from right), Closed
- **Responsive Behavior**:
  - Desktop (1440px): Right side, width 400px
  - Tablet (768px): Right side, width 360px
  - Mobile (375px): Full-screen overlay
- **Implementation Notes**: border-radius 12px 0 0 12px, elevation level-3, transition slide 300ms, focus trap

#### ProgressBar
- **Type**: Feedback
- **Used In Screens**: SCR-008
- **Wireframe References**: wireframe-SCR-008
- **Description**: Upload progress indicator
- **Variants**: Determinate (percentage), Indeterminate (pulsing)
- **Interactive States**: Active (animating), Complete (100%, green)
- **Responsive Behavior**: Full width across all breakpoints
- **Implementation Notes**: Height 4px, border-radius full, bg neutral-200, fill primary-600, transition width 200ms

#### Skeleton
- **Type**: Feedback
- **Used In Screens**: All screens (loading states)
- **Wireframe References**: All wireframe files
- **Description**: Content placeholder during data loading
- **Variants**: Text line, Card, Table row, Avatar
- **Interactive States**: Pulsing animation
- **Responsive Behavior**: Matches component it replaces
- **Implementation Notes**: bg neutral-200, border-radius matching target, animation pulse 1.5s infinite

## Component Relationships

```
Header (Layout)
+-- Logo (Static)
+-- Page Title (h1)
+-- Notification Bell (IconButton + Badge count)
+-- User Menu (Avatar + Dropdown)
    +-- Profile Link
    +-- Settings Link
    +-- Logout Button

Sidebar (Layout)
+-- Role Badge (Badge)
+-- Nav Items (List)
    +-- Nav Item (Link + Icon + Label)
    +-- Active Indicator (Border-left primary-600)

Dashboard (Page)
+-- Card (Content)
|   +-- Card Header (h2 + Badge)
|   +-- Card Body (Content varies)
|   +-- Card Actions (Button group)
+-- Table (Content)
    +-- Table Header (Sortable columns)
    +-- Table Row (Data + Badge + Actions)
    +-- Table Footer (Pagination)

Form Page (Page)
+-- Form Group (fieldset)
    +-- Label
    +-- TextField / Select / RadioGroup
    +-- Helper Text / Error Text
    +-- Button Group (Submit + Cancel)
```

## Component States Matrix

| Component | Default | Hover | Active | Focus | Disabled | Error | Loading | Empty |
|-----------|---------|-------|--------|-------|----------|-------|---------|-------|
| Button | x | x | x | x | x | - | x | - |
| TextField | x | x | x | x | x | x | - | x |
| Select | x | x | x | x | x | x | x | x |
| RadioGroup | x | x | - | x | x | - | - | - |
| Checkbox | x | x | - | x | x | - | - | - |
| Toggle | x | x | - | x | x | - | - | - |
| Calendar | x | x | x | x | x | - | x | - |
| Card | x | x | - | - | - | - | x | x |
| Table | x | x | - | - | - | - | x | x |
| Modal | x | - | - | x | - | - | - | - |
| Drawer | x | - | - | x | - | - | - | - |
| Badge | x | - | - | - | - | - | - | - |
| Alert | x | - | - | - | - | - | - | - |
| Toast | x | - | - | - | - | - | - | - |
| FileUpload | x | x | x | x | x | x | x | - |

## Reusability Analysis

| Component | Reuse Count | Screens | Recommendation |
|-----------|-------------|---------|----------------|
| Header | 13 screens | All | Create as shared layout component |
| Sidebar | 12 screens | All authenticated | Create as shared layout component |
| Button | 13 screens | All | Create as shared component with 5 variants |
| Badge | 6 screens | SCR-002, 003, 009, 010, 011, 013 | Create as shared component with 5 variants |
| Table | 6 screens | SCR-003, 004, 009, 011, 012, 013 | Create as shared component with sortable option |
| Card | 4 screens | SCR-002, 003, 004, 010 | Create as shared component with 4 variants |
| Toast | 13 screens | All | Create as shared component with 4 variants |
| Modal | 4 screens | SCR-009, 010, 011, 013 | Create as shared component with 3 sizes |
| TextField | 4 screens | SCR-001, 005, 007, 012 | Create as shared component with 4 variants |
| Drawer | 3 screens | SCR-006, 009, 013 | Create as shared component |
| Calendar | 1 screen | SCR-006 | Screen-specific component |
| FileUpload | 1 screen | SCR-008 | Screen-specific component |
| Toggle | 1 screen | SCR-007 | Screen-specific component |

## Responsive Breakpoints Summary

| Breakpoint | Width | Components Affected | Key Adaptations |
|-----------|-------|-------------------|-----------------|
| Mobile | 375px | Sidebar→BottomNav, Table→CardList, Modal→BottomSheet, Button→FullWidth | Stacked layout, bottom nav, full-screen overlays |
| Tablet | 768px | Sidebar→Collapsible, Table→HorizontalScroll, Card→2-col grid | 2-column grids, collapsible sidebar |
| Desktop | 1440px | All at full fidelity | 12-column grid, persistent sidebar, inline modals |

## Implementation Priority Matrix

### High Priority (Core Components)
- [x] Header — Used in all screens, critical for navigation
- [x] Sidebar — Primary navigation for all authenticated users
- [x] Button — Primary user interaction across all screens
- [x] Table — Core data display for 6 screens
- [x] Card — Dashboard widgets for 4 screens
- [x] Badge — Status indicators across 6 screens
- [x] Toast — User feedback across all screens
- [x] Modal — Confirmations and forms in 4 screens

### Medium Priority (Feature Components)
- [ ] TextField — Forms and search in 4 screens
- [ ] Select — Filtering and role assignment
- [ ] Drawer — Side panels in 3 screens
- [ ] Alert — Important messages in 3 screens
- [ ] RadioGroup — Booking and intake selection
- [ ] Calendar — Appointment date selection
- [ ] Toggle — AI/Manual mode switch
- [ ] Skeleton — Loading states

### Low Priority (Enhancement Components)
- [ ] Avatar — User profile display
- [ ] Checkbox — Remember me on login
- [ ] Pagination — Audit log table navigation
- [ ] ProgressBar — File upload progress
- [ ] FileUpload — Document upload interface

## Framework-Specific Notes
**Detected Framework**: React 18.x  
**Component Library**: Custom (based on designsystem.md tokens)

### Framework Patterns Applied
- Functional Components with hooks for state management
- CSS Custom Properties for design token consumption
- Media queries for responsive behavior
- CSS transitions (200ms ease) for interactive states

### Component Library Mappings
| Wireframe Component | React Component | Customization Required |
|-------------------|-------------------|----------------------|
| Button | `<Button variant="primary" size="md">` | 5 variants, 3 sizes, 6 states |
| TextField | `<TextField label="" error="">` | Validation styling, password toggle |
| Select | `<Select options={[]} />` | Dropdown styling, multi-select |
| Table | `<DataTable columns={[]} data={[]} />` | Sortable headers, row actions |
| Modal | `<Modal size="md" open={}>` | 3 sizes, focus trap |
| Card | `<Card variant="default">` | 4 variants, clickable option |

## Accessibility Considerations

| Component | ARIA Attributes | Keyboard Navigation | Screen Reader Notes |
|-----------|----------------|-------------------|-------------------|
| Button | role="button", aria-disabled | Enter/Space to activate | Announce label + state |
| TextField | aria-label, aria-describedby, aria-invalid | Tab to focus, type to input | Announce label, error msg |
| Modal | role="dialog", aria-labelledby, aria-modal="true" | Tab trap, ESC to close | Announce title on open |
| Drawer | role="dialog", aria-labelledby | Tab trap, ESC to close | Announce title on open |
| Table | role="table", aria-sort on headers | Tab through cells, arrow keys | Announce column + cell content |
| Badge | role="status", aria-label | Not focusable | Announce status text |
| Alert | role="alert", aria-live="assertive" | Not focusable | Auto-announced on appearance |
| Toast | aria-live="polite" | Dismiss with ESC | Auto-announced after delay |
| Calendar | role="grid", aria-label | Arrow keys navigate dates | Announce date + availability |
| Toggle | role="switch", aria-checked | Space to toggle | Announce label + state |

## Design System Integration

**Design System Reference**: See [designsystem.md](../docs/designsystem.md)

### Components Matching Design System
- [x] Button — Uses primary-600, border-radius md (8px), Inter font
- [x] TextField — Uses neutral-300 border, primary-600 focus, error-600 error
- [x] Card — Uses level-1 elevation, border-radius md (8px), 16px padding
- [x] Table — Uses neutral-200 borders, neutral-50 alternate rows
- [x] Badge — Uses semantic colors, border-radius full, overline typography
- [x] Modal — Uses level-3 elevation, border-radius lg (12px)
- [x] Alert — Uses semantic color tints, 4px left border

### New Components to Add to Design System
- [ ] Calendar — Custom date picker grid with availability states
- [ ] FileUpload — Drag-and-drop zone with dashed border pattern
- [ ] Chat Bubbles — AI conversation interface for intake (SCR-007)
