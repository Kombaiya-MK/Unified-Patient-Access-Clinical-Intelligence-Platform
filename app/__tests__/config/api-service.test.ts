/**
 * API-001 through API-003: API Service Configuration Tests
 * Validates axios instance, baseURL, interceptors, and error handling
 * 
 * @test-plan test_plan_fe_react_project_setup.md
 * @user-story US_001
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../..');

describe('API Service Configuration', () => {
  const apiContent = readFileSync(resolve(ROOT, 'src/services/api.ts'), 'utf-8');

  // API-001: Validate axios instance creation
  describe('API-001: axios instance creation', () => {
    it('imports axios', () => {
      expect(apiContent).toContain("import axios from 'axios'");
    });

    it('creates instance with axios.create()', () => {
      expect(apiContent).toContain('axios.create');
    });

    it('sets baseURL from VITE_API_URL env variable', () => {
      expect(apiContent).toContain('import.meta.env.VITE_API_URL');
      expect(apiContent).toContain('baseURL');
    });

    it('sets Content-Type to application/json', () => {
      expect(apiContent).toContain("'Content-Type': 'application/json'");
    });

    it('configures request timeout', () => {
      expect(apiContent).toMatch(/timeout:\s*\d+/);
    });

    it('exports the apiClient as default', () => {
      expect(apiContent).toContain('export default apiClient');
    });
  });

  // API-002: Validate API proxy in dev config
  describe('API-002: API proxy configuration', () => {
    const viteConfig = readFileSync(resolve(ROOT, 'vite.config.ts'), 'utf-8');

    it('configures proxy for /api routes', () => {
      expect(viteConfig).toContain("'/api'");
      expect(viteConfig).toContain('proxy');
    });

    it('proxy target reads from VITE_API_URL or uses default', () => {
      expect(viteConfig).toMatch(/target:\s*env\.VITE_API_URL\s*\|\|/);
    });

    it('enables changeOrigin for proxy', () => {
      expect(viteConfig).toContain('changeOrigin: true');
    });
  });

  // API-003: Validate fallback for missing baseURL
  describe('API-003: missing baseURL fallback', () => {
    it('provides fallback URL when VITE_API_URL is undefined', () => {
      expect(apiContent).toMatch(/VITE_API_URL\s*\|\|\s*['"]\/api['"]/);
    });
  });

  // Request interceptor validation
  describe('Request interceptor', () => {
    it('adds authorization header with token', () => {
      expect(apiContent).toContain('interceptors.request.use');
      expect(apiContent).toContain('Authorization');
      expect(apiContent).toContain('Bearer');
    });
  });

  // Response interceptor validation
  describe('Response interceptor', () => {
    it('handles 401 unauthorized errors', () => {
      expect(apiContent).toContain('interceptors.response.use');
      expect(apiContent).toContain('401');
    });

    it('handles 403 forbidden errors', () => {
      expect(apiContent).toContain('403');
    });

    it('handles 404 not found errors', () => {
      expect(apiContent).toContain('404');
    });

    it('handles 500 server errors', () => {
      expect(apiContent).toContain('500');
    });

    it('handles network errors (no response)', () => {
      expect(apiContent).toMatch(/error\.request/);
      expect(apiContent).toMatch(/[Nn]etwork error/);
    });
  });

  // Barrel export validation
  describe('Service barrel exports', () => {
    const indexContent = readFileSync(resolve(ROOT, 'src/services/index.ts'), 'utf-8');

    it('exports apiClient from index.ts', () => {
      expect(indexContent).toContain('apiClient');
      expect(indexContent).toContain("'./api'");
    });

    it('exports authService from index.ts', () => {
      expect(indexContent).toContain('authService');
    });
  });
});
