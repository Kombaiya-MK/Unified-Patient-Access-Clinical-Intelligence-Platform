/**
 * Drug Name Normalizer
 * @module utils/drugNameNormalizer
 * @description Normalizes medication names for consistent matching
 * @epic EP-006
 * @story US-033
 */

const ABBREVIATION_MAP: Record<string, string> = {
  asa: 'aspirin',
  apap: 'acetaminophen',
  hctz: 'hydrochlorothiazide',
  mtx: 'methotrexate',
  ssri: 'selective serotonin reuptake inhibitor',
  nsaid: 'nonsteroidal anti-inflammatory drug',
  ace: 'angiotensin converting enzyme',
  arb: 'angiotensin receptor blocker',
  ppi: 'proton pump inhibitor',
};

const BRAND_TO_GENERIC: Record<string, string> = {
  tylenol: 'acetaminophen',
  advil: 'ibuprofen',
  motrin: 'ibuprofen',
  aleve: 'naproxen',
  lipitor: 'atorvastatin',
  zocor: 'simvastatin',
  crestor: 'rosuvastatin',
  nexium: 'esomeprazole',
  prilosec: 'omeprazole',
  zantac: 'ranitidine',
  synthroid: 'levothyroxine',
  coumadin: 'warfarin',
  glucophage: 'metformin',
  lasix: 'furosemide',
  norvasc: 'amlodipine',
  zestril: 'lisinopril',
  prinivil: 'lisinopril',
  tenormin: 'atenolol',
  lopressor: 'metoprolol',
  toprol: 'metoprolol',
  xanax: 'alprazolam',
  valium: 'diazepam',
  ambien: 'zolpidem',
  prozac: 'fluoxetine',
  zoloft: 'sertraline',
  lexapro: 'escitalopram',
  plavix: 'clopidogrel',
  eliquis: 'apixaban',
  xarelto: 'rivaroxaban',
  pradaxa: 'dabigatran',
  lantus: 'insulin glargine',
  humalog: 'insulin lispro',
  novolog: 'insulin aspart',
  prednisone: 'prednisone',
  amoxil: 'amoxicillin',
  augmentin: 'amoxicillin/clavulanate',
  keflex: 'cephalexin',
  cipro: 'ciprofloxacin',
  levaquin: 'levofloxacin',
  flagyl: 'metronidazole',
  diflucan: 'fluconazole',
  proventil: 'albuterol',
  ventolin: 'albuterol',
  singulair: 'montelukast',
  flonase: 'fluticasone',
};

export function normalizeName(input: string): string {
  let normalized = input.trim().toLowerCase();
  normalized = normalized.replace(/[-_]/g, ' ');
  normalized = normalized.replace(/\s+/g, ' ');
  return normalized;
}

export function expandAbbreviations(name: string): string {
  const normalized = normalizeName(name);
  return ABBREVIATION_MAP[normalized] || normalized;
}

export function findGenericName(brandName: string): string | null {
  const normalized = normalizeName(brandName);
  return BRAND_TO_GENERIC[normalized] || null;
}

export function resolveToGeneric(name: string): string {
  const normalized = normalizeName(name);
  const generic = BRAND_TO_GENERIC[normalized];
  if (generic) return generic;

  const expanded = ABBREVIATION_MAP[normalized];
  if (expanded) return expanded;

  return normalized;
}

export function calculateSimilarity(name1: string, name2: string): number {
  const s1 = normalizeName(name1);
  const s2 = normalizeName(name2);

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const maxLen = Math.max(s1.length, s2.length);
  const distance = levenshteinDistance(s1, s2);
  return 1 - distance / maxLen;
}

function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}
