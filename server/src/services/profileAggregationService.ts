/**
 * Profile Aggregation Service
 * @module services/profileAggregationService
 * @description Aggregates unified clinical profile from all sources with conflict detection
 * @epic EP-006
 * @story US-034
 * @task task_001_be_unified_profile_api
 */

import { pool } from '../config/database';
import logger from '../utils/logger';
import redisClient from '../utils/redisClient';
import { profileGenerationService } from './profileGenerationService';
import type { ClinicalProfileResponse, ProfileHistoryEntry } from '../types/clinicalProfile.types';

const CACHE_KEY_PREFIX = 'clinical:profile:';
const CACHE_TTL_SECONDS = 300;

export const profileAggregationService = {
  async getAggregatedProfile(
    patientId: string,
    _options?: { includeHistory?: boolean; includeAllDocuments?: boolean }
  ): Promise<ClinicalProfileResponse> {
    // Check cache
    const cacheKey = `${CACHE_KEY_PREFIX}${patientId}`;
    if (redisClient.isAvailable) {
      try {
        const client = redisClient.getClient();
        if (client) {
          const cached = await client.get(cacheKey);
          if (cached) {
            logger.info(`Clinical profile cache hit for patient ${patientId}`);
            return JSON.parse(cached);
          }
        }
      } catch (err) {
        logger.warn('Redis cache read failed for clinical profile');
      }
    }

    // Generate unified profile (handles data aggregation)
    const unifiedProfile = await profileGenerationService.generateProfile(patientId);

    const clinicalProfile: ClinicalProfileResponse = {
      patient_id: unifiedProfile.patient_id,
      demographics: unifiedProfile.demographics,
      chief_complaint: unifiedProfile.chief_complaint,
      medical_history: unifiedProfile.medical_history,
      current_medications: unifiedProfile.current_medications.map(m => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        prescriber: m.prescriber,
        start_date: m.start_date,
        status: m.status,
        source_document_id: m.source_document_id,
      })),
      allergies: unifiedProfile.allergies.map(a => ({
        allergen: a.allergen,
        reaction: a.reaction,
        severity: a.severity,
        onset_date: a.onset_date,
        source_document_id: a.source_document_id,
      })),
      lab_results: unifiedProfile.lab_results.map(l => ({
        date: l.date,
        test_name: l.test_name,
        value: l.value,
        reference_range: l.reference_range,
        abnormal_flag: l.abnormal_flag,
        source_document_id: l.source_document_id,
      })),
      previous_visits: unifiedProfile.previous_visits.map(v => ({
        date: v.date,
        chief_complaint: v.chief_complaint,
        provider_name: v.provider_name,
        icd10_codes: v.icd10_codes,
        notes_preview: v.notes_preview,
        appointment_id: v.appointment_id,
      })),
      icd10_codes: unifiedProfile.icd10_codes.map(c => ({
        code: c.code,
        description: c.description,
        confidence: c.confidence,
        status: c.status,
        code_type: c.code_type,
      })),
      medication_conflicts: unifiedProfile.medication_conflicts.map(mc => ({
        conflict_id: mc.conflict_id,
        conflict_type: mc.conflict_type,
        medications_involved: mc.medications_involved,
        severity_level: mc.severity_level,
        interaction_mechanism: mc.interaction_mechanism,
        clinical_guidance: mc.clinical_guidance,
        conflict_status: mc.conflict_status,
      })),
      conflicts: unifiedProfile.conflicts.map(c => ({
        field_name: c.field_name,
        conflicting_values: c.conflicting_values.map(cv => ({
          value: cv.value,
          source_document_id: cv.source_document_id,
          source_document_name: cv.source_document_name,
          confidence: cv.confidence,
          extracted_date: cv.extracted_date,
        })),
        resolution_status: c.resolution_status,
        resolved_value: c.resolved_value,
        resolution_notes: c.resolution_notes,
      })),
      processing_status: unifiedProfile.processing_status,
      source_documents: unifiedProfile.source_documents.map(d => ({
        document_id: d.document_id,
        document_name: d.document_name,
        upload_date: d.upload_date,
        extraction_status: d.extraction_status,
        extraction_confidence: d.extraction_confidence,
      })),
      last_updated: unifiedProfile.last_updated,
    };

    // Cache
    if (redisClient.isAvailable) {
      try {
        const client = redisClient.getClient();
        if (client) {
          await client.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(clinicalProfile));
        }
      } catch (err) {
        logger.warn('Redis cache write failed for clinical profile');
      }
    }

    return clinicalProfile;
  },

  async resolveConflict(
    patientId: string,
    fieldName: string,
    selectedValue: string,
    resolutionNotes: string,
    staffId: string
  ): Promise<void> {
    // Update profile_conflicts
    await pool.query(
      `UPDATE profile_conflicts 
       SET resolution_status = 'Resolved', resolved_value = $1, resolution_notes = $2,
           resolved_by_staff_id = $3, resolved_at = NOW(), updated_at = NOW()
       WHERE patient_id = $4 AND field_name = $5 AND resolution_status = 'Pending'`,
      [selectedValue, resolutionNotes, staffId, patientId, fieldName]
    );

    // Log to data_merge_logs if table exists
    try {
      await pool.query(
        `INSERT INTO data_merge_logs (patient_id, merge_decisions, performed_by, staff_id)
         VALUES ($1, $2, $3, $4)`,
        [
          patientId,
          JSON.stringify({ field: fieldName, action: 'resolve_conflict', selected_value: selectedValue }),
          'Staff Manual',
          staffId,
        ]
      );
    } catch (err) {
      logger.warn('data_merge_logs table not available, skipping merge log');
    }

    // Create profile version
    await pool.query(
      `INSERT INTO profile_versions (patient_id, profile_snapshot, change_type, changed_by_staff_id, change_description)
       VALUES ($1, $2, 'conflict_resolution', $3, $4)`,
      [
        patientId,
        JSON.stringify({ field: fieldName, resolved_value: selectedValue }),
        staffId,
        `Resolved conflict for field "${fieldName}"`,
      ]
    );

    // Invalidate cache
    await this.invalidateCache(patientId);

    logger.info(`Conflict resolved for patient ${patientId}, field: ${fieldName}`);
  },

  async getProfileHistory(patientId: string, limit = 20, offset = 0): Promise<{ entries: ProfileHistoryEntry[]; total: number }> {
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM profile_versions WHERE patient_id = $1`,
      [patientId]
    );

    const result = await pool.query(
      `SELECT pv.*, u.email as staff_email
       FROM profile_versions pv
       LEFT JOIN users u ON pv.changed_by_staff_id = u.id
       WHERE pv.patient_id = $1
       ORDER BY pv.created_at DESC
       LIMIT $2 OFFSET $3`,
      [patientId, limit, offset]
    );

    const entries: ProfileHistoryEntry[] = result.rows.map((row: Record<string, unknown>) => {
      const snapshot = row.profile_snapshot as Record<string, unknown> || {};
      return {
        id: String(row.id),
        field_name: snapshot.field ? String(snapshot.field) : undefined,
        action: String(row.change_type),
        previous_value: snapshot.previous_value ? String(snapshot.previous_value) : undefined,
        new_value: snapshot.resolved_value ? String(snapshot.resolved_value) : undefined,
        staff_name: row.staff_email ? String(row.staff_email) : undefined,
        timestamp: String(row.created_at),
        details: snapshot,
      };
    });

    return {
      entries,
      total: parseInt(String(countResult.rows[0].count), 10),
    };
  },

  async invalidateCache(patientId: string): Promise<void> {
    if (redisClient.isAvailable) {
      try {
        const client = redisClient.getClient();
        if (client) {
          await client.del(`${CACHE_KEY_PREFIX}${patientId}`);
          await client.del(`profile:unified:${patientId}`);
        }
      } catch (err) {
        logger.warn('Cache invalidation failed for clinical profile');
      }
    }
  },
};
