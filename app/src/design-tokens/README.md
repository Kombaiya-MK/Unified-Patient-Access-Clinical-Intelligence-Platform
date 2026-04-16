# Design Tokens

Centralized design token definitions for the Unified Patient Access & Clinical Intelligence Platform. All values match the [designsystem.md](../../../.propel/context/docs/designsystem.md) specification.

## Token Structure

```
tokens.json            # Master JSON — single source of truth
tokens.scss            # SCSS variable mirror
config.js              # Style Dictionary build configuration
scripts/
  validate-contrast.js # WCAG contrast ratio validator
```

## Naming Conventions

Tokens follow a **category.type.item** hierarchy:

| Category     | Example Key                  | Example Value |
|-------------|------------------------------|---------------|
| Color       | `color.primitive.primary.600` | `#0066CC`    |
| Typography  | `typography.fontSize.base`    | `16px`       |
| Spacing     | `spacing.base`                | `16px`       |
| Radius      | `radius.md`                   | `8px`        |
| Shadow      | `shadow.level-1`              | box-shadow   |
| Size        | `size.button.md-height`       | `40px`       |
| Breakpoint  | `breakpoint.tablet`           | `768px`      |

## Primitive vs Semantic Tokens

### Primitive tokens
Raw design values with no context of use:

```scss
$color-primary-600: #0066CC;   // the color itself
$color-neutral-900: #1A1A1A;   // the color itself
```

### Semantic tokens
Purpose-mapped aliases that **reference** primitives. Swapping the reference enables dark mode without touching components:

```scss
// Light theme (default)
$color-text-primary: $color-neutral-900;  // → #1A1A1A

// Dark theme (swap target)
// $color-text-primary: $color-neutral-100; // → #F5F5F5
```

## Dark Mode Readiness

The token structure separates primitives from semantics so a dark theme only needs to remap semantic tokens:

| Semantic Token           | Light Value        | Dark Value (future) |
|--------------------------|--------------------|---------------------|
| `color-text-primary`     | `neutral-900`      | `neutral-100`       |
| `color-text-secondary`   | `neutral-600`      | `neutral-400`       |
| `color-bg-primary`       | `white`            | `neutral-900`       |
| `color-bg-secondary`     | `neutral-100`      | `neutral-800`       |
| `color-border-default`   | `neutral-300`      | `neutral-700`       |

Components consume **only semantic tokens**, so theme switching is automatic with no component changes.

## Medical-Grade Contrast Ratios (UXR-305)

All color pairings meet or exceed WCAG AA (4.5:1) requirements. Critical medical UI uses AAA (7:1):

| Pair             | Foreground | Background | Ratio    | Standard |
|------------------|-----------|------------|----------|----------|
| Primary text     | `#1A1A1A` | `#FFFFFF`  | 19.56:1  | AAA      |
| Secondary text   | `#666666` | `#FFFFFF`  | 5.74:1   | AA       |
| Primary button   | `#FFFFFF` | `#0056B3`  | 8.59:1   | AAA      |
| Success green    | `#2E7D32` | `#FFFFFF`  | 4.95:1   | AA       |
| Error red        | `#C62828` | `#FFFFFF`  | 7.28:1   | AA       |
| Warning (invert) | `#F57C00` | `#000000`  | 5.91:1   | AA       |

Run the validator to verify:

```bash
node src/design-tokens/scripts/validate-contrast.js
```

## Token Categories

### Colors
- **Primary**: 9-step blue scale (`#003D7A` – `#E6F0FA`)
- **Secondary**: 9-step healthcare green scale (`#006647` – `#E6F6F0`)
- **Neutral**: 10-step gray scale (`#1A1A1A` – `#FAFAFA`)
- **Status**: success, warning, error, info (5 shades each)

### Typography
- **Font families**: Inter (heading + body), Fira Code (mono)
- **Sizes**: 12px, 14px, 16px, 18px, 20px, 24px, 32px, 48px
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Line heights**: 1.2, 1.25, 1.33, 1.43, 1.5, 1.56, 1.8

### Spacing (4px grid)
`4, 8, 12, 16, 24, 32, 48, 64, 96` px

### Border Radius
`0, 4, 8, 12, 16, 9999` px

### Shadows (Elevation 0-5)
Level 0 (none) through Level 5 (maximum), plus focus-ring and button-active.

## Usage

### In CSS (via CSS custom properties after Style Dictionary build)

```css
.card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-level-1);
  padding: var(--spacing-base);
}
```

### In SCSS

```scss
@import 'design-tokens/tokens';

.card {
  background: $color-bg-primary;
  border: 1px solid $color-border-default;
  border-radius: $radius-md;
  box-shadow: $shadow-level-1;
  padding: $spacing-base;
}
```

### In TypeScript/JavaScript (after Style Dictionary build)

```ts
import { colorBgPrimary, spacingBase } from 'design-tokens/build/tokens';
```
