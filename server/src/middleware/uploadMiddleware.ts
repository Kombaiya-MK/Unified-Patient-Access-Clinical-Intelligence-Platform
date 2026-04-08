/**
 * File Upload Middleware (Multer Configuration)
 * @module middleware/uploadMiddleware
 * @task US_028 TASK_001
 */

import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { STORAGE_CONFIG } from '../config/storage.config';

const tempDir = path.resolve(__dirname, '../../storage/uploads/temp');

// Ensure temp directory exists
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, tempDir);
  },
  filename: (_req, file, cb) => {
    const uniqueId = crypto.randomUUID();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (STORAGE_CONFIG.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not supported. Accepted: PDF, PNG, JPG, JPEG, DOCX`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: STORAGE_CONFIG.maxFileSize,
    files: 10,
  },
});

export const uploadMultiple = upload.array('files', 10);

export const handleUploadErrors = (
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        success: false,
        error: `File exceeds ${STORAGE_CONFIG.maxFileSize / (1024 * 1024)}MB limit. Please compress or split the file.`,
      });
      return;
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({
        success: false,
        error: 'Maximum 10 files per upload.',
      });
      return;
    }
    res.status(400).json({ success: false, error: err.message });
    return;
  }
  if (err) {
    res.status(400).json({ success: false, error: err.message });
    return;
  }
  next();
};
