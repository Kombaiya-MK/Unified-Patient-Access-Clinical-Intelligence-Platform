/**
 * Risk Score Service
 * 
 * Calculates and updates patient risk scores based on no-show history.
 * Risk score = min(100, no_show_count * 30).
 * 
 * @module riskScoreService
 * @created 2026-04-01
 * @task US_024 TASK_002
 */

import { pool } from '../config/database';
import logger from '../utils/logger';
import type { PoolClient } from 'pg';

/**
 * Points added to risk score per non-excused no-show
 */
const RISK_POINTS_PER_NOSHOW = 30;

/**
 * Maximum risk score value
 */
const MAX_RISK_SCORE = 100;

/**
 * Calculate and persist risk score for a patient.
 * 
 * @param patientId - Patient profile ID
 * @param client - Optional transaction client
 * @returns The new risk score
 */
async function calculateRiskScore(
  patientId: string,
  client?: PoolClient,
): Promise<number> {
  const db = client || pool;

  const result = await db.query(
    'SELECT no_show_count FROM patient_profiles WHERE id = $1',
    [patientId],
  );

  if (result.rows.length === 0) {
    logger.warn('Patient not found for risk calculation', { patientId });
    return 0;
  }

  const noShowCount: number = result.rows[0].no_show_count;
  const newScore = Math.min(MAX_RISK_SCORE, noShowCount * RISK_POINTS_PER_NOSHOW);

  await db.query(
    'UPDATE patient_profiles SET risk_score = $1, updated_at = NOW() WHERE id = $2',
    [newScore, patientId],
  );

  logger.debug('Risk score updated', { patientId, noShowCount, newScore });

  return newScore;
}

export default { calculateRiskScore };
