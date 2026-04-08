/**
 * TC-001 through TC-008: Configuration Validation Tests
 * Validates package.json, tsconfig, vite.config, eslint, prettier, and env template
 * 
 * @test-plan test_plan_fe_react_project_setup.md
 * @user-story US_001
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../..');

function readJson(relativePath: string) {
  const content = readFileSync(resolve(ROOT, relativePath), 'utf-8');
  // Parse JSONC (JSON with Comments): strip // and /* */ comments, then trailing commas
  const cleaned = content
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/,\s*([}\]])/g, '$1');
  return JSON.parse(cleaned);
}

describe('Configuration Validation', () => {
  // TC-001: Validate package.json structure
  describe('TC-001: package.json structure', () => {
    const pkg = readJson('package.json');

    it('has correct project name', () => {
      expect(pkg.name).toBe('clinical-appointment-platform');
    });

    it('includes React 19.x as dependency', () => {
      expect(pkg.dependencies.react).toBeDefined();
      expect(pkg.dependencies.react).toMatch(/^\^?19/);
    });

    it('includes React DOM as dependency', () => {
      expect(pkg.dependencies['react-dom']).toBeDefined();
    });

    it('includes React Router v7.x as dependency', () => {
      expect(pkg.dependencies['react-router-dom']).toBeDefined();
      expect(pkg.dependencies['react-router-dom']).toMatch(/^\^?7/);
    });

    it('includes TypeScript 5.9.x as devDependency', () => {
      expect(pkg.devDependencies.typescript).toBeDefined();
      expect(pkg.devDependencies.typescript).toMatch(/5\.9/);
    });

    it('includes Vite 5.x as devDependency', () => {
      expect(pkg.devDependencies.vite).toBeDefined();
      expect(pkg.devDependencies.vite).toMatch(/^\^?5/);
    });

    it('includes axios for API calls', () => {
      expect(pkg.dependencies.axios).toBeDefined();
    });

    it('includes @tanstack/react-query for data fetching', () => {
      expect(pkg.dependencies['@tanstack/react-query']).toBeDefined();
    });
  });

  // TC-002: Validate Node.js version enforcement
  describe('TC-002: Node.js version enforcement', () => {
    const pkg = readJson('package.json');

    it('has engines field defined', () => {
      expect(pkg.engines).toBeDefined();
    });

    it('requires Node.js >= 20.0.0', () => {
      expect(pkg.engines.node).toBe('>=20.0.0');
    });

    it('requires npm >= 9.0.0', () => {
      expect(pkg.engines.npm).toBe('>=9.0.0');
    });
  });

  // TC-003: Validate npm scripts
  describe('TC-003: npm scripts presence', () => {
    const pkg = readJson('package.json');
    const requiredScripts = ['dev', 'build', 'preview', 'lint', 'format', 'type-check', 'test'];

    it.each(requiredScripts)('has "%s" script', (script) => {
      expect(pkg.scripts[script]).toBeDefined();
      expect(pkg.scripts[script].length).toBeGreaterThan(0);
    });

    it('dev script uses vite', () => {
      expect(pkg.scripts.dev).toBe('vite');
    });

    it('build script includes TypeScript check and vite build', () => {
      expect(pkg.scripts.build).toContain('tsc');
      expect(pkg.scripts.build).toContain('vite build');
    });
  });

  // TC-004: Validate TypeScript configuration
  describe('TC-004: TypeScript config', () => {
    it('tsconfig.json exists', () => {
      expect(existsSync(resolve(ROOT, 'tsconfig.json'))).toBe(true);
    });

    it('tsconfig.app.json exists', () => {
      expect(existsSync(resolve(ROOT, 'tsconfig.app.json'))).toBe(true);
    });

    const tsContent = readFileSync(resolve(ROOT, 'tsconfig.app.json'), 'utf-8');

    it('has strict mode enabled', () => {
      expect(tsContent).toMatch(/"strict":\s*true/);
    });

    it('has path aliases configured', () => {
      expect(tsContent).toContain('"@/*"');
      expect(tsContent).toContain('"@components/*"');
      expect(tsContent).toContain('"@pages/*"');
      expect(tsContent).toContain('"@services/*"');
      expect(tsContent).toContain('"@utils/*"');
      expect(tsContent).toContain('"@types/*"');
      expect(tsContent).toContain('"@hooks/*"');
      expect(tsContent).toContain('"@contexts/*"');
    });

    it('targets ES2023', () => {
      expect(tsContent).toMatch(/"target":\s*"ES2023"/);
    });

    it('uses react-jsx', () => {
      expect(tsContent).toMatch(/"jsx":\s*"react-jsx"/);
    });

    it('enables noEmit for type-checking only', () => {
      expect(tsContent).toMatch(/"noEmit":\s*true/);
    });
  });

  // TC-005: Validate Vite config existence (runtime config tested separately)
  describe('TC-005: Vite config structure', () => {
    it('vite.config.ts exists', () => {
      expect(existsSync(resolve(ROOT, 'vite.config.ts'))).toBe(true);
    });

    it('contains react plugin import', () => {
      const content = readFileSync(resolve(ROOT, 'vite.config.ts'), 'utf-8');
      expect(content).toContain("@vitejs/plugin-react");
    });

    it('configures dev server port', () => {
      const content = readFileSync(resolve(ROOT, 'vite.config.ts'), 'utf-8');
      expect(content).toMatch(/port:\s*\d+/);
    });

    it('configures API proxy', () => {
      const content = readFileSync(resolve(ROOT, 'vite.config.ts'), 'utf-8');
      expect(content).toContain("'/api'");
    });

    it('configures path aliases', () => {
      const content = readFileSync(resolve(ROOT, 'vite.config.ts'), 'utf-8');
      expect(content).toContain("'@':");
      expect(content).toContain("'@components':");
      expect(content).toContain("'@services':");
    });

    it('supports VITE_BASE_PATH for IIS deployment', () => {
      const content = readFileSync(resolve(ROOT, 'vite.config.ts'), 'utf-8');
      expect(content).toContain('VITE_BASE_PATH');
    });
  });

  // TC-006: Validate ESLint configuration
  describe('TC-006: ESLint configuration', () => {
    it('eslint.config.js exists', () => {
      expect(existsSync(resolve(ROOT, 'eslint.config.js'))).toBe(true);
    });

    it('configures TypeScript ESLint', () => {
      const content = readFileSync(resolve(ROOT, 'eslint.config.js'), 'utf-8');
      expect(content).toContain('typescript-eslint');
    });

    it('configures react-hooks plugin', () => {
      const content = readFileSync(resolve(ROOT, 'eslint.config.js'), 'utf-8');
      expect(content).toContain('eslint-plugin-react-hooks');
    });

    it('configures react-refresh plugin', () => {
      const content = readFileSync(resolve(ROOT, 'eslint.config.js'), 'utf-8');
      expect(content).toContain('eslint-plugin-react-refresh');
    });
  });

  // TC-007: Validate Prettier configuration (project uses defaults or inline config)
  describe('TC-007: Prettier configuration', () => {
    it('prettier is installed as devDependency', () => {
      const pkg = readJson('package.json');
      expect(pkg.devDependencies.prettier).toBeDefined();
    });

    it('format script is configured', () => {
      const pkg = readJson('package.json');
      expect(pkg.scripts.format).toContain('prettier');
    });

    it('format:check script is configured', () => {
      const pkg = readJson('package.json');
      expect(pkg.scripts['format:check']).toContain('prettier --check');
    });
  });

  // TC-008: Validate env template
  describe('TC-008: env template', () => {
    it('.env.example exists', () => {
      expect(existsSync(resolve(ROOT, '.env.example'))).toBe(true);
    });

    it('contains VITE_API_URL', () => {
      const content = readFileSync(resolve(ROOT, '.env.example'), 'utf-8');
      expect(content).toContain('VITE_API_URL');
    });

    it('contains VITE_BASE_PATH', () => {
      const content = readFileSync(resolve(ROOT, '.env.example'), 'utf-8');
      expect(content).toContain('VITE_BASE_PATH');
    });

    it('contains VITE_APP_NAME', () => {
      const content = readFileSync(resolve(ROOT, '.env.example'), 'utf-8');
      expect(content).toContain('VITE_APP_NAME');
    });

    it('provides example values', () => {
      const content = readFileSync(resolve(ROOT, '.env.example'), 'utf-8');
      expect(content).toMatch(/VITE_API_URL=.+/);
      expect(content).toMatch(/VITE_BASE_PATH=.+/);
    });
  });
});
