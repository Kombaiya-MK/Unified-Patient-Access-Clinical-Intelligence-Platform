/**
 * Document Upload Controller
 * Handles file uploads, duplicate checks, and document listing.
 * @module controllers/documentController
 * @task US_028 TASK_001
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.types';
import { ApiError } from '../types';
import { DocumentType, DocumentUploadResponse } from '../types/document.types';
import {
  validateMagicNumber,
  calculateFileHash,
  checkDuplicate,
  validateTotalSize,
} from '../services/fileValidationService';
import { saveFile } from '../services/fileStorageService';
import { addExtractionJob } from '../queues/documentExtractionQueue';
import pool from '../config/database';
import logger from '../utils/logger';

const VALID_DOC_TYPES = ['Lab Results', 'Imaging', 'Prescription', 'Insurance Card', 'Other'];

export const uploadDocuments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ApiError(401, 'Authentication required');

    const { patientId, documentType } = req.body;
    if (!patientId) throw new ApiError(400, 'patientId is required');
    if (!documentType || !VALID_DOC_TYPES.includes(documentType)) {
      throw new ApiError(400, `documentType must be one of: ${VALID_DOC_TYPES.join(', ')}`);
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) throw new ApiError(400, 'No files provided');

    // Validate total size
    if (!validateTotalSize(files.map((f) => f.size))) {
      throw new ApiError(413, 'Total upload size exceeds 50MB limit.');
    }

    const results: DocumentUploadResponse[] = [];

    for (const file of files) {
      // Validate magic number
      const validMagic = await validateMagicNumber(file.path, file.mimetype);
      if (!validMagic) {
        logger.warn('File failed magic number validation', { filename: file.originalname });
        continue;
      }

      // Calculate hash
      const fileHash = await calculateFileHash(file.path);

      // Check duplicate
      const duplicateResult = await checkDuplicate(fileHash, patientId);

      // Store file
      const filePath = await saveFile(file.path, patientId, documentType, file.originalname);

      // Insert into clinical_documents
      const insertResult = await pool.query(
        `INSERT INTO app.clinical_documents
          (patient_id, created_by_user_id, document_type, title, content, document_date,
           file_url, file_size_bytes, mime_type, original_filename, file_hash,
           uploaded_by_user_id, extraction_status)
         VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7, $8, $9, $10, $2, 'Uploaded')
         RETURNING id, created_at`,
        [
          patientId,
          userId,
          documentType.toLowerCase().replace(/\s+/g, '_'),
          file.originalname,
          '', // content populated after extraction
          filePath,
          file.size,
          file.mimetype,
          file.originalname,
          fileHash,
        ],
      );

      const documentId = insertResult.rows[0].id;

      results.push({
        documentId: Number(documentId),
        filePath,
        fileHash,
        isDuplicate: duplicateResult.isDuplicate,
        uploadedAt: insertResult.rows[0].created_at,
        originalFilename: file.originalname,
        fileSize: file.size,
        documentType: documentType as DocumentType,
      });

      // Enqueue extraction job
      addExtractionJob({
        documentId: Number(documentId),
        patientId: Number(patientId),
        filePath,
        mimeType: file.mimetype,
        documentType,
      });
    }

    res.status(201).json({
      success: true,
      data: results,
      message: `${results.length} document(s) uploaded successfully`,
    });
  } catch (error) {
    next(error);
  }
};

export const checkDuplicateHash = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { fileHash, patientId } = req.body;
    if (!fileHash || !patientId) {
      throw new ApiError(400, 'fileHash and patientId are required');
    }

    const result = await checkDuplicate(fileHash, patientId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getDocuments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { patientId } = req.params;
    if (!patientId) throw new ApiError(400, 'patientId is required');

    const result = await pool.query(
      `SELECT id, patient_id, document_type, title, file_url, file_size_bytes,
              mime_type, original_filename, extraction_status, extraction_confidence,
              needs_manual_review, created_at
       FROM app.clinical_documents
       WHERE patient_id = $1
       ORDER BY created_at DESC`,
      [patientId],
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) throw new ApiError(401, 'Authentication required');

    const result = await pool.query(
      `DELETE FROM app.clinical_documents WHERE id = $1 RETURNING id`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, 'Document not found');
    }

    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    next(error);
  }
};
