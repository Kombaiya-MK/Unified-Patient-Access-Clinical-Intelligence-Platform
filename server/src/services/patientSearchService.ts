/**
 * Patient Search Service
 * 
 * Business logic for searching patients by name, phone, or email.
 * Used by staff to find patients when booking appointments on their behalf.
 * 
 * @module patientSearchService
 * @created 2026-04-01
 * @task US_023 TASK_001
 */

import { pool } from '../config/database';
import { normalizePhone } from '../utils/phoneUtils';
import logger from '../utils/logger';
import type { PatientSearchQuery, PatientSearchResult } from '../types/patientSearch.types';

/**
 * Search patients by name, phone, or email.
 * At least one search parameter must be provided.
 * Results limited to 10 active patients.
 * 
 * @param query - Search parameters (name, phone, email)
 * @returns Array of matching patient results
 */
async function searchPatients(query: PatientSearchQuery): Promise<PatientSearchResult[]> {
  const conditions: string[] = [];
  const params: string[] = [];
  let paramIndex = 1;

  if (query.name) {
    const searchTerm = `%${query.name}%`;
    conditions.push(
      `(u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR (u.first_name || ' ' || u.last_name) ILIKE $${paramIndex})`,
    );
    params.push(searchTerm);
    paramIndex++;
  }

  if (query.phone) {
    const normalizedPhone = normalizePhone(query.phone);
    if (normalizedPhone.length > 0) {
      conditions.push(
        `REGEXP_REPLACE(u.phone_number, '[^0-9]', '', 'g') LIKE $${paramIndex}`,
      );
      params.push(`%${normalizedPhone}%`);
      paramIndex++;
    }
  }

  if (query.email) {
    conditions.push(`LOWER(u.email) = LOWER($${paramIndex})`);
    params.push(query.email);
    paramIndex++;
  }

  if (conditions.length === 0) {
    return [];
  }

  const whereClause = conditions.join(' OR ');

  const sql = `
    SELECT
      pp.id::text AS id,
      u.id::text AS "userId",
      u.first_name AS "firstName",
      u.last_name AS "lastName",
      u.first_name || ' ' || u.last_name AS "fullName",
      u.email,
      u.phone_number AS "phoneNumber",
      pp.date_of_birth::text AS "dateOfBirth",
      pp.medical_record_number AS "medicalRecordNumber"
    FROM patient_profiles pp
    JOIN users u ON pp.user_id = u.id
    WHERE u.is_active = true
      AND (${whereClause})
    ORDER BY u.last_name, u.first_name
    LIMIT 10
  `;

  logger.debug('Patient search query', { conditions: conditions.length, params: params.length });

  const result = await pool.query(sql, params);
  return result.rows as PatientSearchResult[];
}

export default { searchPatients };
