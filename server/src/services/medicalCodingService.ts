/**
 * Medical Coding Service (AI-Powered)
 * @module services/medicalCodingService
 * @description AI-powered ICD-10/CPT code generation using OpenAI GPT-4
 * @epic EP-006
 * @story US-032
 * @task task_002_be_ai_medical_coding_service
 */

import { pool } from '../config/database';
import logger from '../utils/logger';
import redisClient from '../utils/redisClient';
import { openAICircuitBreaker } from './openai/circuitBreakerService';
import { gpt4CodingBreaker } from '../config/circuit-breaker.config';
import { getCodingFallbackMessage } from './fallback/coding-fallback.service';
import { buildMedicalCodingPrompt } from '../prompts/medical-coding-prompt';
import { medicalCodingConfig } from '../config/medicalCoding.config';
import { featureFlagService } from './featureFlagService';
import { validateModel } from '../utils/modelValidator';
import { loadPrompt } from '../utils/promptVersionManager';
import type { FlagEvaluationContext } from '../config/featureFlags';
import type {
  GenerateCodesRequest,
  GenerateCodesResponse,
  MedicalCodeSuggestion,
  CodeReviewAction,
  BulkApproveRequest,
  CodeSearchResult,
  AICodeGenerationResult,
  CodingAuditEntry,
} from '../types/medicalCoding.types';
import crypto from 'crypto';

export interface CodingFlagResult {
  aiEnabled: boolean;
  message?: string;
  model?: string;
  promptVersion?: string;
  data?: GenerateCodesResponse;
}

/**
 * Flag-aware code generation entry point.
 * If ai_coding_enabled is false, returns an "AI unavailable" response.
 * Otherwise resolves model and prompt version from flags.
 */
export async function generateCodesWithFlags(
  userId: number,
  role: string,
  request: GenerateCodesRequest,
): Promise<CodingFlagResult> {
  const flagCtx: FlagEvaluationContext = { userId, role };

  const enabledResult = await featureFlagService.evaluateFlag('ai_coding_enabled', flagCtx);

  if (!enabledResult.value) {
    logger.info('AI coding disabled by feature flag', { userId, flag: 'ai_coding_enabled' });
    return { aiEnabled: false, message: 'AI coding unavailable - use manual coding' };
  }

  const promptVersionResult = await featureFlagService.evaluateFlag('medical_coding_prompt_version', flagCtx);
  const promptVersion = (promptVersionResult.value as string) || 'v1';

  const modelResult = await featureFlagService.evaluateFlag('gpt_intake_model', flagCtx);
  const model = validateModel(modelResult.value as string, 'coding');

  logger.info('AI coding processing with flags', { userId, model, promptVersion });

  // Try to load versioned prompt (falls back to v1 if missing)
  try {
    await loadPrompt('medical-coding', promptVersion);
  } catch {
    logger.warn('Could not load versioned prompt, using default builder', { promptVersion });
  }

  const data = await medicalCodingService.generateCodes(request);
  return { aiEnabled: true, model, promptVersion, data };
}

const CACHE_KEY_PREFIX = 'coding:generated:';

// Common ICD-10 codes for search
const ICD10_REFERENCE: CodeSearchResult[] = [
  { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified', code_type: 'ICD-10', category: 'Respiratory' },
  { code: 'J20.9', description: 'Acute bronchitis, unspecified', code_type: 'ICD-10', category: 'Respiratory' },
  { code: 'J45.909', description: 'Unspecified asthma, uncomplicated', code_type: 'ICD-10', category: 'Respiratory' },
  { code: 'I10', description: 'Essential (primary) hypertension', code_type: 'ICD-10', category: 'Cardiovascular' },
  { code: 'I25.10', description: 'Atherosclerotic heart disease of native coronary artery', code_type: 'ICD-10', category: 'Cardiovascular' },
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', code_type: 'ICD-10', category: 'Endocrine' },
  { code: 'E11.65', description: 'Type 2 diabetes mellitus with hyperglycemia', code_type: 'ICD-10', category: 'Endocrine' },
  { code: 'E78.5', description: 'Hyperlipidemia, unspecified', code_type: 'ICD-10', category: 'Endocrine' },
  { code: 'M54.5', description: 'Low back pain', code_type: 'ICD-10', category: 'Musculoskeletal' },
  { code: 'M79.3', description: 'Panniculitis, unspecified', code_type: 'ICD-10', category: 'Musculoskeletal' },
  { code: 'R10.9', description: 'Unspecified abdominal pain', code_type: 'ICD-10', category: 'Symptoms' },
  { code: 'R05.9', description: 'Cough, unspecified', code_type: 'ICD-10', category: 'Symptoms' },
  { code: 'R51.9', description: 'Headache, unspecified', code_type: 'ICD-10', category: 'Symptoms' },
  { code: 'N39.0', description: 'Urinary tract infection, site not specified', code_type: 'ICD-10', category: 'Genitourinary' },
  { code: 'K21.0', description: 'Gastro-esophageal reflux disease with esophagitis', code_type: 'ICD-10', category: 'Digestive' },
  { code: 'F41.1', description: 'Generalized anxiety disorder', code_type: 'ICD-10', category: 'Mental Health' },
  { code: 'F32.9', description: 'Major depressive disorder, single episode, unspecified', code_type: 'ICD-10', category: 'Mental Health' },
  { code: 'Z00.00', description: 'Encounter for general adult medical examination', code_type: 'ICD-10', category: 'Preventive' },
];

const CPT_REFERENCE: CodeSearchResult[] = [
  { code: '99213', description: 'Office visit, established patient, low complexity', code_type: 'CPT', category: 'E/M' },
  { code: '99214', description: 'Office visit, established patient, moderate complexity', code_type: 'CPT', category: 'E/M' },
  { code: '99215', description: 'Office visit, established patient, high complexity', code_type: 'CPT', category: 'E/M' },
  { code: '99203', description: 'Office visit, new patient, low complexity', code_type: 'CPT', category: 'E/M' },
  { code: '99204', description: 'Office visit, new patient, moderate complexity', code_type: 'CPT', category: 'E/M' },
  { code: '99395', description: 'Preventive visit, established, 18-39 years', code_type: 'CPT', category: 'Preventive' },
  { code: '99396', description: 'Preventive visit, established, 40-64 years', code_type: 'CPT', category: 'Preventive' },
  { code: '36415', description: 'Collection of venous blood by venipuncture', code_type: 'CPT', category: 'Lab' },
  { code: '80053', description: 'Comprehensive metabolic panel', code_type: 'CPT', category: 'Lab' },
  { code: '85025', description: 'Complete blood count with differential', code_type: 'CPT', category: 'Lab' },
  { code: '71046', description: 'Chest X-ray, 2 views', code_type: 'CPT', category: 'Radiology' },
  { code: '93000', description: 'Electrocardiogram, routine, 12 leads', code_type: 'CPT', category: 'Cardiology' },
];

export const medicalCodingService = {
  async generateCodes(request: GenerateCodesRequest): Promise<GenerateCodesResponse> {
    const { appointment_id, patient_id, clinical_notes, chief_complaint, diagnoses, procedures } = request;

    // Check cache
    const cacheKey = `${CACHE_KEY_PREFIX}${crypto.createHash('sha256').update(clinical_notes).digest('hex').substring(0, 16)}`;
    if (redisClient.isAvailable) {
      try {
        const client = redisClient.getClient();
        if (client) {
          const cached = await client.get(cacheKey);
          if (cached) {
            logger.info(`Medical coding cache hit for appointment ${appointment_id}`);
            return JSON.parse(cached);
          }
        }
      } catch (err) {
        logger.warn('Redis cache read failed for medical coding');
      }
    }

    let aiResult: AICodeGenerationResult | null = null;

    // Try AI generation via per-service circuit breaker
    if (openAICircuitBreaker.isAllowed()) {
      try {
        aiResult = await gpt4CodingBreaker.fire(async () =>
          this.runAICodingGeneration(clinical_notes, chief_complaint, diagnoses, procedures),
        ) as AICodeGenerationResult;
        openAICircuitBreaker.recordSuccess();
      } catch (error) {
        openAICircuitBreaker.recordFailure();
        logger.error('AI coding generation failed:', error);
        const fb = getCodingFallbackMessage();
        logger.warn(`Coding fallback: ${fb.message}`);
      }
    } else {
      const fb = getCodingFallbackMessage();
      logger.warn(`Coding circuit breaker open: ${fb.message}`);
    }

    const suggestions: MedicalCodeSuggestion[] = [];
    const now = new Date().toISOString();

    if (aiResult) {
      // Process ICD-10 codes
      for (const code of aiResult.icd10_codes) {
        const suggestion: MedicalCodeSuggestion = {
          suggestion_id: '',
          appointment_id,
          patient_id,
          code_type: 'ICD-10',
          code: code.code,
          description: code.description,
          confidence_score: code.confidence,
          coding_status: 'ai_suggested',
          suggested_by: 'ai',
          source_text: code.source_text,
          ai_reasoning: code.reasoning,
          created_at: now,
          updated_at: now,
        };

        // Insert into DB
        const result = await pool.query(
          `INSERT INTO medical_coding_suggestions 
           (appointment_id, patient_id, code_type, code, description, confidence_score, 
            coding_status, suggested_by, source_text, ai_reasoning)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING suggestion_id`,
          [appointment_id, patient_id, 'ICD-10', code.code, code.description,
           code.confidence, 'ai_suggested', 'ai', code.source_text, code.reasoning]
        );

        suggestion.suggestion_id = String(result.rows[0].suggestion_id);
        suggestions.push(suggestion);

        // Log audit
        await this.logAudit(suggestion.suggestion_id, appointment_id, patient_id, 'generated', 'ICD-10', code.code);
      }

      // Process CPT codes
      for (const code of aiResult.cpt_codes) {
        const suggestion: MedicalCodeSuggestion = {
          suggestion_id: '',
          appointment_id,
          patient_id,
          code_type: 'CPT',
          code: code.code,
          description: code.description,
          confidence_score: code.confidence,
          coding_status: 'ai_suggested',
          suggested_by: 'ai',
          source_text: code.source_text,
          ai_reasoning: code.reasoning,
          created_at: now,
          updated_at: now,
        };

        const result = await pool.query(
          `INSERT INTO medical_coding_suggestions 
           (appointment_id, patient_id, code_type, code, description, confidence_score, 
            coding_status, suggested_by, source_text, ai_reasoning)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING suggestion_id`,
          [appointment_id, patient_id, 'CPT', code.code, code.description,
           code.confidence, 'ai_suggested', 'ai', code.source_text, code.reasoning]
        );

        suggestion.suggestion_id = String(result.rows[0].suggestion_id);
        suggestions.push(suggestion);

        await this.logAudit(suggestion.suggestion_id, appointment_id, patient_id, 'generated', 'CPT', code.code);
      }

      // Update appointment coding status
      await pool.query(
        `UPDATE appointments SET coding_status = 'ai_generated', 
         icd10_codes = $1, cpt_codes = $2 WHERE appointment_id = $3`,
        [
          JSON.stringify(aiResult.icd10_codes.map(c => ({ code: c.code, description: c.description }))),
          JSON.stringify(aiResult.cpt_codes.map(c => ({ code: c.code, description: c.description }))),
          appointment_id,
        ]
      );
    }

    const response: GenerateCodesResponse = {
      suggestions,
      appointment_id,
      generated_at: now,
      model_version: medicalCodingConfig.AI_MODEL,
    };

    // Cache
    if (redisClient.isAvailable) {
      try {
        const client = redisClient.getClient();
        if (client) {
          await client.setex(cacheKey, medicalCodingConfig.CACHE_TTL_HOURS * 3600, JSON.stringify(response));
        }
      } catch (err) {
        logger.warn('Redis cache write failed for medical coding');
      }
    }

    return response;
  },

  async runAICodingGeneration(
    clinicalNotes: string,
    chiefComplaint?: string,
    diagnoses?: string[],
    procedures?: string[]
  ): Promise<AICodeGenerationResult> {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = buildMedicalCodingPrompt(clinicalNotes, chiefComplaint, diagnoses, procedures);

    const response = await openai.chat.completions.create({
      model: medicalCodingConfig.AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: medicalCodingConfig.AI_TEMPERATURE,
      max_tokens: medicalCodingConfig.AI_MAX_TOKENS,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty AI response for medical coding');

    const parsed = JSON.parse(content);

    return {
      icd10_codes: Array.isArray(parsed.icd10_codes) ? parsed.icd10_codes : [],
      cpt_codes: Array.isArray(parsed.cpt_codes) ? parsed.cpt_codes : [],
      reasoning: String(parsed.reasoning || ''),
      confidence_overall: Number(parsed.confidence_overall) || 0,
    };
  },

  async reviewCode(action: CodeReviewAction): Promise<MedicalCodeSuggestion> {
    const { suggestion_id, action: reviewAction, modified_code, modified_description, modification_reason, staff_id } = action;

    let newStatus: string;
    let updateFields: string;
    const params: (string | null)[] = [];

    switch (reviewAction) {
      case 'approve':
        newStatus = 'approved';
        updateFields = `coding_status = $1, reviewed_by_staff_id = $2, reviewed_at = NOW(), updated_at = NOW()`;
        params.push(newStatus, staff_id);
        break;
      case 'reject':
        newStatus = 'rejected';
        updateFields = `coding_status = $1, reviewed_by_staff_id = $2, reviewed_at = NOW(), updated_at = NOW()`;
        params.push(newStatus, staff_id);
        break;
      case 'modify':
        newStatus = 'modified';
        updateFields = `coding_status = $1, reviewed_by_staff_id = $2, reviewed_at = NOW(), 
                        original_code = code, code = $3, description = $4, modification_reason = $5, updated_at = NOW()`;
        params.push(newStatus, staff_id, modified_code || '', modified_description || '', modification_reason || '');
        break;
      default:
        throw new Error(`Invalid review action: ${reviewAction}`);
    }

    const result = await pool.query(
      `UPDATE medical_coding_suggestions SET ${updateFields} WHERE suggestion_id = $${params.length + 1} RETURNING *`,
      [...params, suggestion_id]
    );

    if (result.rows.length === 0) {
      throw new Error(`Suggestion not found: ${suggestion_id}`);
    }

    const suggestion = result.rows[0];

    // Log audit
    await this.logAudit(
      suggestion_id,
      String(suggestion.appointment_id),
      String(suggestion.patient_id),
      reviewAction === 'approve' ? 'approved' : reviewAction === 'reject' ? 'rejected' : 'modified',
      String(suggestion.code_type),
      String(suggestion.code),
      staff_id,
      modified_code ? { original_code: suggestion.original_code, new_code: modified_code, reason: modification_reason } : undefined
    );

    return this.mapSuggestionRow(suggestion);
  },

  async bulkApprove(request: BulkApproveRequest): Promise<number> {
    const { suggestion_ids, staff_id } = request;

    const result = await pool.query(
      `UPDATE medical_coding_suggestions 
       SET coding_status = 'approved', reviewed_by_staff_id = $1, reviewed_at = NOW(), updated_at = NOW()
       WHERE suggestion_id = ANY($2) AND coding_status = 'ai_suggested'
       RETURNING suggestion_id, appointment_id, patient_id, code_type, code`,
      [staff_id, suggestion_ids]
    );

    // Log audit for each approved suggestion
    for (const row of result.rows) {
      await this.logAudit(
        String(row.suggestion_id),
        String(row.appointment_id),
        String(row.patient_id),
        'bulk_approved',
        String(row.code_type),
        String(row.code),
        staff_id
      );
    }

    return result.rowCount || 0;
  },

  async getSuggestions(appointmentId: string): Promise<MedicalCodeSuggestion[]> {
    const result = await pool.query(
      `SELECT * FROM medical_coding_suggestions 
       WHERE appointment_id = $1 
       ORDER BY code_type, confidence_score DESC`,
      [appointmentId]
    );

    return result.rows.map(this.mapSuggestionRow);
  },

  async searchCodes(query: string, codeType?: string): Promise<CodeSearchResult[]> {
    const normalizedQuery = query.toLowerCase();
    const allCodes = [...ICD10_REFERENCE, ...CPT_REFERENCE];

    return allCodes.filter(code => {
      if (codeType && code.code_type !== codeType) return false;
      return code.code.toLowerCase().includes(normalizedQuery) ||
             code.description.toLowerCase().includes(normalizedQuery);
    }).slice(0, 20);
  },

  async logAudit(
    suggestionId: string,
    appointmentId: string,
    patientId: string,
    action: CodingAuditEntry['action_taken'],
    codeType: string,
    code: string,
    staffId?: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO medical_coding_audit 
         (suggestion_id, appointment_id, patient_id, action_taken, code_type, code, 
          new_status, staff_id, modification_details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [suggestionId, appointmentId, patientId, action, codeType, code,
         action, staffId || null, details ? JSON.stringify(details) : null]
      );
    } catch (error) {
      logger.error('Failed to log coding audit:', error);
    }
  },

  mapSuggestionRow(row: Record<string, unknown>): MedicalCodeSuggestion {
    return {
      suggestion_id: String(row.suggestion_id),
      appointment_id: String(row.appointment_id),
      patient_id: String(row.patient_id),
      code_type: String(row.code_type) as 'ICD-10' | 'CPT',
      code: String(row.code),
      description: String(row.description),
      confidence_score: Number(row.confidence_score),
      coding_status: String(row.coding_status) as MedicalCodeSuggestion['coding_status'],
      suggested_by: String(row.suggested_by) as 'ai' | 'staff' | 'system',
      reviewed_by_staff_id: row.reviewed_by_staff_id ? String(row.reviewed_by_staff_id) : undefined,
      reviewed_at: row.reviewed_at ? String(row.reviewed_at) : undefined,
      original_code: row.original_code ? String(row.original_code) : undefined,
      modification_reason: row.modification_reason ? String(row.modification_reason) : undefined,
      source_text: row.source_text ? String(row.source_text) : undefined,
      ai_reasoning: row.ai_reasoning ? String(row.ai_reasoning) : undefined,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  },
};
