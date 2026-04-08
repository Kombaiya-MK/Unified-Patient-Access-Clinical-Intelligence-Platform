/**
 * Conflict Detection Service (Profile Field Conflicts)
 * @module services/conflictDetectionService  
 * @description Detects field-level conflicts between multiple data sources
 * @epic EP-006
 * @story US-031
 * @task task_003_be_conflict_detection_service
 */

import { pool } from '../config/database';
import logger from '../utils/logger';
import type { ProfileConflict, ConflictingValue } from '../types/patientProfile.types';

const SIMILARITY_THRESHOLD = 0.95;

export const profileConflictDetectionService = {
  async detectConflicts(patientId: string): Promise<ProfileConflict[]> {
    const conflicts: ProfileConflict[] = [];

    // Fetch all documents for the patient
    const documentsResult = await pool.query(
      `SELECT id AS document_id, COALESCE(original_filename, title) AS original_filename,
              COALESCE(upload_date, created_at) AS upload_date, extracted_data, extraction_confidence
       FROM clinical_documents 
       WHERE patient_id = $1 AND extraction_status = 'processed'
       ORDER BY COALESCE(upload_date, created_at) DESC`,
      [patientId]
    );

    if (documentsResult.rows.length < 2) {
      return conflicts; // Need at least 2 sources to detect conflicts
    }

    const documents = documentsResult.rows;

    // Check demographics fields across documents
    const demographicFields = ['patient_name', 'date_of_birth', 'gender', 'phone', 'address'];
    for (const field of demographicFields) {
      const fieldConflict = this.checkFieldConflict(field, documents);
      if (fieldConflict) {
        conflicts.push(fieldConflict);
      }
    }

    // Check medication conflicts (different medications or dosages across documents)
    const medicationConflict = this.checkMedicationConflicts(documents);
    if (medicationConflict) {
      conflicts.push(medicationConflict);
    }

    // Check allergy conflicts
    const allergyConflict = this.checkAllergyConflicts(documents);
    if (allergyConflict) {
      conflicts.push(allergyConflict);
    }

    // Check condition conflicts
    const conditionConflict = this.checkConditionConflicts(documents);
    if (conditionConflict) {
      conflicts.push(conditionConflict);
    }

    // Store detected conflicts in DB
    for (const conflict of conflicts) {
      await this.storeConflict(patientId, conflict);
    }

    logger.info(`Detected ${conflicts.length} conflicts for patient ${patientId}`);
    return conflicts;
  },

  checkFieldConflict(fieldName: string, documents: Record<string, unknown>[]): ProfileConflict | null {
    const values: ConflictingValue[] = [];

    for (const doc of documents) {
      const extracted = doc.extracted_data as Record<string, unknown> | null;
      if (!extracted) continue;

      const value = extracted[fieldName];
      if (value && typeof value === 'string' && value.trim()) {
        values.push({
          value: value.trim(),
          source_document_id: String(doc.document_id),
          source_document_name: String(doc.original_filename || 'Unknown'),
          confidence: Number(doc.extraction_confidence) || 0,
          extracted_date: String(doc.upload_date),
        });
      }
    }

    if (values.length < 2) return null;

    // Check if values are different
    const uniqueValues = new Set(values.map(v => v.value.toLowerCase()));
    if (uniqueValues.size <= 1) return null;

    // Calculate similarity between values
    const firstValue = values[0].value.toLowerCase();
    const hasSignificantDifference = values.some(v => {
      const similarity = this.calculateSimilarity(firstValue, v.value.toLowerCase());
      return similarity < SIMILARITY_THRESHOLD;
    });

    if (!hasSignificantDifference) return null;

    return {
      field_name: fieldName,
      conflicting_values: values,
      resolution_status: 'Pending',
      confidence_score: Math.max(...values.map(v => v.confidence)),
    };
  },

  checkMedicationConflicts(documents: Record<string, unknown>[]): ProfileConflict | null {
    const allMedSets: { meds: string[]; docId: string; docName: string; date: string; confidence: number }[] = [];

    for (const doc of documents) {
      const extracted = doc.extracted_data as Record<string, unknown> | null;
      if (!extracted) continue;

      const meds = Array.isArray(extracted.prescribed_medications)
        ? (extracted.prescribed_medications as Record<string, unknown>[]).map(m => 
            `${String(m.name || '')} ${String(m.dosage || '')}`.trim().toLowerCase()
          )
        : [];

      if (meds.length > 0) {
        allMedSets.push({
          meds,
          docId: String(doc.document_id),
          docName: String(doc.original_filename || 'Unknown'),
          date: String(doc.upload_date),
          confidence: Number(doc.extraction_confidence) || 0,
        });
      }
    }

    if (allMedSets.length < 2) return null;

    // Compare medication lists between documents
    const sets = allMedSets.map(s => new Set(s.meds));
    let hasDifference = false;

    for (let i = 1; i < sets.length; i++) {
      const diff1 = [...sets[0]].filter(m => !sets[i].has(m));
      const diff2 = [...sets[i]].filter(m => !sets[0].has(m));
      if (diff1.length > 0 || diff2.length > 0) {
        hasDifference = true;
        break;
      }
    }

    if (!hasDifference) return null;

    return {
      field_name: 'medications',
      conflicting_values: allMedSets.map(s => ({
        value: s.meds.join(', '),
        source_document_id: s.docId,
        source_document_name: s.docName,
        confidence: s.confidence,
        extracted_date: s.date,
      })),
      resolution_status: 'Pending',
    };
  },

  checkAllergyConflicts(documents: Record<string, unknown>[]): ProfileConflict | null {
    const allAllergySets: { allergies: string[]; docId: string; docName: string; date: string; confidence: number }[] = [];

    for (const doc of documents) {
      const extracted = doc.extracted_data as Record<string, unknown> | null;
      if (!extracted) continue;

      const allergies = Array.isArray(extracted.allergies)
        ? (extracted.allergies as Record<string, unknown>[]).map(a =>
            String(a.allergen || a.name || '').trim().toLowerCase()
          ).filter(Boolean)
        : [];

      if (allergies.length > 0) {
        allAllergySets.push({
          allergies,
          docId: String(doc.document_id),
          docName: String(doc.original_filename || 'Unknown'),
          date: String(doc.upload_date),
          confidence: Number(doc.extraction_confidence) || 0,
        });
      }
    }

    if (allAllergySets.length < 2) return null;

    const sets = allAllergySets.map(s => new Set(s.allergies));
    let hasDifference = false;

    for (let i = 1; i < sets.length; i++) {
      const diff1 = [...sets[0]].filter(a => !sets[i].has(a));
      const diff2 = [...sets[i]].filter(a => !sets[0].has(a));
      if (diff1.length > 0 || diff2.length > 0) {
        hasDifference = true;
        break;
      }
    }

    if (!hasDifference) return null;

    return {
      field_name: 'allergies',
      conflicting_values: allAllergySets.map(s => ({
        value: s.allergies.join(', '),
        source_document_id: s.docId,
        source_document_name: s.docName,
        confidence: s.confidence,
        extracted_date: s.date,
      })),
      resolution_status: 'Pending',
    };
  },

  checkConditionConflicts(documents: Record<string, unknown>[]): ProfileConflict | null {
    const allCondSets: { conditions: string[]; docId: string; docName: string; date: string; confidence: number }[] = [];

    for (const doc of documents) {
      const extracted = doc.extracted_data as Record<string, unknown> | null;
      if (!extracted) continue;

      const conditions = Array.isArray(extracted.diagnosed_conditions)
        ? (extracted.diagnosed_conditions as Record<string, unknown>[]).map(c =>
            String(c.name || c.condition || '').trim().toLowerCase()
          ).filter(Boolean)
        : [];

      if (conditions.length > 0) {
        allCondSets.push({
          conditions,
          docId: String(doc.document_id),
          docName: String(doc.original_filename || 'Unknown'),
          date: String(doc.upload_date),
          confidence: Number(doc.extraction_confidence) || 0,
        });
      }
    }

    if (allCondSets.length < 2) return null;

    const sets = allCondSets.map(s => new Set(s.conditions));
    let hasDifference = false;

    for (let i = 1; i < sets.length; i++) {
      const diff1 = [...sets[0]].filter(c => !sets[i].has(c));
      const diff2 = [...sets[i]].filter(c => !sets[0].has(c));
      if (diff1.length > 0 || diff2.length > 0) {
        hasDifference = true;
        break;
      }
    }

    if (!hasDifference) return null;

    return {
      field_name: 'conditions',
      conflicting_values: allCondSets.map(s => ({
        value: s.conditions.join(', '),
        source_document_id: s.docId,
        source_document_name: s.docName,
        confidence: s.confidence,
        extracted_date: s.date,
      })),
      resolution_status: 'Pending',
    };
  },

  async storeConflict(patientId: string, conflict: ProfileConflict): Promise<void> {
    // Check if conflict already exists for this field
    const existing = await pool.query(
      `SELECT id FROM profile_conflicts 
       WHERE patient_id = $1 AND field_name = $2 AND resolution_status = 'Pending'`,
      [patientId, conflict.field_name]
    );

    if (existing.rows.length > 0) {
      // Update existing conflict
      await pool.query(
        `UPDATE profile_conflicts 
         SET conflicting_values = $1, updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(conflict.conflicting_values), existing.rows[0].id]
      );
    } else {
      // Insert new conflict
      await pool.query(
        `INSERT INTO profile_conflicts (patient_id, field_name, conflicting_values, resolution_status)
         VALUES ($1, $2, $3, $4)`,
        [patientId, conflict.field_name, JSON.stringify(conflict.conflicting_values), 'Pending']
      );
    }
  },

  calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const maxLen = Math.max(str1.length, str2.length);
    const distance = this.levenshteinDistance(str1, str2);
    return 1 - distance / maxLen;
  },

  levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }

    return dp[m][n];
  },
};
