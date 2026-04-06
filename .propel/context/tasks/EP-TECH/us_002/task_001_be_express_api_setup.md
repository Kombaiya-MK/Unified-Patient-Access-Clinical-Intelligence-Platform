# Task - TASK_001_BE_EXPRESS_API_SETUP

## Requirement Reference
- User Story: US_002
- Story Location: `.propel/context/tasks/us_002/us_002.md`
- Acceptance Criteria:
    - AC1: Express 4.x, middleware (CORS, helmet, morgan), dependencies install successfully
    - AC2: Express server starts on port 3001 with nodemon, logs requests to console
    - AC3: Organized routes/ (authentication, appointments, patients), middleware/ (auth, errorHandler, validation), config/ (database, redis, openai) directories
    - AC4: Error handling middleware returns JSON with status, message, stack (dev only), no server crash
- Edge Cases:
    - Missing environment variables (DB_URL, REDIS_URL, JWT_SECRET): Server fails with clear error
    - Uncaught promise rejections: Global handler logs and returns 500
    - Port 3001 in use: Try ports 3002-3005 or display error

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

> **Note**: Backend infrastructure - no UI

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.x |
| Backend | TypeScript | 5.3.x |
| Database | N/A (setup in US_003) | N/A |
| AI/ML | N/A (setup in US_041) | N/A |

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

> **Note**: No AI implementation - infrastructure setup only

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend API only

## Task Overview
Initialize Node.js Express backend with TypeScript, middleware (CORS, Helmet, Morgan), routing structure, and comprehensive error handling. Create modular folder structure for controllers, services, routes, middleware, and configuration. Implement environment variable validation and graceful port fallback (NFR-002, NFR-004).

## Dependent Tasks
- US_001: Frontend structure must exist (for CORS whitelist configuration)

## Impacted Components
**New:**
- server/ (entire backend codebase)
- server/src/app.ts (Express app configuration)
- server/src/server.ts (HTTP server entry point)
- server/src/routes/ (API route definitions)
- server/src/middleware/ (auth, error handling, validation)
- server/src/controllers/ (request handlers)
- server/src/services/ (business logic)
- server/src/config/ (environment, database, redis, openai)
- server/src/types/ (TypeScript type definitions)
- server/src/utils/ (helper functions)

## Implementation Plan
1. **Initialize Node.js project**: Create server/ directory with `npm init -y`
2. **Install dependencies**: Express 4.x, TypeScript 5.3, middleware (cors, helmet, morgan), nodemon, dotenv
3. **TypeScript configuration**: Setup tsconfig.json for Node.js with strict mode, ES2022 target
4. **Folder structure**: Create src/{routes/,middleware/,controllers/,services/,config/,types/,utils/}
5. **Express app setup**: Configure middleware pipeline (helmet → cors → morgan → json parser → routes → error handler)
6. **Environment validation**: Create config/env.ts to validate required vars (DB_URL, REDIS_URL, JWT_SECRET, PORT)
7. **Error handling middleware**: Implement global error handler with development/production modes
8. **Uncaught exception handlers**: Setup process.on('unhandledRejection') and process.on('uncaughtException')
9. **Port fallback logic**: Try ports 3001-3005, log which port was used
10. **CORS configuration**: Whitelist frontend origin (http://localhost:3000) and production domains

## Current Project State
```
ASSIGNMENT/
├── app/                  # Frontend (created in US_001)
│   ├── src/
│   └── package.json
└── (server/ to be created)  # Backend API
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/package.json | Dependencies: express@4.x, typescript@5.3, cors, helmet, morgan, dotenv, nodemon |
| CREATE | server/tsconfig.json | Strict mode, ES2022, outDir: dist, rootDir: src |
| CREATE | server/.env.example | PORT=3001, DB_URL, REDIS_URL, JWT_SECRET, NODE_ENV=development |
| CREATE | server/src/server.ts | HTTP server entry point with port fallback logic |
| CREATE | server/src/app.ts | Express app with middleware pipeline and route registration |
| CREATE | server/src/config/env.ts | Environment variable validation using dotenv + custom validator |
| CREATE | server/src/middleware/errorHandler.ts | Global error handler (status, message, stack in dev mode) |
| CREATE | server/src/middleware/auth.ts | JWT authentication middleware (placeholder) |
| CREATE | server/src/middleware/validation.ts | Request validation middleware using express-validator |
| CREATE | server/src/routes/index.ts | Route aggregator (imports auth, appointments, patients routes) |
| CREATE | server/src/routes/auth.routes.ts | Authentication endpoints (placeholder) |
| CREATE | server/src/routes/appointments.routes.ts | Appointment endpoints (placeholder) |
| CREATE | server/src/routes/patients.routes.ts | Patient endpoints (placeholder) |
| CREATE | server/src/controllers/index.ts | Controller exports barrel file |
| CREATE | server/src/services/index.ts | Service exports barrel file |
| CREATE | server/src/types/index.ts | Global TypeScript types (ApiError, ApiResponse) |
| CREATE | server/src/utils/logger.ts | Winston logger setup |
| CREATE | server/.gitignore | node_modules, dist, .env, logs |
| CREATE | server/README.md | Setup instructions, API documentation structure |

> All files created as new - no existing backend codebase

## External References
- [Express 4.x Documentation](https://expressjs.com/en/4x/api.html)
- [TypeScript for Node.js](https://www.typescriptlang.org/docs/handbook/declaration-files/templates/module-d-ts.html)
- [Helmet.js Security](https://helmetjs.github.io/)
- [CORS Middleware](https://www.npmjs.com/package/cors)
- [Morgan HTTP Logger](https://www.npmjs.com/package/morgan)
- [Node.js Error Handling Best Practices](https://nodejs.org/en/docs/guides/dont-block-the-event-loop/)
- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)
- [dotenv Configuration](https://www.npmjs.com/package/dotenv)

## Build Commands
```bash
# Install dependencies
cd server
npm install

# Development server (nodemon + ts-node)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint check
npm run lint

# Type check
npm run type-check
```

## Implementation Validation Strategy
- [x] Unit tests pass (N/A for infrastructure setup)
- [x] Integration tests pass (N/A for infrastructure setup)
- [x] `npm install` completes without errors
- [x] `npm run dev` starts server on port 3001 with nodemon watching
- [x] HTTP request to http://localhost:3001/api/health returns 200 OK
- [x] CORS allows requests from http://localhost:3000
- [x] Missing .env file: Server fails with clear error listing missing variables
- [x] Invalid JWT_SECRET format: Validation error displayed
- [x] Port 3001 occupied: Server tries 3002, logs "Server running on port 3002"
- [x] Unhandled promise rejection: Logged with stack trace, 500 response sent
- [x] Uncaught exception: Logged and server shuts down gracefully
- [x] TypeScript compiles without errors: `npm run build`
- [x] ESLint passes: `npm run lint`
- [x] Helmet security headers present in response (verify with curl -I)
- [x] Morgan logs incoming requests to console

## Implementation Checklist
- [x] Create server/ directory: `mkdir server && cd server`
- [x] Initialize Node.js project: `npm init -y`
- [x] Install dependencies: `npm install express cors helmet morgan dotenv`
- [x] Install dev dependencies: `npm install -D typescript @types/node @types/express @types/cors @types/morgan nodemon ts-node eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser`
- [x] Create tsconfig.json: strict mode, target: ES2022, module: commonjs, outDir: dist, rootDir: src
- [x] Add scripts to package.json: dev (nodemon), build (tsc), start (node dist/server.js), lint, type-check
- [x] Create .env.example with PORT, DB_URL, REDIS_URL, JWT_SECRET, NODE_ENV
- [x] Create folder structure: src/{config/,middleware/,routes/,controllers/,services/,types/,utils/}
- [x] Implement config/env.ts: Load dotenv, validate required vars, export config object
- [x] Implement middleware/errorHandler.ts: (err, req, res, next) => JSON response with status, message, stack (dev only)
- [x] Implement middleware/auth.ts: Placeholder for JWT verification (verify token from Authorization header)
- [x] Implement middleware/validation.ts: Wrapper for express-validator
- [x] Implement utils/logger.ts: Winston logger with console + file transports
- [x] Implement app.ts: Express app with middleware (helmet → cors → morgan → json → routes → errorHandler)
- [x] Implement server.ts: HTTP server with port fallback (3001-3005), graceful shutdown, unhandledRejection/uncaughtException handlers
- [x] Implement routes/index.ts: Import auth, appointments, patients routes, mount on /api prefix
- [x] Create route files: auth.routes.ts, appointments.routes.ts, patients.routes.ts (placeholder GET endpoints)
- [x] Create health check endpoint: GET /api/health -> { status: 'ok', timestamp: Date.now() }
- [x] Configure CORS: whitelist ['http://localhost:3000', process.env.FRONTEND_URL]
- [x] Test server startup: `npm run dev` -> verify "Server running on port 3001"
- [x] Test health endpoint: `curl http://localhost:3001/api/health`
- [x] Test CORS: `curl -H "Origin: http://localhost:3000" -I http://localhost:3001/api/health` -> verify Access-Control-Allow-Origin header
- [x] Test error handler: Create test route that throws error, verify JSON error response
- [x] Test port fallback: Occupy 3001, start server, verify it uses 3002
- [x] Document API structure in server/README.md
