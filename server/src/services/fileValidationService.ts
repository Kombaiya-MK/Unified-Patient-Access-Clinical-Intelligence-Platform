/**
 * File Validation Service
 * Validates file types via MIME and magic numbers, calculates SHA-256 hashes,
 * and checks for duplicate uploads.
 * @module services/fileValidationService
 * @task US_028 TASK_001
 */

import crypto from 'crypto';
import fs from 'fs';
import { STORAGE_CONFIG, MAGIC_NUMBERS } from '../config/storage.config';
import { DuplicateCheckResult } from '../types/document.types';
import pool from '../config/database';
import logger from '../utils/logger';

export async function validateMagicNumber(filePath: string, mimeType: string): Promise<boolean> {
  const expected = MAGIC_NUMBERS[mimeType];
  if (!expected) {
    // DOCX files don't have a simple magic number (ZIP-based)
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const buffer = Buffer.alloc(4);
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, 4, 0);
      fs.closeSync(fd);
      // DOCX is a ZIP file: PK\x03\x04
      return buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
    }
    return true;
  }

  const buffer = Buffer.alloc(expected.length);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buffer, 0, expected.length, 0);
  fs.closeSync(fd);

  return expected.every((byte, i) => buffer[i] === byte);
}

export async function calculateFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

export async function checkDuplicate(
  fileHash: string,
  patientId: string,
): Promise<DuplicateCheckResult> {
  try {
    const result = await pool.query(
      `SELECT id, original_filename, created_at
       FROM app.clinical_documents
       WHERE file_hash = $1 AND patient_id = $2
       LIMIT 1`,
      [fileHash, patientId],
    );

    if (result.rows.length > 0) {
      return {
        isDuplicate: true,
        existingDocumentId: result.rows[0].id,
        existingFilename: result.rows[0].original_filename,
        uploadedAt: result.rows[0].created_at,
      };
    }

    return { isDuplicate: false };
  } catch (error) {
    logger.error('Error checking for duplicate file', { error, fileHash, patientId });
    return { isDuplicate: false };
  }
}

export function validateFileSize(fileSize: number): boolean {
  return fileSize <= STORAGE_CONFIG.maxFileSize;
}

export function validateTotalSize(fileSizes: number[]): boolean {
  const total = fileSizes.reduce((sum, size) => sum + size, 0);
  return total <= STORAGE_CONFIG.maxTotalSize;
}
