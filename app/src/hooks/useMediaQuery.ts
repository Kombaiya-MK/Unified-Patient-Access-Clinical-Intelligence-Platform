/**
 * useMediaQuery Hook
 *
 * React hook that tracks whether a CSS media query matches.
 * Uses `window.matchMedia` with an event listener for live updates.
 * SSR-safe: returns `false` when `window` is not available.
 *
 * @example
 *   const isWide = useMediaQuery('(min-width: 1025px)');
 *
 * @module hooks/useMediaQuery
 * @task US_044 TASK_001
 */

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
