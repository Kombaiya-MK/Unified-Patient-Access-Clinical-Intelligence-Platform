/**
 * Checksum Validator
 *
 * Stream-based MD5 checksum calculator and verifier for backup
 * integrity validation before and after cloud upload.
 *
 * @module utils/checksum-validator
 * @task US_042 TASK_002
 */

import crypto from 'crypto';
import fs from 'fs';

export class ChecksumValidator {
  /**
   * Calculate MD5 checksum of a file using stream processing.
   * Handles large files efficiently without loading into memory.
   */
  async calculateChecksum(
    filePath: string,
    algorithm: string = 'md5',
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash(algorithm);
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data: Buffer) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (err) => {
        stream.destroy();
        reject(err);
      });
    });
  }

  /**
   * Verify a file's checksum against an expected value.
   * Returns true if checksums match (constant-time comparison).
   */
  async verifyChecksum(
    filePath: string,
    expectedChecksum: string,
    algorithm: string = 'md5',
  ): Promise<boolean> {
    if (!/^[0-9a-f]+$/i.test(expectedChecksum)) {
      throw new Error('expectedChecksum must be a valid hex string');
    }
    const actualChecksum = await this.calculateChecksum(filePath, algorithm);
    if (actualChecksum.length !== expectedChecksum.length) {
      return false;
    }
    return crypto.timingSafeEqual(
      Buffer.from(actualChecksum, 'hex'),
      Buffer.from(expectedChecksum, 'hex'),
    );
  }
}
