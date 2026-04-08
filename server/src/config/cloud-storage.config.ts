/**
 * Cloud Storage Configuration
 *
 * Configuration for offsite backup storage using Azure Blob Storage
 * with geo-redundant storage (GRS). Defines provider settings,
 * HIPAA-compliant retention policies, quota limits, storage tiering,
 * and cost monitoring thresholds.
 *
 * @module config/cloud-storage.config
 * @task US_042 TASK_002
 */

export interface RetentionPolicy {
  retentionDays: number;
  tierTransitionDays: number;
  targetTier: 'hot' | 'cool' | 'archive';
}

export const cloudStorageConfig = {
  provider: (process.env.CLOUD_PROVIDER || 'azure') as 'azure' | 'aws',

  azure: {
    accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME || '',
    accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY || '',
    containerName: process.env.AZURE_STORAGE_CONTAINER || 'healthcare-backups',
    redundancy: 'GRS' as const,
    tier: 'Hot' as const,
  },

  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    backupRegion: process.env.AWS_BACKUP_REGION || 'us-west-2',
    bucketName: process.env.AWS_S3_BUCKET || 'healthcare-backups',
    storageClass: 'STANDARD' as const,
  },

  /** HIPAA-compliant retention: NFR-DR01, HIPAA TR-007 */
  retention: {
    daily: {
      retentionDays: 30,
      tierTransitionDays: 7,
      targetTier: 'cool',
    } as RetentionPolicy,
    weekly: {
      retentionDays: 365,
      tierTransitionDays: 365,
      targetTier: 'archive',
    } as RetentionPolicy,
    monthly: {
      retentionDays: 2555, // 7 years per HIPAA
      tierTransitionDays: 365,
      targetTier: 'archive',
    } as RetentionPolicy,
  },

  /** Storage tiering boundaries (days) */
  tiering: {
    hotDays: 7,
    coolDays: 365,
    // Beyond coolDays → archive
  },

  quota: {
    maxStorageGB: Number(process.env.CLOUD_STORAGE_QUOTA_GB) || 1000,
    warningThresholdPercent: 80,
    criticalThresholdPercent: 95,
    purgePercent: 10,
  },

  cost: {
    maxInfrastructureBudgetPercent: 10,
    monthlyInfrastructureBudgetUSD:
      Number(process.env.MONTHLY_INFRA_BUDGET_USD) || 1000,
  },

  /** Inventory manifest path */
  inventoryPath:
    process.env.BACKUP_INVENTORY_PATH || '/var/backups/inventory.json',

  /** Source directory for encrypted backups awaiting upload */
  encryptedBackupDir:
    process.env.BACKUP_ENCRYPTED_DIR || '/var/backups/encrypted',

  prometheus: {
    pushgatewayUrl:
      process.env.PROMETHEUS_PUSHGATEWAY_URL || 'http://localhost:9091',
  },
} as const;
