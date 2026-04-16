# Design Tokens Changelog

All notable changes to the design token system will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Versioning Rules

- **MAJOR** — Breaking changes: token removed, token renamed, value change that affects layout/contrast
- **MINOR** — New tokens added (backward-compatible)
- **PATCH** — Token value tweaks, description updates, bug fixes

---

## [1.0.0] - 2026-03-19

### Added

- Initial design token system with multi-platform export support
- **Color tokens**: Primary, Secondary, Neutral, Success, Warning, Error, Info palettes (9 shades each)
- **Semantic color tokens**: Text, Background, Border, Button, Status mappings
- **Medical-specific color tokens**: Accessible color palette for clinical interfaces (WCAG AA/AAA validated)
- **Typography tokens**: Font families (heading, body, mono), sizes (xs–4xl), weights (regular–bold), line heights, letter spacing
- **Composite typography tokens**: display-large, h1–h6, body-large/medium/small, caption, label, overline
- **Spacing tokens**: Scale from xs (4px) to 4xl (96px)
- **Border radius tokens**: none, sm, md, lg, xl, full
- **Shadow tokens**: 6 elevation levels (level-0 to level-5) plus focus-ring and button-active states
- **Size tokens**: Button heights (sm/md/lg), input height, icon sizes (sm/md/lg)
- **Breakpoint tokens**: Mobile (320px), Tablet (768px), Desktop (1024px), Wide (1441px)
- **Grid tokens**: Desktop (12-col), Tablet (8-col), Mobile (4-col) with gutter and margin definitions
- **Platform exports**: CSS custom properties, SCSS variables, JavaScript ES6 modules, TypeScript declarations

---

## Migration Guide Template

When a **MAJOR** version is released with breaking changes, a migration guide will be included here.

### Example Migration (for future reference)

**Breaking:** `--color-primary` renamed to `--color-primary-main`

```diff
- var(--color-primary)
+ var(--color-primary-main)
```

**Steps:**
1. Search your codebase for the old token name
2. Replace all instances with the new token name
3. Verify no visual regressions in affected components
4. Run `npm run tokens:validate` to confirm contrast ratios remain valid
