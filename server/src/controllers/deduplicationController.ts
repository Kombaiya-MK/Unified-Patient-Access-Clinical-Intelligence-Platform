/**
 * Deduplication Controller
 * Handles manual deduplication, merge history, and conflict resolution.
 * @module controllers/deduplicationController
 * @task US_030 TASK_003
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.types';
import { ApiError } from '../types';
import { addDeduplicationJob } from '../queues/deduplicationQueue';
import pool from '../config/database';

export const manualDeduplicate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId) throw new ApiError(401, 'Authentication required');
    if (role !== 'staff' && role !== 'admin') {
      throw new ApiError(403, 'Staff access required');
    }

    // Check patient exists
    const patientResult = await pool.query(
      `SELECT id FROM app.patient_profiles WHERE id = $1`,
      [id],
    );
    if (patientResult.rows.length === 0) {
      throw new ApiError(404, 'Patient not found');
    }

    // Find most recent document
    const docResult = await pool.query(
      `SELECT id FROM app.clinical_documents
       WHERE patient_id = $1 AND extraction_status IN ('Processed', 'Needs Review')
       ORDER BY created_at DESC LIMIT 1`,
      [id],
    );

    if (docResult.rows.length === 0) {
      throw new ApiError(400, 'No processed documents found for this patient');
    }

    const jobId = await addDeduplicationJob({
      patientId: Number(id),
      newDocumentId: Number(docResult.rows[0].id),
    });

    res.status(202).json({
      success: true,
      data: { jobId, patientId: Number(id) },
      message: 'Deduplication started',
    });
  } catch (error) {
    next(error);
  }
};

export const getMergeHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT id, patient_id, merge_timestamp, algorithm_version,
              source_documents, merge_decisions, conflicts_detected,
              performed_by, staff_id
       FROM app.data_merge_logs
       WHERE patient_id = $1
       ORDER BY merge_timestamp DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset],
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM app.data_merge_logs WHERE patient_id = $1`,
      [id],
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getConflicts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const status = (req.query.status as string) || 'Pending';

    const result = await pool.query(
      `SELECT id, patient_id, field_name, conflicting_values,
              resolution_status, resolved_by_staff_id, resolved_at,
              resolution_notes, created_at
       FROM app.field_conflicts
       WHERE patient_id = $1 AND resolution_status = $2
       ORDER BY created_at DESC`,
      [id, status],
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

export const resolveConflict = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id, conflictId } = req.params;
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId) throw new ApiError(401, 'Authentication required');
    if (role !== 'staff' && role !== 'admin') {
      throw new ApiError(403, 'Staff access required');
    }

    const { resolvedValue, resolutionNotes } = req.body;
    if (resolvedValue === undefined) {
      throw new ApiError(400, 'resolvedValue is required');
    }

    // Update the conflict
    const result = await pool.query(
      `UPDATE app.field_conflicts
       SET resolution_status = 'Resolved',
           resolved_by_staff_id = $1,
           resolved_at = CURRENT_TIMESTAMP,
           resolution_notes = $2
       WHERE id = $3 AND patient_id = $4
       RETURNING field_name`,
      [userId, resolutionNotes || null, conflictId, id],
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, 'Conflict not found');
    }

    const fieldName = result.rows[0].field_name;

    // Update the merged extracted_data with resolved value
    await pool.query(
      `UPDATE app.patient_profiles
       SET extracted_data = jsonb_set(
         COALESCE(extracted_data, '{}'::jsonb),
         ARRAY[$1],
         $2::jsonb
       ),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [fieldName, JSON.stringify(resolvedValue), id],
    );

    // Check if all conflicts are resolved
    const pendingResult = await pool.query(
      `SELECT COUNT(*) FROM app.field_conflicts
       WHERE patient_id = $1 AND resolution_status = 'Pending'`,
      [id],
    );

    if (parseInt(pendingResult.rows[0].count) === 0) {
      await pool.query(
        `UPDATE app.patient_profiles
         SET merge_status = 'Merged', conflict_fields = '[]'::jsonb
         WHERE id = $1`,
        [id],
      );
    }

    res.json({
      success: true,
      message: 'Conflict resolved successfully',
      data: { fieldName, resolvedValue },
    });
  } catch (error) {
    next(error);
  }
};
