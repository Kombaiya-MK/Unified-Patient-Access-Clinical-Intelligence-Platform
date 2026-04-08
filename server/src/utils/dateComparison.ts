/**
 * Date Comparison Utilities
 * Date range overlap detection for lab results and medication timeline.
 * @module utils/dateComparison
 * @task US_030 TASK_002
 */

import { differenceInDays, parseISO, isValid } from 'date-fns';

export function isDateWithinRange(
  date1: string,
  date2: string,
  daysRange: number,
): boolean {
  const d1 = parseISO(date1);
  const d2 = parseISO(date2);

  if (!isValid(d1) || !isValid(d2)) return false;

  const daysDiff = Math.abs(differenceInDays(d1, d2));
  return daysDiff <= daysRange;
}

export function areLabResultsOverlapping(
  testName1: string,
  date1: string | undefined,
  testName2: string,
  date2: string | undefined,
  daysRange: number,
): boolean {
  if (testName1.toLowerCase().trim() !== testName2.toLowerCase().trim()) {
    return false;
  }
  if (!date1 || !date2) return true; // Same test without dates = likely duplicate
  return isDateWithinRange(date1, date2, daysRange);
}

export function getMedicationTemporalRelation(
  date1: string | undefined,
  date2: string | undefined,
  thresholdDays: number,
): 'duplicate' | 'timeline_entry' | 'unknown' {
  if (!date1 || !date2) return 'unknown';

  const d1 = parseISO(date1);
  const d2 = parseISO(date2);
  if (!isValid(d1) || !isValid(d2)) return 'unknown';

  const daysDiff = Math.abs(differenceInDays(d1, d2));
  return daysDiff > thresholdDays ? 'timeline_entry' : 'duplicate';
}
