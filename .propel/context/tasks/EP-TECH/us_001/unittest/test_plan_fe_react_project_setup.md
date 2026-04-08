# Unit Test Plan - Frontend React Project Setup (US_001)

## Requirement Reference
- **User Story**: us_001
- **Story Location**: `.propel/context/tasks/us_001/us_001.md`
- **Layer**: FE (Frontend Infrastructure)
- **Related Test Plans**: N/A (First foundational story)
- **Acceptance Criteria Covered**:
  - AC1: Dependencies install without errors with correct directory structure (src/, public/, tests/, config/)
  - AC2: Development server starts on port 3000 with HMR working correctly
  - AC3: Configuration files present (React Router v6, TypeScript, ESLint, Prettier, .env.example)
  - AC4: Production build completes successfully and outputs optimized static files

## Test Plan Overview

This test plan validates the React 18.x project setup and development environment configuration for the Clinical Appointment Platform. The focus is on infrastructure testing: build processes, configuration validation, development tooling, and environment variable handling. 

**Scope**: Configuration validation, build system tests, tooling verification, and edge case handling for Node.js version requirements and missing environment variables.

**Testing Framework**: Vitest v4.0.7 (Vite-native testing framework) with @testing-library/react v16.x for component testing utilities.

**Note**: Since this is an infrastructure setup story without application logic, tests focus on validating the development environment rather than business logic.

## Dependent Tasks
- None (foundational story - no dependencies)

## Components Under Test

| Component | Type | File Path | Responsibilities |
|-----------|------|-----------|------------------|
| Project Configuration | Config | `app/package.json` | Dependency management, scripts, Node version enforcement |
| Vite Build Configuration | Config | `app/vite.config.ts` | Build settings, dev server, API proxy, base path |
| TypeScript Configuration | Config | `app/tsconfig.json` | Type checking, path aliases, compiler options |
| ESLint Configuration | Config | `app/.eslintrc.json` | Code linting rules, TypeScript + React integration |
| Prettier Configuration | Config | `app/.prettierrc` | Code formatting rules |
| Environment Template | Config | `app/.env.example` | Environment variable documentation |
| React Entry Point | Module | `app/src/main.tsx` | Application bootstrap, router setup |
| Root Component | Component | `app/src/App.tsx` | Root-level routing structure |
| API Service | Service | `app/src/services/api.ts` | Axios instance configuration |

## Test Cases

### Configuration Validation Tests

| Test-ID | Type | Description | Given | When | Then | Assertions |
|---------|------|-------------|-------|------|------|------------|
| TC-001 | positive | Validate package.json structure | `package.json` exists with required fields | File is parsed | All required dependencies present | React 18.x, React DOM 18.x, React Router 6.x, TypeScript 5.3.x, Vite 5.x present |
| TC-002 | positive | Validate Node.js version enforcement | `package.json` engines field | File is read | Node version requirement specified | `engines.node >= "20.0.0"` present |
| TC-003 | positive | Validate npm scripts presence | `package.json` scripts field | Scripts are listed | All required scripts exist | `dev`, `build`, `preview`, `lint`, `format` scripts present |
| TC-004 | positive | Validate TypeScript config | `tsconfig.json` exists | Config is parsed | Strict mode and path aliases configured | `strict: true`, `paths` contains aliases for @components/*, @services/*, etc. |
| TC-005 | positive | Validate Vite config structure | `vite.config.ts` exists | Config is parsed | Dev server and proxy configured | Port 3000 or 5173, API proxy to backend port |
| TC-006 | positive | Validate ESLint configuration | `.eslintrc.json` exists | Config is parsed | TypeScript + React rules enabled | `@typescript-eslint/parser`, react-hooks plugin present |
| TC-007 | positive | Validate Prettier configuration | `.prettierrc` exists | Config is parsed | Formatting rules defined | `semi`, `singleQuote`, `tabWidth`, `trailingComma` configured |
| TC-008 | positive | Validate env template | `.env.example` exists | File is read | Required variables documented | `VITE_API_URL`, `VITE_BASE_PATH` present |

### File Structure Tests

| Test-ID | Type | Description | Given | When | Then | Assertions |
|---------|------|-------------|-------|------|------|------------|
| FS-001 | positive | Validate src/ directory structure | Project root | Directory is checked | Core folders exist | `src/components/`, `src/pages/`, `src/services/`, `src/utils/`, `src/types/`, `src/hooks/`, `src/contexts/`, `src/assets/` directories exist |
| FS-002 | positive | Validate public/ directory | Project root | Directory is checked | Public assets folder exists | `public/` directory exists |
| FS-003 | positive | Validate root files | Project root | Files are checked | Configuration files present | `package.json`, `vite.config.ts`, `tsconfig.json`, `.eslintrc.json`, `.prettierrc`, `.env.example`, `.gitignore` exist |
| FS-004 | positive | Validate entry point files | `src/` directory | Core files are checked | React entry points exist | `src/main.tsx`, `src/App.tsx` exist |
| FS-005 | positive | Validate barrel export files | Component directories | Index files are checked | Export aggregators present | `src/components/index.ts`, `src/pages/index.ts` exist |

### Build Process Tests

| Test-ID | Type | Description | Given | When | Then | Assertions |
|---------|------|-------------|-------|------|------|------------|
| BP-001 | positive | Validate development build | Dependencies installed | `npm run dev` executed | Dev server starts successfully | Server listening on port (3000 or 5173), no compilation errors |
| BP-002 | positive | Validate production build | Dependencies installed | `npm run build` executed | Build completes without errors | `dist/` directory created, `dist/index.html` exists, optimized assets present |
| BP-003 | positive | Validate TypeScript compilation | TypeScript files exist | `tsc --noEmit` executed | Type checking passes | Exit code 0, no type errors |
| BP-004 | positive | Validate linting | Source files exist | `npm run lint` executed | Linting passes | Exit code 0, no lint errors |
| BP-005 | positive | Validate code formatting | Source files exist | `npm run format:check` executed | Format check passes | Exit code 0, all files properly formatted |
| BP-006 | edge_case | Validate build with missing dependencies | `node_modules/` deleted | `npm run build` executed | Build fails gracefully | Error message indicates missing dependencies |

### Environment Variable Tests

| Test-ID | Type | Description | Given | When | Then | Assertions |
|---------|------|-------------|-------|------|------|------------|
| ENV-001 | positive | Validate env loading in development | `.env` file with `VITE_API_URL` | Dev server started | Environment variable accessible | `import.meta.env.VITE_API_URL` resolves correctly |
| ENV-002 | positive | Validate env template documentation | `.env.example` file | File is read | All required variables documented | `VITE_API_URL`, `VITE_BASE_PATH` with example values |
| ENV-003 | negative | Validate missing required env behavior | `.env` missing `VITE_API_URL` | Application accessed | Graceful handling or clear error | Application handles undefined env or shows clear error message |
| ENV-004 | positive | Validate env in production build | `.env` file | Production build executed | Env variables embedded | Built files contain env variable values (not dynamic) |

### Routing Configuration Tests

| Test-ID | Type | Description | Given | When | Then | Assertions |
|---------|------|-------------|-------|------|------|------------|
| RT-001 | positive | Validate React Router setup | `main.tsx` with BrowserRouter | Application rendered | Router initialized | BrowserRouter wraps App component |
| RT-002 | positive | Validate base path configuration | `VITE_BASE_PATH` env variable | Router configured | Base path applied | BrowserRouter `basename` prop uses env variable |
| RT-003 | edge_case | Validate IIS deployment path | `VITE_BASE_PATH="/clinic"` | Build with base path | Assets use correct base | Built `index.html` references assets with `/clinic` prefix |

### API Service Configuration Tests

| Test-ID | Type | Description | Given | When | Then | Assertions |
|---------|------|-------------|-------|------|------|------------|
| API-001 | positive | Validate axios instance creation | `src/services/api.ts` | Module imported | Axios instance created | Instance has `baseURL` from `import.meta.env.VITE_API_URL` |
| API-002 | positive | Validate API proxy in dev | Vite config with proxy | Dev server running | API requests proxied | Requests to `/api/*` proxied to backend port |
| API-003 | negative | Validate API error on missing baseURL | `VITE_API_URL` undefined | Axios instance used | Fail gracefully or use fallback | Error handled or default localhost URL used |

### Edge Case Tests

| Test-ID | Type | Description | Given | When | Then | Assertions |
|---------|------|-------------|-------|------|------|------------|
| EC-001 | edge_case | Validate Node version check | Node.js v18.x installed | `npm install` executed | Installation fails or warns | Error message: "Node.js >=20.0.0 required" |
| EC-002 | edge_case | Validate missing env on build | No `.env` file | `npm run build` executed | Build fails with clear message | Error lists missing `VITE_API_URL` variable |
| EC-003 | edge_case | Validate empty env values | `.env` with empty `VITE_API_URL` | Application started | Handles empty value | No crash, uses fallback or shows warning |
| EC-004 | edge_case | Validate malformed config files | `.prettierrc` with JSON syntax error | Load configuration | Error is caught | Clear parse error message displayed |

### Hot Module Replacement (HMR) Tests

| Test-ID | Type | Description | Given | When | Then | Assertions |
|---------|------|-------------|-------|------|------|------------|
| HMR-001 | positive | Validate HMR functionality | Dev server running, browser open | Edit `App.tsx` and save | Page updates without full reload | Component re-renders, state preserved if possible |
| HMR-002 | positive | Validate HMR for CSS changes | Dev server running | Edit CSS file and save | Styles update instantly | No page reload, CSS changes immediately visible |

### Error Scenario Tests

| Test-ID | Type | Description | Given | When | Then | Assertions |
|---------|------|-------------|-------|------|------|------------|
| ES-001 | error | Validate build with TypeScript errors | `.ts` file with type errors | `npm run build` executed | Build fails | Exit code 1, TypeScript errors displayed |
| ES-002 | error | Validate dev server with port conflict | Port 3000/5173 already in use | `npm run dev` executed | Server fails to start or uses next port | Error message or fallback port (3001/5174) used |
| ES-003 | error | Validate malformed vite.config.ts | Syntax error in config | `npm run dev` executed | Config load fails | Clear syntax error message |

## Expected Changes

| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | `app/test-setup.ts` | Vitest setup file with global test utilities |
| CREATE | `app/vitest.config.ts` | Vitest configuration for React + TypeScript |
| CREATE | `app/__tests__/config/package.test.ts` | Tests for package.json structure |
| CREATE | `app/__tests__/config/vite.test.ts` | Tests for Vite configuration |
| CREATE | `app/__tests__/config/typescript.test.ts` | Tests for TypeScript configuration |
| CREATE | `app/__tests__/config/eslint.test.ts` | Tests for ESLint configuration |
| CREATE | `app/__tests__/structure/directories.test.ts` | Tests for file/directory structure |
| CREATE | `app/__tests__/build/build-process.test.ts` | Tests for build processes |
| CREATE | `app/__tests__/env/environment-variables.test.ts` | Tests for environment variable handling |
| CREATE | `app/__tests__/fixtures/config-samples.ts` | Mock configuration files for testing |
| UPDATE | `app/package.json` | Add test dependencies: vitest, @testing-library/react, jsdom |

## Mocking Strategy

| Dependency | Mock Type | Mock Behavior | Return Value |
|------------|-----------|---------------|--------------|
| fs (Node.js) | mock | File system operations | Mocked file contents for config files |
| process.env | stub | Environment variables | Test-specific env values |
| import.meta.env | stub | Vite environment variables | Mocked `VITE_*` variables |
| child_process | mock | npm command execution | Success/failure exit codes |

**Note**: Since this is infrastructure testing, most tests will use actual file system checks rather than mocks, but build process tests may mock command execution.

## Test Data

| Scenario | Input Data | Expected Output |
|----------|------------|-----------------|
| Valid package.json | `{ "name": "clinical-appointment-platform", "version": "1.0.0", "engines": { "node": ">=20.0.0" } }` | Validation passes |
| Invalid Node version | Node v18.19.0 | Error: "Node.js >=20.0.0 required" |
| Valid .env | `VITE_API_URL=http://localhost:3001/api\nVITE_BASE_PATH=/` | Env loads successfully |
| Missing required env | No `VITE_API_URL` | Build warning or error with variable name |
| Valid directory structure | `src/`, `public/`, config files present | Structure validation passes |
| Missing core directory | `src/components/` directory missing | Structure validation fails |

## Test Commands
- **Setup Testing Framework**: `npm install --save-dev vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event`
- **Run All Tests**: `npm test` or `npx vitest`
- **Run Tests with UI**: `npx vitest --ui`
- **Run with Coverage**: `npx vitest --coverage`
- **Run Single Test File**: `npx vitest __tests__/config/package.test.ts`
- **Run Tests in Watch Mode**: `npx vitest --watch`
- **Type Check**: `npx tsc --noEmit`

## Coverage Target
- **Line Coverage**: 85% (configuration and setup code)
- **Branch Coverage**: 80% (error handling paths)
- **Critical Paths**: 
  - Package.json validation: 100%
  - Node version enforcement: 100%
  - Environment variable loading: 100%
  - Build process completion: 100%

## Documentation References
- **Vitest Documentation**: https://vitest.dev/ (v4.0.7)
- **React Testing Library**: https://testing-library.com/docs/react-testing-library/intro
- **Vite Configuration**: https://vitejs.dev/config/
- **TypeScript Testing**: https://www.typescriptlang.org/docs/handbook/testing.html
- **Project Test Patterns**: `server/tests/unit/` (reference for Jest patterns, adapt to Vitest)

## Implementation Checklist
- [x] Install Vitest and testing dependencies (`vitest`, `@vitest/ui`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`)
- [x] Create `vitest.config.ts` with React plugin and jsdom environment
- [x] Create `test-setup.ts` for global test configuration
- [x] Update `package.json` with test scripts (`test`, `test:ui`, `test:coverage`)
- [x] Create `__tests__/` directory structure matching testing layers
- [x] Implement configuration validation tests (TC-001 through TC-008)
- [x] Implement file structure validation tests (FS-001 through FS-005)
- [x] Implement build process tests (BP-001 through BP-006)
- [x] Implement environment variable tests (ENV-001 through ENV-004)
- [x] Implement routing configuration tests (RT-001 through RT-003)
- [x] Implement API service tests (API-001 through API-003)
- [x] Implement edge case tests (EC-001 through EC-004)
- [ ] Implement HMR tests (HMR-001, HMR-002) — Manual integration tests, not automatable in CI
- [x] Implement error scenario tests (ES-001 through ES-003)
- [x] Run full test suite and validate coverage meets 85% target
- [x] Document any test failures or infrastructure issues
- [x] Update project README with testing instructions

## Testing Framework Setup Instructions

### 1. Install Dependencies
```bash
cd app
npm install --save-dev vitest@4.0.7 @vitest/ui jsdom
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev @vitest/coverage-v8
```

### 2. Create vitest.config.ts
```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test-setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '__tests__/',
        '*.config.ts',
        '*.config.js',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
    },
  },
});
```

### 3. Create test-setup.ts
```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

### 4. Update package.json scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run"
  }
}
```

## Notes and Considerations

1. **Infrastructure vs. Application Testing**: This test plan focuses on infrastructure validation (configuration, build processes, tooling) rather than application logic testing. Future user stories will require component and integration testing.

2. **Testing Framework Selection**: Vitest is chosen over Jest for its native Vite integration, faster execution, and compatibility with ESM modules. It provides Jest-compatible APIs for easier migration.

3. **File System Testing**: Many tests validate file existence and configuration structure. These are integration-style tests that check actual project setup rather than mocked scenarios.

4. **Node Version Enforcement**: The `engines` field in package.json enforces Node >=20.0.0. Testing this requires running install with older Node versions, which should be documented as a manual test.

5. **HMR Testing**: Hot Module Replacement tests require a running dev server and browser automation. These may be better suited to E2E tests with Playwright (already configured in `test-automation/`).

6. **Build Process Tests**: Build tests execute actual npm commands. In CI/CD environments, these should use cached dependencies to avoid unnecessary network requests.

7. **Coverage Limitations**: Configuration files and build scripts may not be covered by traditional code coverage metrics. Manual validation and integration testing complement unit test coverage.

8. **Test Isolation**: Since this is infrastructure testing, tests ARE isolated but validate real file system state. Use temporary directories or cleanup hooks to prevent test pollution.

## Validation Criteria

### Definition of Done
- [ ] All 40+ test cases implemented and passing
- [ ] Code coverage ≥85% for testable components
- [ ] All acceptance criteria validated through automated tests
- [ ] Edge cases covered with appropriate assertions
- [ ] Test execution time <30 seconds for full suite
- [ ] Documentation complete with setup and execution instructions
- [ ] CI/CD integration ready (tests can run in GitHub Actions/Azure Pipelines)

### Success Metrics
- Zero test failures on clean install
- Build process validation completes in <10 seconds
- Configuration validation catches all malformed configs
- Environment variable tests prevent runtime errors
- Test suite provides clear error messages for failures
