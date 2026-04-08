/**
 * Conflict Check Controller
 * @module controllers/conflictCheckController
 * @description Handles medication conflict checking, overriding, and validation
 * @epic EP-006
 * @story US-033
 * @task task_003_be_conflict_api
 */

import { Response } from 'express';
import { pool } from '../config/database';
import { medicationConflictDetectionService } from '../services/medicationConflictDetectionService';
import { drugDatabaseService } from '../services/drugDatabaseService';
import { ApiError, AuthenticatedRequest } from '../types';
import logger from '../utils/logger';

export const checkConflicts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { medications, allergies, conditions } = req.body;

    if (!id) {
      throw new ApiError(400, 'Patient ID is required');
    }

    if (!Array.isArray(medications) || medications.length === 0) {
      throw new ApiError(400, 'Medications array is required and must not be empty');
    }

    // Verify patient exists
    const patientResult = await pool.query(
      'SELECT id, user_id, extracted_data FROM patient_profiles WHERE user_id = $1',
      [id]
    );

    if (patientResult.rows.length === 0) {
      throw new ApiError(404, 'Patient not found');
    }

    const patient = patientResult.rows[0];
    const extractedData = patient.extracted_data || {};

    // Use provided allergies/conditions or fall back to patient profile data
    const patientAllergies = allergies || (Array.isArray(extractedData.allergies)
      ? extractedData.allergies.map((a: Record<string, unknown>) => ({
          allergen_name: String(a.allergen || a.name || ''),
          severity: String(a.severity || 'Unknown'),
          reaction_type: a.reaction ? String(a.reaction) : undefined,
        }))
      : []);

    const patientConditions = conditions || (Array.isArray(extractedData.diagnosed_conditions)
      ? extractedData.diagnosed_conditions.map((c: Record<string, unknown>) => ({
          condition_name: String(c.name || c.condition || ''),
          icd10_code: c.icd10_code ? String(c.icd10_code) : undefined,
        }))
      : []);

    const result = await medicationConflictDetectionService.checkConflicts(
      medications, patientAllergies, patientConditions, String(id)
    );

    const criticalCount = result.conflicts.filter(c => c.severity_level >= 4).length;
    const warningCount = result.conflicts.filter(c => c.severity_level >= 2 && c.severity_level < 4).length;

    const response = {
      ...result,
      action_required: criticalCount > 0,
      critical_conflicts_count: criticalCount,
      warning_conflicts_count: warningCount,
    };

    if (criticalCount > 0) {
      res.status(409).json({
        success: true,
        data: response,
        message: 'Critical medication conflicts detected - override required',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.json({ success: true, data: response, timestamp: new Date().toISOString() });
    }
  } catch (error) {
    logger.error('Failed to check conflicts:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, error: error.message, timestamp: new Date().toISOString() });
    } else {
      res.status(500).json({ success: false, error: 'Failed to check medication conflicts', timestamp: new Date().toISOString() });
    }
  }
};

export const getActiveConflicts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new ApiError(400, 'Patient ID is required');
    }

    const result = await pool.query(
      `SELECT * FROM medication_conflicts 
       WHERE patient_id = $1 AND conflict_status = 'Active'
       ORDER BY severity_level DESC, detected_at DESC`,
      [id]
    );

    const conflicts = result.rows.map((row: Record<string, unknown>) => ({
      conflict_id: String(row.conflict_id),
      patient_id: String(row.patient_id),
      conflict_type: String(row.conflict_type),
      medications_involved: row.medications_involved,
      severity_level: Number(row.severity_level),
      interaction_mechanism: String(row.interaction_mechanism),
      clinical_guidance: String(row.clinical_guidance),
      conflict_status: String(row.conflict_status),
      detected_at: String(row.detected_at),
      can_override: Number(row.severity_level) >= 4,
    }));

    res.json({ success: true, data: conflicts, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Failed to get active conflicts:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, error: error.message, timestamp: new Date().toISOString() });
    } else {
      res.status(500).json({ success: false, error: 'Failed to get active conflicts', timestamp: new Date().toISOString() });
    }
  }
};

export const overrideConflict = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id, conflictId } = req.params;
    const { override_reason, acknowledged } = req.body;

    if (!acknowledged) {
      throw new ApiError(400, 'Must acknowledge conflict to override');
    }

    if (!override_reason || typeof override_reason !== 'string' || override_reason.length < 10) {
      throw new ApiError(400, 'Override reason must be at least 10 characters');
    }

    // Verify conflict exists
    const conflictResult = await pool.query(
      'SELECT * FROM medication_conflicts WHERE conflict_id = $1 AND patient_id = $2',
      [conflictId, id]
    );

    if (conflictResult.rows.length === 0) {
      throw new ApiError(404, 'Conflict not found');
    }

    const staffId = req.user?.id || '';

    await pool.query(
      `UPDATE medication_conflicts 
       SET conflict_status = 'Overridden', override_reason = $1, 
           override_by_staff_id = $2, override_at = NOW()
       WHERE conflict_id = $3`,
      [override_reason, staffId, conflictId]
    );

    // Log to audit
    await pool.query(
      `INSERT INTO conflict_check_audit 
       (patient_id, medications_checked, conflicts_detected_count, checked_by, staff_id)
       VALUES ($1, $2, 0, 'Staff Manual', $3)`,
      [id, JSON.stringify({ action: 'override', conflict_id: conflictId }), staffId]
    );

    // Check if any active conflicts remain
    const remainingResult = await pool.query(
      `SELECT COUNT(*) FROM medication_conflicts WHERE patient_id = $1 AND conflict_status = 'Active'`,
      [id]
    );
    const remaining = parseInt(String(remainingResult.rows[0].count), 10);
    if (remaining === 0) {
      await pool.query(
        'UPDATE patient_profiles SET has_active_conflicts = false WHERE user_id = $1',
        [id]
      );
    }

    res.json({
      success: true,
      data: { message: 'Conflict overridden successfully', conflict_id: conflictId },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to override conflict:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, error: error.message, timestamp: new Date().toISOString() });
    } else {
      res.status(500).json({ success: false, error: 'Failed to override conflict', timestamp: new Date().toISOString() });
    }
  }
};

export const getConflictHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM conflict_check_audit WHERE patient_id = $1',
      [id]
    );

    const result = await pool.query(
      `SELECT * FROM conflict_check_audit 
       WHERE patient_id = $1 
       ORDER BY check_performed_at DESC 
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    res.json({
      success: true,
      data: {
        entries: result.rows,
        total: parseInt(String(countResult.rows[0].count), 10),
        limit,
        offset,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get conflict history:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, error: error.message, timestamp: new Date().toISOString() });
    } else {
      res.status(500).json({ success: false, error: 'Failed to get conflict history', timestamp: new Date().toISOString() });
    }
  }
};

export const validateMedication = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { medication_name } = req.body;

    if (!medication_name || typeof medication_name !== 'string') {
      throw new ApiError(400, 'Medication name is required');
    }

    const normalized = drugDatabaseService.normalizeMedicationName(medication_name);

    if (normalized) {
      const drugClass = drugDatabaseService.getDrugClass(normalized);
      res.json({
        success: true,
        data: { valid: true, normalized_name: normalized, drug_class: drugClass },
        timestamp: new Date().toISOString(),
      });
    } else {
      const suggestions = drugDatabaseService.searchDrugByPartial(medication_name);
      res.json({
        success: true,
        data: { valid: false, suggestions },
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error('Failed to validate medication:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, error: error.message, timestamp: new Date().toISOString() });
    } else {
      res.status(500).json({ success: false, error: 'Failed to validate medication', timestamp: new Date().toISOString() });
    }
  }
};
