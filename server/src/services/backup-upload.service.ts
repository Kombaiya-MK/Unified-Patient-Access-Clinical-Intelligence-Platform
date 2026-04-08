/**
 * Backup Upload Service
 *
 * Orchestrates uploading encrypted backups from local disk to Azure
 * Blob Storage. Scans the encrypted backup directory, calculates
 * MD5 checksums, uploads with metadata tags, verifies integrity,
 * and updates the inventory manifest. Ensures atomic operations —
 * partial uploads are not recorded in the manifest.
 *
 * @module services/backup-upload.service
 * @task US_042 TASK_002
 */

import fs from 'fs';
import path from 'path';
import { AzureStorageService } from './azure-storage.service';
import { ChecksumValidator } from '../utils/checksum-validator';
import { cloudStorageConfig, RetentionPolicy } from '../config/cloud-storage.config';
import logger from '../utils/logger';

export interface UploadResult {
  fileName: string;
  success: boolean;
  etag?: string;
  checksum?: string;
  error?: string;
}

interface InventoryEntry {
  fileName: string;
  metadata: Record<string, string>;
  etag: string;
  checksum: string;
  sizeBytes: number;
  uploadedAt: string;
}

export class BackupUploadService {
  private storageService: AzureStorageService;
  private checksumValidator: ChecksumValidator;

  constructor(
    storageService?: AzureStorageService,
    checksumValidator?: ChecksumValidator,
  ) {
    this.storageService = storageService || new AzureStorageService();
    this.checksumValidator = checksumValidator || new ChecksumValidator();
  }

  /**
   * Scan for pending encrypted backups and upload each one.
   */
  async uploadPendingBackups(): Promise<UploadResult[]> {
    const backupDir = cloudStorageConfig.encryptedBackupDir;

    if (!fs.existsSync(backupDir)) {
      logger.warn(`Backup directory not found: ${backupDir}`);
      return [];
    }

    const files = fs
      .readdirSync(backupDir)
      .filter((f) => f.endsWith('.enc'));

    if (files.length === 0) {
      logger.info('No pending backups to upload');
      return [];
    }

    logger.info(`Found ${files.length} backup(s) to upload`);
    const results: UploadResult[] = [];

    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const result = await this.uploadSingleBackup(filePath);
      results.push(result);
    }

    const successCount = results.filter((r) => r.success).length;
    logger.info(
      `Upload batch complete: ${successCount}/${results.length} successful`,
    );

    return results;
  }

  /**
   * Upload a single backup file with checksum verification
   * and inventory tracking. Atomic: manifest is only updated
   * after both upload and verification succeed.
   */
  async uploadSingleBackup(localFilePath: string): Promise<UploadResult> {
    const fileName = path.basename(localFilePath);

    try {
      const metadata = this.extractMetadata(fileName);

      const localChecksum =
        await this.checksumValidator.calculateChecksum(localFilePath);
      metadata['checksum'] = localChecksum;

      const stat = fs.statSync(localFilePath);
      metadata['size_bytes'] = String(stat.size);

      const etag = await this.storageService.uploadBackup(
        localFilePath,
        metadata,
      );

      const verified = await this.storageService.verifyUpload(fileName, etag);
      if (!verified) {
        await this.storageService.deleteBackup(fileName);
        throw new Error('Upload verification failed — ETag mismatch');
      }

      await this.updateInventoryManifest({
        fileName,
        metadata,
        etag,
        checksum: localChecksum,
        sizeBytes: stat.size,
        uploadedAt: new Date().toISOString(),
      });

      logger.info(`Successfully uploaded and verified: ${fileName}`);
      return { fileName, success: true, etag, checksum: localChecksum };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      logger.error(`Upload failed for ${fileName}: ${message}`);
      return { fileName, success: false, error: message };
    }
  }

  /**
   * Parse backup type (daily / weekly / monthly) from filename
   * timestamp. Monthly = 1st of month, weekly = Sunday, else daily.
   */
  extractMetadata(fileName: string): Record<string, string> {
    const dateMatch = fileName.match(/(\d{4}-\d{2}-\d{2})/);
    const datePart = dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10);

    const date = new Date(datePart);
    const dayOfMonth = date.getUTCDate();
    const dayOfWeek = date.getUTCDay();

    let backupType: 'daily' | 'weekly' | 'monthly' = 'daily';
    if (dayOfMonth === 1) {
      backupType = 'monthly';
    } else if (dayOfWeek === 0) {
      backupType = 'weekly';
    }

    const policy: RetentionPolicy =
      cloudStorageConfig.retention[backupType];

    return {
      backup_type: backupType,
      timestamp: datePart,
      retention_tier: policy.targetTier,
      retention_days: String(policy.retentionDays),
      original_file: fileName,
    };
  }

  /**
   * Append a verified upload record to the local inventory manifest.
   */
  private async updateInventoryManifest(
    entry: InventoryEntry,
  ): Promise<void> {
    const manifestPath = cloudStorageConfig.inventoryPath;
    const manifestDir = path.dirname(manifestPath);

    if (!fs.existsSync(manifestDir)) {
      fs.mkdirSync(manifestDir, { recursive: true });
    }

    let inventory: InventoryEntry[] = [];
    if (fs.existsSync(manifestPath)) {
      const raw = fs.readFileSync(manifestPath, 'utf-8');
      inventory = JSON.parse(raw) as InventoryEntry[];
    }

    inventory.push(entry);
    fs.writeFileSync(manifestPath, JSON.stringify(inventory, null, 2));
    logger.info(`Inventory updated: ${entry.fileName}`);
  }
}
