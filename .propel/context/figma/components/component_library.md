# Component Library — Unified Patient Access & Clinical Intelligence Platform

**Source**: designsystem.md (tokens + component specs)
**Naming Convention**: `C/<Category>/<Name>`
**Version**: 1.0
**Last Updated**: 2026-03-17

---

## C/Actions

### Button

| Property | Value |
|----------|-------|
| Variants | Primary, Secondary, Tertiary, Ghost, Destructive |
| Sizes | Small (32px), Medium (40px), Large (48px) |
| States | Default, Hover, Focus, Active, Disabled, Loading |

#### Variant Specifications

| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| Primary | primary-600 (`#0066CC`) | white | none |
| Secondary | transparent | primary-600 | 1px solid primary-600 |
| Tertiary | transparent | primary-600 | none |
| Ghost | transparent | neutral-700 | none |
| Destructive | error-600 (`#DC3545`) | white | none |

#### Size Specifications

| Size | Height | Padding | Font Size | Icon Size |
|------|--------|---------|-----------|-----------|
| Small | 32px | 6px 12px | 14px | 16px |
| Medium | 40px | 8px 16px | 16px | 20px |
| Large | 48px | 12px 24px | 18px | 24px |

#### State Specifications

| State | Visual Treatment |
|-------|-----------------|
| Default | Base styling per variant |
| Hover | Background 10% darker |
| Focus | focus-ring: `0 0 0 2px #FFF, 0 0 0 4px #0066CC` |
| Active | Inset shadow: `inset 0px 2px 4px rgba(0,0,0,0.2)` |
| Disabled | 50% opacity, cursor: not-allowed |
| Loading | Spinner replaces text, button disabled |

**Spacing**: Icon-text gap 8px, button-to-button gap 12px (inline), 16px (stacked)
**Border Radius**: md (8px)

---

### IconButton

| Property | Value |
|----------|-------|
| Variants | Primary, Secondary, Tertiary, Ghost, Destructive |
| Sizes | Small (32×32px, icon 16px), Medium (40×40px, icon 20px), Large (48×48px, icon 24px) |
| States | Default, Hover, Focus, Active, Disabled, Loading |

**Usage**: Close modal (Ghost), Edit action (Secondary), Delete action (Destructive), Overflow menu (Ghost)

---

### FAB (Floating Action Button)

| Property | Value |
|----------|-------|
| Size | 56×56px |
| Icon Size | 24px |
| Background | primary-600 |
| Shadow | level-3 |
| Border Radius | full (9999px) |
| States | Default, Hover (level-4 shadow), Focus, Active, Disabled |

**Usage**: Mobile "Add Walk-in" on SCR-009

---

### Link

| State | Color | Decoration |
|-------|-------|------------|
| Default | primary-600 | underline |
| Hover | primary-800 | underline |
| Active | primary-900 | underline |
| Visited | #551A8B | underline |
| Focus | primary-600 | 2px outline |

**Size**: Inherits from parent context

---

## C/Inputs

### TextField

| Property | Value |
|----------|-------|
| Sizes | Small (32px), Medium (40px), Large (48px) |
| States | Default, Hover, Focus, Error, Disabled |

#### State Specifications

| State | Background | Border | Text Color |
|-------|-----------|--------|------------|
| Default | white | 1px solid neutral-300 | neutral-900 |
| Hover | white | 1px solid neutral-400 | neutral-900 |
| Focus | white | 2px solid primary-600 | neutral-900 |
| Error | white | 2px solid error-600 | neutral-900 |
| Disabled | neutral-100 | 1px solid neutral-300 | neutral-500 |

#### Elements

| Element | Style |
|---------|-------|
| Label | 14px medium, neutral-700 |
| Placeholder | 16px regular, neutral-500 |
| Helper Text | 12px regular, neutral-600 |
| Error Message | 12px regular, error-600 |
| Icon | 20px (prefix or suffix) |

**Spacing**: Label-to-input 4px, input padding 8px 12px, icon margin 8px

---

### TextArea

| Property | Value |
|----------|-------|
| Min Height | 80px |
| Max Height | 200px (scrollable) |
| Resize | Vertical only |
| Character Count | Caption style, bottom-right |

Inherits all TextField states and styling.

---

### Select

| Property | Value |
|----------|-------|
| Dropdown Icon | Chevron-down, 20px, neutral-500 |
| Dropdown Menu | white, shadow level-2, radius md (8px), max-height 300px |
| Option Padding | 8px 12px |
| Option Hover | background neutral-100 |
| Option Selected | background primary-100, text primary-600 |

Inherits TextField field states and sizing.

---

### Checkbox

| Size | Dimensions |
|------|-----------|
| Small | 16×16px |
| Medium (default) | 20×20px |
| Large | 24×24px |

| State | Background | Border | Mark |
|-------|-----------|--------|------|
| Unchecked | white | 2px solid neutral-400 | — |
| Checked | primary-600 | 2px solid primary-600 | white checkmark |
| Indeterminate | primary-600 | 2px solid primary-600 | white dash |
| Disabled | neutral-100 | neutral-300 | — |

**Spacing**: Label gap 8px, vertical gap 12px (stacked)

---

### RadioGroup

| State | Background | Border | Inner Circle |
|-------|-----------|--------|-------------|
| Unselected | white | 2px solid neutral-400 | — |
| Selected | white | 2px solid primary-600 | 8px diameter primary-600 |
| Disabled | neutral-100 | neutral-300 | — |

Inherits Checkbox sizing. **Spacing**: Label gap 8px, vertical gap 12px

---

### Toggle

| Size | Track | Thumb |
|------|-------|-------|
| Small | 32×20px | 16px |
| Medium (default) | 48×28px | 24px |

| State | Track Color | Thumb Color |
|-------|------------|-------------|
| Off | neutral-300 | white |
| On | primary-600 | white |
| Disabled | neutral-200 | neutral-400 |

**Animation**: 200ms ease-in-out transition

---

### FileUpload

| State | Visual |
|-------|--------|
| Default | Dashed border (neutral-300), upload icon, "Drag and drop or click to upload" text |
| Drag Active | Dashed border (primary-600), background primary-100 |
| Uploading | ProgressBar with file name and percentage |
| Success | Green check icon, file name, success badge |
| Error | Red alert icon, error message, "Retry" button |

**Accepted Formats**: PDF, JPG, PNG (from FR-006)
**Max File Size**: 10MB
**Border Radius**: md (8px)

---

## C/Navigation

### Header

| Platform | Height | Padding | Elements |
|----------|--------|---------|----------|
| Desktop | 64px | 0 32px | Logo (40px), role badge, nav links (H6), avatar (40px), notifications bell |
| Mobile | 56px | 0 16px | Menu icon, logo (32px), avatar (32px) |

**Background**: white, shadow level-1

---

### Sidebar

| Property | Expanded | Collapsed |
|----------|----------|-----------|
| Width | 240px | 64px |
| Background | white | white |
| Border | 1px solid neutral-200 (right) | 1px solid neutral-200 (right) |
| Padding | 16px | 16px |

#### Navigation Item

| State | Background | Text | Indicator |
|-------|-----------|------|-----------|
| Default | transparent | neutral-700 | — |
| Hover | neutral-100 | neutral-700 | — |
| Active | primary-100 | primary-600 | 4px left border primary-600 |
| Focus | focus-ring | — | — |

**Height**: 40px, **Padding**: 8px 12px, **Icon**: 20px, **Label**: 16px medium

---

### BottomNav

| Property | Value |
|----------|-------|
| Height | 56px |
| Max Items | 4–5 |
| Background | white |
| Shadow | level-1 (upward) |
| Border Top | 1px solid neutral-200 |

| State | Icon | Label |
|-------|------|-------|
| Inactive | neutral-500, 24px | neutral-600, 12px |
| Active | primary-600, 24px | primary-600, 12px medium + 2px top border |

---

### Breadcrumb

**Desktop only.** Separator: "/" or chevron-right, neutral-400. Current item: neutral-700, non-clickable. Previous items: primary-600, clickable.

---

### Tabs

| Property | Value |
|----------|-------|
| Orientation | Horizontal (default), Vertical |
| Height | 40px |
| Indicator | 2px bottom border primary-600 (active tab) |

| State | Color | Weight |
|-------|-------|--------|
| Inactive | neutral-600 | regular (400) |
| Active | primary-600 | semi-bold (600) |
| Hover | neutral-900 | regular (400) |
| Focus | focus-ring | — |

---

## C/Content

### Card

| Variant | Background | Shadow | Border |
|---------|-----------|--------|--------|
| Elevated | white | level-1 | none |
| Flat | neutral-50 | none | 1px solid neutral-200 |
| Interactive | white | level-1 → level-2 on hover | none |

**Padding**: 16px (mobile), 24px (desktop). **Border Radius**: md (8px).

#### Card Elements

| Element | Style |
|---------|-------|
| Header Title | H3 |
| Header Actions | IconButtons (right-aligned) |
| Header Divider | 1px solid neutral-200 |
| Content Body | Body-medium, gap 16px |
| Actions | Secondary/Tertiary buttons, right-aligned, gap 12px |

---

### Table

| Element | Style |
|---------|-------|
| Header Background | neutral-50 |
| Header Border | 2px solid neutral-300 (bottom) |
| Header Text | H6 (14px semi-bold) |
| Cell Padding | 12px 16px |
| Cell Text | Body-small (14px) |
| Row Border | 1px solid neutral-200 (bottom) |
| Row Hover | background neutral-50 |
| Sortable Icon | Chevron up/down 16px, hover: primary-600 |

**Responsive**: Full table (desktop), horizontal scroll (tablet), card layout (mobile)

---

### Avatar

| Size | Dimensions | Font Size |
|------|-----------|-----------|
| XS | 24×24px | 10px |
| S | 32×32px | 12px |
| M | 40×40px | 16px |
| L | 48×48px | 18px |
| XL | 64×64px | 24px |

**Border Radius**: full (9999px). **Fallback**: Initials with primary-100 background, primary-600 text.

---

### Badge

#### Number Badge

| Size | Dimensions | Background | Text |
|------|-----------|-----------|------|
| Small | 20×20px | error-600 | white, 12px medium |
| Medium | 24×24px | error-600 | white, 12px medium |

**Positioning**: Top-right of parent, -4px offset

#### Status Badge

| Variant | Background | Text |
|---------|-----------|------|
| Success | success-200 | success-700, 12px medium uppercase |
| Warning | warning-200 | warning-700, 12px medium uppercase |
| Error | error-200 | error-700, 12px medium uppercase |
| Info | info-200 | info-700, 12px medium uppercase |
| Neutral | neutral-200 | neutral-700, 12px medium uppercase |

**Shape**: Pill (9999px radius), **Padding**: 4px 8px

---

### Divider

| Orientation | Dimensions | Color |
|------------|-----------|-------|
| Horizontal | 100% × 1px | neutral-200 |
| Vertical | 1px × 100% | neutral-200 |

---

## C/Feedback

### Modal

| Size | Width |
|------|-------|
| Small | 400px |
| Medium (default) | 600px |
| Large | 800px |
| Fullscreen | 100vw × 100vh |

**Layout**: white, radius lg (12px), shadow level-3, padding 24px
**Backdrop**: rgba(0,0,0,0.5), blur 4px optional
**Animation**: Enter fade 200ms + scale 0.95→1, exit fade 150ms + scale→0.95

#### Modal Elements

| Element | Style |
|---------|-------|
| Header Title | H3 |
| Close Button | IconButton Ghost (top-right) |
| Header Divider | 1px solid neutral-200 |
| Content | Body-medium, max-height calc(100vh - 200px) scrollable |
| Actions | Primary + Secondary buttons, right-aligned, gap 12px |
| Actions Divider | 1px solid neutral-200 (top) |

---

### Drawer

| Size | Width | Mobile |
|------|-------|--------|
| Small | 360px | 80vw |
| Medium (default) | 480px | 90vw |
| Large | 640px | 100vw |

**Position**: Right (default), Left, Bottom (mobile)
**Layout**: white, shadow level-3, height 100vh, padding 24px
**Animation**: Slide in 250ms + backdrop fade 200ms; exit slide 200ms + fade 150ms

#### Drawer Elements

| Element | Style |
|---------|-------|
| Header Title | H3 |
| Close Button | IconButton Ghost (top-right) |
| Content | Scrollable, form elements full width |
| Actions | Sticky footer, Primary + Secondary, right-aligned, gap 12px |

---

### Toast

| Type | Background | Icon |
|------|-----------|------|
| Info | info-600 | info-circle |
| Success | success-600 | check-circle |
| Warning | warning-600 | alert-triangle |
| Error | error-600 | alert-circle |

**Layout**: padding 12px 16px, radius md (8px), shadow level-2, width 300px (desktop) / 90vw (mobile)
**Position**: Top-right 24px (desktop), bottom-center 16px (mobile)
**Auto-dismiss**: 5s (success/info), 7s (warning/error)
**Animation**: Slide in + fade 200ms

---

### Alert

| Type | Border Left | Background | Icon Color |
|------|------------|-----------|------------|
| Info | 4px solid info-600 | info-100 | info-600 |
| Success | 4px solid success-600 | success-100 | success-600 |
| Warning | 4px solid warning-600 | warning-100 | warning-600 |
| Error | 4px solid error-600 | error-100 | error-600 |

**Layout**: padding 16px, radius md (8px)
**Elements**: Icon (24px), optional Title (H5), Message (Body-small, neutral-900), optional action buttons (Tertiary), optional close (IconButton Ghost)
**Variants**: Inline (content flow), Banner (full viewport width, sticky top)

---

### Skeleton

| Type | Dimensions | Radius |
|------|-----------|--------|
| Text | 16px height, variable width | sm (4px) |
| Avatar | Match avatar size | full (circle) or md |
| Card | Match card height, 100% width | md (8px) |
| Table Row | Match row height | none |

**Animation**: Pulse — neutral-200 to neutral-100, 1.5s infinite

---

### ProgressBar

| Variant | Track | Fill |
|---------|-------|------|
| Determinate | neutral-200 | primary-600 |
| Indeterminate | neutral-200 | primary-600 (animated) |

**Height**: 4px (thin), 8px (default)
**Border Radius**: full (9999px)

---

### Spinner

| Size | Dimensions | Stroke |
|------|-----------|--------|
| Small | 16×16px | 2px |
| Medium | 24×24px | 3px |
| Large | 40×40px | 4px |

**Color**: primary-600 (default), white (on dark backgrounds)
**Animation**: 360° rotation, 0.8s linear infinite

---

## C/Data

### Calendar

| Property | Value |
|----------|-------|
| Type | Month view date picker |
| Cell Size | 40×40px |
| Today | primary-100 background, primary-600 text |
| Selected | primary-600 background, white text |
| Disabled (past dates) | neutral-400 text, no hover |
| Hover | neutral-100 background |
| Focus | focus-ring |

**Navigation**: Previous/Next month arrows (IconButton Ghost)
**Border Radius**: md (8px) for container

---

## Component Count Summary

| Category | Components | Total Variants |
|----------|-----------|---------------|
| C/Actions | 4 (Button, IconButton, FAB, Link) | 5 button variants × 3 sizes × 6 states = 90 |
| C/Inputs | 7 (TextField, TextArea, Select, Checkbox, RadioGroup, Toggle, FileUpload) | 5 states × 3 sizes avg = 105 |
| C/Navigation | 5 (Header, Sidebar, BottomNav, Breadcrumb, Tabs) | Desktop + Mobile variants = 10+ |
| C/Content | 6 (Card, ListItem, Table, Avatar, Badge, Divider) | 3 card + 5 avatar + 5 badge = 35+ |
| C/Feedback | 7 (Modal, Drawer, Toast, Alert, Skeleton, ProgressBar, Spinner) | 4 types × 4 sizes avg = 48+ |
| C/Data | 1 (Calendar) | Month view, states = 5 |
| **Total** | **30 components** | **~293+ variant/state combinations** |

---

## Universal State Matrix

All interactive components support these 6 states:

| State | Visual Treatment | Required |
|-------|-----------------|----------|
| Default | Base styling per design tokens | Yes |
| Hover | Subtle elevation/color shift | Yes (desktop) |
| Focus | 2px outline primary-600 + 2px white inner ring (>=3:1 contrast) | Yes |
| Active | Pressed/depressed visual (inset shadow or darker fill) | Yes |
| Disabled | 50% opacity, cursor: not-allowed | Yes |
| Loading | Skeleton or spinner replacement | Yes (async components) |
