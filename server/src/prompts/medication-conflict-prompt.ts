/**
 * Medication Conflict Prompt Template
 * @module prompts/medication-conflict-prompt
 * @description OpenAI prompt for medication conflict analysis
 * @epic EP-006
 * @story US-033
 */

import type { MedicationInput, AllergyInput, ConditionInput } from '../types/conflictDetection.types';

export function buildConflictPrompt(
  medications: MedicationInput[],
  allergies: AllergyInput[],
  conditions: ConditionInput[]
): string {
  const medicationList = medications
    .map((m, i) => `${i + 1}. ${m.name} - ${m.dosage} - ${m.frequency}${m.generic_name ? ` (Generic: ${m.generic_name})` : ''}`)
    .join('\n');

  const allergyList = allergies.length > 0
    ? allergies.map((a, i) => `${i + 1}. ${a.allergen_name} - Severity: ${a.severity}${a.reaction_type ? ` - Reaction: ${a.reaction_type}` : ''}`).join('\n')
    : 'No allergy data available';

  const conditionList = conditions.length > 0
    ? conditions.map((c, i) => `${i + 1}. ${c.condition_name}${c.icd10_code ? ` (${c.icd10_code})` : ''}`).join('\n')
    : 'No condition data available';

  return `You are a clinical pharmacology expert specializing in medication safety analysis.

Analyze the following patient data for drug interactions, drug-allergy conflicts, and drug-condition contraindications.

Return a JSON response with this exact structure:
{
  "conflicts": [
    {
      "conflict_type": "Drug-Drug" | "Drug-Allergy" | "Drug-Condition" | "Drug-Condition-Dosage",
      "medications_involved": ["medication names"],
      "severity_level": 1-5,
      "interaction_mechanism": "explanation of how the interaction occurs",
      "clinical_guidance": "recommended clinical actions",
      "dosage_dependent": true/false,
      "dosage_threshold": "threshold if dosage dependent, e.g., '400mg/day'"
    }
  ],
  "overall_safety_assessment": "summary of overall safety status",
  "no_conflicts_detected": true/false
}

Severity Scale:
1 = Minor (routine monitoring recommended)
2 = Moderate (clinical caution advised)
3 = Major (avoid combination if possible)
4 = Severe (contraindicated, requires clinical override)
5 = Critical (life-threatening risk, immediate action needed)

Analysis Requirements:
1. Check ALL medication pairs for Drug-Drug interactions
2. Cross-reference ALL medications against patient allergies, including cross-sensitivities (e.g., Penicillin allergy → flag Cephalosporins)
3. Validate ALL medications against patient conditions (e.g., NSAIDs + CKD, Beta-blockers + Asthma, Warfarin + bleeding disorders)
4. Include dosage considerations when interactions are dose-dependent
5. Be thorough - patient safety depends on complete analysis

MEDICATIONS:
${medicationList}

ALLERGIES:
${allergyList}

CONDITIONS:
${conditionList}

Return ONLY valid JSON. Do not include any text outside the JSON object.`;
}
