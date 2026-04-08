/**
 * RT-001 through RT-003: Routing Configuration Tests
 * Validates React Router setup, base path configuration, and IIS deployment support
 * 
 * @test-plan test_plan_fe_react_project_setup.md
 * @user-story US_001
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../..');

describe('Routing Configuration Validation', () => {
  // RT-001: Validate React Router setup
  describe('RT-001: React Router setup in main.tsx', () => {
    const mainContent = readFileSync(resolve(ROOT, 'src/main.tsx'), 'utf-8');

    it('imports BrowserRouter from react-router-dom', () => {
      expect(mainContent).toContain("import { BrowserRouter } from 'react-router-dom'");
    });

    it('wraps App with BrowserRouter', () => {
      expect(mainContent).toContain('<BrowserRouter');
      expect(mainContent).toContain('<App');
      expect(mainContent).toContain('</BrowserRouter>');
    });

    it('wraps App with StrictMode', () => {
      expect(mainContent).toContain('<StrictMode>');
      expect(mainContent).toContain('</StrictMode>');
    });
  });

  // RT-002: Validate base path configuration
  describe('RT-002: base path configuration', () => {
    const mainContent = readFileSync(resolve(ROOT, 'src/main.tsx'), 'utf-8');

    it('BrowserRouter uses basename prop from env', () => {
      expect(mainContent).toContain('basename={basePath}');
    });

    it('basePath reads from VITE_BASE_PATH', () => {
      expect(mainContent).toContain('import.meta.env.VITE_BASE_PATH');
    });

    it('defaults to "/" when VITE_BASE_PATH is not set', () => {
      expect(mainContent).toMatch(/VITE_BASE_PATH\s*\|\|\s*['"]\/['"]/);
    });
  });

  // RT-003: IIS deployment path support
  describe('RT-003: IIS deployment path support', () => {
    it('vite.config.ts uses VITE_BASE_PATH for build base', () => {
      const viteConfig = readFileSync(resolve(ROOT, 'vite.config.ts'), 'utf-8');
      expect(viteConfig).toContain('VITE_BASE_PATH');
      expect(viteConfig).toMatch(/base:\s*env\.VITE_BASE_PATH/);
    });

    it('.env.example documents base path with IIS context', () => {
      const envContent = readFileSync(resolve(ROOT, '.env.example'), 'utf-8');
      expect(envContent).toMatch(/IIS/i);
      expect(envContent).toContain('VITE_BASE_PATH');
    });
  });

  // App.tsx routing structure
  describe('App.tsx routing structure', () => {
    const appContent = readFileSync(resolve(ROOT, 'src/App.tsx'), 'utf-8');

    it('imports Routes and Route from react-router-dom', () => {
      expect(appContent).toContain('Routes');
      expect(appContent).toContain('Route');
      expect(appContent).toContain("from 'react-router-dom'");
    });

    it('uses <Routes> for route definition', () => {
      expect(appContent).toContain('<Routes>');
      expect(appContent).toContain('</Routes>');
    });

    it('has login route defined', () => {
      expect(appContent).toMatch(/path=["']\/login["']/);
    });

    it('uses ProtectedRoute for authenticated pages', () => {
      expect(appContent).toContain('ProtectedRoute');
    });
  });
});
