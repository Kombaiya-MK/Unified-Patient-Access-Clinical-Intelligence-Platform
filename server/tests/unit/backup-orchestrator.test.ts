/**
 * Unit Tests for Backup Orchestrator
 *
 * Tests CLI argument parsing (parseArgs) and validates
 * type validation logic.
 *
 * @module backup-orchestrator.test
 * @task BUG_BACKUP_001
 */

// Mock logger before importing the module
jest.mock('../../src/utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock backup config
jest.mock('../../src/config/backup.config', () => ({
  backupConfig: {
    prometheus: { pushgatewayUrl: 'http://localhost:9091' },
    retry: { delayMs: 100, maxAttempts: 2 },
  },
}));

import { parseArgs } from '../../src/scripts/backup-orchestrator';

describe('backup-orchestrator parseArgs', () => {
  const mockExit = jest.spyOn(process, 'exit').mockImplementation((() => {
    throw new Error('process.exit called');
  }) as never);

  afterEach(() => {
    mockExit.mockClear();
  });

  afterAll(() => {
    mockExit.mockRestore();
  });

  it('should return all types when no --type flag is provided', () => {
    const result = parseArgs(['node', 'backup-orchestrator.js']);

    expect(result).toEqual(['postgresql', 'redis', 'logs']);
  });

  it('should return ["postgresql"] when --type=postgresql is provided', () => {
    const result = parseArgs(['node', 'script.js', '--type=postgresql']);

    expect(result).toEqual(['postgresql']);
  });

  it('should return ["redis"] when --type=redis is provided', () => {
    const result = parseArgs(['node', 'script.js', '--type=redis']);

    expect(result).toEqual(['redis']);
  });

  it('should return ["logs"] when --type=logs is provided', () => {
    const result = parseArgs(['node', 'script.js', '--type=logs']);

    expect(result).toEqual(['logs']);
  });

  it('should call process.exit(1) for invalid backup type', () => {
    expect(() => {
      parseArgs(['node', 'script.js', '--type=invalid']);
    }).toThrow('process.exit called');

    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should ignore unrelated arguments', () => {
    const result = parseArgs(['node', 'script.js', '--verbose', '--force']);

    expect(result).toEqual(['postgresql', 'redis', 'logs']);
  });
});
