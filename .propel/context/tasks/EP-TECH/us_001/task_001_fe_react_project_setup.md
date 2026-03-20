# Task - TASK_001_FE_REACT_PROJECT_SETUP

## Requirement Reference
- User Story: US_001  
- Story Location: `.propel/context/tasks/us_001/us_001.md`
- Acceptance Criteria:
    - AC1: Dependencies install without errors with correct directory structure (src/, public/, tests/, config/)
    - AC2: Development server starts on port 3000 with HMR working
    - AC3: Configuration files present (React Router v6, TypeScript, ESLint, Prettier, .env.example)
    - AC4: Production build completes successfully
- Edge Cases:
    - Node.js version <20.x: Display clear error with minimum version requirement
    - Missing environment variables during build: Fail with specific variable names
    - React Router path conflicts: Document base path for IIS deployment

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | N/A |
| **UXR Requirements** | N/A |
| **Design Tokens** | N/A |

> **Note**: Infrastructure task - no UI implementation

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.2 |
| Frontend | TypeScript | 5.3.x |
| Frontend | React Router | 6.x |
| Frontend | Vite | 5.x |
| Backend | N/A | N/A |
| Database | N/A | N/A |
| AI/ML | N/A | N/A |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

> **Note**: No AI implementation required for infrastructure setup

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Web application only

## Task Overview
Initialize React 18.2 project with TypeScript, routing, and development tooling. Create folder structure for scalable application development with proper configuration for ESLint, Prettier, and environment variables. Ensure compatibility with Windows Services/IIS deployment (NFR-006) and free hosting platforms (NFR-007).

## Dependent Tasks
- None (foundational task)

## Impacted Components
**New:**
- app/ (entire frontend codebase structure)
- app/src/App.tsx (root component)
- app/src/main.tsx (entry point)
- app/vite.config.ts (build configuration)
- app/.env.example (environment template)
- app/tsconfig.json (TypeScript configuration)
- app/.eslintrc.json (linting rules)
- app/.prettierrc (code formatting)

## Implementation Plan
1. **Initialize Vite React-TS project**: Use `npm create vite@latest app -- --template react-ts`
2. **Install dependencies**: Add React Router v6, ESLint plugins, Prettier, testing libraries
3. **Configure folder structure**: Create src/{components/, pages/, services/, utils/, types/, hooks/, contexts/, assets/}
4. **Setup routing**: Configure React Router with base path support for IIS
5. **Environment configuration**: Create .env.example with required variables (VITE_API_URL, VITE_BASE_PATH)
6. **Tooling setup**: Configure ESLint (Airbnb + TypeScript), Prettier (2-space tabs, single quotes, trailing commas)
7. **Node version check**: Add engines field in package.json to enforce Node >= 20.x
8. **Build scripts**: Configure vite build with proper base path and optimization

## Current Project State
```
ASSIGNMENT/
├── .propel/              # Project documentation
├── test-automation/      # Playwright tests (already created)
└── (app/ to be created)  # Frontend application
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/package.json | Dependencies: react@18.2, react-dom@18.2, react-router-dom@6.x, typescript@5.3, vite@5.x|
| CREATE | app/vite.config.ts | Build configuration with base path, proxy to backend (port 3001) |
| CREATE | app/tsconfig.json | TypeScript strict mode, path aliases, ESNext target |
| CREATE | app/.eslintrc.json | Airbnb config + @typescript-eslint, react-hooks plugin |
| CREATE | app/.prettierrc | 2-space indent, single quotes, trailing commas all |
| CREATE | app/.env.example | VITE_API_URL=http://localhost:3001/api, VITE_BASE_PATH=/ |
| CREATE | app/src/main.tsx | React.StrictMode + BrowserRouter setup |
| CREATE | app/src/App.tsx | Root component with Routes setup |
| CREATE | app/src/components/index.ts | Component exports barrel file |
| CREATE | app/src/pages/index.ts | Page exports barrel file |
| CREATE | app/src/services/api.ts | Axios instance with baseURL from env |
| CREATE | app/src/types/index.ts | Global TypeScript types |
| CREATE | app/src/utils/index.ts | Utility functions |
| CREATE | app/public/index.html | HTML template with meta tags |
| CREATE | app/.gitignore | node_modules, dist, .env, coverage |
| CREATE | app/README.md | Setup instructions, commands, folder structure |

> All files created as new - no existing codebase to modify

## External References
- [React 18.2 Documentation](https://react.dev/)
- [Vite Configuration](https://vitejs.dev/config/)
- [React Router v6 Tutorial](https://reactrouter.com/en/main/start/tutorial)
- [TypeScript 5.3 Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [ESLint Airbnb Config](https://github.com/airbnb/javascript/tree/master/packages/eslint-config-airbnb)
- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)
- [Vite Base Path for IIS](https://vitejs.dev/guide/build.html#public-base-path)

## Build Commands
```bash
# Install dependencies
cd app
npm install

# Development server (port 3000)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint check
npm run lint

# Format code
npm run format
```

## Implementation Validation Strategy
- [x] Unit tests pass (N/A for infrastructure setup)
- [x] Integration tests pass (N/A for infrastructure setup)
- [x] `npm install` completes without errors
- [x] `npm run dev` starts server on port 3000 with HMR working (edit App.tsx, verify instant update)
- [x] `npm run build` generates optimized dist/ folder with index.html
- [x] TypeScript compiles without errors: `npx tsc --noEmit`
- [x] ESLint passes without errors: `npm run lint`
- [x] Prettier formatting applies correctly: `npm run format`
- [x] Environment variables load from .env file
- [x] React Router base path configurable via VITE_BASE_PATH
- [x] Node version check: Run with Node 18.x -> should display error (enforced via package.json engines field)
- [x] Folder structure verified: src/, public/, tests/, config/ directories exist

## Implementation Checklist
- [x] Run `npm create vite@latest app -- --template react-ts`
- [x] Install dependencies: `npm install react-router-dom axios @types/node eslint prettier`
- [x] Create folder structure: src/{components/,pages/,services/,utils/,types/,hooks/,contexts/,assets/}
- [x] Configure vite.config.ts with base path and API proxy (proxy /api -> http://localhost:3001)
- [x] Setup tsconfig.json paths: @components/*, @pages/*, @services/*, @utils/*, @types/*
- [x] Create .env.example with VITE_API_URL and VITE_BASE_PATH
- [x] Configure ESLint: `npm install -D eslint-config-airbnb-typescript @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react-hooks`
- [x] Create .prettierrc: `{ "semi": true, "singleQuote": true, "tabWidth": 2, "trailingComma": "all" }`
- [x] Add scripts to package.json: dev, build, preview, lint, format
- [x] Add engines field: `"engines": { "node": ">=20.0.0" }`
- [x] Create src/main.tsx with StrictMode + BrowserRouter + base path from env
- [x] Create src/App.tsx with Routes placeholder
- [x] Create src/services/api.ts with axios instance using import.meta.env.VITE_API_URL
- [x] Create barrel files: src/components/index.ts, src/pages/index.ts
- [x] Test dev server: `npm run dev` -> open http://localhost:3000
- [x] Test HMR: Edit App.tsx, verify instant browser update
- [x] Test production build: `npm run build` -> verify dist/ folder created
- [x] Test linting: `npm run lint` -> should pass with 0 errors
- [x] Test formatting: `npm run format` -> verify files formatted
- [x] Document setup steps in app/README.md
