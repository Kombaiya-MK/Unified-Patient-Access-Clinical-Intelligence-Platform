/**
 * FS-001 through FS-005: File Structure Validation Tests
 * Validates directory structure, root config files, entry points, and barrel exports
 * 
 * @test-plan test_plan_fe_react_project_setup.md
 * @user-story US_001
 */
import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../..');

describe('File Structure Validation', () => {
  // FS-001: Validate src/ directory structure
  describe('FS-001: src/ directory structure', () => {
    const requiredDirs = [
      'src/components',
      'src/pages',
      'src/services',
      'src/utils',
      'src/types',
      'src/hooks',
      'src/contexts',
      'src/assets',
    ];

    it.each(requiredDirs)('"%s" directory exists', (dir) => {
      expect(existsSync(resolve(ROOT, dir))).toBe(true);
    });

    it('src/context directory exists (application-level context)', () => {
      expect(existsSync(resolve(ROOT, 'src/context'))).toBe(true);
    });
  });

  // FS-002: Validate public/ directory
  describe('FS-002: public/ directory', () => {
    it('public/ directory exists', () => {
      expect(existsSync(resolve(ROOT, 'public'))).toBe(true);
    });
  });

  // FS-003: Validate root configuration files
  describe('FS-003: root configuration files', () => {
    const requiredFiles = [
      'package.json',
      'vite.config.ts',
      'tsconfig.json',
      'tsconfig.app.json',
      'tsconfig.node.json',
      'eslint.config.js',
      '.env.example',
      'index.html',
    ];

    it.each(requiredFiles)('"%s" exists', (file) => {
      expect(existsSync(resolve(ROOT, file))).toBe(true);
    });
  });

  // FS-004: Validate entry point files
  describe('FS-004: entry point files', () => {
    it('src/main.tsx exists', () => {
      expect(existsSync(resolve(ROOT, 'src/main.tsx'))).toBe(true);
    });

    it('src/App.tsx exists', () => {
      expect(existsSync(resolve(ROOT, 'src/App.tsx'))).toBe(true);
    });

    it('index.html exists at root', () => {
      expect(existsSync(resolve(ROOT, 'index.html'))).toBe(true);
    });
  });

  // FS-005: Validate barrel export files
  describe('FS-005: barrel export files', () => {
    it('src/components/index.ts exists', () => {
      expect(existsSync(resolve(ROOT, 'src/components/index.ts'))).toBe(true);
    });

    it('src/pages/index.ts exists', () => {
      expect(existsSync(resolve(ROOT, 'src/pages/index.ts'))).toBe(true);
    });

    it('src/services/index.ts exists', () => {
      expect(existsSync(resolve(ROOT, 'src/services/index.ts'))).toBe(true);
    });

    it('src/types/index.ts exists', () => {
      expect(existsSync(resolve(ROOT, 'src/types/index.ts'))).toBe(true);
    });

    it('src/utils/index.ts exists', () => {
      expect(existsSync(resolve(ROOT, 'src/utils/index.ts'))).toBe(true);
    });
  });
});
