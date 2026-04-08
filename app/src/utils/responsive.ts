/**
 * Responsive Utilities
 *
 * TypeScript helper functions for programmatic breakpoint checks,
 * viewport size detection, and touch capability detection.
 *
 * Breakpoints match CSS custom properties in variables-responsive.css:
 *   MOBILE:        < 768px
 *   TABLET:        768px – 1024px
 *   DESKTOP:       1025px – 1440px
 *   LARGE_DESKTOP: > 1440px
 *
 * @module utils/responsive
 * @task US_044 TASK_001
 */

export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1440,
} as const;

export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'large-desktop';

/**
 * Get the current breakpoint based on window width.
 */
export function getBreakpoint(width?: number): Breakpoint {
  const w = width ?? (typeof window !== 'undefined' ? window.innerWidth : 0);

  if (w < BREAKPOINTS.MOBILE) return 'mobile';
  if (w <= BREAKPOINTS.TABLET) return 'tablet';
  if (w <= BREAKPOINTS.DESKTOP) return 'desktop';
  return 'large-desktop';
}

/**
 * True when viewport is below mobile breakpoint (< 768px).
 */
export function isMobile(width?: number): boolean {
  return getBreakpoint(width) === 'mobile';
}

/**
 * True when viewport is in the tablet range (768px – 1024px).
 */
export function isTablet(width?: number): boolean {
  return getBreakpoint(width) === 'tablet';
}

/**
 * True when viewport is desktop or larger (≥ 1025px).
 */
export function isDesktop(width?: number): boolean {
  const bp = getBreakpoint(width);
  return bp === 'desktop' || bp === 'large-desktop';
}

/**
 * True when viewport is large desktop (> 1440px).
 */
export function isLargeDesktop(width?: number): boolean {
  return getBreakpoint(width) === 'large-desktop';
}

/**
 * Detect primary touch input capability.
 * Uses `pointer: coarse` media query (most reliable heuristic).
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches;
}

/**
 * Build a min-width media query string for a given breakpoint.
 * Useful with `useMediaQuery` or `window.matchMedia`.
 */
export function mediaQueryFor(breakpoint: Breakpoint): string {
  switch (breakpoint) {
    case 'mobile':
      return `(max-width: ${BREAKPOINTS.MOBILE - 1}px)`;
    case 'tablet':
      return `(min-width: ${BREAKPOINTS.MOBILE}px) and (max-width: ${BREAKPOINTS.TABLET}px)`;
    case 'desktop':
      return `(min-width: ${BREAKPOINTS.TABLET + 1}px) and (max-width: ${BREAKPOINTS.DESKTOP}px)`;
    case 'large-desktop':
      return `(min-width: ${BREAKPOINTS.DESKTOP + 1}px)`;
  }
}
