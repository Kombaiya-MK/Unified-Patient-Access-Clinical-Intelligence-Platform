/**
 * Medical Terms Service
 * 
 * File: server/src/services/validation/medicalTermsService.ts
 * Task: US_027 TASK_002 - Backend Real-Time Validation Service
 * 
 * Detects ambiguous colloquial medical terms and generates clarification questions.
 */
import type { ValidationResult } from '../../types/aiIntake.types';
import type { AmbiguousTermMapping } from '../../types/validation.types';

/** Colloquial to medical term mappings */
const AMBIGUOUS_TERMS: AmbiguousTermMapping[] = [
  {
    colloquial: 'sugar problems',
    medicalTerms: ['diabetes', 'hyperglycemia', 'hypoglycemia'],
    clarificationTemplate: 'By "sugar problems," do you mean diabetes, hyperglycemia, or hypoglycemia?',
  },
  {
    colloquial: 'heart trouble',
    medicalTerms: ['heart disease', 'arrhythmia', 'heart failure', 'coronary artery disease'],
    clarificationTemplate: 'When you say "heart trouble," could you specify if it\'s heart disease, an irregular heartbeat, or heart failure?',
  },
  {
    colloquial: 'breathing problems',
    medicalTerms: ['asthma', 'COPD', 'shortness of breath', 'sleep apnea'],
    clarificationTemplate: 'Could you tell me more about your breathing issues? Is it asthma, COPD, or general shortness of breath?',
  },
  {
    colloquial: 'stomach issues',
    medicalTerms: ['GERD', 'gastritis', 'IBS', 'ulcer'],
    clarificationTemplate: 'When you mention stomach issues, do you mean acid reflux, gastritis, irritable bowel syndrome, or something else?',
  },
  {
    colloquial: 'blood pressure',
    medicalTerms: ['hypertension', 'hypotension'],
    clarificationTemplate: 'Is your blood pressure typically high (hypertension) or low (hypotension)?',
  },
  {
    colloquial: 'back pain',
    medicalTerms: ['lower back pain', 'sciatica', 'herniated disc', 'muscle strain'],
    clarificationTemplate: 'Could you describe your back pain more? Is it in the lower or upper back, and does it radiate down your legs?',
  },
  {
    colloquial: 'nerve problems',
    medicalTerms: ['neuropathy', 'neuralgia', 'nerve damage'],
    clarificationTemplate: 'By "nerve problems," do you mean tingling/numbness (neuropathy), pain (neuralgia), or a specific nerve condition?',
  },
  {
    colloquial: 'water pill',
    medicalTerms: ['diuretic', 'hydrochlorothiazide', 'furosemide'],
    clarificationTemplate: 'Do you know the name of your water pill (diuretic)? Common ones include hydrochlorothiazide or furosemide.',
  },
  {
    colloquial: 'blood thinner',
    medicalTerms: ['warfarin', 'apixaban', 'rivaroxaban', 'clopidogrel'],
    clarificationTemplate: 'Do you know the name of your blood thinner? Common ones include warfarin, Eliquis (apixaban), or Xarelto (rivaroxaban).',
  },
];

/**
 * Detect ambiguous medical terms in text
 */
export function detectAmbiguousTerms(input: string): ValidationResult[] {
  const results: ValidationResult[] = [];
  const lowerInput = input.toLowerCase();

  for (const term of AMBIGUOUS_TERMS) {
    if (lowerInput.includes(term.colloquial)) {
      results.push({
        isValid: false,
        field: 'medical_term',
        originalValue: term.colloquial,
        confidence: 0.5,
        clarificationQuestion: term.clarificationTemplate,
      });
    }
  }

  return results;
}
