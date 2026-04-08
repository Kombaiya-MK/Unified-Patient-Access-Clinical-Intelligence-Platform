/**
 * KMS Key Manager
 *
 * Generates, rotates, and audits AES-256 encryption keys for backup
 * encryption. Keys are stored with restrictive file permissions (0o600).
 * Annual rotation per NFR-SEC02.
 *
 * @module utils/kms-key-manager
 * @task US_042 TASK_001
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { backupConfig } from '../config/backup.config';
import logger from './logger';

const KEY_SIZE_BYTES = 32; // 256-bit key

export class KMSKeyManager {
  private readonly keyPath: string;
  private readonly rotationLogPath: string;

  constructor() {
    this.keyPath = backupConfig.encryption.keyPath;
    this.rotationLogPath = path.join(
      path.dirname(this.keyPath),
      'key-rotation.log',
    );
  }

  /**
   * Generate a new 256-bit random encryption key.
   * Writes base64-encoded key to keyPath with 0o600 permissions (owner read/write only).
   */
  async generateKey(): Promise<void> {
    const keyDir = path.dirname(this.keyPath);
    if (!fs.existsSync(keyDir)) {
      fs.mkdirSync(keyDir, { recursive: true, mode: 0o700 });
    }

    const key = crypto.randomBytes(KEY_SIZE_BYTES);
    fs.writeFileSync(this.keyPath, key.toString('base64'), { mode: 0o600, encoding: 'utf8' });

    this.appendRotationLog('New encryption key generated');
    logger.info('Backup encryption key generated', { path: this.keyPath });
  }

  /**
   * Rotate the encryption key: archive the current key, then generate a new one.
   * Archived key is named with an ISO-8601 timestamp suffix.
   */
  async rotateKey(): Promise<void> {
    if (fs.existsSync(this.keyPath)) {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const archivePath = `${this.keyPath}.${timestamp}`;
      fs.copyFileSync(this.keyPath, archivePath);
      fs.chmodSync(archivePath, 0o600);
      this.appendRotationLog(`Old key archived to ${archivePath}`);
      logger.info('Old encryption key archived', { archivePath });
    }

    await this.generateKey();
    this.appendRotationLog('Key rotation completed');
  }

  /**
   * Returns the age of the current key in whole days.
   * Throws if no key exists.
   */
  async checkKeyAge(): Promise<number> {
    if (!fs.existsSync(this.keyPath)) {
      throw new Error(
        `Encryption key not found at ${this.keyPath}. Run generateKey() first.`,
      );
    }
    const stats = fs.statSync(this.keyPath);
    return Math.floor((Date.now() - stats.mtimeMs) / (1_000 * 60 * 60 * 24));
  }

  /**
   * Check if the key should be rotated (age >= keyRotationDays).
   * Returns true if rotation is needed.
   */
  async shouldRotate(): Promise<boolean> {
    try {
      const ageDays = await this.checkKeyAge();
      return ageDays >= backupConfig.encryption.keyRotationDays;
    } catch {
      // Key doesn't exist — rotation is needed (initial generation)
      return true;
    }
  }

  /**
   * Verify the key file exists, has the expected size, and has restrictive permissions (0o600).
   */
  verifyKeyIntegrity(): boolean {
    if (!fs.existsSync(this.keyPath)) {
      return false;
    }
    const stats = fs.statSync(this.keyPath);
    const expectedSize = Math.ceil((KEY_SIZE_BYTES * 4) / 3); // base64 length of 32 bytes = 44
    const hasValidSize = stats.size >= expectedSize && stats.size <= expectedSize + 4; // allow padding variance
    const hasRestrictivePerms = (stats.mode & 0o777) === 0o600;
    return hasValidSize && hasRestrictivePerms;
  }

  private appendRotationLog(message: string): void {
    const entry = `${new Date().toISOString()} - ${message}\n`;
    try {
      fs.appendFileSync(this.rotationLogPath, entry, { mode: 0o600 });
    } catch {
      logger.warn('Failed to write key rotation log', {
        path: this.rotationLogPath,
      });
    }
  }
}
