/**
 * Audit Logs Retention Configuration
 * UPACI Clinical Appointment Platform
 * 
 * Defines retention policies for audit logs partitioning and archival.
 * HIPAA requires 7-year retention of all audit logs (45 CFR 164.316(b)(2)(i)).
 * 
 * @module config/retention.config
 */

/**
 * Retention policy configuration for audit logs
 */
export const retentionConfig = {
  /**
   * HIPAA-required retention period in years
   * 
   * 45 CFR 164.316(b)(2)(i) requires:
   * "Retain the documentation required by paragraph (b)(1) of this section 
   * for 6 years from the date of its creation or the date when it last was 
   * in effect, whichever is later."
   * 
   * We use 7 years to provide buffer for compliance.
   */
  retentionYears: 7,

  /**
   * Cron schedule for retention job (monthly execution)
   * 
   * Format: second minute hour day-of-month month day-of-week
   * '0 0 1 * *' = Run at 00:00 on the 1st day of every month
   * 
   * Monthly execution is sufficient as partitions are yearly
   * and 7-year retention means old partitions won't need immediate archival.
   */
  cronSchedule: '0 0 1 * *',

  /**
   * S3 bucket for audit log archives (AWS)
   * Override with AUDIT_ARCHIVE_S3_BUCKET environment variable
   * 
   * Example: 'upaci-audit-archive-prod' or 'upaci-audit-archive-dev'
   */
  s3Bucket: process.env.AUDIT_ARCHIVE_S3_BUCKET || 'upaci-audit-archive',

  /**
   * Azure Blob Storage container for audit log archives
   * Override with AUDIT_ARCHIVE_AZURE_CONTAINER environment variable
   * 
   * Example: 'audit-archives-prod' or 'audit-archives-dev'
   */
  azureContainer: process.env.AUDIT_ARCHIVE_AZURE_CONTAINER || 'audit-archives',

  /**
   * Storage provider to use: 's3' or 'azure'
   * Override with AUDIT_ARCHIVE_STORAGE environment variable
   * 
   * Determines which cloud provider to use for archival:
   * - 's3': AWS S3 (requires AWS credentials)
   * - 'azure': Azure Blob Storage (requires Azure credentials)
   */
  storageProvider: (process.env.AUDIT_ARCHIVE_STORAGE || 's3') as 's3' | 'azure',

  /**
   * Dry run mode - test archive operations without actual execution
   * Override with AUDIT_ARCHIVE_DRY_RUN environment variable
   * 
   * When true:
   * - Retention job runs and identifies old partitions
   * - Archive commands are logged but not executed
   * - No partitions are actually dropped
   * - Useful for testing and verification
   * 
   * When false:
   * - Retention job actually archives and drops old partitions
   * - Use in production with caution
   */
  dryRun: process.env.AUDIT_ARCHIVE_DRY_RUN === 'true',

  /**
   * Enable/disable retention job
   * Override with AUDIT_RETENTION_ENABLED environment variable
   * 
   * Set to false to completely disable the retention cron job.
   * Useful for:
   * - Development environments where archival isn't needed
   * - Temporary suspension without code changes
   * - Manual-only archival workflows
   */
  enabled: process.env.AUDIT_RETENTION_ENABLED !== 'false',

  /**
   * Database connection settings for direct partition operations
   * These are used by the retention job to query partition metadata
   * and execute archive scripts.
   */
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'upaci',
    user: process.env.DB_USER || 'upaci_user',
    schema: process.env.DB_SCHEMA || 'app',
  },

  /**
   * Script paths for archive/restore operations
   * These bash scripts handle the actual export/import of partitions
   */
  scripts: {
    archivePath: './database/scripts/archive_partition.sh',
    restorePath: './database/scripts/restore_partition.sh',
  },

  /**
   * Notification settings for archive operations
   * Configure alerts for retention job failures or successes
   */
  notifications: {
    /**
     * Enable email notifications for archive operations
     * Requires email service to be configured in application
     */
    emailEnabled: process.env.AUDIT_ARCHIVE_NOTIFY_EMAIL === 'true',

    /**
     * Email addresses to notify on archive failures
     * Comma-separated list of email addresses
     */
    alertEmails: (process.env.AUDIT_ARCHIVE_ALERT_EMAILS || '').split(',').filter(Boolean),

    /**
     * Enable Slack notifications
     * Requires SLACK_WEBHOOK_URL to be set
     */
    slackEnabled: process.env.AUDIT_ARCHIVE_NOTIFY_SLACK === 'true',

    /**
     * Slack webhook URL for archive notifications
     */
    slackWebhook: process.env.SLACK_WEBHOOK_URL || '',
  },

  /**
   * Archive size thresholds and warnings
   * Configure warnings for unexpectedly large or small archives
   */
  thresholds: {
    /**
     * Minimum expected archive size in bytes (100 MB)
     * Archives smaller than this trigger a warning
     */
    minArchiveSizeBytes: 100 * 1024 * 1024,

    /**
     * Maximum expected archive size in bytes (100 GB)
     * Archives larger than this trigger a warning
     */
    maxArchiveSizeBytes: 100 * 1024 * 1024 * 1024,

    /**
     * Minimum row count threshold
     * Partitions with fewer rows trigger a warning
     */
    minRowCount: 1000,
  },

  /**
   * Retry policy for failed archive operations
   */
  retry: {
    /**
     * Maximum number of retry attempts for failed archives
     */
    maxAttempts: 3,

    /**
     * Delay in milliseconds between retry attempts
     */
    delayMs: 60000, // 1 minute

    /**
     * Exponential backoff multiplier
     * Each retry waits delayMs * (backoffMultiplier ^ attemptNumber)
     */
    backoffMultiplier: 2,
  },

  /**
   * Logging configuration for retention job
   */
  logging: {
    /**
     * Log level: 'debug', 'info', 'warn', 'error'
     */
    level: (process.env.AUDIT_RETENTION_LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',

    /**
     * Log file path for retention job output
     * Set to empty string to disable file logging
     */
    logFile: process.env.AUDIT_RETENTION_LOG_FILE || './logs/audit-retention.log',

    /**
     * Whether to log to console in addition to file
     */
    logToConsole: process.env.NODE_ENV !== 'production',
  },
};

/**
 * Validates retention configuration
 * Throws error if configuration is invalid
 */
export function validateRetentionConfig(): void {
  if (retentionConfig.retentionYears < 7) {
    throw new Error('HIPAA requires minimum 7-year retention for audit logs');
  }

  if (retentionConfig.storageProvider !== 's3' && retentionConfig.storageProvider !== 'azure') {
    throw new Error(`Invalid storage provider: ${retentionConfig.storageProvider}. Must be 's3' or 'azure'`);
  }

  if (retentionConfig.storageProvider === 's3') {
    if (!retentionConfig.s3Bucket) {
      throw new Error('S3 bucket not configured. Set AUDIT_ARCHIVE_S3_BUCKET environment variable.');
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.');
    }
  }

  if (retentionConfig.storageProvider === 'azure') {
    if (!retentionConfig.azureContainer) {
      throw new Error('Azure container not configured. Set AUDIT_ARCHIVE_AZURE_CONTAINER environment variable.');
    }

    if (!process.env.AZURE_STORAGE_ACCOUNT || !process.env.AZURE_STORAGE_KEY) {
      throw new Error('Azure credentials not configured. Set AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_KEY environment variables.');
    }
  }

  if (!retentionConfig.enabled) {
    console.warn('[RETENTION] Audit retention job is DISABLED via configuration');
  }

  if (retentionConfig.dryRun) {
    console.warn('[RETENTION] Running in DRY RUN mode - no partitions will be archived or dropped');
  }
}

/**
 * Returns human-readable retention configuration summary
 */
export function getRetentionConfigSummary(): string {
  return `
Audit Retention Configuration:
  Retention Period: ${retentionConfig.retentionYears} years (HIPAA compliant)
  Cron Schedule: ${retentionConfig.cronSchedule} (monthly)
  Storage Provider: ${retentionConfig.storageProvider.toUpperCase()}
  S3 Bucket: ${retentionConfig.s3Bucket}
  Azure Container: ${retentionConfig.azureContainer}
  Dry Run: ${retentionConfig.dryRun ? 'YES (testing mode)' : 'NO (production mode)'}
  Enabled: ${retentionConfig.enabled ? 'YES' : 'NO'}
  Notifications: ${retentionConfig.notifications.emailEnabled ? 'Email' : ''}${retentionConfig.notifications.slackEnabled ? ' Slack' : ''} ${!retentionConfig.notifications.emailEnabled && !retentionConfig.notifications.slackEnabled ? 'DISABLED' : ''}
  `.trim();
}

export default retentionConfig;
