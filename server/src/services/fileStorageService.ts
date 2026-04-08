/**
 * File Storage Service
 * Stores files to local filesystem with organized path structure.
 * @module services/fileStorageService
 * @task US_028 TASK_001
 */

import fs from 'fs';
import path from 'path';
import { STORAGE_CONFIG } from '../config/storage.config';
import logger from '../utils/logger';

export async function saveFile(
  tempPath: string,
  patientId: string,
  documentType: string,
  originalFilename: string,
): Promise<string> {
  const sanitizedType = documentType.replace(/\s+/g, '_').toLowerCase();
  const timestamp = Date.now();
  const ext = path.extname(originalFilename);
  const baseName = path.basename(originalFilename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  const newFilename = `${baseName}_${timestamp}${ext}`;

  const destDir = path.join(
    STORAGE_CONFIG.localPath,
    'documents',
    patientId,
    sanitizedType,
  );

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const destPath = path.join(destDir, newFilename);

  await fs.promises.rename(tempPath, destPath);
  logger.info('File stored', { destPath, originalFilename, patientId });

  // Return relative path for storage in DB
  const relativePath = path.relative(STORAGE_CONFIG.localPath, destPath).replace(/\\/g, '/');
  return `uploads/${relativePath}`;
}

export async function deleteFile(filePath: string): Promise<void> {
  const fullPath = path.isAbsolute(filePath)
    ? filePath
    : path.join(STORAGE_CONFIG.localPath, filePath.replace('uploads/', ''));

  if (fs.existsSync(fullPath)) {
    await fs.promises.unlink(fullPath);
    logger.info('File deleted', { filePath });
  }
}

export async function getFilePath(storedPath: string): Promise<string> {
  const relativePart = storedPath.replace('uploads/', '');
  return path.join(STORAGE_CONFIG.localPath, relativePart);
}
