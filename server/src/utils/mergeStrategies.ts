/**
 * Merge Strategies
 * Field-specific merge logic for deduplication results.
 * @module utils/mergeStrategies
 * @task US_030 TASK_003
 */

import { DocumentData, MergeDecision, MedicationData } from '../types/deduplication.types';

export function mergePatientName(documents: DocumentData[]): MergeDecision {
  // Select the most recent non-null patient name
  const sorted = documents
    .filter((d) => d.extractedData.patient_name)
    .sort((a, b) => {
      const dateA = a.documentDate ? new Date(a.documentDate).getTime() : 0;
      const dateB = b.documentDate ? new Date(b.documentDate).getTime() : 0;
      return dateB - dateA;
    });

  const selected = sorted[0];
  return {
    fieldName: 'patient_name',
    mergedValue: selected?.extractedData.patient_name || null,
    sourceDocumentIds: selected ? [selected.documentId] : [],
    confidenceScore: selected?.confidence || 0,
    mergeRationale: 'Selected most recent patient name by document date',
  };
}

export function mergeMedications(documents: DocumentData[]): MergeDecision {
  const allMeds: Array<MedicationData & { sourceDocId: number }> = [];

  for (const doc of documents) {
    for (const med of doc.extractedData.prescribed_medications || []) {
      allMeds.push({ ...med, sourceDocId: doc.documentId });
    }
  }

  // Deduplicate by name, keeping latest
  const uniqueMeds = new Map<string, MedicationData & { sourceDocId: number }>();
  for (const med of allMeds) {
    const key = med.name.toLowerCase().trim();
    if (!uniqueMeds.has(key)) {
      uniqueMeds.set(key, med);
    }
  }

  const mergedValue = Array.from(uniqueMeds.values()).map(({ name, dosage, frequency }) => ({
    name,
    dosage,
    frequency,
  }));

  return {
    fieldName: 'prescribed_medications',
    mergedValue,
    sourceDocumentIds: [...new Set(allMeds.map((m) => m.sourceDocId))],
    confidenceScore: 0.95,
    mergeRationale: 'Merged unique medications from all sources',
  };
}

export function mergeLabResults(documents: DocumentData[]): MergeDecision {
  // Keep all lab results (don't deduplicate, they represent timeline entries)
  const allLabs = documents.flatMap((doc) =>
    (doc.extractedData.lab_test_results || []).map((lab) => ({
      ...lab,
      sourceDocumentId: doc.documentId,
    })),
  );

  return {
    fieldName: 'lab_test_results',
    mergedValue: allLabs,
    sourceDocumentIds: [...new Set(allLabs.map((l) => l.sourceDocumentId))],
    confidenceScore: 0.95,
    mergeRationale: 'Kept all lab results as timeline entries',
  };
}

export function mergeAllergies(documents: DocumentData[]): MergeDecision {
  const allAllergies = documents.flatMap((doc) => doc.extractedData.allergies || []);
  const uniqueAllergies = [...new Set(allAllergies.map((a) => a.toLowerCase().trim()))];

  // Preserve original casing of first occurrence
  const result: string[] = [];
  const seen = new Set<string>();
  for (const allergy of allAllergies) {
    const normalized = allergy.toLowerCase().trim();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(allergy);
    }
  }

  return {
    fieldName: 'allergies',
    mergedValue: result,
    sourceDocumentIds: documents.map((d) => d.documentId),
    confidenceScore: uniqueAllergies.length > 0 ? 0.95 : 1.0,
    mergeRationale: 'Merged unique allergies from all sources',
  };
}

export function mergeConditions(documents: DocumentData[]): MergeDecision {
  const allConditions = documents.flatMap((doc) => doc.extractedData.diagnosed_conditions || []);
  const result: string[] = [];
  const seen = new Set<string>();

  for (const condition of allConditions) {
    const normalized = condition.toLowerCase().trim();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(condition);
    }
  }

  return {
    fieldName: 'diagnosed_conditions',
    mergedValue: result,
    sourceDocumentIds: documents.map((d) => d.documentId),
    confidenceScore: 0.95,
    mergeRationale: 'Merged unique conditions with source tracking',
  };
}
