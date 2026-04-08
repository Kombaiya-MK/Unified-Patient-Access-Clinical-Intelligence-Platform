/**
 * Fuzzy String Matching Utilities
 * Uses Levenshtein distance for fuzzy matching of names and medical terms.
 * @module utils/fuzzyMatching
 * @task US_030 TASK_002
 */

export function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

export function fuzzyRatio(a: string, b: string): number {
  const na = normalizeString(a);
  const nb = normalizeString(b);
  if (na === nb) return 1.0;
  if (na.length === 0 || nb.length === 0) return 0;

  const distance = levenshteinDistance(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return 1 - distance / maxLen;
}

export function tokenSetRatio(a: string, b: string): number {
  const tokensA = new Set(normalizeString(a).split(' ').filter(Boolean));
  const tokensB = new Set(normalizeString(b).split(' ').filter(Boolean));

  const intersection = new Set([...tokensA].filter((t) => tokensB.has(t)));
  const diffA = [...tokensA].filter((t) => !tokensB.has(t));
  const diffB = [...tokensB].filter((t) => !tokensA.has(t));

  const sortedIntersection = [...intersection].sort().join(' ');
  const combined1 = [sortedIntersection, ...diffA.sort()].filter(Boolean).join(' ');
  const combined2 = [sortedIntersection, ...diffB.sort()].filter(Boolean).join(' ');

  const r1 = fuzzyRatio(sortedIntersection, combined1);
  const r2 = fuzzyRatio(sortedIntersection, combined2);
  const r3 = fuzzyRatio(combined1, combined2);

  return Math.max(r1, r2, r3);
}

export function fuzzyStringMatch(
  str1: string,
  str2: string,
  threshold: number,
): { isMatch: boolean; score: number } {
  const score = tokenSetRatio(str1, str2);
  return { isMatch: score >= threshold, score };
}

export function fuzzyArrayMatch(
  arr1: string[],
  arr2: string[],
  threshold: number,
): { matchCount: number; totalUnique: number; score: number } {
  const norm1 = arr1.map(normalizeString);
  const norm2 = arr2.map(normalizeString);
  const allUnique = new Set([...norm1, ...norm2]);
  let matchCount = 0;

  for (const item1 of norm1) {
    for (const item2 of norm2) {
      if (fuzzyRatio(item1, item2) >= threshold) {
        matchCount++;
        break;
      }
    }
  }

  const score = allUnique.size > 0 ? matchCount / allUnique.size : 1.0;
  return { matchCount, totalUnique: allUnique.size, score };
}
