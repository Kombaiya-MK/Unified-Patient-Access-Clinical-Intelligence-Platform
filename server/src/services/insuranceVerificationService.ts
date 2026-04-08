/**
 * Insurance Verification Service
 *
 * Core business logic for insurance eligibility verification.
 * Handles verification, retry logic, and patient flag updates.
 *
 * @module insuranceVerificationService
 * @task US_037 TASK_002
 */

import { pool } from '../config/database';
import { insuranceApiConfig } from '../config/insuranceApiConfig';
import {
  callEligibilityAPI,
  RetryableError,
  NonRetryableError,
} from './insuranceApiClient';
import { logAuditEntry } from '../utils/auditLogger';
import { AuditAction } from '../types/audit.types';
import { ApiError } from '../types';
import logger from '../utils/logger';

export interface VerificationResult {
  id: number;
  patient_id: number;
  appointment_id: number | null;
  verification_date: string;
  status: string;
  copay_amount: number | null;
  deductible_remaining: number | null;
  coverage_start_date: string | null;
  coverage_end_date: string | null;
  authorization_notes: string | null;
  insurance_plan: string | null;
  member_id: string | null;
  last_verified_at: string;
  verification_source: string;
  is_primary_insurance: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Verify insurance eligibility for a patient (optionally tied to an appointment).
 */
export async function verifyEligibility(
  patientId: number,
  appointmentId?: number,
  userId?: number,
): Promise<VerificationResult> {
  // Fetch patient insurance info
  const patientResult = await pool.query(
    `SELECT pp.id AS profile_id, pp.insurance_provider, pp.insurance_policy_number, pp.date_of_birth,
            u.first_name, u.last_name
     FROM patient_profiles pp
     JOIN users u ON pp.user_id = u.id
     WHERE pp.id = $1`,
    [patientId],
  );

  if (patientResult.rows.length === 0) {
    throw new ApiError(404, 'Patient profile not found');
  }

  const patient = patientResult.rows[0];

  // Handle missing insurance info
  if (!patient.insurance_provider || !patient.insurance_policy_number) {
    const verification = await pool.query(
      `INSERT INTO insurance_verifications
         (patient_id, appointment_id, verification_date, status, insurance_plan, member_id,
          last_verified_at, verification_source, is_primary_insurance)
       VALUES ($1, $2, CURRENT_DATE, 'incomplete', $3, $4, NOW(), 'system', TRUE)
       RETURNING *`,
      [patientId, appointmentId ?? null, patient.insurance_provider, patient.insurance_policy_number],
    );

    await logAuditEntry({
      user_id: userId ?? null,
      action: AuditAction.CREATE,
      table_name: 'insurance_verifications',
      record_id: String(verification.rows[0].id),
      new_values: { status: 'incomplete', reason: 'Missing insurance info' },
    });

    return verification.rows[0];
  }

  try {
    const apiResult = await callEligibilityAPI({
      plan: patient.insurance_provider,
      memberId: patient.insurance_policy_number,
      dob: patient.date_of_birth,
    });

    // Store successful verification
    const verification = await pool.query(
      `INSERT INTO insurance_verifications
         (patient_id, appointment_id, verification_date, status, copay_amount,
          deductible_remaining, coverage_start_date, coverage_end_date,
          authorization_notes, insurance_plan, member_id, last_verified_at,
          verification_source, is_primary_insurance)
       VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11, TRUE)
       RETURNING *`,
      [
        patientId, appointmentId ?? null,
        apiResult.status, apiResult.copay, apiResult.deductible,
        apiResult.coverageStart, apiResult.coverageEnd, apiResult.authNotes,
        patient.insurance_provider, patient.insurance_policy_number,
        insuranceApiConfig.provider,
      ],
    );

    // Record successful attempt
    await pool.query(
      `INSERT INTO insurance_verification_attempts
         (verification_id, attempt_number, api_provider, api_response_payload,
          response_code, status, attempted_at)
       VALUES ($1, 1, $2, $3, '200', 'success', NOW())`,
      [
        verification.rows[0].id,
        insuranceApiConfig.provider,
        JSON.stringify({ status: apiResult.status, copay: apiResult.copay }),
      ],
    );

    await logAuditEntry({
      user_id: userId ?? null,
      action: AuditAction.CREATE,
      table_name: 'insurance_verifications',
      record_id: String(verification.rows[0].id),
      new_values: { status: apiResult.status, verification_source: insuranceApiConfig.provider },
    });

    return verification.rows[0];
  } catch (error) {
    const isRetryable = error instanceof RetryableError;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const responseCode = (error instanceof RetryableError || error instanceof NonRetryableError)
      ? error.responseCode || 'ERR'
      : 'ERR';

    // Store failed verification
    const verification = await pool.query(
      `INSERT INTO insurance_verifications
         (patient_id, appointment_id, verification_date, status, insurance_plan,
          member_id, last_verified_at, verification_source, is_primary_insurance)
       VALUES ($1, $2, CURRENT_DATE, 'failed', $3, $4, NOW(), $5, TRUE)
       RETURNING *`,
      [
        patientId, appointmentId ?? null,
        patient.insurance_provider, patient.insurance_policy_number,
        insuranceApiConfig.provider,
      ],
    );

    // Record failed attempt
    await pool.query(
      `INSERT INTO insurance_verification_attempts
         (verification_id, attempt_number, api_provider, response_code, status,
          error_message, attempted_at, retry_after)
       VALUES ($1, 1, $2, $3, 'failed', $4, NOW(), $5)`,
      [
        verification.rows[0].id,
        insuranceApiConfig.provider,
        responseCode,
        errorMessage,
        isRetryable ? new Date(Date.now() + 60000).toISOString() : null, // 1 min backoff
      ],
    );

    await logAuditEntry({
      user_id: userId ?? null,
      action: AuditAction.CREATE,
      table_name: 'insurance_verifications',
      record_id: String(verification.rows[0].id),
      new_values: { status: 'failed', error: errorMessage },
    });

    logger.error(`Insurance verification failed for patient ${patientId}: ${errorMessage}`);
    return verification.rows[0];
  }
}

/**
 * Retry a failed verification (called by retry queue).
 */
export async function retryVerification(
  verificationId: number,
  attemptNumber: number,
): Promise<VerificationResult> {
  const verificationResult = await pool.query(
    `SELECT iv.*, pp.insurance_provider, pp.insurance_policy_number, pp.date_of_birth
     FROM insurance_verifications iv
     JOIN patient_profiles pp ON iv.patient_id = pp.id
     WHERE iv.id = $1`,
    [verificationId],
  );

  if (verificationResult.rows.length === 0) {
    throw new ApiError(404, 'Verification not found');
  }

  const row = verificationResult.rows[0];

  try {
    const apiResult = await callEligibilityAPI({
      plan: row.insurance_provider,
      memberId: row.insurance_policy_number,
      dob: row.date_of_birth,
    });

    await pool.query(
      `UPDATE insurance_verifications
       SET status = $1, copay_amount = $2, deductible_remaining = $3,
           coverage_start_date = $4, coverage_end_date = $5,
           authorization_notes = $6, last_verified_at = NOW()
       WHERE id = $7`,
      [apiResult.status, apiResult.copay, apiResult.deductible,
        apiResult.coverageStart, apiResult.coverageEnd, apiResult.authNotes,
        verificationId],
    );

    await pool.query(
      `INSERT INTO insurance_verification_attempts
         (verification_id, attempt_number, api_provider, api_response_payload,
          response_code, status, attempted_at)
       VALUES ($1, $2, $3, $4, '200', 'success', NOW())`,
      [verificationId, attemptNumber, insuranceApiConfig.provider,
        JSON.stringify({ status: apiResult.status })],
    );

    const updated = await pool.query('SELECT * FROM insurance_verifications WHERE id = $1', [verificationId]);
    return updated.rows[0];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const backoffDelays = [60000, 300000, 900000]; // 1min, 5min, 15min
    const retryAfter = attemptNumber < 3
      ? new Date(Date.now() + backoffDelays[attemptNumber]).toISOString()
      : null;

    await pool.query(
      `INSERT INTO insurance_verification_attempts
         (verification_id, attempt_number, api_provider, response_code, status,
          error_message, attempted_at, retry_after)
       VALUES ($1, $2, $3, 'ERR', 'failed', $4, NOW(), $5)`,
      [verificationId, attemptNumber, insuranceApiConfig.provider, errorMessage, retryAfter],
    );

    logger.error(`Retry ${attemptNumber} failed for verification ${verificationId}: ${errorMessage}`);
    throw error;
  }
}

/**
 * Get latest verification for a patient.
 */
export async function getLatestVerification(patientId: number): Promise<VerificationResult | null> {
  const result = await pool.query(
    `SELECT * FROM insurance_verifications
     WHERE patient_id = $1
     ORDER BY last_verified_at DESC NULLS LAST
     LIMIT 1`,
    [patientId],
  );
  return result.rows[0] || null;
}

/**
 * Get verification history for a patient with pagination.
 */
export async function getVerificationHistory(
  patientId: number,
  page: number,
  limit: number,
): Promise<{ data: VerificationResult[]; total: number }> {
  const offset = (page - 1) * limit;

  const countResult = await pool.query(
    'SELECT COUNT(*) FROM insurance_verifications WHERE patient_id = $1',
    [patientId],
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await pool.query(
    `SELECT iv.*, json_agg(
       json_build_object(
         'id', iva.id,
         'attempt_number', iva.attempt_number,
         'api_provider', iva.api_provider,
         'response_code', iva.response_code,
         'status', iva.status,
         'error_message', iva.error_message,
         'attempted_at', iva.attempted_at
       ) ORDER BY iva.attempt_number
     ) FILTER (WHERE iva.id IS NOT NULL) AS attempts
     FROM insurance_verifications iv
     LEFT JOIN insurance_verification_attempts iva ON iv.id = iva.verification_id
     WHERE iv.patient_id = $1
     GROUP BY iv.id
     ORDER BY iv.last_verified_at DESC NULLS LAST
     LIMIT $2 OFFSET $3`,
    [patientId, limit, offset],
  );

  return { data: result.rows, total };
}
