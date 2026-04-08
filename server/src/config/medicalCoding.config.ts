/**
 * Medical Coding Configuration
 * @module config/medicalCoding
 * @description Configuration for AI-powered medical coding service
 * @epic EP-006
 * @story US-032
 */

export const medicalCodingConfig = {
  AI_MODEL: 'gpt-4o',
  AI_TEMPERATURE: 0.2,
  AI_MAX_TOKENS: 3000,
  CONFIDENCE_THRESHOLD_AUTO_SUGGEST: 0.80,
  CONFIDENCE_THRESHOLD_HIGH: 0.90,
  CACHE_TTL_HOURS: 48,
  MAX_CODES_PER_ENCOUNTER: 25,
  BULK_APPROVE_LIMIT: 50,
};

export const codingStatusLabels: Record<string, string> = {
  ai_suggested: 'AI Suggested',
  approved: 'Approved',
  rejected: 'Rejected',
  modified: 'Modified',
  manual: 'Manual Entry',
};

export const codeTypeLabels: Record<string, string> = {
  'ICD-10': 'ICD-10 Diagnosis Code',
  'CPT': 'CPT Procedure Code',
};
