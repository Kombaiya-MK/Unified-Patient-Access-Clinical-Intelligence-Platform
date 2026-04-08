/**
 * Similarity Comparison Algorithms
 * Field-specific comparison functions for deduplication.
 * @module services/similarityAlgorithms
 * @task US_030 TASK_002
 */

import { FieldMatch, MedicationData, LabData } from '../types/deduplication.types';
import { DEDUPLICATION_CONFIG } from '../config/deduplication.config';
import { tokenSetRatio, normalizeString, fuzzyRatio } from '../utils/fuzzyMatching';
import { areLabResultsOverlapping, getMedicationTemporalRelation } from '../utils/dateComparison';

export function comparePatientNames(name1: string, name2: string): FieldMatch {
  const score = tokenSetRatio(name1, name2);
  return {
    fieldName: 'patient_name',
    similarityScore: score,
    valuesCompared: [name1, name2],
    matchType: 'fuzzy',
  };
}

export function compareMedications(
  meds1: MedicationData[],
  meds2: MedicationData[],
): FieldMatch {
  if (meds1.length === 0 && meds2.length === 0) {
    return { fieldName: 'medications', similarityScore: 1.0, valuesCompared: [meds1, meds2], matchType: 'exact' };
  }
  if (meds1.length === 0 || meds2.length === 0) {
    return { fieldName: 'medications', similarityScore: 0, valuesCompared: [meds1, meds2], matchType: 'exact' };
  }

  let matchedCount = 0;
  let totalScores = 0;

  for (const med1 of meds1) {
    let bestScore = 0;
    for (const med2 of meds2) {
      const nameMatch = normalizeString(med1.name) === normalizeString(med2.name);
      if (nameMatch) {
        const temporal = getMedicationTemporalRelation(
          med1.date,
          med2.date,
          DEDUPLICATION_CONFIG.medicationTimelineThresholdDays,
        );
        if (temporal === 'timeline_entry') continue; // Skip timeline entries

        const dosageScore = fuzzyRatio(med1.dosage || '', med2.dosage || '');
        const freqScore = fuzzyRatio(med1.frequency || '', med2.frequency || '');
        const score = (1.0 + dosageScore + freqScore) / 3;
        bestScore = Math.max(bestScore, score);
      }
    }
    if (bestScore > 0) matchedCount++;
    totalScores += bestScore;
  }

  const allUnique = Math.max(meds1.length, meds2.length);
  const score = allUnique > 0 ? totalScores / allUnique : 1.0;

  return {
    fieldName: 'medications',
    similarityScore: score,
    valuesCompared: [meds1, meds2],
    matchType: 'fuzzy',
  };
}

export function compareLabResults(labs1: LabData[], labs2: LabData[]): FieldMatch {
  if (labs1.length === 0 && labs2.length === 0) {
    return { fieldName: 'labs', similarityScore: 1.0, valuesCompared: [labs1, labs2], matchType: 'date_overlap' };
  }
  if (labs1.length === 0 || labs2.length === 0) {
    return { fieldName: 'labs', similarityScore: 0, valuesCompared: [labs1, labs2], matchType: 'date_overlap' };
  }

  let matchedCount = 0;
  for (const lab1 of labs1) {
    for (const lab2 of labs2) {
      if (areLabResultsOverlapping(
        lab1.test_name,
        lab1.date,
        lab2.test_name,
        lab2.date,
        DEDUPLICATION_CONFIG.labDateOverlapDays,
      )) {
        matchedCount++;
        break;
      }
    }
  }

  const allUnique = Math.max(labs1.length, labs2.length);
  const score = allUnique > 0 ? matchedCount / allUnique : 1.0;

  return {
    fieldName: 'labs',
    similarityScore: score,
    valuesCompared: [labs1, labs2],
    matchType: 'date_overlap',
  };
}

export function compareAllergies(allergies1: string[], allergies2: string[]): FieldMatch {
  if (allergies1.length === 0 && allergies2.length === 0) {
    return { fieldName: 'allergies', similarityScore: 1.0, valuesCompared: [allergies1, allergies2], matchType: 'exact' };
  }
  if (allergies1.length === 0 || allergies2.length === 0) {
    return { fieldName: 'allergies', similarityScore: 0, valuesCompared: [allergies1, allergies2], matchType: 'exact' };
  }

  const norm1 = allergies1.map(normalizeString);
  const norm2 = allergies2.map(normalizeString);
  const set1 = new Set(norm1);
  const set2 = new Set(norm2);

  const intersection = [...set1].filter((a) => set2.has(a)).length;
  const union = new Set([...set1, ...set2]).size;
  const score = union > 0 ? intersection / union : 1.0;

  return {
    fieldName: 'allergies',
    similarityScore: score,
    valuesCompared: [allergies1, allergies2],
    matchType: 'exact',
  };
}

export function compareConditions(conds1: string[], conds2: string[]): FieldMatch {
  if (conds1.length === 0 && conds2.length === 0) {
    return { fieldName: 'conditions', similarityScore: 1.0, valuesCompared: [conds1, conds2], matchType: 'fuzzy' };
  }
  if (conds1.length === 0 || conds2.length === 0) {
    return { fieldName: 'conditions', similarityScore: 0, valuesCompared: [conds1, conds2], matchType: 'fuzzy' };
  }

  let matchedCount = 0;
  for (const c1 of conds1) {
    for (const c2 of conds2) {
      const score = tokenSetRatio(c1, c2);
      if (score >= DEDUPLICATION_CONFIG.fuzzyMatchThreshold) {
        matchedCount++;
        break;
      }
    }
  }

  const allUnique = Math.max(conds1.length, conds2.length);
  const score = allUnique > 0 ? matchedCount / allUnique : 1.0;

  return {
    fieldName: 'conditions',
    similarityScore: score,
    valuesCompared: [conds1, conds2],
    matchType: 'fuzzy',
  };
}
