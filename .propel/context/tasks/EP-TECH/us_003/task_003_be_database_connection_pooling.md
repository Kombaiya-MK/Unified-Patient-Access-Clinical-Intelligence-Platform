# Task - TASK_003_BE_DATABASE_CONNECTION_POOLING

## Requirement Reference
- User Story: US_003  
- Story Location: `.propel/context/tasks/us_003/us_003.md`
- Acceptance Criteria:
    - AC3: Database connection configured, backend starts and successfully connects to PostgreSQL using connection pooling (pg library) with max 20 connections, logs connection status
- Edge Cases:
    - Database connection failures during startup: Retry 3 times with exponential backoff, then exit with error

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

> **Note**: Backend database integration - no UI

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | pg (node-postgres) | 8.x |
| Backend | TypeScript | 5.3.x |
| Database | PostgreSQL | 15+ |
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

> **Note**: Database connection only - no AI logic

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend API only

## Task Overview
Integrate PostgreSQL database connection pooling into Express backend using node-postgres (pg) library with max 20 connections. Implement connection retry logic with exponential backoff (3 attempts), health check endpoint, comprehensive logging, and graceful shutdown. Handle connection errors and environment variable validation.

## Dependent Tasks
- TASK_001_DB_POSTGRESQL_PGVECTOR_SETUP: Database must be installed and running
- TASK_002_DB_SCHEMA_TABLES_CREATION: Tables must exist for connection validation
- US_002: Express backend API must be set up

## Impacted Components
**Modified:**
- server/package.json (add pg, @types/pg dependencies)
- server/src/app.ts (import database module, add health check route)
- server/src/server.ts (connect to database before starting server)
- server/.env.example (add database connection variables)

**New:**
- server/src/config/database.ts (PostgreSQL Pool configuration)
- server/src/utils/dbHealthCheck.ts (connection validation and retry logic)
- server/src/middleware/dbConnection.ts (middleware to ensure DB connected)
- server/src/types/database.types.ts (TypeScript types for query results)

## Implementation Plan
1. **Install Dependencies**: Add pg@8.x and @types/pg to server/package.json
2. **Database Configuration**: Create config/database.ts with Pool setup (max 20 connections, idle timeout 10s)
3. **Environment Variables**: Add DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_SSL to .env.example
4. **Connection Pool**: Initialize Pool with configuration from environment variables
5. **Health Check Utility**: Create dbHealthCheck.ts with retry logic (3 attempts, exponential backoff: 1s, 2s, 4s)
6. **Connection Logging**: Log successful connection (host, port, database name) and failures with error details
7. **Startup Integration**: Call dbHealthCheck() in server.ts before Express server starts
8. **Middleware**: Create dbConnection middleware to attach pool to req.db for route handlers
9. **Health Endpoint**: Add GET /api/health endpoint that queries `SELECT 1` to verify connection
10. **Graceful Shutdown**: Listen for SIGTERM/SIGINT signals and close pool with pool.end()
11. **Error Handling**: Catch connection errors and exit process with code 1 after 3 failed retries
12. **Query Logging**: Add query logging in development mode (log SQL queries and execution time)

## Current Project State
```
ASSIGNMENT/
├── app/                     # Frontend (US_001)
├── server/                  # Backend API (US_002)
│   ├── src/
│   │   ├── app.ts          # Express app (to be modified)
│   │   ├── server.ts       # Entry point (to be modified)
│   │   ├── config/         # Configuration files
│   │   └── middleware/     # Middleware functions
└── database/                # Database setup (US_003 Tasks 1-2)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| MODIFY | server/package.json | Add dependencies: pg@8.x, @types/pg@8.x |
| MODIFY | server/.env.example | Add DB_HOST, DB_PORT=5432, DB_NAME=upaci, DB_USER, DB_PASSWORD, DB_SSL=false, DB_MAX_CONNECTIONS=20 |
| CREATE | server/src/config/database.ts | Pool configuration with max 20 connections, connect timeout 5s, idle timeout 10s |
| CREATE | server/src/utils/dbHealthCheck.ts | Connection validation with 3 retries, exponential backoff (1s, 2s, 4s) |
| CREATE | server/src/middleware/dbConnection.ts | Attach pool to req.db, ensure connection active |
| CREATE | server/src/types/database.types.ts | QueryResult types, DbError interface |
| MODIFY | server/src/app.ts | Import database, add GET /api/health endpoint |
| MODIFY | server/src/server.ts | Call dbHealthCheck() before server.listen(), add graceful shutdown |
| CREATE | server/src/utils/queryLogger.ts | Log SQL queries in development (query text, params, execution time) |
| CREATE | server/docs/DATABASE_INTEGRATION.md | Documentation for database connection, query examples, troubleshooting |

> 4 modified files, 6 new files created

## External References
- [node-postgres (pg) Documentation](https://node-postgres.com/)
- [PostgreSQL Pool Configuration](https://node-postgres.com/api/pool)
- [Connection Pooling Best Practices](https://node-postgres.com/features/pooling)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/15/libpq-connect.html#LIBPQ-CONNSTRING)
- [Exponential Backoff Algorithm](https://en.wikipedia.org/wiki/Exponential_backoff)
- [Node.js Graceful Shutdown](https://nodejs.org/api/process.html#process_signal_events)
- [pg TypeScript Support](https://www.npmjs.com/package/@types/pg)
- [PostgreSQL SSL Connection](https://node-postgres.com/features/ssl)

## Build Commands
```bash
# Install dependencies
cd server
npm install pg @types/pg

# Update .env with database credentials
cp .env.example .env
# Edit .env: DB_HOST=localhost, DB_NAME=upaci, DB_USER=your_user, DB_PASSWORD=your_password

# Start development server
npm run dev

# Test database connection
curl http://localhost:3001/api/health

# Test with connection retry (stop PostgreSQL, then start server)
# Stop: Windows Services -> postgresql-x64-15 -> Stop
#       Linux: sudo systemctl stop postgresql
npm run dev
# Expected: 3 retry attempts, then exit with error

# Restart PostgreSQL and test again
# Start: Windows Services -> postgresql-x64-15 -> Start
#        Linux: sudo systemctl start postgresql
npm run dev
# Expected: Successful connection after retry

# Production build
npm run build

# Start production server
npm start
```

## Implementation Validation Strategy
- [ ] Unit tests pass (database connection mocking tests)
- [ ] Integration tests pass (actual PostgreSQL connection tests)
- [ ] pg and @types/pg dependencies installed: `npm list pg` shows version 8.x
- [ ] .env file has all database variables: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_SSL
- [ ] Server starts and connects to database: Console logs "Database connected to upaci at localhost:5432"
- [ ] Health endpoint works: `curl http://localhost:3001/api/health` returns `{"status":"ok","database":"connected"}`
- [ ] Connection pool max connections: Query `SELECT count(*) FROM pg_stat_activity WHERE datname='upaci';` shows ≤ 20 connections
- [ ] Retry logic works: Stop PostgreSQL → Start server → Verify 3 retry attempts logged
- [ ] Exponential backoff: Check logs show delays of ~1s, ~2s, ~4s between retries
- [ ] Graceful shutdown: Send SIGTERM → Verify "Closing database connections..." logged, pool.end() called
- [ ] Environment variable validation: Start server without DB_NAME → Verify error "DB_NAME is required"
- [ ] SSL connection: Set DB_SSL=true → Verify connection uses SSL (check pg_stat_ssl)
- [ ] Query logging in dev: Make test query → Verify SQL and execution time logged
- [ ] Type safety: TypeScript compiles without errors for database query results
- [ ] Connection error handling: Invalid credentials → Verify error logged, process exits with code 1

## Implementation Checklist
- [ ] Install pg and @types/pg: `npm install pg @types/pg`
- [ ] Create server/src/config/database.ts with Pool initialization
- [ ] Configure Pool options: max: 20, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000
- [ ] Load database config from environment: host, port, database, user, password, ssl
- [ ] Create server/src/types/database.types.ts: DbError, QueryResult, DbConfig interfaces
- [ ] Create server/src/utils/dbHealthCheck.ts with async function testConnection()
- [ ] Implement retry logic: for loop 3 times, try pool.query('SELECT 1'), catch errors
- [ ] Add exponential backoff: await sleep(Math.pow(2, attempt) * 1000) between retries
- [ ] Log each retry attempt: "Database connection attempt 1/3 failed: <error>"
- [ ] Exit process if all retries fail: process.exit(1)
- [ ] Create server/src/middleware/dbConnection.ts to attach pool to req.db
- [ ] Modify server/src/app.ts: import database config, add GET /api/health route
- [ ] Implement /api/health handler: const result = await pool.query('SELECT NOW()'); return { status: 'ok', timestamp: result.rows[0].now }
- [ ] Modify server/src/server.ts: import dbHealthCheck, call await dbHealthCheck() before server.listen()
- [ ] Add graceful shutdown handlers: process.on('SIGTERM', async () => { await pool.end(); process.exit(0); })
- [ ] Create server/src/utils/queryLogger.ts to log queries in NODE_ENV=development
- [ ] Wrap pool.query with logging: log query text, parameters, execution time (performance.now())
- [ ] Update server/.env.example with all database variables
- [ ] Test connection with valid credentials: npm run dev → verify "Database connected" logged
- [ ] Test connection with invalid credentials: set wrong password → verify retry logic, then error exit
- [ ] Test health endpoint: curl http://localhost:3001/api/health → verify JSON response
- [ ] Test graceful shutdown: start server, send Ctrl+C → verify pool closed gracefully
- [ ] Document database integration in DATABASE_INTEGRATION.md (connection pooling, query examples)
- [ ] Add TypeScript example: const result = await pool.query<{id: number, name: string}>('SELECT * FROM users')
- [ ] Test query logging: Enable dev mode, make query → verify SQL logged to console
