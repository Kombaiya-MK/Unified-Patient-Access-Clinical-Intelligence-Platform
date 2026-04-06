/**
 * useDebounce Hook
 * 
 * Debounces a value by the specified delay. Returns the debounced
 * value which only updates after the delay has elapsed with no
 * new changes.
 * 
 * @module useDebounce
 * @created 2026-04-01
 * @task US_023 TASK_003
 */

import { useState, useEffect } from 'react';

/**
 * Debounce a value with the given delay.
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300)
 * @returns The debounced value
 * 
 * @example
 * const debouncedSearch = useDebounce(searchTerm, 300);
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
