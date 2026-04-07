/**
 * Upload Backups Script
 *
 * Cron-scheduled script that orchestrates the full cloud backup
 * pipeline: upload pending backups → enforce retention policy →
 * check / enforce quota → calculate and push cost metrics.
 *
 * Usage:
 *   npx ts-node upload-backups.ts
 *
 * Cron: 0 *​/12 * * * (every 12 hours)
 *
 * @module scripts/upload-backups
 * @task US_042 TASK_002
 */

import { BackupUploadService } from '../services/backup-upload.service';
import { RetentionPolicyService } from '../services/retention-policy.service';
import { QuotaManagementService } from '../services/quota-management.service';
import { CostMonitoringService } from '../services/cost-monitoring.service';
import logger from '../utils/logger';

export async function runUploadPipeline(): Promise<void> {
  logger.info('=== Cloud Backup Upload Pipeline START ===');

  // Step 1: Upload pending encrypted backups
  const uploadService = new BackupUploadService();
  const results = await uploadService.uploadPendingBackups();
  const successCount = results.filter((r) => r.success).length;
  const failCount = results.length - successCount;

  logger.info(
    `Upload phase: ${successCount} succeeded, ${failCount} failed ` +
      `out of ${results.length} file(s)`,
  );

  // Step 2: Enforce retention policy (delete expired, tier transitions)
  const retentionService = new RetentionPolicyService();
  const actions = await retentionService.enforceRetentionPolicy();
  logger.info(`Retention phase: ${actions.length} action(s) taken`);

  // Step 3: Check and enforce quota limits
  const quotaService = new QuotaManagementService();
  await quotaService.enforceQuota();

  // Step 4: Calculate costs and push metrics to Prometheus
  const costService = new CostMonitoringService();
  const budget = await costService.checkBudget();

  logger.info(
    `Cost: $${budget.totalCostUSD.toFixed(2)} ` +
      `(${budget.budgetPercent.toFixed(1)}% of budget cap)`,
  );

  if (budget.budgetExceeded) {
    logger.error(
      'CRITICAL: Storage cost exceeds 10% infrastructure budget!',
    );
  }

  await costService.pushCostMetrics();

  // Summary
  if (failCount > 0) {
    logger.warn(`=== Pipeline COMPLETED WITH ${failCount} FAILURE(S) ===`);
    process.exitCode = 1;
  } else {
    logger.info('=== Cloud Backup Upload Pipeline COMPLETE ===');
  }
}

/* istanbul ignore next */
if (require.main === module) {
  runUploadPipeline().catch((err) => {
    logger.error('Upload pipeline failed:', err);
    process.exit(1);
  });
}
