/**
 * Manual Intake Service
 * 
 * File: server/src/services/manualIntakeService.ts
 * Task: US_026 TASK_001 - Backend Draft Auto-Save and Submission API
 * 
 * Business logic for manual patient intake form draft management
 * with auto-save and submission capabilities.
 */
import { pool } from '../config/database';
import logger from '../utils/logger';
import { ApiError } from '../types';
import type {
  IntakeMode,
  ManualIntakeDraftData,
} from '../types/aiIntake.types';

/**
 * Save or update an intake draft (UPSERT pattern)
 */
export async function saveDraft(
  patientId: number,
  userId: number,
  draftData: ManualIntakeDraftData,
  appointmentId?: number,
): Promise<{ draftId: number; lastSavedAt: string }> {
  // Resolve patient profile ID — patientId may be a user_id or a profile_id
  let profileId: number = patientId;
  const profileCheck = await pool.query(
    'SELECT id FROM patient_profiles WHERE id = $1',
    [patientId],
  );
  if (profileCheck.rows.length === 0) {
    // Try looking up by user_id instead
    const userCheck = await pool.query(
      'SELECT id FROM patient_profiles WHERE user_id = $1',
      [patientId],
    );
    if (userCheck.rows.length === 0) {
      throw new ApiError(404, 'Patient not found');
    }
    profileId = Number(userCheck.rows[0].id);
  }

  // Check for existing draft
  const existingDraft = await pool.query(
    `SELECT id FROM clinical_documents
     WHERE patient_id = $1 AND draft_status IN ('draft', 'in_progress')
       AND document_type = 'clinical_note'
     ORDER BY created_at DESC LIMIT 1`,
    [profileId],
  );

  const now = new Date().toISOString();

  if (existingDraft.rows.length > 0) {
    // Update existing draft
    const draftId = Number(existingDraft.rows[0].id);
    await pool.query(
      `UPDATE clinical_documents
       SET draft_data = $1, draft_status = 'in_progress', last_saved_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(draftData), draftId],
    );

    logger.info('Intake draft updated', { draftId, patientId: profileId });
    return { draftId, lastSavedAt: now };
  }

  // Create new draft
  const result = await pool.query(
    `INSERT INTO clinical_documents (
      patient_id, appointment_id, created_by_user_id,
      document_type, title, content, document_date,
      draft_status, draft_data, last_saved_at, intake_mode
    ) VALUES ($1, $2, $3, 'clinical_note', 'Manual Intake Draft', '',
      CURRENT_DATE, 'draft', $4, NOW(), 'manual')
    RETURNING id`,
    [profileId, appointmentId || null, userId, JSON.stringify(draftData)],
  );

  const draftId = Number(result.rows[0].id);
  logger.info('New intake draft created', { draftId, patientId: profileId });
  return { draftId, lastSavedAt: now };
}

/**
 * Update an existing draft by ID
 */
export async function updateDraft(
  draftId: number,
  draftData: ManualIntakeDraftData,
): Promise<{ lastSavedAt: string }> {
  const result = await pool.query(
    `UPDATE clinical_documents
     SET draft_data = $1, draft_status = 'in_progress', last_saved_at = NOW(), updated_at = NOW()
     WHERE id = $2 AND draft_status IN ('draft', 'in_progress')
     RETURNING id`,
    [JSON.stringify(draftData), draftId],
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, 'Draft not found or already submitted');
  }

  return { lastSavedAt: new Date().toISOString() };
}

/**
 * Get a draft by appointment ID
 */
export async function getDraftByAppointment(
  appointmentId: number,
): Promise<{
  draftId: number;
  draftData: ManualIntakeDraftData;
  lastSavedAt: string | null;
  draftStatus: string;
} | null> {
  const result = await pool.query(
    `SELECT id, draft_data, last_saved_at, draft_status
     FROM clinical_documents
     WHERE appointment_id = $1 AND draft_status IN ('draft', 'in_progress')
     ORDER BY created_at DESC LIMIT 1`,
    [appointmentId],
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    draftId: Number(row.id),
    draftData: row.draft_data || {},
    lastSavedAt: row.last_saved_at,
    draftStatus: row.draft_status,
  };
}

/**
 * Submit a manual intake draft as a finalized clinical document
 */
export async function submitDraft(
  draftId: number,
  _userId: number,
  intakeMode: IntakeMode = 'manual',
): Promise<{ documentId: number }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get draft
    const draftResult = await client.query(
      `SELECT id, patient_id, draft_data, appointment_id
       FROM clinical_documents
       WHERE id = $1 AND draft_status IN ('draft', 'in_progress')`,
      [draftId],
    );

    if (draftResult.rows.length === 0) {
      throw new ApiError(404, 'Draft not found or already submitted');
    }

    const draft = draftResult.rows[0];
    const draftData = draft.draft_data as ManualIntakeDraftData;

    // Validate required fields
    if (!draftData.chiefComplaint || draftData.chiefComplaint.trim().length < 10) {
      throw new ApiError(400, 'Chief complaint must be at least 10 characters');
    }

    // Build content from draft data
    const content = buildManualIntakeContent(draftData);

    // Finalize the document
    await client.query(
      `UPDATE clinical_documents
       SET content = $1, draft_status = 'submitted', intake_mode = $2,
           last_saved_at = NOW(), updated_at = NOW()
       WHERE id = $3`,
      [content, intakeMode, draftId],
    );

    await client.query('COMMIT');
    logger.info('Manual intake draft submitted', { draftId, patientId: draft.patient_id });

    return { documentId: draftId };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Build clinical document content from manual form data
 */
function buildManualIntakeContent(data: ManualIntakeDraftData): string {
  const sections: string[] = [];

  if (data.chiefComplaint) {
    sections.push(`CHIEF COMPLAINT:\n${data.chiefComplaint}`);
  }
  if (data.medicalHistory?.length) {
    sections.push(`MEDICAL HISTORY:\n${data.medicalHistory.join('\n')}`);
  }
  if (data.medications?.length) {
    const meds = data.medications
      .map((m) => `${m.name}${m.dosage ? ` (${m.dosage})` : ''}${m.frequency ? ` - ${m.frequency}` : ''}`)
      .join('\n');
    sections.push(`CURRENT MEDICATIONS:\n${meds}`);
  }
  if (data.allergies?.length) {
    const allergies = data.allergies
      .map((a) => `${a.allergen}${a.reaction ? ` - ${a.reaction}` : ''}`)
      .join('\n');
    sections.push(`ALLERGIES:\n${allergies}`);
  }
  if (data.familyHistory?.length) {
    sections.push(`FAMILY HISTORY:\n${data.familyHistory.join('\n')}`);
  }
  if (data.emergencyContact?.name) {
    const ec = data.emergencyContact;
    sections.push(
      `EMERGENCY CONTACT:\n${ec.name}${ec.relationship ? ` (${ec.relationship})` : ''}${ec.phone ? ` - ${ec.phone}` : ''}`,
    );
  }
  if (data.additionalNotes) {
    sections.push(`ADDITIONAL NOTES:\n${data.additionalNotes}`);
  }

  return sections.join('\n\n');
}
