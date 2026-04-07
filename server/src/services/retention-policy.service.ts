/**
 * Retention Policy Service
 *
 * Enforces HIPAA-compliant backup retention lifecycle rules:
 *   - Daily backups: kept 30 days, moved to cool tier after 7 days
 *   - Weekly backups: kept 1 year, moved to archive after 1 year
 *   - Monthly backups: kept 7 years (HIPAA TR-007), archive after 1 year
 *
 * Also handles storage tier transitions:
 *   hot (0-7 days) → cool (7-365 days) → archive (365+ days)
 *
 * @module services/retention-policy.service
 * @task US_042 TASK_002
 */

import { AzureStorageService } from './azure-storage.service';
import { cloudStorageConfig, RetentionPolicy } from '../config/cloud-storage.config';
import logger from '../utils/logger';

export interface RetentionAction {
  blobName: string;
  action: 'delete' | 'tier-transition';
  reason: string;
  targetTier?: 'Hot' | 'Cool' | 'Archive';
}

export class RetentionPolicyService {
  private storageService: AzureStorageService;

  constructor(storageService?: AzureStorageService) {
    this.storageService = storageService || new AzureStorageService();
  }

  /**
   * Scan all backups and enforce retention + tiering rules.
   * Returns list of actions taken.
   */
  async enforceRetentionPolicy(): Promise<RetentionAction[]> {
    const backups = await this.storageService.listBackups();
    const actions: RetentionAction[] = [];

    logger.info(
      `Evaluating retention for ${backups.length} backup(s)`,
    );

    for (const backup of backups) {
      const ageInDays = this.calculateAgeInDays(backup.name);
      const backupType = this.extractBackupType(backup.name);
      const policy: RetentionPolicy =
        cloudStorageConfig.retention[backupType];

      if (ageInDays > policy.retentionDays) {
        logger.info(
          `Deleting expired ${backupType} backup: ${backup.name} ` +
            `(age: ${ageInDays}d, limit: ${policy.retentionDays}d)`,
        );
        await this.storageService.deleteBackup(backup.name);
        actions.push({
          blobName: backup.name,
          action: 'delete',
          reason: `Exceeded ${backupType} retention of ${policy.retentionDays} days`,
        });
        continue;
      }

      const targetTier = this.determineTier(ageInDays);
      const currentTier = backup.tier.toLowerCase();

      if (targetTier !== currentTier && this.shouldTransition(currentTier, targetTier)) {
        const azureTier = this.mapTier(targetTier);
        logger.info(
          `Transitioning ${backup.name} from ${currentTier} to ${targetTier} ` +
            `(age: ${ageInDays}d)`,
        );
        await this.storageService.setAccessTier(backup.name, azureTier);
        actions.push({
          blobName: backup.name,
          action: 'tier-transition',
          reason: `Age ${ageInDays}d triggers ${targetTier} tier`,
          targetTier: azureTier,
        });
      }
    }

    logger.info(
      `Retention enforcement complete: ${actions.length} action(s) taken`,
    );
    return actions;
  }

  /**
   * Calculate backup age from the date embedded in the filename.
   */
  calculateAgeInDays(fileName: string): number {
    const dateMatch = fileName.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!dateMatch) return 0;

    const backupDate = new Date(
      `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T00:00:00Z`,
    );
    const now = new Date();
    return Math.floor(
      (now.getTime() - backupDate.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  /**
   * Infer backup type from filename date.
   * 1st of month → monthly, Sunday → weekly, else daily.
   */
  extractBackupType(fileName: string): 'daily' | 'weekly' | 'monthly' {
    const dateMatch = fileName.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!dateMatch) return 'daily';

    const date = new Date(
      `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T00:00:00Z`,
    );
    const dayOfMonth = date.getUTCDate();
    const dayOfWeek = date.getUTCDay();

    if (dayOfMonth === 1) return 'monthly';
    if (dayOfWeek === 0) return 'weekly';
    return 'daily';
  }

  /**
   * Determine target tier based on backup age.
   */
  private determineTier(ageInDays: number): string {
    if (ageInDays <= cloudStorageConfig.tiering.hotDays) return 'hot';
    if (ageInDays <= cloudStorageConfig.tiering.coolDays) return 'cool';
    return 'archive';
  }

  /**
   * Only allow forward tier transitions (hot → cool → archive).
   */
  private shouldTransition(current: string, target: string): boolean {
    const tierOrder: Record<string, number> = {
      hot: 0,
      cool: 1,
      archive: 2,
    };
    return (tierOrder[target] ?? 0) > (tierOrder[current] ?? 0);
  }

  /**
   * Map internal tier name to Azure access tier enum value.
   */
  private mapTier(tier: string): 'Hot' | 'Cool' | 'Archive' {
    const tierMap: Record<string, 'Hot' | 'Cool' | 'Archive'> = {
      hot: 'Hot',
      cool: 'Cool',
      archive: 'Archive',
    };
    return tierMap[tier] || 'Hot';
  }
}
