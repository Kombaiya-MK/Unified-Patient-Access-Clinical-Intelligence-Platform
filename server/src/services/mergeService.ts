/**
 * Merge Service
 * Orchestrates the deduplication and merge workflow for patient documents.
 * @module services/mergeService
 * @task US_030 TASK_003
 */

import pool from '../config/database';
import { DocumentData, MergeDecision, ConflictValue } from '../types/deduplication.types';
import { findDuplicates } from './deduplicationService';
import {
  mergePatientName,
  mergeMedications,
  mergeLabResults,
  mergeAllergies,
  mergeConditions,
} from '../utils/mergeStrategies';
import { DEDUPLICATION_CONFIG } from '../config/deduplication.config';
import logger from '../utils/logger';

export async function performDeduplication(
  patientId: number,
  newDocumentId: number,
): Promise<{ success: boolean; conflictsDetected: number; mergeSummary: string }> {
  // Fetch all documents for this patient with extracted data
  const docsResult = await pool.query(
    `SELECT cd.id AS document_id, cd.patient_id, cd.document_date,
            cd.extraction_confidence,
            pp.extracted_data
     FROM app.clinical_documents cd
     LEFT JOIN app.patient_profiles pp ON pp.source_document_id = cd.id
     WHERE cd.patient_id = $1
       AND cd.extraction_status IN ('Processed', 'Needs Review')
       AND pp.extracted_data IS NOT NULL
     ORDER BY cd.created_at DESC`,
    [patientId],
  );

  if (docsResult.rows.length < 2) {
    logger.info('Not enough documents for deduplication', { patientId, count: docsResult.rows.length });
    return { success: true, conflictsDetected: 0, mergeSummary: 'Single document, no deduplication needed' };
  }

  const documents: DocumentData[] = docsResult.rows.map((row) => ({
    documentId: Number(row.document_id),
    patientId: Number(row.patient_id),
    documentDate: row.document_date?.toISOString?.() || null,
    extractedData: typeof row.extracted_data === 'string'
      ? JSON.parse(row.extracted_data)
      : row.extracted_data || {},
    confidence: Number(row.extraction_confidence || 0) / 100,
  }));

  const newDoc = documents.find((d) => d.documentId === newDocumentId);
  if (!newDoc) {
    logger.warn('New document not found in results', { newDocumentId });
    return { success: false, conflictsDetected: 0, mergeSummary: 'New document not found' };
  }

  const existingDocs = documents.filter((d) => d.documentId !== newDocumentId);
  const duplicateResults = findDuplicates(newDoc, existingDocs);

  const mergeDecisions: MergeDecision[] = [];
  const conflicts: Array<{ fieldName: string; values: ConflictValue[] }> = [];

  // Check for conflicts from similarity results
  for (const result of duplicateResults) {
    if (result.conflictDetected) {
      for (const match of result.matchDetails) {
        if (match.similarityScore > 0 && match.similarityScore < DEDUPLICATION_CONFIG.conflictSimilarityThreshold) {
          const conflictValues: ConflictValue[] = [
            { value: match.valuesCompared[0], sourceDocumentId: newDoc.documentId, confidence: newDoc.confidence, extractedDate: newDoc.documentDate },
            { value: match.valuesCompared[1], sourceDocumentId: existingDocs[0]?.documentId || 0, confidence: existingDocs[0]?.confidence || 0, extractedDate: existingDocs[0]?.documentDate || null },
          ];
          conflicts.push({ fieldName: match.fieldName, values: conflictValues });
        }
      }
    }
  }

  // Perform merges on non-conflicting fields
  const allDocs = [...existingDocs, newDoc];
  mergeDecisions.push(mergePatientName(allDocs));
  mergeDecisions.push(mergeMedications(allDocs));
  mergeDecisions.push(mergeLabResults(allDocs));
  mergeDecisions.push(mergeAllergies(allDocs));
  mergeDecisions.push(mergeConditions(allDocs));

  // Build merged extracted data
  const mergedData: Record<string, unknown> = {};
  for (const decision of mergeDecisions) {
    mergedData[decision.fieldName] = decision.mergedValue;
  }

  // Also carry over simple fields from most recent document
  const mostRecent = allDocs[0];
  if (mostRecent?.extractedData) {
    mergedData.date_of_birth = mergedData.date_of_birth || mostRecent.extractedData.date_of_birth;
    mergedData.provider_name = mergedData.provider_name || mostRecent.extractedData.provider_name;
    mergedData.facility_name = mergedData.facility_name || mostRecent.extractedData.facility_name;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const mergeStatus = conflicts.length > 0 ? 'Has Conflicts' : 'Merged';
    const sourceDocIds = allDocs.map((d) => d.documentId);

    // Update patient_profiles
    await client.query(
      `UPDATE app.patient_profiles
       SET extracted_data = $1,
           merged_from_documents = $2,
           merge_status = $3,
           last_deduplicated_at = CURRENT_TIMESTAMP,
           conflict_fields = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [
        JSON.stringify(mergedData),
        JSON.stringify(sourceDocIds.map((id) => ({ document_id: id }))),
        mergeStatus,
        JSON.stringify(conflicts.map((c) => c.fieldName)),
        patientId,
      ],
    );

    // Create field_conflicts records
    for (const conflict of conflicts) {
      await client.query(
        `INSERT INTO app.field_conflicts (patient_id, field_name, conflicting_values)
         VALUES ($1, $2, $3)`,
        [patientId, conflict.fieldName, JSON.stringify(conflict.values)],
      );
    }

    // Create merge log
    await client.query(
      `INSERT INTO app.data_merge_logs
        (patient_id, algorithm_version, source_documents, merge_decisions, conflicts_detected, performed_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        patientId,
        'v1.0',
        JSON.stringify(sourceDocIds),
        JSON.stringify(mergeDecisions),
        JSON.stringify(conflicts),
        'System',
      ],
    );

    await client.query('COMMIT');

    logger.info('Deduplication completed', {
      patientId,
      documentsCompared: allDocs.length,
      conflictsDetected: conflicts.length,
      mergeStatus,
    });

    return {
      success: true,
      conflictsDetected: conflicts.length,
      mergeSummary: `Merged ${allDocs.length} documents. ${conflicts.length} conflicts detected.`,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Deduplication merge failed', { patientId, error });
    throw error;
  } finally {
    client.release();
  }
}
