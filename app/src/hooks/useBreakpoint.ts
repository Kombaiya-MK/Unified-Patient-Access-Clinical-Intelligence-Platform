/**
 * useBreakpoint Hook
 *
 * React hook that returns the current responsive breakpoint as a
 * typed string. Listens to window resize via `useMediaQuery` and
 * re-renders components only when the breakpoint bucket changes.
 *
 * @example
 *   const bp = useBreakpoint();
 *   if (bp === 'mobile') return <MobileNav />;
 *
 * @module hooks/useBreakpoint
 * @task US_044 TASK_001
 */

import { useMediaQuery } from './useMediaQuery';
import { BREAKPOINTS, type Breakpoint } from '../utils/responsive';

export function useBreakpoint(): Breakpoint {
  const isLargeDesktop = useMediaQuery(
    `(min-width: ${BREAKPOINTS.DESKTOP + 1}px)`,
  );
  const isDesktop = useMediaQuery(
    `(min-width: ${BREAKPOINTS.TABLET + 1}px)`,
  );
  const isTablet = useMediaQuery(
    `(min-width: ${BREAKPOINTS.MOBILE}px)`,
  );

  if (isLargeDesktop) return 'large-desktop';
  if (isDesktop) return 'desktop';
  if (isTablet) return 'tablet';
  return 'mobile';
}
