/**
 * Backup Configuration
 *
 * Central configuration for automated PostgreSQL, Redis, and application
 * log backups. Defines schedules, retention policies, compression, and
 * encryption settings.
 *
 * @module config/backup.config
 * @task US_042 TASK_001
 */

import path from 'path';

const BACKUP_BASE_DIR = process.env.BACKUP_BASE_DIR || '/var/backups';
const APP_CONFIG_DIR = process.env.APP_CONFIG_DIR || '/etc/app';

export const backupConfig = {
  baseDirs: {
    postgresql: path.join(BACKUP_BASE_DIR, 'postgresql'),
    redis: path.join(BACKUP_BASE_DIR, 'redis'),
    logs: path.join(BACKUP_BASE_DIR, 'logs'),
    compressed: path.join(BACKUP_BASE_DIR, 'compressed'),
    encrypted: path.join(BACKUP_BASE_DIR, 'encrypted'),
  },

  postgresql: {
    /** Cron: every 6 hours at minute 0 */
    schedule: '0 */6 * * *',
    retentionDays: 7,
    format: 'custom',
  },

  redis: {
    /** Cron: every hour at minute 0 */
    schedule: '0 * * * *',
    retentionDays: 7,
    bgsaveWaitMs: 5_000,
  },

  logs: {
    /** Cron: daily at 2 AM */
    schedule: '0 2 * * *',
    retentionDays: 90,
    sourceDir: process.env.LOG_DIR || '/var/log/app',
  },

  encryption: {
    algorithm: 'aes-256-cbc' as const,
    keyPath: path.join(APP_CONFIG_DIR, 'backup-encryption.key'),
    /** Annual rotation per NFR-SEC02 */
    keyRotationDays: 365,
  },

  compression: {
    /** gzip -9 (best compression) */
    level: 9,
    /** Target 70 % compression ratio */
    targetRatio: 0.70,
  },

  retry: {
    /** Wait 5 minutes before retry */
    delayMs: 5 * 60 * 1_000,
    maxAttempts: 2,
  },

  prometheus: {
    pushgatewayUrl: process.env.PROMETHEUS_PUSHGATEWAY_URL || 'http://localhost:9091',
  },

  /** Local retention before offsite upload */
  localRetentionDays: 7,
} as const;
