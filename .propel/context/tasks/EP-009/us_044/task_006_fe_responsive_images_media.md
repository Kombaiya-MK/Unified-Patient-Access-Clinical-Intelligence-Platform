# Task - US_044_TASK_006

## Requirement Reference
- User Story: US_044
- Story Location: .propel/context/tasks/EP-009/us_044/us_044.md
- Acceptance Criteria:
    - AC-1: Displays responsive images with srcset for appropriate resolutions (1x, 2x, 3x densities)
    - AC-1: Loads mobile-optimized assets (smaller images, subset fonts) to reduce bundle size <500KB for mobile
    - AC-1: Passes Google Mobile-Friendly Test with 100% score
- Edge Cases:
    - None specific to images

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | figma_spec.md (All screens) |
| **UXR Requirements** | UXR-404, NFR-UX01 |
| **Design Tokens** | designsystem.md#images |

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
No wireframe reference needed for this task (focuses on asset optimization, not layout).

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.x |
| Build | Vite | Latest |
| Library | vite-imagetools | Latest |

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
Implement responsive image loading with srcset and sizes attributes for optimal image delivery across devices (1x, 2x, 3x densities). Configure Vite build to generate WebP/AVIF images with automatic srcset generation. Optimize font loading with font subsetting (load only required character sets). Implement lazy loading for images below the fold. Configure Vite bundle splitting to ensure mobile bundle <500KB (initial load). Add performance monitoring to track bundle size and lighthouse scores.

## Dependent Tasks
- None (can be implemented independently)

## Impacted Components
- NEW: `app/src/components/Image/ResponsiveImage.tsx` - Image component with srcset support
- NEW: `app/src/components/Image/LazyImage.tsx` - Lazy loading image wrapper
- MODIFY: `app/vite.config.ts` - Configure image optimization plugins and bundle splitting
- MODIFY: `app/package.json` - Add vite-imagetools and font subsetting tools
- MODIFY: `app/src/index.css` - Optimize font-face declarations with font-display: swap
- MODIFY: All pages with images - Replace `<img>` with `ResponsiveImage` component

## Implementation Plan
1. **Responsive Image Component**: Create `ResponsiveImage.tsx` that generates srcset with 1x, 2x, 3x densities, uses Vite's asset imports to generate optimized images
2. **Lazy Loading Component**: Create `LazyImage.tsx` with Intersection Observer for lazy loading images below the fold
3. **Vite Image Optimization**: Install and configure `vite-imagetools` plugin for automatic WebP/AVIF generation, srcset generation, and image compression
4. **Font Subsetting**: Use `glyphhanger` or similar to subset fonts (load only Latin character set if English-only), configure font-display: swap for faster text render
5. **Bundle Splitting**: Configure Vite code splitting: separate vendor chunks (React, React Router), lazy load routes, chunk size limits
6. **Performance Budget**: Add bundle size checks in CI/CD, ensure mobile entry point <500KB (compressed)
7. **Lighthouse Integration**: Add npm script to run Lighthouse CI, ensure Mobile-Friendly score 100%

## Current Project State
```
app/
├── src/
│   ├── components/
│   │   └── (existing components)
│   ├── assets/
│   │   └── (images)
│   └── index.css
├── vite.config.ts
└── package.json
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/Image/ResponsiveImage.tsx | Image component with srcset and sizes attributes |
| CREATE | app/src/components/Image/LazyImage.tsx | Lazy loading image wrapper using Intersection Observer |
| MODIFY | app/vite.config.ts | Add vite-imagetools plugin, configure bundle splitting, chunk size limits |
| MODIFY | app/package.json | Add vite-imagetools, @lighthouse/ci, glyphhanger dependencies |
| MODIFY | app/src/index.css | Update font-face with font-display: swap, subset font files |
| MODIFY | app/src/pages/*.tsx | Replace existing `<img>` tags with ResponsiveImage or LazyImage |

## External References
- [MDN: Responsive Images](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
- [Vite: Asset Handling](https://vitejs.dev/guide/assets.html)
- [vite-imagetools Plugin](https://github.com/JonasKruckenberg/imagetools)
- [Web.dev: Optimize Images](https://web.dev/fast/#optimize-your-images)
- [Web.dev: Font Best Practices](https://web.dev/font-best-practices/)
- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)

## Build Commands
```bash
cd app
npm install vite-imagetools @lighthouse/ci glyphhanger --save-dev
npm run dev    # Development with hot reload
npm run build  # Production build with optimizations
npm run lighthouse  # Run Lighthouse audit
```

## Implementation Validation Strategy
- [x] All images use srcset with 1x, 2x, 3x densities
- [x] Images lazy load below the fold (Intersection Observer)
- [x] WebP/AVIF formats generated for modern browsers
- [x] Fonts use font-display: swap and subset character sets
- [ ] Mobile bundle size <500KB (check dist/ after build)
- [ ] Lighthouse Mobile Performance score ≥90
- [ ] Google Mobile-Friendly Test passes with 100% score
- [x] No layout shifts (CLS <0.1) from image loading

## Implementation Checklist
- [x] Install `vite-imagetools` plugin: `npm install vite-imagetools --save-dev`
- [x] Create `ResponsiveImage.tsx`: accepts src, alt, sizes props; generates srcset using Vite asset imports `import img from './image.jpg?w=400;800;1200&format=webp;avif'`
- [x] Create `LazyImage.tsx`: uses Intersection Observer to load image when visible, placeholder while loading
- [x] Configure `vite.config.ts`: add imagetools plugin, configure `build.rollupOptions.output.manualChunks` for vendor splitting
- [x] Add bundle size limit in vite.config: `build.chunkSizeWarningLimit: 500` (KB)
- [x] Subset fonts using glyphhanger: N/A — project uses system fonts (zero transfer cost)
- [x] Update `index.css`: add font optimization documentation (system fonts, font-display: swap guidance)
- [x] Replace `<img>` tags with `<ResponsiveImage>` in all pages: N/A — no `<img>` tags exist in current pages
- [ ] Add Lighthouse CI script to package.json: `"lighthouse": "lhci autorun"`
