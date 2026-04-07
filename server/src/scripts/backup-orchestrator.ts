/**
 * Backup Orchestrator
 *
 * Coordinates automated backup pipeline: PostgreSQL -> Redis -> Logs
 * followed by compression (gzip -9) and encryption (AES-256-CBC).
 * Includes retry logic, Prometheus metrics push, and atomic failure
 * handling.
 *
 * Usage:
 *   npx ts-node backup-orchestrator.ts                   # All backups
 *   npx ts-node backup-orchestrator.ts --type=postgresql  # Single type
 *
 * @module scripts/backup-orchestrator
 * @task US_042 TASK_001
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { URL } from 'url';
import { backupConfig } from '../config/backup.config';
import logger from '../utils/logger';

const execAsync = promisify(exec);

type BackupType = 'postgresql' | 'redis' | 'logs';

interface BackupResult {
  type: BackupType;
  originalFile: string;
  compressedFile: string;
  encryptedFile: string;
  durationSeconds: number;
  sizeBytes: number;
  success: boolean;
  error?: string;
}

const SCRIPTS_DIR = path.resolve(__dirname);

function getScriptPath(name: string): string {
  return path.join(SCRIPTS_DIR, name);
}

async function pushMetrics(
  type: string,
  duration: number,
  size: number,
  success: boolean,
): Promise<void> {
  const body = [
    '# TYPE backup_duration_seconds gauge',
    `backup_duration_seconds{type="${type}"} ${duration}`,
    '# TYPE backup_size_bytes gauge',
    `backup_size_bytes{type="${type}"} ${size}`,
    '# TYPE backup_success_last_timestamp gauge',
    `backup_success_last_timestamp{type="${type}"} ${success ? Math.floor(Date.now() / 1000) : 0}`,
  ].join('\n');

  const url = new URL(
    `/metrics/job/backup_orchestrator/instance/${type}`,
    backupConfig.prometheus.pushgatewayUrl,
  );

  return new Promise<void>((resolve) => {
    const req = http.request(
      url,
      { method: 'POST', headers: { 'Content-Type': 'text/plain' } },
      () => resolve(),
    );
    req.on('error', (err) => {
      logger.warn('Failed to push metrics to Prometheus pushgateway', {
        error: err.message,
      });
      resolve();
    });
    req.write(body);
    req.end();
  });
}

async function runBackup(type: BackupType): Promise<BackupResult> {
  const startTime = Date.now();
  const result: BackupResult = {
    type,
    originalFile: '',
    compressedFile: '',
    encryptedFile: '',
    durationSeconds: 0,
    sizeBytes: 0,
    success: false,
  };

  try {
    const scriptMap: Record<BackupType, string> = {
      postgresql: getScriptPath('backup-postgresql.sh'),
      redis: getScriptPath('backup-redis.sh'),
      logs: getScriptPath('backup-logs.sh'),
    };

    // Step 1: Run backup script
    logger.info(`Starting ${type} backup`);
    const { stdout: rawOriginal } = await execAsync(`bash "${scriptMap[type]}"`);
    result.originalFile = rawOriginal.trim();

    if (!result.originalFile) {
      throw new Error(`${type} backup script produced no output`);
    }

    // Step 2: Compress
    logger.info(`Compressing ${type} backup: ${result.originalFile}`);
    const { stdout: rawCompressed } = await execAsync(
      `bash "${getScriptPath('compress-backups.sh')}" "${result.originalFile}"`,
    );
    result.compressedFile = rawCompressed.trim();

    // Step 3: Encrypt
    logger.info(`Encrypting ${type} backup: ${result.compressedFile}`);
    const { stdout: rawEncrypted } = await execAsync(
      `bash "${getScriptPath('encrypt-backups.sh')}" "${result.compressedFile}"`,
    );
    result.encryptedFile = rawEncrypted.trim();

    // Step 4: Verify final file
    const stat = fs.statSync(result.encryptedFile);
    result.sizeBytes = stat.size;

    if (result.sizeBytes === 0) {
      throw new Error('Encrypted file is empty');
    }

    result.success = true;
    result.durationSeconds = (Date.now() - startTime) / 1000;

    logger.info(`${type} backup completed successfully`, {
      file: result.encryptedFile,
      sizeBytes: result.sizeBytes,
      durationSeconds: result.durationSeconds,
    });

    await pushMetrics(type, result.durationSeconds, result.sizeBytes, true);
  } catch (error) {
    result.durationSeconds = (Date.now() - startTime) / 1000;
    result.error = error instanceof Error ? error.message : String(error);

    logger.error(`${type} backup failed`, { error: result.error });
    await pushMetrics(type, result.durationSeconds, 0, false);
  }

  return result;
}

async function runBackupWithRetry(type: BackupType): Promise<BackupResult> {
  let result = await runBackup(type);

  if (!result.success && backupConfig.retry.maxAttempts > 1) {
    logger.warn(
      `${type} backup failed, retrying after ${backupConfig.retry.delayMs / 1000}s delay...`,
    );
    await new Promise((resolve) =>
      setTimeout(resolve, backupConfig.retry.delayMs),
    );

    result = await runBackup(type);

    if (!result.success) {
      logger.error(`CRITICAL: ${type} backup failed after retry`, {
        error: result.error,
      });
    }
  }

  return result;
}

async function orchestrate(types: BackupType[]): Promise<void> {
  logger.info('Backup orchestration started', { types });
  const results: BackupResult[] = [];

  for (const type of types) {
    const result = await runBackupWithRetry(type);
    results.push(result);
  }

  const successCount = results.filter((r) => r.success).length;
  const failures = results.filter((r) => !r.success);

  logger.info(
    `Backup orchestration completed: ${successCount}/${results.length} successful`,
  );

  if (failures.length > 0) {
    logger.error('CRITICAL: Backup failures detected', {
      failures: failures.map((f) => ({ type: f.type, error: f.error })),
    });
  }
}

// CLI entry point
export function parseArgs(argv: string[] = process.argv): BackupType[] {
  const typeArg = argv.find((a) => a.startsWith('--type='));
  if (typeArg) {
    const type = typeArg.split('=')[1] as BackupType;
    const valid: BackupType[] = ['postgresql', 'redis', 'logs'];
    if (!valid.includes(type)) {
      logger.error(`Invalid backup type: ${type}. Must be one of: ${valid.join(', ')}`);
      process.exit(1);
    }
    return [type];
  }
  return ['postgresql', 'redis', 'logs'];
}

if (require.main === module) {
  const types = parseArgs();
  orchestrate(types).catch((err) => {
    logger.error('Backup orchestration crashed', { error: err });
    process.exit(1);
  });
}
