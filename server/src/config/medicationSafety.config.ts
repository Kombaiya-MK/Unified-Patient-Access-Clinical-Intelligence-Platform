/**
 * Medication Safety Configuration
 * @module config/medicationSafety
 * @description Safety thresholds and severity rules for medication conflict detection
 * @epic EP-006
 * @story US-033
 */

export const medicationSafetyConfig = {
  CRITICAL_SEVERITY_THRESHOLD: 4,
  REQUIRES_OVERRIDE_THRESHOLD: 4,
  ACCURACY_TARGET: 0.99,
  CACHE_TTL_HOURS: 24,
  FUZZY_MATCH_THRESHOLD: 0.85,
  MAX_RETRY_ATTEMPTS: 2,
  AI_MODEL: 'gpt-4o',
  AI_TEMPERATURE: 0.1,
  AI_MAX_TOKENS: 2000,
};

export const severityScale: Record<number, { label: string; description: string; color: string }> = {
  1: { label: 'Minor', description: 'Monitor - routine observation recommended', color: '#3B82F6' },
  2: { label: 'Moderate', description: 'Caution - clinical assessment advised', color: '#F59E0B' },
  3: { label: 'Major', description: 'Avoid if possible - seek alternatives', color: '#F97316' },
  4: { label: 'Severe', description: 'Contraindicated - requires override', color: '#EF4444' },
  5: { label: 'Critical', description: 'Life-threatening risk - immediate action', color: '#DC2626' },
};

export const conflictTypeLabels: Record<string, string> = {
  'Drug-Drug': 'Drug-Drug Interaction',
  'Drug-Allergy': 'Drug-Allergy Conflict',
  'Drug-Condition': 'Drug-Condition Contraindication',
  'Drug-Condition-Dosage': 'Dosage-Dependent Interaction',
};
