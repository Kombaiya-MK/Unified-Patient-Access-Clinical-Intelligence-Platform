/**
 * Medication Conflict Detection Service (AI-Powered)
 * @module services/medicationConflictDetectionService
 * @description AI-powered medication conflict analysis using OpenAI GPT-4
 * @epic EP-006
 * @story US-033
 * @task task_002_be_ai_conflict_detection
 */

import { pool } from '../config/database';
import logger from '../utils/logger';
import redisClient from '../utils/redisClient';
import { openAICircuitBreaker } from './openai/circuitBreakerService';
import { gpt4ConflictsBreaker } from '../config/circuit-breaker.config';
import { drugDatabaseService } from './drugDatabaseService';
import { buildConflictPrompt } from '../prompts/medication-conflict-prompt';
import { medicationSafetyConfig } from '../config/medicationSafety.config';
import { resolveToGeneric } from '../utils/drugNameNormalizer';
import type {
  MedicationInput,
  AllergyInput,
  ConditionInput,
  ConflictResult,
  ConflictCheckResponse,
  UnrecognizedMedication,
} from '../types/conflictDetection.types';
import crypto from 'crypto';

const CACHE_KEY_PREFIX = 'conflict:check:';

export const medicationConflictDetectionService = {
  async checkConflicts(
    medications: MedicationInput[],
    allergies: AllergyInput[],
    conditions: ConditionInput[],
    patientId: string
  ): Promise<ConflictCheckResponse> {
    const unrecognizedMedications: UnrecognizedMedication[] = [];

    // Normalize medication names
    const normalizedMeds = medications.map(med => {
      const normalized = drugDatabaseService.normalizeMedicationName(med.name);
      if (!normalized) {
        const suggestions = drugDatabaseService.searchDrugByPartial(med.name);
        unrecognizedMedications.push({ input_name: med.name, suggestions });
      }
      return {
        ...med,
        generic_name: normalized || resolveToGeneric(med.name),
      };
    });

    // Check cache
    const cacheKey = this.buildCacheKey(normalizedMeds, allergies, conditions);
    if (redisClient.isAvailable) {
      try {
        const client = redisClient.getClient();
        if (client) {
          const cached = await client.get(cacheKey);
          if (cached) {
            logger.info(`Conflict check cache hit for patient ${patientId}`);
            const cachedResult = JSON.parse(cached) as ConflictCheckResponse;
            cachedResult.unrecognized_medications = unrecognizedMedications.length > 0 ? unrecognizedMedications : undefined;
            return cachedResult;
          }
        }
      } catch (err) {
        logger.warn('Redis cache read failed for conflict check');
      }
    }

    let conflicts: ConflictResult[] = [];

    // Try AI-powered detection first via per-service circuit breaker
    if (openAICircuitBreaker.isAllowed()) {
      try {
        const aiConflicts = await gpt4ConflictsBreaker.fire(async () =>
          this.runAIConflictDetection(normalizedMeds, allergies, conditions),
        ) as ConflictResult[];
        conflicts = aiConflicts;
        openAICircuitBreaker.recordSuccess();
      } catch (error) {
        openAICircuitBreaker.recordFailure();
        logger.error('AI conflict detection failed, falling back to rule-based:', error);
        conflicts = this.runRuleBasedDetection(normalizedMeds, allergies, conditions);
      }
    } else {
      logger.warn('Circuit breaker open, using rule-based conflict detection');
      conflicts = this.runRuleBasedDetection(normalizedMeds, allergies, conditions);
    }

    // Determine overall safety status
    const maxSeverity = conflicts.length > 0
      ? Math.max(...conflicts.map(c => c.severity_level))
      : 0;
    const overallStatus: ConflictCheckResponse['overall_safety_status'] =
      maxSeverity >= medicationSafetyConfig.CRITICAL_SEVERITY_THRESHOLD ? 'Critical'
      : maxSeverity >= 2 ? 'Warning'
      : 'Safe';

    const response: ConflictCheckResponse = {
      conflicts,
      overall_safety_status: overallStatus,
      no_allergy_data_warning: allergies.length === 0,
      patient_id: patientId,
      checked_at: new Date().toISOString(),
      unrecognized_medications: unrecognizedMedications.length > 0 ? unrecognizedMedications : undefined,
    };

    // Log to audit
    await this.logAudit(patientId, normalizedMeds, allergies, conditions, response);

    // Store conflicts in DB if detected
    if (conflicts.length > 0) {
      await this.storeConflicts(patientId, conflicts);
    }

    // Cache results
    if (redisClient.isAvailable) {
      try {
        const client = redisClient.getClient();
        if (client) {
          await client.setex(
            cacheKey,
            medicationSafetyConfig.CACHE_TTL_HOURS * 3600,
            JSON.stringify(response)
          );
        }
      } catch (err) {
        logger.warn('Redis cache write failed for conflict check');
      }
    }

    return response;
  },

  async runAIConflictDetection(
    medications: MedicationInput[],
    allergies: AllergyInput[],
    conditions: ConditionInput[]
  ): Promise<ConflictResult[]> {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = buildConflictPrompt(medications, allergies, conditions);

    const response = await openai.chat.completions.create({
      model: medicationSafetyConfig.AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: medicationSafetyConfig.AI_TEMPERATURE,
      max_tokens: medicationSafetyConfig.AI_MAX_TOKENS,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty AI response');

    const parsed = JSON.parse(content);

    if (parsed.no_conflicts_detected || !Array.isArray(parsed.conflicts)) {
      return [];
    }

    return parsed.conflicts.map((c: Record<string, unknown>) => ({
      conflict_type: String(c.conflict_type || 'Drug-Drug'),
      medications_involved: Array.isArray(c.medications_involved) ? c.medications_involved.map(String) : [],
      severity_level: Math.min(5, Math.max(1, Number(c.severity_level) || 1)),
      interaction_mechanism: String(c.interaction_mechanism || ''),
      clinical_guidance: String(c.clinical_guidance || ''),
      dosage_dependent: Boolean(c.dosage_dependent),
      dosage_threshold: c.dosage_threshold ? String(c.dosage_threshold) : undefined,
      action_required: Number(c.severity_level) >= medicationSafetyConfig.REQUIRES_OVERRIDE_THRESHOLD,
    }));
  },

  runRuleBasedDetection(
    medications: MedicationInput[],
    allergies: AllergyInput[],
    conditions: ConditionInput[]
  ): ConflictResult[] {
    const conflicts: ConflictResult[] = [];

    // Check drug-drug interactions
    for (let i = 0; i < medications.length; i++) {
      for (let j = i + 1; j < medications.length; j++) {
        const med1 = medications[i];
        const med2 = medications[j];
        const hasInteraction = drugDatabaseService.getKnownInteractions(med1.name, med2.name);

        if (hasInteraction) {
          const med1Info = drugDatabaseService.getDrugInfo(med1.name);
          const med2Info = drugDatabaseService.getDrugInfo(med2.name);

          conflicts.push({
            conflict_type: 'Drug-Drug',
            medications_involved: [med1.generic_name || med1.name, med2.generic_name || med2.name],
            severity_level: 3,
            interaction_mechanism: `Known interaction between ${med1Info?.drug_class || med1.name} and ${med2Info?.drug_class || med2.name}`,
            clinical_guidance: 'Monitor patient closely. Consider alternative medication or dosage adjustment.',
            dosage_dependent: false,
            action_required: false,
          });
        }
      }
    }

    // Check drug-allergy conflicts
    for (const med of medications) {
      for (const allergy of allergies) {
        const hasCrossSensitivity = drugDatabaseService.checkCrossSensitivity(
          med.name,
          allergy.allergen_name
        );

        if (hasCrossSensitivity) {
          conflicts.push({
            conflict_type: 'Drug-Allergy',
            medications_involved: [med.generic_name || med.name],
            severity_level: 4,
            interaction_mechanism: `Potential cross-reactivity with documented allergy to ${allergy.allergen_name}`,
            clinical_guidance: 'Avoid this medication. Consider alternative from a different drug class.',
            dosage_dependent: false,
            action_required: true,
          });
        }
      }
    }

    // Check drug-condition contraindications
    for (const med of medications) {
      for (const condition of conditions) {
        const isContraindicated = drugDatabaseService.checkConditionContraindication(
          med.name,
          condition.condition_name
        );

        if (isContraindicated) {
          conflicts.push({
            conflict_type: 'Drug-Condition',
            medications_involved: [med.generic_name || med.name],
            severity_level: 4,
            interaction_mechanism: `${med.name} is contraindicated with ${condition.condition_name}`,
            clinical_guidance: 'Avoid this medication with the documented condition. Seek alternative therapy.',
            dosage_dependent: false,
            action_required: true,
          });
        }
      }
    }

    return conflicts;
  },

  async logAudit(
    patientId: string,
    medications: MedicationInput[],
    allergies: AllergyInput[],
    conditions: ConditionInput[],
    response: ConflictCheckResponse
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO conflict_check_audit 
         (patient_id, medications_checked, allergies_checked, conditions_checked, 
          conflicts_detected_count, highest_severity, no_allergy_warning, checked_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          patientId,
          JSON.stringify(medications),
          JSON.stringify(allergies),
          JSON.stringify(conditions),
          response.conflicts.length,
          response.conflicts.length > 0 ? Math.max(...response.conflicts.map(c => c.severity_level)) : null,
          response.no_allergy_data_warning,
          'System',
        ]
      );
    } catch (error) {
      logger.error('Failed to log conflict check audit:', error);
    }
  },

  async storeConflicts(patientId: string, conflicts: ConflictResult[]): Promise<void> {
    try {
      for (const conflict of conflicts) {
        await pool.query(
          `INSERT INTO medication_conflicts 
           (patient_id, conflict_type, medications_involved, severity_level, 
            interaction_mechanism, clinical_guidance, dosage_threshold)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            patientId,
            conflict.conflict_type,
            JSON.stringify(conflict.medications_involved.map(name => ({ medication_name: name }))),
            conflict.severity_level,
            conflict.interaction_mechanism,
            conflict.clinical_guidance,
            conflict.dosage_threshold || null,
          ]
        );
      }

      // Update patient profile
      const hasCritical = conflicts.some(c => c.severity_level >= medicationSafetyConfig.CRITICAL_SEVERITY_THRESHOLD);
      if (hasCritical) {
        await pool.query(
          `UPDATE patient_profiles SET has_active_conflicts = true, last_conflict_check_at = NOW() WHERE profile_id = $1`,
          [patientId]
        );
      }
    } catch (error) {
      logger.error('Failed to store medication conflicts:', error);
    }
  },

  buildCacheKey(medications: MedicationInput[], allergies: AllergyInput[], conditions: ConditionInput[]): string {
    const data = JSON.stringify({
      medications: medications.map(m => m.generic_name || m.name).sort(),
      allergies: allergies.map(a => a.allergen_name).sort(),
      conditions: conditions.map(c => c.condition_name).sort(),
    });
    const hash = crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
    return `${CACHE_KEY_PREFIX}${hash}`;
  },
};
