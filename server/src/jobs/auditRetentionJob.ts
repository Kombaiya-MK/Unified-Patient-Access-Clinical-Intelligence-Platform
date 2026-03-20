/**
 * Audit Logs Retention Cron Job
 * UPACI Clinical Appointment Platform
 * 
 * Automatically archives audit log partitions older than 7 years to cold storage
 * (S3 or Azure Blob) and drops them from the database to manage storage costs.
 * 
 * HIPAA Compliance: 45 CFR 164.316(b)(2)(i) requires 7-year retention.
 * This job ensures compliance while optimizing database storage.
 * 
 * @module jobs/auditRetentionJob
 */

import cron from 'node-cron';
import { spawn } from 'child_process';
import { Pool } from 'pg';
import { retentionConfig, validateRetentionConfig, getRetentionConfigSummary } from '../config/retention.config';
import logger from '../utils/logger';

interface PartitionMetadata {
  partition_name: string;
  partition_type: string;
  start_date: Date;
  end_date: Date;
  status: string;
  row_count_at_archive?: number;
}

interface ArchiveResult {
  partition_name: string;
  year: number;
  success: boolean;
  error?: string;
  row_count?: number;
  archive_size_bytes?: number;
  archive_location?: string;
}

/**
 * Database connection pool for partition queries
 * Uses configuration from retention.config
 */
let dbPool: Pool | null = null;

/**
 * Initialize database connection pool
 */
function initializeDatabase(): Pool {
  if (dbPool) {
    return dbPool;
  }

  dbPool = new Pool({
    host: retentionConfig.database.host,
    port: retentionConfig.database.port,
    database: retentionConfig.database.name,
    user: retentionConfig.database.user,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  logger.info('Database connection pool initialized for retention job');

  return dbPool;
}

/**
 * Calculates the cutoff year for retention
 * Partitions older than this year should be archived
 * 
 * @returns Cutoff year (current year - retention years)
 */
function calculateCutoffYear(): number {
  const currentYear = new Date().getFullYear();
  const cutoffYear = currentYear - retentionConfig.retentionYears;
  
  logger.info(`Retention cutoff year: ${cutoffYear} (current: ${currentYear}, retention: ${retentionConfig.retentionYears} years)`);
  
  return cutoffYear;
}

/**
 * Queries partition_metadata table to find partitions eligible for archival
 * 
 * @param cutoffYear - Partitions older than this year should be archived
 * @returns Array of partition metadata for archival
 */
async function findPartitionsForArchival(cutoffYear: number): Promise<PartitionMetadata[]> {
  const pool = initializeDatabase();

  try {
    const query = `
      SELECT 
        partition_name,
        partition_type,
        start_date,
        end_date,
        status,
        row_count_at_archive
      FROM ${retentionConfig.database.schema}.partition_metadata
      WHERE 
        partition_type = 'yearly'
        AND status = 'active'
        AND partition_name LIKE 'audit_logs_%'
        AND partition_name ~ '^audit_logs_[0-9]{4}$'
        AND EXTRACT(YEAR FROM start_date)::int < $1
      ORDER BY start_date ASC;
    `;

    const result = await pool.query<PartitionMetadata>(query, [cutoffYear]);

    logger.info(`Found ${result.rows.length} partition(s) eligible for archival (older than ${cutoffYear})`);

    result.rows.forEach((partition) => {
      logger.debug(`  - ${partition.partition_name}: ${partition.start_date.toISOString().split('T')[0]} to ${partition.end_date.toISOString().split('T')[0]}`);
    });

    return result.rows;
  } catch (error) {
    logger.error('Failed to query partitions for archival', { error });
    throw error;
  }
}

/**
 * Extracts year from partition name (e.g., 'audit_logs_2024' -> 2024)
 * 
 * @param partitionName - Full partition table name
 * @returns Year as number, or null if invalid format
 */
function extractYearFromPartitionName(partitionName: string): number | null {
  const match = partitionName.match(/^audit_logs_(\d{4})$/);
  
  if (!match) {
    logger.warn(`Invalid partition name format: ${partitionName}`);
    return null;
  }

  return parseInt(match[1], 10);
}

/**
 * Executes archive script for a specific partition year
 * Spawns bash script process and waits for completion
 * 
 * @param year - Year of partition to archive
 * @returns Promise that resolves to archive result
 */
async function archivePartition(year: number): Promise<ArchiveResult> {
  return new Promise((resolve) => {
    const scriptPath = retentionConfig.scripts.archivePath;
    const storageArg = retentionConfig.storageProvider === 's3'
      ? `--s3-bucket=${retentionConfig.s3Bucket}`
      : `--azure-container=${retentionConfig.azureContainer}`;

    const args = [
      String(year),
      retentionConfig.dryRun ? '--dry-run' : '--execute',
      storageArg,
    ];

    logger.info(`Executing archive script: ${scriptPath} ${args.join(' ')}`);

    const archiveProcess = spawn('bash', [scriptPath, ...args]);

    let stdout = '';
    let stderr = '';

    archiveProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      logger.debug(`[archive_partition.sh] ${output.trim()}`);
    });

    archiveProcess.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      logger.error(`[archive_partition.sh ERR] ${output.trim()}`);
    });

    archiveProcess.on('close', (code) => {
      if (code === 0) {
        logger.info(`Archive script completed successfully for partition audit_logs_${year}`);
        
        resolve({
          partition_name: `audit_logs_${year}`,
          year,
          success: true,
        });
      } else {
        logger.error(`Archive script failed for partition audit_logs_${year} with exit code ${code}`);
        logger.error(`stderr: ${stderr}`);
        
        resolve({
          partition_name: `audit_logs_${year}`,
          year,
          success: false,
          error: `Archive script exited with code ${code}. stderr: ${stderr}`,
        });
      }
    });

    archiveProcess.on('error', (error) => {
      logger.error(`Failed to spawn archive script process`, { error });
      
      resolve({
        partition_name: `audit_logs_${year}`,
        year,
        success: false,
        error: `Failed to spawn process: ${error.message}`,
      });
    });
  });
}

/**
 * Logs archive operation to audit_error_logs if it failed
 * Provides visibility into retention job failures
 * 
 * @param result - Archive operation result
 */
async function logArchiveFailure(result: ArchiveResult): Promise<void> {
  if (result.success) {
    return;
  }

  const pool = initializeDatabase();

  try {
    await pool.query(`
      INSERT INTO ${retentionConfig.database.schema}.audit_error_logs (
        error_message,
        attempted_entry,
        severity
      ) VALUES ($1, $2, $3)
    `, [
      `Audit retention job failed to archive partition ${result.partition_name}`,
      JSON.stringify({
        partition_name: result.partition_name,
        year: result.year,
        error: result.error,
        timestamp: new Date().toISOString(),
      }),
      'ERROR',
    ]);

    logger.info(`Logged archive failure to audit_error_logs for ${result.partition_name}`);
  } catch (error) {
    logger.error(`Failed to log archive failure to audit_error_logs`, { error });
  }
}

/**
 * Sends notification about archive operation results
 * Supports email and Slack notifications based on configuration
 * 
 * @param results - Array of archive results
 */
async function sendArchiveNotifications(results: ArchiveResult[]): Promise<void> {
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => r.success === false).length;

  const message = `
Audit Retention Job Summary:
  Total Partitions Processed: ${results.length}
  Successful Archives: ${successCount}
  Failed Archives: ${failureCount}
  Mode: ${retentionConfig.dryRun ? 'DRY RUN' : 'PRODUCTION'}
  Storage: ${retentionConfig.storageProvider.toUpperCase()}
  
${results.map(r => `  - ${r.partition_name}: ${r.success ? '✓ SUCCESS' : '✗ FAILED' + (r.error ? ` (${r.error})` : '')}`).join('\n')}
  `.trim();

  logger.info(message);

  // Email notifications
  if (retentionConfig.notifications.emailEnabled && retentionConfig.notifications.alertEmails.length > 0) {
    // TODO: Implement email notification via email service
    logger.info(`Would send email notification to: ${retentionConfig.notifications.alertEmails.join(', ')}`);
  }

  // Slack notifications
  if (retentionConfig.notifications.slackEnabled && retentionConfig.notifications.slackWebhook) {
    // TODO: Implement Slack notification via webhook
    logger.info(`Would send Slack notification to webhook`);
  }
}

/**
 * Main function that checks and archives old partitions
 * Called by cron scheduler based on configured schedule
 */
export async function checkAndArchiveOldPartitions(): Promise<void> {
  try {
    logger.info('========================================');
    logger.info('Audit Retention Job Started');
    logger.info('========================================');
    logger.info(getRetentionConfigSummary());
    logger.info('========================================');

    // Validate configuration
    validateRetentionConfig();

    if (!retentionConfig.enabled) {
      logger.warn('Retention job is DISABLED via configuration. Skipping execution.');
      return;
    }

    // Calculate cutoff year
    const cutoffYear = calculateCutoffYear();

    // Find partitions eligible for archival
    const partitions = await findPartitionsForArchival(cutoffYear);

    if (partitions.length === 0) {
      logger.info('No partitions found for archival. All partitions are within retention period.');
      logger.info('========================================');
      return;
    }

    logger.info(`Processing ${partitions.length} partition(s) for archival...`);

    // Archive each partition
    const results: ArchiveResult[] = [];

    for (const partition of partitions) {
      const year = extractYearFromPartitionName(partition.partition_name);

      if (!year) {
        logger.warn(`Skipping partition ${partition.partition_name} due to invalid name format`);
        continue;
      }

      logger.info(`Archiving partition: ${partition.partition_name} (year ${year})...`);

      const result = await archivePartition(year);
      results.push(result);

      if (!result.success) {
        await logArchiveFailure(result);
      }

      // Add delay between archives to avoid overwhelming the system
      if (partitions.indexOf(partition) < partitions.length - 1) {
        logger.info('Waiting 10 seconds before next archive...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    // Send notifications
    await sendArchiveNotifications(results);

    logger.info('========================================');
    logger.info('Audit Retention Job Completed');
    logger.info(`  Processed: ${results.length} partition(s)`);
    logger.info(`  Successful: ${results.filter(r => r.success).length}`);
    logger.info(`  Failed: ${results.filter(r => !r.success).length}`);
    logger.info('========================================');
  } catch (error) {
    logger.error('Audit retention job failed with exception', { error });

    // Log to audit_error_logs
    try {
      const pool = initializeDatabase();
      await pool.query(`
        INSERT INTO ${retentionConfig.database.schema}.audit_error_logs (
          error_message,
          attempted_entry,
          stack_trace,
          severity
        ) VALUES ($1, $2, $3, $4)
      `, [
        'Audit retention job crashed with exception',
        JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        }),
        error instanceof Error ? error.stack : '',
        'CRITICAL',
      ]);
    } catch (logError) {
      logger.error('Failed to log retention job exception to audit_error_logs', { logError });
    }

    throw error;
  }
}

/**
 * Starts the retention cron job
 * Schedules automatic execution based on configured cron schedule
 * 
 * @returns cron.ScheduledTask instance for management
 */
export function startRetentionJob(): cron.ScheduledTask {
  logger.info('Initializing audit retention cron job...');
  logger.info(getRetentionConfigSummary());

  if (!retentionConfig.enabled) {
    logger.warn('Retention job is DISABLED via configuration. Cron job will NOT be started.');
    // Return a dummy task that does nothing
    return cron.schedule('0 0 1 * *', () => {}, { scheduled: false });
  }

  // Validate cron schedule
  if (!cron.validate(retentionConfig.cronSchedule)) {
    throw new Error(`Invalid cron schedule: ${retentionConfig.cronSchedule}`);
  }

  logger.info(`Scheduling retention job with cron: ${retentionConfig.cronSchedule}`);

  const task = cron.schedule(retentionConfig.cronSchedule, async () => {
    try {
      await checkAndArchiveOldPartitions();
    } catch (error) {
      logger.error('Retention job execution failed', { error });
    }
  });

  logger.info('✓ Audit retention cron job started successfully');
  logger.info(`  Next run: ${retentionConfig.cronSchedule} (monthly on 1st day at 00:00)`);
  logger.warn(`  Mode: ${retentionConfig.dryRun ? 'DRY RUN (testing)' : 'PRODUCTION (will actually archive/drop partitions)'}`);

  return task;
}

/**
 * Stops the retention cron job
 * Useful for graceful shutdown
 * 
 * @param task - The cron task to stop
 */
export function stopRetentionJob(task: cron.ScheduledTask): void {
  task.stop();
  logger.info('Audit retention cron job stopped');
}

/**
 * Manually triggers retention job (for testing or manual execution)
 * Does not require cron schedule - runs immediately
 */
export async function triggerRetentionJobManually(): Promise<void> {
  logger.info('Manually triggering retention job...');
  await checkAndArchiveOldPartitions();
}

/**
 * Cleanup function to close database connections
 * Should be called on application shutdown
 */
export async function cleanup(): Promise<void> {
  if (dbPool) {
    await dbPool.end();
    dbPool = null;
    logger.info('Database connection pool closed for retention job');
  }
}

export default {
  startRetentionJob,
  stopRetentionJob,
  checkAndArchiveOldPartitions,
  triggerRetentionJobManually,
  cleanup,
};
