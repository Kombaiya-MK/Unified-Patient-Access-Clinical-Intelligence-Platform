/**
 * Deduplication Service
 * Main orchestrator for finding duplicate data across documents.
 * @module services/deduplicationService
 * @task US_030 TASK_002
 */

import { SimilarityResult, FieldMatch, DocumentData } from '../types/deduplication.types';
import { DEDUPLICATION_CONFIG } from '../config/deduplication.config';
import {
  comparePatientNames,
  compareMedications,
  compareLabResults,
  compareAllergies,
  compareConditions,
} from './similarityAlgorithms';
import logger from '../utils/logger';

export function findDuplicates(
  targetDocument: DocumentData,
  existingDocuments: DocumentData[],
): SimilarityResult[] {
  const results: SimilarityResult[] = [];

  for (const existing of existingDocuments) {
    if (existing.documentId === targetDocument.documentId) continue;

    const result = compareDocuments(targetDocument, existing);
    results.push(result);
  }

  return results;
}

function compareDocuments(doc1: DocumentData, doc2: DocumentData): SimilarityResult {
  const matchDetails: FieldMatch[] = [];
  const ed1 = doc1.extractedData;
  const ed2 = doc2.extractedData;

  // Compare patient names
  if (ed1.patient_name && ed2.patient_name) {
    matchDetails.push(comparePatientNames(ed1.patient_name, ed2.patient_name));
  }

  // Compare medications
  matchDetails.push(compareMedications(
    ed1.prescribed_medications || [],
    ed2.prescribed_medications || [],
  ));

  // Compare lab results
  matchDetails.push(compareLabResults(
    ed1.lab_test_results || [],
    ed2.lab_test_results || [],
  ));

  // Compare allergies
  matchDetails.push(compareAllergies(
    ed1.allergies || [],
    ed2.allergies || [],
  ));

  // Compare conditions
  matchDetails.push(compareConditions(
    ed1.diagnosed_conditions || [],
    ed2.diagnosed_conditions || [],
  ));

  const confidenceScore = calculateOverallConfidence(matchDetails);
  const { conflictDetected, conflictReason } = detectConflicts(matchDetails);
  const isDuplicate = confidenceScore >= DEDUPLICATION_CONFIG.duplicateConfidenceThreshold && !conflictDetected;

  logger.debug('Document comparison result', {
    doc1Id: doc1.documentId,
    doc2Id: doc2.documentId,
    confidenceScore,
    isDuplicate,
    conflictDetected,
  });

  return {
    isDuplicate,
    confidenceScore,
    matchDetails,
    conflictDetected,
    conflictReason,
  };
}

function calculateOverallConfidence(fieldMatches: FieldMatch[]): number {
  const weights = DEDUPLICATION_CONFIG.fieldWeights;
  let totalWeight = 0;
  let weightedScore = 0;

  for (const match of fieldMatches) {
    const weight = weights[match.fieldName] || 0;
    if (weight > 0) {
      weightedScore += match.similarityScore * weight;
      totalWeight += weight;
    }
  }

  return totalWeight > 0 ? weightedScore / totalWeight : 0;
}

function detectConflicts(fieldMatches: FieldMatch[]): { conflictDetected: boolean; conflictReason: string | null } {
  for (const match of fieldMatches) {
    if (
      match.similarityScore > 0 &&
      match.similarityScore < DEDUPLICATION_CONFIG.conflictSimilarityThreshold
    ) {
      return {
        conflictDetected: true,
        conflictReason: `${match.fieldName} values too dissimilar (${Math.round(match.similarityScore * 100)}%) for auto-merge`,
      };
    }
  }

  return { conflictDetected: false, conflictReason: null };
}
