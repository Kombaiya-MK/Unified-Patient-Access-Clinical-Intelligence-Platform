/**
 * Encryption Key Rotation Check
 *
 * Runs as a monthly cron job to verify the encryption key age.
 * Automatically rotates the key if it is >= 365 days old (NFR-SEC02).
 *
 * Usage:
 *   npx ts-node check-key-rotation.ts
 *
 * @module scripts/check-key-rotation
 * @task US_042 TASK_001
 */

import { KMSKeyManager } from '../utils/kms-key-manager';
import { backupConfig } from '../config/backup.config';
import logger from '../utils/logger';

export async function checkAndRotate(): Promise<void> {
  const kms = new KMSKeyManager();

  try {
    const shouldRotate = await kms.shouldRotate();

    if (shouldRotate) {
      const ageInDays = await kms.checkKeyAge();
      logger.warn(
        `Encryption key is ${ageInDays} days old (threshold: ${backupConfig.encryption.keyRotationDays}). Rotating...`,
      );
      await kms.rotateKey();
      logger.info('Encryption key rotated successfully');
    } else {
      const ageInDays = await kms.checkKeyAge();
      logger.info(
        `Encryption key age: ${ageInDays} days. No rotation needed (threshold: ${backupConfig.encryption.keyRotationDays} days)`,
      );
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Encryption key not found')
    ) {
      logger.warn('Encryption key not found. Generating initial key...');
      await kms.generateKey();
      logger.info('Initial encryption key generated');
    } else {
      logger.error('Key rotation check failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      process.exit(1);
    }
  }
}

if (require.main === module || process.argv[1]?.includes('check-key-rotation')) {
  checkAndRotate().catch((err) => {
    logger.error('Key rotation check crashed', { error: err });
    process.exit(1);
  });
}
