/**
 * ENV-001 through ENV-004: Environment Variable Tests
 * Validates .env.example template, variable documentation, and loading behavior
 * 
 * @test-plan test_plan_fe_react_project_setup.md
 * @user-story US_001
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../..');

describe('Environment Variable Validation', () => {
  // ENV-002: Validate env template documentation
  describe('ENV-002: env template documentation', () => {
    const envContent = readFileSync(resolve(ROOT, '.env.example'), 'utf-8');

    it('documents VITE_API_URL with example value', () => {
      expect(envContent).toMatch(/VITE_API_URL=http:\/\/localhost:\d+\/api/);
    });

    it('documents VITE_BASE_PATH with "/" default', () => {
      expect(envContent).toMatch(/VITE_BASE_PATH=\//);
    });

    it('documents VITE_APP_NAME', () => {
      expect(envContent).toContain('VITE_APP_NAME=');
    });

    it('includes descriptive comments for each section', () => {
      expect(envContent).toMatch(/#.*API/i);
      expect(envContent).toMatch(/#.*Base.*path/i);
    });
  });

  // ENV-001: Validate env loading in main.tsx
  describe('ENV-001: env loading in application code', () => {
    it('main.tsx reads VITE_BASE_PATH for router basename', () => {
      const mainContent = readFileSync(resolve(ROOT, 'src/main.tsx'), 'utf-8');
      expect(mainContent).toContain('import.meta.env.VITE_BASE_PATH');
    });

    it('api.ts reads VITE_API_URL for axios baseURL', () => {
      const apiContent = readFileSync(resolve(ROOT, 'src/services/api.ts'), 'utf-8');
      expect(apiContent).toContain('import.meta.env.VITE_API_URL');
    });
  });

  // ENV-003: Validate graceful handling of missing env
  describe('ENV-003: fallback values for missing env', () => {
    it('main.tsx uses "/" as fallback for VITE_BASE_PATH', () => {
      const mainContent = readFileSync(resolve(ROOT, 'src/main.tsx'), 'utf-8');
      expect(mainContent).toMatch(/VITE_BASE_PATH\s*\|\|\s*['"]\/['"]/);
    });

    it('api.ts uses "/api" as fallback for VITE_API_URL', () => {
      const apiContent = readFileSync(resolve(ROOT, 'src/services/api.ts'), 'utf-8');
      expect(apiContent).toMatch(/VITE_API_URL\s*\|\|\s*['"]\/api['"]/);
    });
  });

  // ENV-004: Validate env in build output (config assertion)
  describe('ENV-004: env variables embedded in build', () => {
    it('vite config uses loadEnv to load env variables', () => {
      const viteConfig = readFileSync(resolve(ROOT, 'vite.config.ts'), 'utf-8');
      expect(viteConfig).toContain('loadEnv');
    });

    it('all VITE_ prefixed variables are auto-exposed by Vite', () => {
      const envContent = readFileSync(resolve(ROOT, '.env.example'), 'utf-8');
      const envVars = envContent.match(/^[A-Z_]+=.*/gm) || [];
      for (const line of envVars) {
        const varName = line.split('=')[0];
        // All env variables should use VITE_ prefix for Vite exposure
        expect(varName).toMatch(/^VITE_/);
      }
    });
  });
});
