/**
 * Unit Tests for KMSKeyManager
 *
 * Tests encryption key generation, rotation, age checking,
 * rotation threshold, and integrity verification.
 *
 * @module kms-key-manager.test
 * @task BUG_BACKUP_001
 */

import { KMSKeyManager } from '../../src/utils/kms-key-manager';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Mock logger to prevent console noise during tests
jest.mock('../../src/utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Use a fixed test ID so both mock and test body share the same path
const FIXED_TEST_ID = 'kms-unit-test-fixture';
const TEST_DIR = path.join(os.tmpdir(), `kms-test-${FIXED_TEST_ID}`);
const TEST_KEY_PATH = path.join(TEST_DIR, 'test-encryption.key');

// Mock backupConfig — factory must inline values (jest.mock is hoisted)
jest.mock('../../src/config/backup.config', () => {
  const p = require('path');
  const o = require('os');
  const dir = p.join(o.tmpdir(), 'kms-test-kms-unit-test-fixture');
  return {
    backupConfig: {
      encryption: {
        keyPath: p.join(dir, 'test-encryption.key'),
        keyRotationDays: 365,
      },
    },
  };
});

describe('KMSKeyManager', () => {
  let kms: KMSKeyManager;

  beforeEach(() => {
    // Clean up test directory before each test
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    kms = new KMSKeyManager();
  });

  afterAll(() => {
    // Final cleanup
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('generateKey', () => {
    it('should create a 32-byte key file', async () => {
      await kms.generateKey();

      expect(fs.existsSync(TEST_KEY_PATH)).toBe(true);
      const keyData = fs.readFileSync(TEST_KEY_PATH);
      expect(keyData.length).toBe(32);
    });

    it('should create parent directories if they do not exist', async () => {
      expect(fs.existsSync(TEST_DIR)).toBe(false);

      await kms.generateKey();

      expect(fs.existsSync(TEST_DIR)).toBe(true);
      expect(fs.existsSync(TEST_KEY_PATH)).toBe(true);
    });

    it('should overwrite existing key when called again', async () => {
      await kms.generateKey();
      const firstKey = fs.readFileSync(TEST_KEY_PATH);

      await kms.generateKey();
      const secondKey = fs.readFileSync(TEST_KEY_PATH);

      expect(firstKey.length).toBe(32);
      expect(secondKey.length).toBe(32);
      // Keys should be different (random)
      expect(firstKey.equals(secondKey)).toBe(false);
    });
  });

  describe('rotateKey', () => {
    it('should archive the old key and generate a new one', async () => {
      await kms.generateKey();
      const originalKey = fs.readFileSync(TEST_KEY_PATH);

      await kms.rotateKey();
      const newKey = fs.readFileSync(TEST_KEY_PATH);

      // New key should be different
      expect(originalKey.equals(newKey)).toBe(false);

      // Archived key should exist (filename contains ISO timestamp)
      const files = fs.readdirSync(TEST_DIR);
      const archivedFiles = files.filter(
        (f) => f.startsWith('test-encryption.key.') && f !== 'key-rotation.log',
      );
      expect(archivedFiles.length).toBeGreaterThanOrEqual(1);
    });

    it('should generate a new key even if no previous key exists', async () => {
      expect(fs.existsSync(TEST_KEY_PATH)).toBe(false);

      await kms.rotateKey();

      expect(fs.existsSync(TEST_KEY_PATH)).toBe(true);
      const key = fs.readFileSync(TEST_KEY_PATH);
      expect(key.length).toBe(32);
    });

    it('should append to the rotation log', async () => {
      await kms.generateKey();
      await kms.rotateKey();

      const logPath = path.join(TEST_DIR, 'key-rotation.log');
      expect(fs.existsSync(logPath)).toBe(true);

      const logContent = fs.readFileSync(logPath, 'utf-8');
      expect(logContent).toContain('Key rotation completed');
    });
  });

  describe('checkKeyAge', () => {
    it('should return age close to 0 for a freshly generated key', async () => {
      await kms.generateKey();

      const age = await kms.checkKeyAge();

      // Freshly created key should be 0 days old (allow -1 to 0 for clock skew)
      expect(age).toBeGreaterThanOrEqual(-1);
      expect(age).toBeLessThanOrEqual(0);
    });

    it('should throw when no key exists', async () => {
      await expect(kms.checkKeyAge()).rejects.toThrow('Encryption key not found');
    });
  });

  describe('shouldRotate', () => {
    it('should return false for a fresh key', async () => {
      await kms.generateKey();

      const result = await kms.shouldRotate();

      expect(result).toBe(false);
    });

    it('should return true when no key exists', async () => {
      const result = await kms.shouldRotate();

      expect(result).toBe(true);
    });
  });

  describe('verifyKeyIntegrity', () => {
    it('should return true for a valid 32-byte key', async () => {
      await kms.generateKey();

      const result = kms.verifyKeyIntegrity();

      expect(result).toBe(true);
    });

    it('should return false when key does not exist', () => {
      const result = kms.verifyKeyIntegrity();

      expect(result).toBe(false);
    });

    it('should return false when key has wrong size', async () => {
      fs.mkdirSync(TEST_DIR, { recursive: true });
      fs.writeFileSync(TEST_KEY_PATH, Buffer.alloc(16)); // Wrong size

      const result = kms.verifyKeyIntegrity();

      expect(result).toBe(false);
    });
  });
});
