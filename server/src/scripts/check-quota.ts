/**
 * Check Quota Script
 *
 * Standalone cron script that checks storage quota and enforces
 * limits by purging oldest backups when the critical threshold
 * (95 %) is exceeded.
 *
 * Usage:
 *   npx ts-node check-quota.ts
 *
 * Cron: 0 3 * * * (daily at 3 AM)
 *
 * @module scripts/check-quota
 * @task US_042 TASK_002
 */

import { QuotaManagementService } from '../services/quota-management.service';
import logger from '../utils/logger';

export async function runQuotaCheck(): Promise<void> {
  logger.info('=== Quota Check START ===');

  const quotaService = new QuotaManagementService();
  const status = await quotaService.enforceQuota();

  logger.info(
    `Quota status: ${status.level.toUpperCase()} — ` +
      `${status.usedGB.toFixed(2)} / ${status.quotaGB} GB ` +
      `(${status.percentUsed.toFixed(1)}%)`,
  );

  logger.info('=== Quota Check COMPLETE ===');
}

/* istanbul ignore next */
if (require.main === module) {
  runQuotaCheck().catch((err) => {
    logger.error('Quota check failed:', err);
    process.exit(1);
  });
}
