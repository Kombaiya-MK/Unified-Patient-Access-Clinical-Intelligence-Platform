/**
 * Quota Management Service
 *
 * Monitors Azure Blob Storage usage against configured quota limits
 * (default 1 TB). Issues warnings at 80 %, critical alerts at 95 %,
 * and auto-purges the oldest 10 % of backups when the critical
 * threshold is breached (EC-1).
 *
 * @module services/quota-management.service
 * @task US_042 TASK_002
 */

import { AzureStorageService } from './azure-storage.service';
import { cloudStorageConfig } from '../config/cloud-storage.config';
import logger from '../utils/logger';

export interface QuotaStatus {
  usedGB: number;
  quotaGB: number;
  percentUsed: number;
  level: 'ok' | 'warning' | 'critical' | 'exceeded';
}

export class QuotaManagementService {
  private storageService: AzureStorageService;

  constructor(storageService?: AzureStorageService) {
    this.storageService = storageService || new AzureStorageService();
  }

  /**
   * Calculate current storage usage against quota.
   */
  async checkQuota(): Promise<QuotaStatus> {
    const backups = await this.storageService.listBackups();
    const totalBytes = backups.reduce((sum, b) => sum + b.size, 0);
    const usedGB = totalBytes / (1024 ** 3);

    const quotaGB = cloudStorageConfig.quota.maxStorageGB;
    const percentUsed = quotaGB > 0 ? (usedGB / quotaGB) * 100 : 0;

    let level: QuotaStatus['level'] = 'ok';
    if (percentUsed > 100) {
      level = 'exceeded';
    } else if (
      percentUsed > cloudStorageConfig.quota.criticalThresholdPercent
    ) {
      level = 'critical';
    } else if (
      percentUsed > cloudStorageConfig.quota.warningThresholdPercent
    ) {
      level = 'warning';
    }

    return { usedGB, quotaGB, percentUsed, level };
  }

  /**
   * Enforce quota limits. Purge oldest backups if critical.
   */
  async enforceQuota(): Promise<QuotaStatus> {
    const status = await this.checkQuota();

    switch (status.level) {
      case 'exceeded':
      case 'critical':
        logger.warn(
          `Storage quota CRITICAL: ${status.percentUsed.toFixed(1)}% used ` +
            `(${status.usedGB.toFixed(2)} / ${status.quotaGB} GB)`,
        );
        await this.purgeOldestBackups();
        break;
      case 'warning':
        logger.warn(
          `Storage quota WARNING: ${status.percentUsed.toFixed(1)}% used ` +
            `(${status.usedGB.toFixed(2)} / ${status.quotaGB} GB)`,
        );
        break;
      default:
        logger.info(
          `Storage quota OK: ${status.percentUsed.toFixed(1)}% used ` +
            `(${status.usedGB.toFixed(2)} / ${status.quotaGB} GB)`,
        );
    }

    return status;
  }

  /**
   * Delete the oldest 10 % of backups to free space.
   * Sorts by filename date (oldest first).
   */
  private async purgeOldestBackups(): Promise<number> {
    const backups = await this.storageService.listBackups();

    if (backups.length === 0) {
      logger.info('No backups to purge');
      return 0;
    }

    const sorted = [...backups].sort((a, b) => {
      const ageA = this.extractTimestamp(a.name);
      const ageB = this.extractTimestamp(b.name);
      return ageA - ageB; // ascending: oldest first
    });

    const purgePercent = cloudStorageConfig.quota.purgePercent;
    const deleteCount = Math.max(1, Math.ceil(sorted.length * (purgePercent / 100)));

    logger.warn(`Purging ${deleteCount} oldest backup(s) to free space`);

    let deleted = 0;
    for (let i = 0; i < deleteCount && i < sorted.length; i++) {
      try {
        await this.storageService.deleteBackup(sorted[i].name);
        deleted++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error(`Failed to purge ${sorted[i].name}: ${msg}`);
      }
    }

    logger.info(`Purged ${deleted}/${deleteCount} backup(s)`);
    return deleted;
  }

  /**
   * Extract epoch timestamp from filename for sorting.
   */
  private extractTimestamp(fileName: string): number {
    const dateMatch = fileName.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!dateMatch) return 0;

    return new Date(
      `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T00:00:00Z`,
    ).getTime();
  }
}
