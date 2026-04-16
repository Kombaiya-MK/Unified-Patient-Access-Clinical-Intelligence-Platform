# Design System - Unified Patient Access & Clinical Intelligence Platform

## Design System Overview

This design system defines the visual language and component specifications for the Unified Patient Access & Clinical Intelligence Platform. It serves as the single source of truth for design tokens, component behavior, and brand guidelines to ensure consistency across all screens and user interfaces.

**Platform**: Responsive Web (React)  
**Target Devices**: Desktop (1440px+), Tablet (768px-1023px), Mobile (375px-767px)  
**Accessibility Standard**: WCAG 2.2 AA  
**Version**: 1.0  
**Last Updated**: March 17, 2026

---

## 1. Design Tokens

### 1.1 Color Palette

#### Primary Colors
```yaml
Primary:
  primary-900: "#003D7A"  # Darkest - pressed state
  primary-800: "#004C99"  # Darker - hover state  
  primary-700: "#005BB8"  # Dark
  primary-600: "#0066CC"  # Base primary color
  primary-500: "#3385D6"  # Light
  primary-400: "#66A3E0"  # Lighter
  primary-300: "#99C2EB"  # Very light
  primary-200: "#CCE0F5"  # Pale
  primary-100: "#E6F0FA"  # Background tint

Usage:
  - Primary CTAs (buttons, links)
  - Active navigation items
  - Focus indicators
  - Brand elements
```

#### Secondary Colors
```yaml
Secondary:
  secondary-900: "#006647"  # Darkest
  secondary-800: "#008057"  # Darker
  secondary-700: "#009966"  # Dark
  secondary-600: "#00A86B"  # Base secondary color (healthcare green)
  secondary-500: "#33B989"  # Light
  secondary-400: "#66CAA7"  # Lighter
  secondary-300: "#99DCC5"  # Very light
  secondary-200: "#CCEDE2"  # Pale
  secondary-100: "#E6F6F0"  # Background tint

Usage:
  - Success states
  - Health-related icons
  - Confirmation messages
  - Positive indicators
```

#### Semantic Colors
```yaml
Success:
  success-700: "#007A3D"
  success-600: "#00A145"  # Base success
  success-500: "#33B367"
  success-200: "#CCF2DF"
  success-100: "#E6F9EF"

Warning:
  warning-700: "#CC6600"
  warning-600: "#FF8800"  # Base warning
  warning-500: "#FFA033"
  warning-200: "#FFE5CC"
  warning-100: "#FFF2E6"

Error:
  error-700: "#A02A2A"
  error-600: "#DC3545"  # Base error
  error-500: "#E35D6A"
  error-200: "#F8D7DA"
  error-100: "#FCE8EA"

Info:
  info-700: "#005A8A"
  info-600: "#0077B6"  # Base info
  info-500: "#3392C5"
  info-200: "#CCE7F4"
  info-100: "#E6F3F9"

Usage:
  - success: Success toast, confirmation banners, approved status
  - warning: Warning alerts, medium-priority notifications, amber risk level
  - error: Error messages, validation failures, critical alerts
  - info: Informational messages, tooltips, help text
```

#### Neutral/Gray Scale
```yaml
Neutral:
  neutral-900: "#1A1A1A"  # Darkest text
  neutral-800: "#333333"  # Dark text
  neutral-700: "#4D4D4D"  # Body text
  neutral-600: "#666666"  # Secondary text
  neutral-500: "#808080"  # Placeholder text
  neutral-400: "#999999"  # Disabled text
  neutral-300: "#CCCCCC"  # Borders
  neutral-200: "#E5E5E5"  # Dividers
  neutral-100: "#F5F5F5"  # Background light
  neutral-50:  "#FAFAFA"  # Background lightest

Usage:
  - Text hierarchy (900=headings, 700=body, 600=secondary)
  - Borders and dividers (300, 200)
  - Backgrounds (100, 50)
  - Disabled states (400)
```

#### Background Colors
```yaml
Background:
  bg-primary: "#FFFFFF"      # Main background (white)
  bg-secondary: "#F5F5F5"    # Secondary background (neutral-100)
  bg-tertiary: "#FAFAFA"     # Tertiary background (neutral-50)
  bg-overlay: "rgba(0, 0, 0, 0.5)"  # Modals/drawers backdrop

Usage:
  - bg-primary: Main content areas
  - bg-secondary: Card backgrounds, alternate table rows
  - bg-tertiary: Page backgrounds
  - bg-overlay: Modal/drawer backdrops
```

#### Color Contrast Requirements (WCAG AA)
✓ **Text on backgrounds**: Minimum 4.5:1 (normal text), 3:1 (large text 18px+)  
✓ **UI components**: Minimum 3:1 (buttons, form borders, focus indicators)  
✓ **Critical information** (medication conflicts, errors): Minimum 7:1 for enhanced readability

**Accessible Combinations:**
- `neutral-900` on `bg-primary` (white) → 16.75:1 ✓ (AAA)
- `neutral-700` on `bg-primary` → 9.41:1 ✓ (AAA)
- `neutral-600` on `bg-primary` → 5.74:1 ✓ (AA)
- `primary-600` on `bg-primary` → 5.40:1 ✓ (AA)
- `error-600` on `bg-primary` → 4.63:1 ✓ (AA)
- `success-700` on `bg-primary` → 5.55:1 ✓ (AA) *(text-success remapped from success-600)*
- `warning-700` on `bg-primary` → 4.51:1 ✓ (AA)

**Contrast Fixes Applied (US_043 TASK_005):**
- `--color-text-success` remapped from `success-600` (3.94:1 FAIL) → `success-700` (5.55:1 PASS)
- `--accent-text` introduced at #9000E0 (4.70:1) — original `--accent` kept for decorative usage
- Desktop touch targets raised from 36px → 40px to meet UXR-304
- See `app/docs/color-contrast-report.md` for full audit

---

### 1.2 Typography

#### Font Families
```yaml
Heading: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
Body: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
Mono: "Fira Code", "Consolas", "Monaco", "Courier New", monospace

Justification:
  - Inter: Professional, readable, excellent web rendering
  - System font stack: Fallback for performance
  - Mono: Audit logs, technical data, IDs
```

#### Type Scale
```yaml
Display:
  display-large:
    size: 48px
    weight: 700 (Bold)
    line-height: 56px (1.167)
    letter-spacing: -0.5px
    usage: "Hero headings (landing page, not in MVP)"

Headings:
  h1:
    size: 32px
    weight: 700 (Bold)
    line-height: 40px (1.25)
    letter-spacing: -0.25px
    usage: "Page titles (Dashboard, main screens)"
  
  h2:
    size: 24px
    weight: 600 (Semi-bold)
    line-height: 32px (1.33)
    letter-spacing: 0px
    usage: "Section titles (Cards, data sections)"
  
  h3:
    size: 20px
    weight: 600 (Semi-bold)
    line-height: 28px (1.4)
    letter-spacing: 0px
    usage: "Subsection titles (Form groups, lists)"
  
  h4:
    size: 18px
    weight: 600 (Semi-bold)
    line-height: 24px (1.33)
    letter-spacing: 0px
    usage: "Modal/drawer titles"
  
  h5:
    size: 16px
    weight: 600 (Semi-bold)
    line-height: 24px (1.5)
    letter-spacing: 0px
    usage: "Table headers, list item titles"
  
  h6:
    size: 14px
    weight: 600 (Semi-bold)
    line-height: 20px (1.43)
    letter-spacing: 0px
    usage: "Component labels, small headings"

Body Text:
  body-large:
    size: 18px
    weight: 400 (Regular)
    line-height: 28px (1.56)
    letter-spacing: 0px
    usage: "Lead paragraphs, emphasis text"
  
  body-medium:
    size: 16px
    weight: 400 (Regular)
    line-height: 24px (1.5)
    letter-spacing: 0px
    usage: "Default body text, form inputs"
  
  body-small:
    size: 14px
    weight: 400 (Regular)
    line-height: 20px (1.43)
    letter-spacing: 0px
    usage: "Secondary text, table cells"

Supporting Text:
  caption:
    size: 12px
    weight: 400 (Regular)
    line-height: 16px (1.33)
    letter-spacing: 0px
    usage: "Helper text, timestamps, metadata"
  
  label:
    size: 14px
    weight: 500 (Medium)
    line-height: 20px (1.43)
    letter-spacing: 0.1px
    usage: "Form labels, button text"
  
  overline:
    size: 12px
    weight: 500 (Medium)
    line-height: 16px (1.33)
    letter-spacing: 1px
    text-transform: uppercase
    usage: "Badges, status labels, categories"
```

#### Font Weights
```yaml
Weights:
  regular: 400    # Body text
  medium: 500     # Labels, emphasis
  semi-bold: 600  # Headings
  bold: 700       # Display, H1
```

---

### 1.3 Spacing

#### Spacing Scale (Base 8px)
```yaml
Spacing:
  xs: 4px       # Compact elements (badge padding, icon margin)
  sm: 8px       # Small spacing (button padding, list item padding)
  md: 12px      # Medium spacing (card padding, form field margin)
  base: 16px    # Default spacing (section margin, card content padding)
  lg: 24px      # Large spacing (section gaps, modal padding)
  xl: 32px      # Extra large (page padding, major section gaps)
  2xl: 48px     # Double extra large (page header margin)
  3xl: 64px     # Triple extra large (hero sections, not in MVP)
  4xl: 96px     # Quadruple (rare, large page margins)

Usage Guidelines:
  - Stack margin: Use base (16px) or lg (24px)
  - Inline spacing: Use sm (8px) or md (12px)
  - Card padding: Use base (16px) or lg (24px)
  - Button padding: Horizontal md (12px), Vertical sm (8px)
  - Form field margin: Use base (16px) between fields
  - Page container: xl (32px) desktop, base (16px) mobile
```

#### Component-Specific Spacing
```yaml
Button:
  padding-sm: "6px 12px"    # Small button
  padding-md: "8px 16px"    # Medium button (default)
  padding-lg: "12px 24px"   # Large button
  gap: 8px                  # Icon-text gap

Card:
  padding: 16px             # Card content padding
  gap: 16px                 # Between card elements
  margin: 16px              # Card to card spacing

Form:
  field-gap: 16px           # Between form fields
  label-gap: 4px            # Label to input gap
  group-gap: 24px           # Between form groups

Table:
  cell-padding: "12px 16px" # Table cell padding
  header-padding: "12px 16px"
  row-gap: 0px              # No gap (border separation)
```

---

### 1.4 Border Radius

```yaml
Radius:
  none: 0px         # No radius (tables, dividers)
  sm: 4px           # Small (badges, tags, chips)
  md: 8px           # Medium (buttons, inputs, cards - DEFAULT)
  lg: 12px          # Large (modals, drawers)
  xl: 16px          # Extra large (featured cards, hero sections)
  full: 9999px      # Fully rounded (avatars, pills, FAB)

Component Mapping:
  - Buttons: md (8px)
  - Inputs: md (8px)
  - Cards: md (8px)
  - Modals: lg (12px)
  - Badges: full (9999px)
  - Avatars: full (9999px)
  - Tables: none (0px)
```

---

### 1.5 Elevation & Shadows

```yaml
Elevation Levels:
  level-0:  # No shadow (inline elements, table cells)
    value: "none"
  
  level-1:  # Subtle shadow (cards, list items)
    value: "0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 2px rgba(0, 0, 0, 0.24)"
    usage: "Cards, list items, subtle elevation"
  
  level-2:  # Medium shadow (dropdowns, popovers)
    value: "0px 3px 6px rgba(0, 0, 0, 0.15), 0px 2px 4px rgba(0, 0, 0, 0.12)"
    usage: "Dropdowns, select menus, date picker"
  
  level-3:  # Prominent shadow (modals, drawers)
    value: "0px 10px 20px rgba(0, 0, 0, 0.15), 0px 3px 6px rgba(0, 0, 0, 0.10)"
    usage: "Modals, drawers, floating action buttons"
  
  level-4:  # High elevation (tooltips on top of modals)
    value: "0px 15px 25px rgba(0, 0, 0, 0.15), 0px 5px 10px rgba(0, 0, 0, 0.05)"
    usage: "Tooltips, context menus (rarely used)"
  
  level-5:  # Maximum elevation (rare, critical overlays)
    value: "0px 20px 40px rgba(0, 0, 0, 0.2)"
    usage: "Critical alerts, system banners"

Focus/Active Shadows:
  focus-ring:
    value: "0 0 0 2px #FFFFFF, 0 0 0 4px #0066CC"
    usage: "Keyboard focus indicator (2px white inner ring, 2px primary outer ring)"
  
  button-active:
    value: "inset 0px 2px 4px rgba(0, 0, 0, 0.2)"
    usage: "Button pressed state (inset shadow)"
```

---

### 1.6 Breakpoints

```yaml
Breakpoints:
  mobile:
    min: 320px
    max: 767px
    container: "100% - 32px padding (16px each side)"
    columns: 4
    gutter: 16px
  
  tablet:
    min: 768px
    max: 1023px
    container: "100% - 64px padding (32px each side)"
    columns: 8
    gutter: 24px
  
  desktop:
    min: 1024px
    max: 1440px
    container: "100% max 1440px"
    columns: 12
    gutter: 24px
  
  wide:
    min: 1441px
    container: "1440px centered"
    columns: 12
    gutter: 32px

Media Query Syntax:
  mobile: "@media (max-width: 767px)"
  tablet: "@media (min-width: 768px) and (max-width: 1023px)"
  desktop: "@media (min-width: 1024px)"
  wide: "@media (min-width: 1441px)"
```

---

### 1.7 Grid System

```yaml
Grid:
  desktop:
    columns: 12
    gutter: 24px
    margin: 32px (each side)
    max-width: 1440px
  
  tablet:
    columns: 8
    gutter: 24px
    margin: 32px (each side)
  
  mobile:
    columns: 4
    gutter: 16px
    margin: 16px (each side)

Usage Examples:
  - Dashboard 3-column layout: 4-4-4 columns (desktop), 8-8-8 stacked (tablet), 4 full width (mobile)
  - Form with sidebar: 8-4 layout (desktop), 8 stacked (tablet/mobile)
  - Content + sidebar: 9-3 layout (desktop), 8 stacked (tablet/mobile)
```

---

## 2. Component Library

### 2.1 Actions

#### Button
```yaml
Purpose: Primary interaction element for user actions

Variants:
  Primary:
    background: primary-600
    text: white
    border: none
    usage: "Main CTAs (Book appointment, Submit, Save)"
  
  Secondary:
    background: transparent
    text: primary-600
    border: 1px solid primary-600
    usage: "Secondary actions (Cancel, Back)"
  
  Tertiary:
    background: transparent
    text: primary-600
    border: none
    usage: "Tertiary actions (links styled as buttons)"
  
  Ghost:
    background: transparent
    text: neutral-700
    border: none
    usage: "Low emphasis actions (minimize, close)"
  
  Destructive:
    background: error-600
    text: white
    border: none
    usage: "Destructive actions (Delete, Deactivate)"

Sizes:
  Small:
    height: 32px
    padding: "6px 12px"
    font-size: 14px
    icon-size: 16px
  
  Medium (Default):
    height: 40px
    padding: "8px 16px"
    font-size: 16px
    icon-size: 20px
  
  Large:
    height: 48px
    padding: "12px 24px"
    font-size: 18px
    icon-size: 24px

States:
  Default: base colors
  Hover: background 10% darker
  Focus: focus-ring shadow (2px border)
  Active: button-active shadow (inset)
  Disabled: 50% opacity, cursor not-allowed
  Loading: spinner replaces text, button disabled

Spacing:
  Icon-text gap: 8px
  Button-to-button gap: 12px (inline), 16px (stacked)
```

#### IconButton
```yaml
Purpose: Icon-only button for compact actions

Sizes:
  Small: 32x32px, icon 16px
  Medium: 40x40px, icon 20px
  Large: 48x48px, icon 24px

Variants: Same as button (Primary, Secondary, Tertiary, Ghost, Destructive)

Usage:
  - Close modal (Ghost)
  - Edit action (Secondary)
  - Delete action (Destructive)
  - Overflow menu (Ghost)
```

#### Link
```yaml
Purpose: Hyperlink for navigation

Styles:
  Default:
    color: primary-600
    text-decoration: underline
  Hover:
    color: primary-800
  Active:
    color: primary-900
  Visited:
    color: "#551A8B"
  Focus:
    outline: 2px solid primary-600

Sizes:
  Inherit font size from parent context
```

---

### 2.2 Inputs

#### TextField
```yaml
Purpose: Single-line text input

Sizes:
  Small: 32px height
  Medium: 40px height (default)
  Large: 48px height

States:
  Default:
    background: white
    border: 1px solid neutral-300
    text: neutral-900
  Hover:
    border: 1px solid neutral-400
  Focus:
    border: 2px solid primary-600
    outline: none
  Error:
    border: 2px solid error-600
    helper-text: error-600
  Disabled:
    background: neutral-100
    border: 1px solid neutral-300
    text: neutral-500
    cursor: not-allowed

Elements:
  Label: 14px medium, neutral-700
  Placeholder: 16px regular, neutral-500
  Helper text: 12px regular, neutral-600
  Error message: 12px regular, error-600
  Icon: 20px (prefix or suffix)

Spacing:
  Label to input: 4px
  Input padding: 8px 12px
  Icon margin: 8px (inside input)
```

#### Select
```yaml
Purpose: Dropdown selection input

Inherits: TextField styles

Additional Elements:
  Dropdown icon: Chevron-down, 20px, neutral-500
  Dropdown menu:
    background: white
    shadow: level-2
    border-radius: md (8px)
    max-height: 300px (scrollable)
  
  Option:
    padding: 8px 12px
    hover: background neutral-100
    selected: background primary-100, text primary-600
```

#### Checkbox
```yaml
Purpose: Multiple selection input

Sizes:
  Small: 16x16px
  Medium: 20x20px (default)
  Large: 24x24px

States:
  Unchecked:
    background: white
    border: 2px solid neutral-400
  Checked:
    background: primary-600
    border: 2px solid primary-600
    checkmark: white
  Indeterminate:
    background: primary-600
    dash: white (horizontal line)
  Disabled:
    background: neutral-100
    border: neutral-300

Spacing:
  Label gap: 8px
  Vertical gap: 12px (stacked checkboxes)
```

#### RadioGroup
```yaml
Purpose: Single selection from multiple options

Inherits: Checkbox sizing

States:
  Unselected:
    background: white
    border: 2px solid neutral-400
    shape: circle
  Selected:
    background: white
    border: 2px solid primary-600
    inner-circle: primary-600 (8px diameter)
  Disabled:
    background: neutral-100
    border: neutral-300

Spacing:
  Label gap: 8px
  Vertical gap: 12px (stacked options)
```

#### Toggle
```yaml
Purpose: On/off switch

Sizes:
  Small: 32x20px track, 16px thumb
  Medium: 48x28px track, 24px thumb (default)

States:
  Off:
    track: neutral-300
    thumb: white
  On:
    track: primary-600
    thumb: white
  Disabled:
    track: neutral-200
    thumb: neutral-400

Animation:
  Transition: 200ms ease-in-out
```

---

### 2.3 Navigation

#### Header
```yaml
Purpose: Top navigation bar with branding and user menu

Desktop Layout:
  height: 64px
  background: white
  shadow: level-1
  padding: 0 32px
  
  Elements:
    - Logo (left): 40px height
    - Role badge (left): "Patient | Staff | Admin"
    - Navigation links (center): H6 styling
    - User avatar (right): 40px diameter
    - Notifications bell (right): IconButton with badge

Mobile Layout:
  height: 56px
  padding: 0 16px
  
  Elements:
    - Menu icon (left): IconButton
    - Logo (center): 32px height
    - User avatar (right): 32px diameter
```

#### Sidebar
```yaml
Purpose: Primary navigation (desktop)

Layout:
  width-expanded: 240px
  width-collapsed: 64px
  background: white
  border-right: 1px solid neutral-200
  padding: 16px

Navigation Item:
  height: 40px
  padding: 8px 12px
  border-radius: md (8px)
  
  States:
    Default: background transparent, text neutral-700
    Hover: background neutral-100
    Active: background primary-100, text primary-600, left-border 4px primary-600
    Focus: focus-ring
  
  Elements:
    - Icon: 20px, left aligned
    - Label: 16px medium
    - Badge: notification count (right aligned)

Collapsed State:
  Show icons only (centered)
  Tooltip on hover showing label
```

#### BottomNav
```yaml
Purpose: Primary navigation (mobile)

Layout:
  height: 56px
  background: white
  shadow: level-1 (inverted, upward)
  border-top: 1px solid neutral-200
  
  Items: 4-5 max
  Layout: Flexbox, evenly distributed

Navigation Item:
  width: 20% (5 items) or 25% (4 items)
  padding: 8px
  
  States:
    Inactive:
      icon: neutral-500, 24px
      label: neutral-600, 12px
    Active:
      icon: primary-600, 24px
      label: primary-600, 12px medium
      top-border: 2px solid primary-600
```

---

### 2.4 Content

#### Card
```yaml
Purpose: Content container

Variants:
  Elevated:
    background: white
    shadow: level-1
    border: none
  
  Flat:
    background: neutral-50
    shadow: none
    border: 1px solid neutral-200
  
  Interactive (clickable):
    Hover: shadow level-2
    Active: shadow level-1
    Cursor: pointer

Layout:
  padding: 16px (mobile), 24px (desktop)
  border-radius: md (8px)

Elements:
  Card Header:
    - Title: H3 styling
    - Actions: IconButtons (right aligned)
    - Divider: 1px solid neutral-200 (bottom)
  
  Card Content:
    - Body: Body-medium styling
    - Gap: 16px between elements
  
  Card Actions:
    - Buttons: Secondary or Tertiary
    - Alignment: Right (horizontal layout)
    - Gap: 12px between buttons
```

#### Table
```yaml
Purpose: Tabular data display

Layout:
  width: 100%
  border-collapse: collapse
  
  Header:
    background: neutral-50
    border-bottom: 2px solid neutral-300
    padding: 12px 16px
    text: H6 styling (14px semi-bold)
  
  Row:
    border-bottom: 1px solid neutral-200
    hover: background neutral-50
  
  Cell:
    padding: 12px 16px
    text: Body-small (14px)

Sortable Column:
  Icon: Chevron-up/down, 16px
  Hover: text primary-600

Responsive Behavior:
  Desktop: Full table
  Tablet: Horizontal scroll
  Mobile: Card-based layout (each row becomes a card)
```

#### Badge
```yaml
Purpose: Status indicators and counts

Types:
  Number Badge:
    shape: Circle
    size: 20x20px (small), 24x24px (medium)
    background: error-600 (notifications)
    text: white, 12px medium
    usage: Notification count on icons
  
  Status Badge:
    shape: Pill
    padding: 4px 8px
    border-radius: full (9999px)
    text: 12px medium, uppercase
    
    Variants:
      Success: background success-200, text success-700
      Warning: background warning-200, text warning-700
      Error: background error-200, text error-700
      Info: background info-200, text info-700
      Neutral: background neutral-200, text neutral-700

Positioning:
  Overlap parent: top-right corner, -4px offset
```

---

### 2.5 Feedback

#### Modal
```yaml
Purpose: Focused content overlay

Sizes:
  Small: 400px width
  Medium: 600px width (default)
  Large: 800px width
  Fullscreen: 100vw x 100vh

Layout:
  background: white
  border-radius: lg (12px) (except fullscreen)
  shadow: level-3
  padding: 24px
  
  Backdrop:
    background: bg-overlay (rgba(0,0,0,0.5))
    blur: 4px (optional)

Elements:
  Modal Header:
    - Title: H3 styling
    - Close button: IconButton Ghost (top-right)
    - Divider: 1px solid neutral-200 (bottom)
  
  Modal Content:
    - Body: Body-medium styling
    - Max-height: calc(100vh - 200px) (scrollable)
  
  Modal Actions:
    - Buttons: Primary + Secondary
    - Alignment: Right
    - Gap: 12px
    - Divider: 1px solid neutral-200 (top)

Animation:
  Enter: Fade in 200ms + Scale up from 0.95 to 1
  Exit: Fade out 150ms + Scale down to 0.95
```

#### Drawer
```yaml
Purpose: Side panel for forms or details

Sizes:
  Small: 360px width (mobile: 80vw)
  Medium: 480px width (mobile: 90vw) (default)
  Large: 640px width (mobile: 100vw)

Layout:
  background: white
  shadow: level-3
  height: 100vh
  padding: 24px
  
  Position:
    Right: Default (slides from right)
    Left: Alternative (slides from left)
    Bottom: Mobile variant (slides from bottom, height auto)

Elements:
  Drawer Header:
    - Title: H3 styling
    - Close button: IconButton Ghost (top-right)
    - Divider: 1px solid neutral-200 (bottom)
  
  Drawer Content:
    - Body: Scrollable
    - Form elements: Full width
  
  Drawer Actions:
    - Buttons: Primary + Secondary
    - Layout: Sticky footer
    - Alignment: Right
    - Gap: 12px

Animation:
  Enter: Slide in 250ms + Backdrop fade in 200ms
  Exit: Slide out 200ms + Backdrop fade out 150ms
```

#### Toast
```yaml
Purpose: Brief notifications

Types:
  Info: background info-600, icon info-circle
  Success: background success-600, icon check-circle
  Warning: background warning-600, icon alert-triangle
  Error: background error-600, icon alert-circle

Layout:
  padding: 12px 16px
  border-radius: md (8px)
  shadow: level-2
  width: 300px (desktop), 90vw (mobile)
  
  Position:
    Desktop: Top-right, 24px from edge
    Mobile: Bottom-center, 16px from edge

Elements:
  - Icon: 20px (left)
  - Message: Body-small, white text
  - Close button: IconButton Ghost, white icon (right, optional)

Animation:
  Enter: Slide in from top (desktop) or bottom (mobile) + Fade in 200ms
  Exit: Fade out 150ms
  Auto-dismiss: 5s (success/info), 7s (warning/error)
```

#### Alert
```yaml
Purpose: In-page notifications

Types: Info, Success, Warning, Error (same colors as Toast)

Layout:
  padding: 16px
  border-radius: md (8px)
  border-left: 4px solid <type color>
  background: <type>-100
  
  Elements:
    - Icon: 24px (left), <type>-600 color
    - Title: H5 styling (optional)
    - Message: Body-small, neutral-900
    - Actions: Buttons Tertiary (bottom, optional)
    - Close button: IconButton Ghost (top-right, optional)

Variants:
  Inline: Full width within content flow
  Banner: Full viewport width, sticky top
```

#### Skeleton
```yaml
Purpose: Loading placeholder

Types:
  Text:
    height: 16px (match font size)
    width: 100% or specific (e.g., 60%, 40%)
    border-radius: sm (4px)
  
  Avatar:
    size: Match avatar size (circle or square)
    border-radius: full (circle) or md (square)
  
  Card:
    height: Match card height
    width: 100%
    border-radius: md (8px)
  
  Table Row:
    height: Match row height
    cells: Rectangle per column

Animation:
  Pulse: Background animates neutral-200 to neutral-100 (1.5s infinite)
  Shimmer: Gradient overlay moving left to right (alternative)
```

---

## 3. Interaction Patterns

### 3.1 Loading States
```yaml
Guidelines:
  - Show loading indicator within 200ms of async operation
  - Use optimistic UI updates when possible (e.g., appointment booking)
  - Skeleton screens for content >500ms load time
  - Spinner for quick actions <3s
  - Progress bar for long operations >3s

Button Loading:
  - Replace button text with spinner
  - Disable button interaction
  - Maintain button dimensions
```

### 3.2 Focus Management
```yaml
Guidelines:
  - Visible focus indicator on all interactive elements
  - Focus ring: 2px solid primary-600, 2px white inner ring
  - Tab order: Logical reading order (top-left to bottom-right)
  - Trap focus in modals/drawers
  - Return focus to trigger element on close

Keyboard Shortcuts:
  - Escape: Close modal/drawer
  - Tab: Next focusable element
  - Shift+Tab: Previous focusable element
  - Enter: Activate button/link
  - Space: Toggle checkbox/radio
```

### 3.3 Validation
```yaml
Trigger:
  - On blur (field loses focus)
  - On submit (form-level validation)
  - Real-time for password strength (progressive)

Display:
  - Inline error message below field
  - Red border on invalid field (2px solid error-600)
  - Error icon (alert-circle, 20px) inside field (right)
  - Error summary at top of form (on submit with errors)

Patterns:
  - Email: Regex validation + DNS check (optional)
  - Phone: Format validation (US: (XXX) XXX-XXXX)
  - Date: Format MM/DD/YYYY + past/future logic
  - Password: Min 8 chars, 1 uppercase, 1 number, 1 special
```

---

## 4. Accessibility Standards

### 4.1 WCAG 2.2 AA Compliance
```yaml
Color Contrast:
  - Text on backgrounds: ≥4.5:1 (normal), ≥3:1 (large 18px+)
  - UI components: ≥3:1 (buttons, borders, focus indicators)
  - Critical info: ≥7:1 (medication conflicts, errors)

Keyboard Navigation:
  - All interactive elements focusable
  - Logical tab order
  - Focus visible (never outline: none without alternative)
  - Keyboard shortcuts for common actions

Screen Reader Support:
  - Semantic HTML (button, nav, main, aside)
  - ARIA labels for icon buttons
  - ARIA live regions for dynamic content (toasts, queue updates)
  - Alt text for images (not in MVP)

Touch Targets:
  - Minimum 44x44px (mobile)
  - Minimum 8px spacing between targets
```

### 4.2 ARIA Roles and Labels
```yaml
Common ARIA Patterns:
  - button: role="button" (if div/span used)
  - alert: role="alert" (error messages)
  - dialog: role="dialog" aria-modal="true" (modals)
  - navigation: <nav aria-label="Main navigation">
  - region: role="region" aria-label="Queue management"
  - status: role="status" (loading indicators)

Labels:
  - aria-label: Descriptive label for icon buttons
  - aria-labelledby: Reference to heading/label
  - aria-describedby: Reference to helper text/error
  - aria-expanded: Accordion/dropdown state
  - aria-selected: Tab/option selected state
  - aria-invalid: Form field validation state
```

---

## 5. Brand Guidelines

### 5.1 Logo Usage
```yaml
Logo:
  description: "Healthcare cross icon + 'Unified Patient Access' wordmark"
  formats: SVG (preferred), PNG (fallback)
  sizes:
    - Desktop header: 40px height
    - Mobile header: 32px height
    - Favicon: 32x32px, 16x16px
  
  Clear space: Minimum 8px clear space around logo
  
  Variations:
    - Full logo: Icon + wordmark (primary)
    - Icon only: Use when space constrained (e.g., favicon)
    - Wordmark only: Not recommended
  
  Color variations:
    - Primary: Full color (icon primary-600, text neutral-900)
    - Monochrome: Single color (white or neutral-900)
```

### 5.2 Brand Voice
```yaml
Tone:
  - Professional yet approachable
  - Healthcare-appropriate (reassuring, simple language)
  - Action-oriented (clear CTAs)
  - Non-blaming error messages

Patient-Facing:
  - Simple language (avoid medical jargon)
  - Encouraging (e.g., "Great! Your appointment is confirmed.")
  - Reassuring (e.g., "Your data is secure and HIPAA-compliant.")

Staff-Facing:
  - Efficient and clear
  - Clinical terminology acceptable
  - Action-oriented (e.g., "Mark patient as arrived")

Admin-Facing:
  - Technical clarity
  - System-focused language
```

---

## 6. Implementation Notes

### 6.1 CSS Custom Properties
```css
/* Recommended CSS variable structure */
:root {
  /* Colors */
  --color-primary-600: #0066CC;
  --color-secondary-600: #00A86B;
  --color-error-600: #DC3545;
  --color-success-600: #00A145;
  --color-neutral-900: #1A1A1A;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-base: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Typography */
  --font-family-base: "Inter", -apple-system, sans-serif;
  --font-size-body: 16px;
  --line-height-body: 1.5;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-level-1: 0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 2px rgba(0, 0, 0, 0.24);
  --shadow-level-2: 0px 3px 6px rgba(0, 0, 0, 0.15), 0px 2px 4px rgba(0, 0, 0, 0.12);
  --shadow-level-3: 0px 10px 20px rgba(0, 0, 0, 0.15), 0px 3px 6px rgba(0, 0, 0, 0.10);
}
```

### 6.2 React Component Structure
```typescript
// Recommended React component prop interface
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
}

// Example component usage
<Button variant="primary" size="medium" loading={loading}>
  Book Appointment
</Button>
```

---

## 7. Design System Governance

### 7.1 Version History
| Version | Date | Changes |
|---------|------|---------|
| 1.0 | March 17, 2026 | Initial design system creation |

### 7.2 Contribution Guidelines
- All design token changes require review
- New components must include all states (Default, Hover, Focus, Active, Disabled)
- Accessibility audit required for new components
- Component variants must follow existing naming conventions

---

**Design System Status**: Complete  
**Next Review Date**: Quarterly review recommended
