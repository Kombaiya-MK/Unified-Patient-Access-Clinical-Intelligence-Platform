# Design Token Changelog

All notable changes to the design token system will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [1.0.1] - 2026-04-09

### Added

- Token snapshot initialized for future change detection

## [1.0.0] - 2026-03-19

### Added

- Initial design token system with multi-platform export support
- **Color tokens**: Primary, Secondary, Neutral, Success, Warning, Error, Info palettes (9 shades each)
- **Semantic color tokens**: Text, Background, Border, Button, Status mappings
- **Medical-specific color tokens**: Accessible color palette for clinical interfaces
- **Typography tokens**: Font families (heading, body, mono), sizes (xs–4xl), weights (regular–bold), line heights, letter spacing
- **Spacing tokens**: Scale from xs (4px) to 4xl (96px)
- **Border radius tokens**: none, sm, md, lg, xl, full
- **Shadow tokens**: 6 elevation levels plus focus ring and button active states
- **Size tokens**: Button heights (sm/md/lg), input height, icon sizes (sm/md/lg)
- **Breakpoint tokens**: Mobile (320px), Tablet (768px), Desktop (1024px), Wide (1441px)
- **Platform exports**: CSS custom properties, SCSS variables, JavaScript ES6 modules, TypeScript declarations, iOS JSON, Android XML
