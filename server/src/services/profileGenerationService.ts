/**
 * Profile Generation Service
 * @module services/profileGenerationService
 * @description Generates unified patient profiles from multiple data sources
 * @epic EP-006
 * @story US-031
 * @task task_002_be_patient_profile_generation_api
 */

import { pool } from '../config/database';
import logger from '../utils/logger';
import redisClient from '../utils/redisClient';
import type {
  UnifiedProfile,
  ProfileDemographics,
  ProfileMedication,
  ProfileAllergy,
  ProfileLabResult,
  ProfileVisit,
  MedicalHistoryData,
  ProcessingStatus,
  SourceDocumentRef,
  ProfileCode,
} from '../types/patientProfile.types';

const CACHE_KEY_PREFIX = 'profile:unified:';
const CACHE_TTL_SECONDS = 300; // 5 minutes

export const profileGenerationService = {
  async generateProfile(patientId: string): Promise<UnifiedProfile> {
    // Check cache first
    const cacheKey = `${CACHE_KEY_PREFIX}${patientId}`;
    if (redisClient.isAvailable) {
      try {
        const client = redisClient.getClient();
        if (client) {
          const cached = await client.get(cacheKey);
          if (cached) {
            logger.info(`Profile cache hit for patient ${patientId}`);
            return JSON.parse(cached);
          }
        }
      } catch (err) {
        logger.warn('Redis cache read failed, proceeding with DB query');
      }
    }

    // Fetch patient profile
    const profileResult = await pool.query(
      `SELECT * FROM patient_profiles WHERE user_id = $1`,
      [patientId]
    );

    if (profileResult.rows.length === 0) {
      throw new Error(`Patient profile not found: ${patientId}`);
    }

    const profile = profileResult.rows[0];
    const extractedData = profile.extracted_data || {};

    // Fetch all clinical documents for this patient
    const documentsResult = await pool.query(
      `SELECT id AS document_id, COALESCE(original_filename, title) AS original_filename,
              COALESCE(upload_date, created_at) AS upload_date, extraction_status,
              extraction_confidence, extracted_data
       FROM clinical_documents 
       WHERE patient_id = $1 
       ORDER BY COALESCE(upload_date, created_at) DESC`,
      [patientId]
    );

    // Fetch appointments
    const appointmentsResult = await pool.query(
      `SELECT a.id AS appointment_id, a.appointment_date, a.chief_complaint,
              CONCAT(u.first_name, ' ', u.last_name) AS provider_name,
              a.icd10_codes, a.cpt_codes, a.notes
       FROM appointments a
       LEFT JOIN users u ON a.doctor_id = u.id
       WHERE a.patient_id = $1 
       ORDER BY a.appointment_date DESC`,
      [patientId]
    );

    // Fetch profile conflicts
    const conflictsResult = await pool.query(
      `SELECT * FROM profile_conflicts 
       WHERE patient_id = $1 
       ORDER BY created_at DESC`,
      [patientId]
    );

    // Fetch medication conflicts
    const medConflictsResult = await pool.query(
      `SELECT * FROM medication_conflicts 
       WHERE patient_id = $1 AND conflict_status = 'Active'
       ORDER BY severity_level DESC`,
      [patientId]
    );

    // Fetch medical coding suggestions
    const codingResult = await pool.query(
      `SELECT * FROM medical_coding_suggestions 
       WHERE patient_id = $1 
       ORDER BY confidence_score DESC`,
      [patientId]
    );

    // Aggregate data from all documents
    const aggregatedMedications = this.aggregateMedications(documentsResult.rows, extractedData);
    const aggregatedAllergies = this.aggregateAllergies(documentsResult.rows, extractedData);
    const aggregatedLabResults = this.aggregateLabResults(documentsResult.rows, extractedData);
    const aggregatedConditions = this.aggregateConditions(documentsResult.rows, extractedData);

    // Build demographics from profile and documents
    const demographics = this.buildDemographics(profile, extractedData);

    // Build processing status
    const processingStatus = this.buildProcessingStatus(documentsResult.rows);

    // Build source documents
    const sourceDocuments: SourceDocumentRef[] = documentsResult.rows.map((doc: Record<string, unknown>) => ({
      document_id: String(doc.document_id),
      document_name: String(doc.original_filename || 'Unknown'),
      upload_date: String(doc.upload_date),
      extraction_status: String(doc.extraction_status || 'processing') as 'processing' | 'processed' | 'needs_review' | 'failed',
      extraction_confidence: Number(doc.extraction_confidence) || undefined,
    }));

    // Build visits from appointments
    const previousVisits: ProfileVisit[] = appointmentsResult.rows.map((apt: Record<string, unknown>) => ({
      date: String(apt.appointment_date),
      chief_complaint: String(apt.chief_complaint || ''),
      provider_name: String(apt.provider_name || ''),
      icd10_codes: Array.isArray(apt.icd10_codes) ? apt.icd10_codes as string[] : [],
      notes_preview: apt.notes ? String(apt.notes).substring(0, 200) : undefined,
      appointment_id: String(apt.appointment_id),
    }));

    // Build coding
    const icd10Codes: ProfileCode[] = codingResult.rows.map((code: Record<string, unknown>) => ({
      code: String(code.code),
      description: String(code.description),
      confidence: Number(code.confidence_score),
      status: String(code.coding_status) as ProfileCode['status'],
      code_type: String(code.code_type) as 'ICD-10' | 'CPT',
    }));

    // Build profile conflicts
    const conflicts = conflictsResult.rows.map((c: Record<string, unknown>) => ({
      field_name: String(c.field_name),
      conflicting_values: Array.isArray(c.conflicting_values) ? c.conflicting_values : [],
      resolution_status: String(c.resolution_status) as 'Pending' | 'Resolved' | 'Deferred',
      resolved_value: c.resolved_value ? String(c.resolved_value) : undefined,
      resolution_notes: c.resolution_notes ? String(c.resolution_notes) : undefined,
      resolved_by_staff_id: c.resolved_by_staff_id ? String(c.resolved_by_staff_id) : undefined,
      resolved_at: c.resolved_at ? String(c.resolved_at) : undefined,
      confidence_score: c.confidence_score ? Number(c.confidence_score) : undefined,
    }));

    // Build medication conflicts summary
    const medicationConflicts = medConflictsResult.rows.map((mc: Record<string, unknown>) => ({
      conflict_id: String(mc.conflict_id),
      conflict_type: String(mc.conflict_type) as 'Drug-Drug' | 'Drug-Allergy' | 'Drug-Condition' | 'Drug-Condition-Dosage',
      medications_involved: Array.isArray(mc.medications_involved)
        ? (mc.medications_involved as Array<Record<string, unknown>>).map(m => String(m.medication_name || m))
        : [],
      severity_level: Number(mc.severity_level),
      interaction_mechanism: String(mc.interaction_mechanism),
      clinical_guidance: String(mc.clinical_guidance),
      conflict_status: String(mc.conflict_status) as 'Active' | 'Overridden' | 'Resolved' | 'Acknowledged',
    }));

    const unifiedProfile: UnifiedProfile = {
      patient_id: patientId,
      demographics,
      chief_complaint: extractedData.chief_complaint || '',
      medical_history: {
        conditions: aggregatedConditions,
        surgeries: extractedData.surgeries || [],
        procedures: extractedData.procedures || [],
      },
      current_medications: aggregatedMedications,
      allergies: aggregatedAllergies,
      lab_results: aggregatedLabResults,
      previous_visits: previousVisits,
      icd10_codes: icd10Codes,
      medication_conflicts: medicationConflicts,
      conflicts,
      processing_status: processingStatus,
      source_documents: sourceDocuments,
      last_updated: new Date().toISOString(),
      profile_confidence_score: Number(profile.profile_confidence_score) || 0,
    };

    // Update profile in DB (ignore errors for missing columns)
    try {
      await pool.query(
        `UPDATE patient_profiles 
         SET extracted_data = COALESCE(extracted_data, '{}'::jsonb)
         WHERE user_id = $1`,
        [patientId]
      );
    } catch (updateErr) {
      logger.warn('Profile update failed (non-critical):', updateErr);
    }

    // Cache the profile
    if (redisClient.isAvailable) {
      try {
        const client = redisClient.getClient();
        if (client) {
          await client.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(unifiedProfile));
        }
      } catch (err) {
        logger.warn('Redis cache write failed');
      }
    }

    logger.info(`Unified profile generated for patient ${patientId}`);
    return unifiedProfile;
  },

  buildDemographics(profile: Record<string, unknown>, extractedData: Record<string, unknown>): ProfileDemographics {
    return {
      first_name: String(profile.first_name || extractedData.first_name || ''),
      last_name: String(profile.last_name || extractedData.last_name || ''),
      mrn: String(profile.mrn || ''),
      date_of_birth: String(profile.date_of_birth || extractedData.date_of_birth || ''),
      gender: String(profile.gender || extractedData.gender || ''),
      address: profile.address ? String(profile.address) : undefined,
      phone: profile.phone ? String(profile.phone) : undefined,
      email: profile.email ? String(profile.email) : undefined,
    };
  },

  aggregateMedications(documents: Record<string, unknown>[], extractedData: Record<string, unknown>): ProfileMedication[] {
    const medications: ProfileMedication[] = [];
    const seen = new Set<string>();

    // From extracted data on profile
    const profileMeds = Array.isArray(extractedData.prescribed_medications) ? extractedData.prescribed_medications : [];
    for (const med of profileMeds) {
      const m = med as Record<string, unknown>;
      const key = `${String(m.name || '').toLowerCase()}-${String(m.dosage || '')}`;
      if (!seen.has(key)) {
        seen.add(key);
        medications.push({
          name: String(m.name || ''),
          dosage: String(m.dosage || ''),
          frequency: String(m.frequency || ''),
          prescriber: m.prescriber ? String(m.prescriber) : undefined,
          start_date: m.start_date ? String(m.start_date) : undefined,
          status: 'Active',
          confidence: m.confidence ? Number(m.confidence) : undefined,
        });
      }
    }

    // From individual documents
    for (const doc of documents) {
      const docExtracted = doc.extracted_data as Record<string, unknown> | null;
      if (!docExtracted) continue;
      const docMeds = Array.isArray(docExtracted.prescribed_medications) ? docExtracted.prescribed_medications : [];
      for (const med of docMeds) {
        const m = med as Record<string, unknown>;
        const key = `${String(m.name || '').toLowerCase()}-${String(m.dosage || '')}`;
        if (!seen.has(key)) {
          seen.add(key);
          medications.push({
            name: String(m.name || ''),
            dosage: String(m.dosage || ''),
            frequency: String(m.frequency || ''),
            status: 'Active',
            source_document_id: String(doc.document_id),
            confidence: m.confidence ? Number(m.confidence) : undefined,
          });
        }
      }
    }

    return medications;
  },

  aggregateAllergies(documents: Record<string, unknown>[], extractedData: Record<string, unknown>): ProfileAllergy[] {
    const allergies: ProfileAllergy[] = [];
    const seen = new Set<string>();

    const profileAllergies = Array.isArray(extractedData.allergies) ? extractedData.allergies : [];
    for (const allergy of profileAllergies) {
      const a = allergy as Record<string, unknown>;
      const key = String(a.allergen || a.name || '').toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        allergies.push({
          allergen: String(a.allergen || a.name || ''),
          reaction: String(a.reaction || ''),
          severity: (String(a.severity || 'Moderate') as ProfileAllergy['severity']),
          confidence: a.confidence ? Number(a.confidence) : undefined,
        });
      }
    }

    for (const doc of documents) {
      const docExtracted = doc.extracted_data as Record<string, unknown> | null;
      if (!docExtracted) continue;
      const docAllergies = Array.isArray(docExtracted.allergies) ? docExtracted.allergies : [];
      for (const allergy of docAllergies) {
        const a = allergy as Record<string, unknown>;
        const key = String(a.allergen || a.name || '').toLowerCase();
        if (key && !seen.has(key)) {
          seen.add(key);
          allergies.push({
            allergen: String(a.allergen || a.name || ''),
            reaction: String(a.reaction || ''),
            severity: (String(a.severity || 'Moderate') as ProfileAllergy['severity']),
            source_document_id: String(doc.document_id),
            confidence: a.confidence ? Number(a.confidence) : undefined,
          });
        }
      }
    }

    return allergies;
  },

  aggregateLabResults(documents: Record<string, unknown>[], extractedData: Record<string, unknown>): ProfileLabResult[] {
    const results: ProfileLabResult[] = [];

    const profileLabs = Array.isArray(extractedData.lab_test_results) ? extractedData.lab_test_results : [];
    for (const lab of profileLabs) {
      const l = lab as Record<string, unknown>;
      results.push({
        date: String(l.date || ''),
        test_name: String(l.test_name || l.name || ''),
        value: String(l.value || ''),
        reference_range: String(l.reference_range || ''),
        abnormal_flag: l.abnormal_flag ? String(l.abnormal_flag) as ProfileLabResult['abnormal_flag'] : undefined,
        confidence: l.confidence ? Number(l.confidence) : undefined,
      });
    }

    for (const doc of documents) {
      const docExtracted = doc.extracted_data as Record<string, unknown> | null;
      if (!docExtracted) continue;
      const docLabs = Array.isArray(docExtracted.lab_test_results) ? docExtracted.lab_test_results : [];
      for (const lab of docLabs) {
        const l = lab as Record<string, unknown>;
        results.push({
          date: String(l.date || ''),
          test_name: String(l.test_name || l.name || ''),
          value: String(l.value || ''),
          reference_range: String(l.reference_range || ''),
          abnormal_flag: l.abnormal_flag ? String(l.abnormal_flag) as ProfileLabResult['abnormal_flag'] : undefined,
          source_document_id: String(doc.document_id),
          confidence: l.confidence ? Number(l.confidence) : undefined,
        });
      }
    }

    return results;
  },

  aggregateConditions(documents: Record<string, unknown>[], extractedData: Record<string, unknown>): MedicalHistoryData['conditions'] {
    const conditions: MedicalHistoryData['conditions'] = [];
    const seen = new Set<string>();

    const profileConditions = Array.isArray(extractedData.diagnosed_conditions) ? extractedData.diagnosed_conditions : [];
    for (const cond of profileConditions) {
      const c = cond as Record<string, unknown>;
      const key = String(c.name || c.condition || '').toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        conditions.push({
          name: String(c.name || c.condition || ''),
          icd10_code: c.icd10_code ? String(c.icd10_code) : undefined,
          diagnosed_date: c.diagnosed_date ? String(c.diagnosed_date) : undefined,
          status: (String(c.status || 'Active') as 'Active' | 'Resolved' | 'Chronic'),
          confidence: c.confidence ? Number(c.confidence) : undefined,
        });
      }
    }

    for (const doc of documents) {
      const docExtracted = doc.extracted_data as Record<string, unknown> | null;
      if (!docExtracted) continue;
      const docConditions = Array.isArray(docExtracted.diagnosed_conditions) ? docExtracted.diagnosed_conditions : [];
      for (const cond of docConditions) {
        const c = cond as Record<string, unknown>;
        const key = String(c.name || c.condition || '').toLowerCase();
        if (key && !seen.has(key)) {
          seen.add(key);
          conditions.push({
            name: String(c.name || c.condition || ''),
            icd10_code: c.icd10_code ? String(c.icd10_code) : undefined,
            status: (String(c.status || 'Active') as 'Active' | 'Resolved' | 'Chronic'),
            source_document_id: String(doc.document_id),
            confidence: c.confidence ? Number(c.confidence) : undefined,
          });
        }
      }
    }

    return conditions;
  },

  buildProcessingStatus(documents: Record<string, unknown>[]): ProcessingStatus {
    const total = documents.length;
    const processed = documents.filter(d => d.extraction_status === 'processed').length;
    const pending = total - processed;

    return {
      total_documents: total,
      processed_documents: processed,
      pending_documents: pending,
      estimated_completion_time: pending > 0 ? `${pending * 30}s` : undefined,
    };
  },

  async invalidateCache(patientId: string): Promise<void> {
    if (redisClient.isAvailable) {
      try {
        const client = redisClient.getClient();
        if (client) {
          await client.del(`${CACHE_KEY_PREFIX}${patientId}`);
        }
      } catch (err) {
        logger.warn('Redis cache invalidation failed');
      }
    }
  },
};
