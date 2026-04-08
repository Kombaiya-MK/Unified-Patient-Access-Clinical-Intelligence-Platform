/**
 * Medication Conflicts Fallback Service
 *
 * Rule-based drug interaction checker used when the GPT-4 conflicts
 * circuit breaker is open.
 *
 * @module services/fallback/conflicts-fallback.service
 * @task US_041 TASK_001
 */
import { fallbackActivationCounter } from '../../config/circuit-breaker.config';
import logger from '../../utils/logger';

export interface BasicConflict {
  drug1: string;
  drug2: string;
  severity: 'low' | 'moderate' | 'high';
  message: string;
}

export interface ConflictsFallbackResponse {
  fallback: boolean;
  conflicts: BasicConflict[];
  disclaimer: string;
}

/**
 * Common high-risk drug–drug interactions.
 * Values are arrays of interacting drug names (lower-cased).
 */
const BASIC_INTERACTIONS: Record<string, { targets: string[]; severity: 'low' | 'moderate' | 'high' }> = {
  warfarin:    { targets: ['aspirin', 'ibuprofen', 'naproxen', 'clopidogrel'], severity: 'high' },
  metformin:   { targets: ['alcohol', 'iodinated contrast'], severity: 'moderate' },
  lisinopril:  { targets: ['potassium supplements', 'spironolactone', 'potassium chloride'], severity: 'moderate' },
  simvastatin: { targets: ['erythromycin', 'clarithromycin', 'itraconazole', 'gemfibrozil'], severity: 'high' },
  methotrexate:{ targets: ['trimethoprim', 'nsaids', 'ibuprofen', 'naproxen'], severity: 'high' },
  digoxin:     { targets: ['amiodarone', 'verapamil', 'quinidine'], severity: 'high' },
  ssri:        { targets: ['maoi', 'tramadol', 'triptans', 'linezolid'], severity: 'high' },
  fluoxetine:  { targets: ['maoi', 'tramadol', 'triptans'], severity: 'high' },
  sertraline:  { targets: ['maoi', 'tramadol', 'triptans'], severity: 'high' },
  clopidogrel: { targets: ['omeprazole', 'esomeprazole'], severity: 'moderate' },
  theophylline:{ targets: ['ciprofloxacin', 'erythromycin', 'cimetidine'], severity: 'moderate' },
};

export function checkBasicInteractions(medications: string[]): ConflictsFallbackResponse {
  const conflicts: BasicConflict[] = [];
  const meds = medications.map(m => m.toLowerCase().trim());

  for (let i = 0; i < meds.length; i++) {
    const entry = BASIC_INTERACTIONS[meds[i]];
    if (!entry) continue;

    for (let j = 0; j < meds.length; j++) {
      if (i === j) continue;
      if (entry.targets.includes(meds[j])) {
        conflicts.push({
          drug1: medications[i],
          drug2: medications[j],
          severity: entry.severity,
          message: `Potential interaction between ${medications[i]} and ${medications[j]} (rule-based check).`,
        });
      }
    }
  }

  fallbackActivationCounter.inc({ service: 'conflicts', fallback_type: 'rule_based' });
  logger.warn(`Conflicts fallback activated – ${conflicts.length} rule-based interactions found`);

  return {
    fallback: true,
    conflicts,
    disclaimer:
      'Using basic rule-based validation. AI-powered advanced conflict detection is temporarily unavailable.',
  };
}
