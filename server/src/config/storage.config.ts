/**
 * File Storage Configuration
 * @module config/storage.config
 * @task US_028 TASK_001
 */

import path from 'path';
import { StorageConfig } from '../types/document.types';

export const STORAGE_CONFIG: StorageConfig = {
  storageType: 'local',
  localPath: path.resolve(__dirname, '../../storage/uploads'),
  maxFileSize: 10 * 1024 * 1024, // 10 MB
  maxTotalSize: 50 * 1024 * 1024, // 50 MB
  allowedMimeTypes: [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  allowedExtensions: ['.pdf', '.png', '.jpg', '.jpeg', '.docx'],
};

export const MAGIC_NUMBERS: Record<string, number[]> = {
  'application/pdf': [0x25, 0x50, 0x44, 0x46],       // %PDF
  'image/png':       [0x89, 0x50, 0x4e, 0x47],        // .PNG
  'image/jpeg':      [0xff, 0xd8, 0xff],               // JPEG SOI
  'image/jpg':       [0xff, 0xd8, 0xff],
};

export default STORAGE_CONFIG;
