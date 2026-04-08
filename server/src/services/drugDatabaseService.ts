/**
 * Drug Database Service
 * @module services/drugDatabaseService
 * @description In-memory drug reference database for medication normalization and interaction lookup
 * @epic EP-006
 * @story US-033
 */

import { resolveToGeneric, calculateSimilarity, normalizeName } from '../utils/drugNameNormalizer';
import type { DrugReference } from '../types/conflictDetection.types';

const DRUG_DATABASE: DrugReference[] = [
  {
    name: 'warfarin',
    generic_name: 'warfarin',
    drug_class: 'Anticoagulant',
    common_interactions: ['aspirin', 'ibuprofen', 'naproxen', 'clopidogrel', 'fluconazole', 'metronidazole', 'amiodarone'],
    contraindicated_conditions: ['active bleeding', 'hemorrhagic stroke', 'severe hepatic disease'],
    cross_sensitivities: [],
    dosage_thresholds: { aspirin: '81mg/day' },
  },
  {
    name: 'aspirin',
    generic_name: 'aspirin',
    drug_class: 'NSAID/Antiplatelet',
    common_interactions: ['warfarin', 'ibuprofen', 'naproxen', 'clopidogrel', 'methotrexate', 'heparin'],
    contraindicated_conditions: ['peptic ulcer', 'bleeding disorder', 'severe asthma'],
    cross_sensitivities: ['ibuprofen', 'naproxen'],
    dosage_thresholds: { warfarin: '325mg/day' },
  },
  {
    name: 'ibuprofen',
    generic_name: 'ibuprofen',
    drug_class: 'NSAID',
    common_interactions: ['warfarin', 'aspirin', 'lisinopril', 'furosemide', 'methotrexate', 'lithium'],
    contraindicated_conditions: ['chronic kidney disease', 'peptic ulcer', 'heart failure', 'severe hepatic disease'],
    cross_sensitivities: ['aspirin', 'naproxen', 'celecoxib'],
    dosage_thresholds: { general: '1200mg/day' },
  },
  {
    name: 'naproxen',
    generic_name: 'naproxen',
    drug_class: 'NSAID',
    common_interactions: ['warfarin', 'aspirin', 'lisinopril', 'furosemide', 'methotrexate'],
    contraindicated_conditions: ['chronic kidney disease', 'peptic ulcer', 'heart failure'],
    cross_sensitivities: ['aspirin', 'ibuprofen'],
    dosage_thresholds: {},
  },
  {
    name: 'lisinopril',
    generic_name: 'lisinopril',
    drug_class: 'ACE Inhibitor',
    common_interactions: ['potassium supplements', 'spironolactone', 'ibuprofen', 'naproxen', 'lithium'],
    contraindicated_conditions: ['bilateral renal artery stenosis', 'angioedema history', 'pregnancy'],
    cross_sensitivities: ['enalapril', 'ramipril', 'captopril'],
    dosage_thresholds: {},
  },
  {
    name: 'metformin',
    generic_name: 'metformin',
    drug_class: 'Biguanide',
    common_interactions: ['contrast dye', 'alcohol'],
    contraindicated_conditions: ['severe renal impairment', 'metabolic acidosis', 'severe hepatic disease'],
    cross_sensitivities: [],
    dosage_thresholds: { general: '2000mg/day' },
  },
  {
    name: 'atorvastatin',
    generic_name: 'atorvastatin',
    drug_class: 'Statin',
    common_interactions: ['gemfibrozil', 'niacin', 'cyclosporine', 'clarithromycin', 'itraconazole'],
    contraindicated_conditions: ['active liver disease', 'pregnancy'],
    cross_sensitivities: ['simvastatin', 'rosuvastatin', 'pravastatin'],
    dosage_thresholds: {},
  },
  {
    name: 'amoxicillin',
    generic_name: 'amoxicillin',
    drug_class: 'Penicillin Antibiotic',
    common_interactions: ['warfarin', 'methotrexate'],
    contraindicated_conditions: [],
    cross_sensitivities: ['penicillin', 'ampicillin', 'cephalexin'],
    dosage_thresholds: {},
  },
  {
    name: 'metoprolol',
    generic_name: 'metoprolol',
    drug_class: 'Beta Blocker',
    common_interactions: ['verapamil', 'diltiazem', 'clonidine', 'digoxin'],
    contraindicated_conditions: ['severe bradycardia', 'heart block', 'decompensated heart failure', 'asthma'],
    cross_sensitivities: ['atenolol', 'propranolol', 'carvedilol'],
    dosage_thresholds: {},
  },
  {
    name: 'amlodipine',
    generic_name: 'amlodipine',
    drug_class: 'Calcium Channel Blocker',
    common_interactions: ['simvastatin', 'cyclosporine'],
    contraindicated_conditions: ['severe aortic stenosis', 'cardiogenic shock'],
    cross_sensitivities: ['nifedipine', 'felodipine'],
    dosage_thresholds: {},
  },
  {
    name: 'omeprazole',
    generic_name: 'omeprazole',
    drug_class: 'Proton Pump Inhibitor',
    common_interactions: ['clopidogrel', 'methotrexate', 'digoxin'],
    contraindicated_conditions: [],
    cross_sensitivities: ['esomeprazole', 'lansoprazole', 'pantoprazole'],
    dosage_thresholds: {},
  },
  {
    name: 'sertraline',
    generic_name: 'sertraline',
    drug_class: 'SSRI',
    common_interactions: ['warfarin', 'tramadol', 'lithium', 'sumatriptan', 'maois'],
    contraindicated_conditions: [],
    cross_sensitivities: ['fluoxetine', 'escitalopram', 'paroxetine'],
    dosage_thresholds: {},
  },
  {
    name: 'levothyroxine',
    generic_name: 'levothyroxine',
    drug_class: 'Thyroid Hormone',
    common_interactions: ['calcium supplements', 'iron supplements', 'antacids', 'warfarin'],
    contraindicated_conditions: ['untreated adrenal insufficiency'],
    cross_sensitivities: [],
    dosage_thresholds: {},
  },
  {
    name: 'prednisone',
    generic_name: 'prednisone',
    drug_class: 'Corticosteroid',
    common_interactions: ['warfarin', 'aspirin', 'ibuprofen', 'diabetes medications', 'live vaccines'],
    contraindicated_conditions: ['systemic fungal infection', 'active untreated infection'],
    cross_sensitivities: ['prednisolone', 'methylprednisolone', 'dexamethasone'],
    dosage_thresholds: {},
  },
  {
    name: 'clopidogrel',
    generic_name: 'clopidogrel',
    drug_class: 'Antiplatelet',
    common_interactions: ['omeprazole', 'warfarin', 'aspirin', 'nsaids'],
    contraindicated_conditions: ['active bleeding', 'severe hepatic impairment'],
    cross_sensitivities: [],
    dosage_thresholds: {},
  },
];

export const drugDatabaseService = {
  normalizeMedicationName(name: string): string | null {
    const resolved = resolveToGeneric(name);
    const found = DRUG_DATABASE.find(d => d.generic_name === resolved || d.name === resolved);
    if (found) return found.generic_name;

    // Fuzzy match
    let bestMatch: { name: string; score: number } | null = null;
    for (const drug of DRUG_DATABASE) {
      const score = calculateSimilarity(resolved, drug.generic_name);
      if (score >= 0.85 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { name: drug.generic_name, score };
      }
    }

    return bestMatch?.name || null;
  },

  searchDrugByPartial(partial: string): Array<{ name: string; confidence: number }> {
    const normalized = normalizeName(partial);
    const results: Array<{ name: string; confidence: number }> = [];

    for (const drug of DRUG_DATABASE) {
      if (drug.generic_name.includes(normalized) || normalized.includes(drug.generic_name)) {
        results.push({ name: drug.generic_name, confidence: 0.9 });
      } else {
        const score = calculateSimilarity(normalized, drug.generic_name);
        if (score >= 0.5) {
          results.push({ name: drug.generic_name, confidence: score });
        }
      }
    }

    return results
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  },

  getDrugClass(medicationName: string): string | null {
    const resolved = resolveToGeneric(medicationName);
    const drug = DRUG_DATABASE.find(d => d.generic_name === resolved || d.name === resolved);
    return drug?.drug_class || null;
  },

  getKnownInteractions(drug1: string, drug2: string): boolean {
    const resolved1 = resolveToGeneric(drug1);
    const resolved2 = resolveToGeneric(drug2);

    const drugInfo1 = DRUG_DATABASE.find(d => d.generic_name === resolved1);
    const drugInfo2 = DRUG_DATABASE.find(d => d.generic_name === resolved2);

    if (drugInfo1?.common_interactions.includes(resolved2)) return true;
    if (drugInfo2?.common_interactions.includes(resolved1)) return true;

    return false;
  },

  getDrugInfo(medicationName: string): DrugReference | null {
    const resolved = resolveToGeneric(medicationName);
    return DRUG_DATABASE.find(d => d.generic_name === resolved || d.name === resolved) || null;
  },

  getDosageThreshold(drug: string, interactionDrug: string): string | null {
    const resolved = resolveToGeneric(drug);
    const drugInfo = DRUG_DATABASE.find(d => d.generic_name === resolved);
    if (!drugInfo?.dosage_thresholds) return null;

    const resolvedInteraction = resolveToGeneric(interactionDrug);
    return drugInfo.dosage_thresholds[resolvedInteraction] || drugInfo.dosage_thresholds.general || null;
  },

  checkCrossSensitivity(medication: string, allergen: string): boolean {
    const resolvedMed = resolveToGeneric(medication);
    const resolvedAllergen = normalizeName(allergen);

    const drugInfo = DRUG_DATABASE.find(d => d.generic_name === resolvedMed);
    if (!drugInfo) return false;

    // Direct class match
    if (drugInfo.cross_sensitivities.some(cs => normalizeName(cs) === resolvedAllergen)) {
      return true;
    }

    // Check if the allergen is in the same drug class
    const allergenDrug = DRUG_DATABASE.find(d => d.generic_name === resolvedAllergen);
    if (allergenDrug && allergenDrug.drug_class === drugInfo.drug_class) {
      return true;
    }

    // Penicillin → Cephalosporin cross-reactivity
    if (resolvedAllergen === 'penicillin' && drugInfo.drug_class.toLowerCase().includes('cephalosporin')) {
      return true;
    }
    if (resolvedAllergen === 'penicillin' && drugInfo.cross_sensitivities.includes('penicillin')) {
      return true;
    }

    return false;
  },

  checkConditionContraindication(medication: string, condition: string): boolean {
    const resolved = resolveToGeneric(medication);
    const normalizedCondition = normalizeName(condition);
    const drugInfo = DRUG_DATABASE.find(d => d.generic_name === resolved);
    if (!drugInfo) return false;

    return drugInfo.contraindicated_conditions.some(c =>
      normalizeName(c).includes(normalizedCondition) || normalizedCondition.includes(normalizeName(c))
    );
  },

  getAllDrugs(): string[] {
    return DRUG_DATABASE.map(d => d.generic_name);
  },
};
