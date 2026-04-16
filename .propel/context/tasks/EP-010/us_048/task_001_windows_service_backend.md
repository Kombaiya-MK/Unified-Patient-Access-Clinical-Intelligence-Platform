# Task - task_001_windows_service_backend

## Requirement Reference
- User Story: US_048 - Windows Services/IIS Deployment Configuration
- Story Location: .propel/context/tasks/us_048/us_048.md
- Acceptance Criteria:
    - System configures Node.js backend as Windows Service using node-windows or PM2 Windows service wrapper with service name "UPACI-Backend"
    - System sets service to start automatically on server boot with restart on failure (3 attempts with 30s delay)
    - System runs service under dedicated service account (LOCAL_SERVICE or custom domain account) with minimum required permissions
    - System logs service output to Windows Event Log (Application log, source "UPACI") and file logs in C:\Logs\UPACI\
    - System configures backend to accept X-Forwarded-For, X-Forwarded-Proto headers from IIS for correct client IP logging
    - System implements health check endpoint (/health for backend) monitored by IIS Application Initialization module
- Edge Cases:
    - What happens when Node.js service crashes? (Windows Service Manager automatically restarts after 30s, alerts admin after 3 failed restart attempts)

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

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Backend | Node.js (Express) | 20.x LTS |
| Infrastructure | Windows Server | 2019/2022 |
| Library | node-windows | 1.x |
| Library | winston | 3.x |
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

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Configure Node.js Express backend as a Windows Service using node-windows package, with automatic startup, crash recovery (3 restart attempts with 30s delay), Windows Event Log integration, file logging to C:\Logs\UPACI\, and support for X-Forwarded headers from IIS reverse proxy. Ensure existing /api/health endpoint is compatible with IIS Application Initialization monitoring.

**Purpose**: Establish backend as a reliable Windows Service that starts automatically, restarts on failure, logs to Windows infrastructure, and integrates seamlessly with IIS reverse proxy.

**Capabilities**:
- Windows Service installation with service name "UPACI-Backend"
- Automatic startup on server boot (Startup Type: Automatic)
- Crash recovery with 3 restart attempts (30-second delay between attempts)
- Service account configuration (LOCAL_SERVICE or custom domain account)
- Dual logging: Windows Event Log (Application log, source "UPACI") + file logs (C:\Logs\UPACI\backend.log)
- X-Forwarded-For and X-Forwarded-Proto header support for correct client IP logging behind IIS
- Health check endpoint validation (/api/health returns JSON with status, timestamp, database, Redis)

## Dependent Tasks
- None (foundational backend service configuration)

## Impacted Components
- **CREATE**: server/install-service.js (Windows Service installation script using node-windows)
- **CREATE**: server/uninstall-service.js (Windows Service uninstallation script)
- **MODIFY**: server/src/server.ts (add X-Forwarded header middleware, configure Winston for Event Log)
- **MODIFY**: server/src/utils/logger.ts (add Windows Event Log transport)
- **CREATE**: server/scripts/setup-logging.ps1 (PowerShell script to create C:\Logs\UPACI\ directory with permissions)
- **MODIFY**: server/package.json (add node-windows dependency, add service install/uninstall scripts)
- **CREATE**: server/.env.production (production environment variables for Windows Service)
- **MODIFY**: server/src/app.ts (verify /api/health endpoint returns proper JSON for IIS monitoring)

## Implementation Plan

### Phase 1: node-windows Service Installation Script (2 hours)
1. **Install node-windows package**:
   - Add to package.json: `npm install --save node-windows`
   - node-windows version: 1.x (latest stable)

2. **Create install-service.js**:
   - Import `node-windows.Service`
   - Service configuration:
     - name: "UPACI-Backend"
     - description: "UPACI Platform Backend API Service"
     - script: Path to compiled server.js (e.g., `C:\\Apps\\upaci-backend\\dist\\server.js` or `C:\\Apps\\upaci-backend\\server\\src\\server.ts` if using ts-node)
     - nodeOptions: `['--max_old_space_size=4096']` (4GB heap for production)
     - env: `[{ name: "NODE_ENV", value: "production" }]`
     - maxRestarts: 3 (restart attempts)
     - maxRetries: 3 (same as maxRestarts)
     - wait: 30 (30-second delay between restart attempts)
     - grow: 0.5 (no exponential backoff needed)
   - Event handlers:
     - `svc.on('install', () => svc.start())` - Auto-start after installation
     - `svc.on('alreadyinstalled', () => console.log('Service already installed'))`
     - `svc.on('error', (err) => console.error('Service error:', err))`
   - Install command: `svc.install()`

3. **Create uninstall-service.js**:
   - Uninstall script for service removal during updates or decommissioning
   - Stops service before uninstalling
   - Cleans up service registry entries

### Phase 2: Windows Event Log Integration (1.5 hours)
4. **Configure Winston for Event Log**:
   - Install winston-eventlog transport: `npm install winston-eventlog`
   - Modify logger.ts:
     - Add `new winstonEventLog({ source: 'UPACI', eventLog: 'Application' })` transport
     - Log levels: error → Error event, warn → Warning event, info → Information event
     - Format: JSON with timestamp, level, message, metadata
   - Test Event Log: Run service, verify logs appear in Event Viewer → Windows Logs → Application → Source: UPACI

5. **Configure File Logging**:
   - Create C:\Logs\UPACI\ directory (PowerShell script: `New-Item -ItemType Directory -Force -Path "C:\Logs\UPACI"`)
   - Set permissions: Grant NETWORK SERVICE and LOCAL SERVICE write access (`icacls "C:\Logs\UPACI" /grant "NETWORK SERVICE:(OI)(CI)F" /grant "LOCAL SERVICE:(OI)(CI)F"`)
   - Winston file transport:
     - filename: `C:\\Logs\\UPACI\\backend-%DATE%.log` (daily rotation)
     - datePattern: 'YYYY-MM-DD'
     - maxSize: '100m' (rotate at 100MB)
     - maxFiles: '30d' (keep 30 days)
     - zippedArchive: true (compress old logs)

### Phase 3: X-Forwarded Headers Support (1 hour)
6. **Add X-Forwarded middleware to server.ts**:
   - Install express middleware: `app.set('trust proxy', 1)` (trust first proxy - IIS)
   - Middleware to log X-Forwarded headers:
     ```typescript
     app.use((req, res, next) => {
       req.clientIp = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.ip;
       req.protocol = req.headers['x-forwarded-proto']?.toString() || req.protocol;
       next();
     });
     ```
   - Update audit logging to use `req.clientIp` instead of `req.ip`
   - Update logger context to include `clientIp` and `protocol`

### Phase 4: Health Check Endpoint Validation (1 hour)
7. **Verify /api/health endpoint**:
   - Check existing implementation in app.ts (already implemented!)
   - Ensure response format is IIS-compatible JSON:
     ```json
     {
       "status": "healthy" | "degraded" | "unhealthy",
       "timestamp": "2026-03-19T12:00:00Z",
       "uptime": 3600,
       "database": { "status": "connected", "latency": 5 },
       "redis": { "status": "connected", "latency": 2 }
     }
     ```
   - HTTP status codes: 200 (healthy), 503 (unhealthy)
   - Response time: <500ms (fast health checks for IIS polling)

### Phase 5: Service Account Configuration & Testing (1.5 hours)
8. **Configure service account**:
   - Default: Run as LOCAL SERVICE (least privilege)
   - Custom domain account option: Create dedicated service account (e.g., `DOMAIN\UPACI-Service`)
   - Permissions required:
     - Read/Execute: C:\Apps\upaci-backend\ (application files)
     - Write: C:\Logs\UPACI\ (log files)
     - Network access: Allow outbound HTTP/HTTPS for external APIs
     - Database access: SQL Server login with db_datareader/db_datawriter roles
   - Configure in Services.msc: Right-click service → Properties → Log On tab → Select account and enter password

9. **Test service lifecycle**:
   - Install service: `node install-service.js` (run as Administrator)
   - Verify in Services.msc: Service name "UPACI-Backend", Status "Running", Startup type "Automatic"
   - Test crash recovery: Kill node.exe process, verify service restarts within 30 seconds
   - Check logs: Event Viewer (Application log, source UPACI) and C:\Logs\UPACI\backend-*.log
   - Test X-Forwarded headers: Configure IIS proxy (from task_003), send request, verify client IP logged correctly

## Current Project State
```
server/
  src/
    app.ts (MODIFY - verify /api/health endpoint format)
    server.ts (MODIFY - add X-Forwarded middleware, Winston Event Log)
    utils/
      logger.ts (MODIFY - add Event Log transport)
      dbHealthCheck.ts (existing - used by /api/health)
      redisHealthCheck.ts (existing - used by /api/health)
  scripts/
    setup-logging.ps1 (CREATE - PowerShell to create log directory)
  install-service.js (CREATE - Windows Service install script)
  uninstall-service.js (CREATE - Windows Service uninstall script)
  .env.production (CREATE - production environment variables)
  package.json (MODIFY - add node-windows dependency)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/install-service.js | node-windows service installation script (service name: UPACI-Backend, auto-start, restart on failure) |
| CREATE | server/uninstall-service.js | node-windows service uninstallation script for clean removal |
| MODIFY | server/src/server.ts | Add X-Forwarded-For/Proto middleware, trust IIS proxy (app.set('trust proxy', 1)) |
| MODIFY | server/src/utils/logger.ts | Add winston-eventlog transport (Application log, source: UPACI) and file transport (C:\Logs\UPACI\) |
| CREATE | server/scripts/setup-logging.ps1 | PowerShell script to create C:\Logs\UPACI\ directory and set permissions for SERVICE accounts |
| MODIFY | server/package.json | Add node-windows, winston-eventlog dependencies, add npm scripts for service install/uninstall |
| CREATE | server/.env.production | Production environment variables (NODE_ENV=production, PORT=3000, database connection strings) |
| MODIFY | server/src/app.ts | Verify /api/health endpoint returns JSON with status/timestamp/uptime/database/redis (already exists, validate format) |

## External References
- **node-windows Documentation**: https://github.com/coreybutler/node-windows (Windows Service wrapper for Node.js)
- **winston-eventlog**: https://www.npmjs.com/package/winston-eventlog (Winston transport for Windows Event Log)
- **Express Behind Proxies**: https://expressjs.com/en/guide/behind-proxies.html (Trust proxy configuration)
- **X-Forwarded-For Header**: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For (Client IP forwarding)
- **Windows Services Best Practices**: https://docs.microsoft.com/en-us/windows/win32/services/service-security-and-access-rights (Service account permissions)
- **PowerShell icacls**: https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/icacls (File permission management)

## Build Commands
```powershell
# Install dependencies
cd server
npm install node-windows winston-eventlog --save

# Build TypeScript (if applicable)
npm run build

# Install Windows Service (requires Administrator privileges)
node install-service.js

# Verify service status
Get-Service UPACI-Backend

# View service logs
Get-EventLog -LogName Application -Source UPACI -Newest 50

# Uninstall service (for updates/removal)
node uninstall-service.js
```

## Implementation Validation Strategy
- [x] Unit tests pass (no code changes to business logic)
- [x] Integration tests pass (health check endpoint validation)
- [x] Manual service installation: Verify service appears in Services.msc with correct name, description, startup type
- [x] Crash recovery testing: Kill node.exe process, verify service restarts within 30 seconds (check Event Log for restart events)
- [x] Service account testing: Verify service runs under LOCAL_SERVICE, has correct file system permissions (read app files, write logs)
- [x] Event Log validation: Trigger errors/warnings/info logs, verify they appear in Event Viewer → Application → Source: UPACI
- [x] File logging validation: Verify logs written to C:\Logs\UPACI\backend-YYYY-MM-DD.log with daily rotation
- [x] X-Forwarded header testing: Configure IIS proxy (from task_003), send requests, verify client IP and protocol logged correctly (not 127.0.0.1)
- [x] Health check endpoint testing: Call /api/health, verify JSON response with status=healthy, timestamp, uptime, database/redis status, HTTP 200

## Implementation Checklist
- [x] Install node-windows package and create install-service.js with service configuration (name: UPACI-Backend, auto-start, maxRestarts: 3, wait: 30s)
- [x] Create uninstall-service.js for service removal and add npm scripts to package.json (npm run install-service, npm run uninstall-service)
- [x] Configure Winston for Windows Event Log (winston-eventlog transport, Application log, source: UPACI) and file logging (C:\Logs\UPACI\backend-%DATE%.log, daily rotation, 30-day retention)
- [x] Create PowerShell script setup-logging.ps1 to create C:\Logs\UPACI\ directory and grant NETWORK SERVICE/LOCAL SERVICE write permissions
- [x] Add X-Forwarded-For and X-Forwarded-Proto middleware to server.ts (app.set('trust proxy', 1), extract clientIp from x-forwarded-for header)
- [x] Update audit logging and Winston logger context to use req.clientIp instead of req.ip for correct client IP behind IIS proxy
- [x] Verify /api/health endpoint returns IIS-compatible JSON (status, timestamp, uptime, database, redis fields) with HTTP 200/503 status codes
- [x] Configure service account (LOCAL_SERVICE default or custom domain account), set file system permissions (read app files, write logs), and test service lifecycle (install, start, crash recovery, uninstall)
