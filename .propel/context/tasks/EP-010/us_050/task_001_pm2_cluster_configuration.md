# Task - task_001_pm2_cluster_configuration

## Requirement Reference
- User Story: US_050 - Zero-Downtime Deployment with PM2 Cluster Mode
- Story Location: .propel/context/tasks/us_050/us_050.md
- Acceptance Criteria:
    - System runs PM2 in cluster mode with number of instances equal to CPU cores (e.g., 4 cores = 4 instances) per NFR-REL05
    - System implements graceful shutdown handler in Node.js: listens for SIGINT signal, stops accepting new connections, finishes processing in-flight requests with 30s timeout, closes database connections gracefully, exits with code 0
    - System configures PM2 ecosystem.config.js with: name "upaci-backend", script "server.js", instances "max" (all CPU cores), exec_mode "cluster", kill_timeout 30000 (30s), max_memory_restart "1G", env variables (NODE_ENV, DB_HOST, REDIS_HOST)
    - System implements health check endpoint responding: 200 OK if database connected + Redis connected, 503 Service Unavailable if any dependency down
    - System configures PM2 for automatic restart on crash with max_restarts 10, min_uptime 60000 (consider stable after 60s)
- Edge Cases:
    - What happens when new version fails health check? (PM2 keeps old version running, alerts admin, deployment marked as failed)
    - What if all instances crash simultaneously? (PM2 automatically restarts all instances, circuit breaker opens to protect database)

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
| Infrastructure | PM2 | 5.x |
| Database | PostgreSQL | 15.x |
| Caching | Upstash Redis | latest |
| Frontend | N/A | N/A |
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
Configure PM2 process manager in cluster mode with instances equal to CPU cores, implement graceful shutdown handlers with 30-second timeout for in-flight request completion, configure automatic restart policies (max 10 restarts, 60s min uptime), and ensure PM2 readiness signaling for zero-downtime reloads.

**Purpose**: Enable zero-downtime deployments via PM2 rolling restarts while maintaining high availability with multi-instance load distribution.

**Capabilities**:
- PM2 cluster mode with "max" instances (utilizes all CPU cores)
- Graceful shutdown with SIGINT/SIGTERM handling (30s timeout for requests)
- PM2 readiness signaling via process.send('ready') after server listens
- Automatic crash recovery (max 10 restarts, 60s stability threshold)
- Memory-based restart trigger (1GB threshold)
- PM2 startup script for OS-level auto-start

## Dependent Tasks
- None (foundational infrastructure task)

## Impacted Components
- **CREATE**: server/ecosystem.config.js (PM2 configuration file)
- **MODIFY**: server/src/server.ts (enhance graceful shutdown, add PM2 ready signal)
- **CREATE**: server/pm2-startup.sh (PM2 startup script for Linux)
- **CREATE**: server/pm2-startup.ps1 (PM2 startup script for Windows)
- **MODIFY**: server/package.json (add PM2 scripts for start/reload/stop)
- **CREATE**: server/.pm2/logs/ (log directory for PM2 output)

## Implementation Plan

### Phase 1: PM2 Ecosystem Configuration (1.5 hours)
1. **Create ecosystem.config.js**:
   - Configuration file in server root directory
   - Settings:
     - name: "upaci-backend"
     - script: "./dist/server.js" (TypeScript compiled output)
     - instances: "max" (uses all CPU cores, e.g., 4 cores = 4 instances)
     - exec_mode: "cluster"
     - max_memory_restart: "1G" (restart if instance exceeds 1GB RAM)
     - kill_timeout: 30000 (30 seconds for graceful shutdown)
     - wait_ready: true (wait for process.send('ready') before considering instance ready)
     - listen_timeout: 10000 (10s timeout for app.listen() to complete)
     - max_restarts: 10 (restart up to 10 times on crash)
     - min_uptime: 60000 (consider stable after 60 seconds)
   - Environment variables:
     - NODE_ENV: "production"
     - PORT: 3000
     - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
     - REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
   - Log configuration:
     - error_file: "./logs/pm2-error.log"
     - out_file: "./logs/pm2-out.log"
     - log_date_format: "YYYY-MM-DD HH:mm:ss Z"
     - merge_logs: true (combine logs from all instances)

2. **Example ecosystem.config.js**:
   ```javascript
   module.exports = {
     apps: [{
       name: 'upaci-backend',
       script: './dist/server.js',
       instances: 'max',
       exec_mode: 'cluster',
       max_memory_restart: '1G',
       kill_timeout: 30000,
       wait_ready: true,
       listen_timeout: 10000,
       max_restarts: 10,
       min_uptime: '60s',
       env: {
         NODE_ENV: 'production',
         PORT: 3000,
         DB_HOST: process.env.DB_HOST || 'localhost',
         DB_PORT: process.env.DB_PORT || 5432,
         REDIS_HOST: process.env.REDIS_HOST || 'localhost',
         REDIS_PORT: process.env.REDIS_PORT || 6379
       },
       error_file: './logs/pm2-error.log',
       out_file: './logs/pm2-out.log',
       log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
       merge_logs: true
     }]
   };
   ```

### Phase 2: Enhance Graceful Shutdown Handler (2 hours)
3. **Modify server.ts graceful shutdown**:
   - Current implementation has SIGTERM/SIGINT handlers
   - Enhancements needed:
     - Send `process.send('ready')` after successful `server.listen()` (PM2 readiness signal)
     - Update shutdown timeout to 30 seconds (matches PM2 kill_timeout)
     - Ensure shutdown order: HTTP server → Database pool → Redis client → process.exit(0)
     - Log shutdown start/completion for monitoring
   - Example code (enhance existing shutdown handler in server.ts):
     ```typescript
     const server = http.createServer(app);
     server.listen(port, () => {
       logger.info(`✓ Server running on port ${port}`);
       // CRITICAL: Signal PM2 that app is ready
       if (process.send) {
         process.send('ready');
         logger.info('✓ PM2 ready signal sent');
       }
     });

     const shutdown = async (signal: string) => {
       logger.info(`${signal} received, starting graceful shutdown...`);
       
       // Stop accepting new connections
       server.close(async () => {
         logger.info('HTTP server closed');
         
         // Close database connections
         try {
           await closePool();
           logger.info('Database pool closed');
         } catch (error) {
           logger.error('Error closing database pool:', error);
         }
         
         // Close Redis connection
         try {
           await redisClient.disconnect();
           logger.info('Redis connection closed');
         } catch (error) {
           logger.error('Error closing Redis connection:', error);
         }
         
         logger.info('Graceful shutdown complete');
         process.exit(0);
       });

       // Force shutdown after 30s timeout (matches PM2 kill_timeout)
       setTimeout(() => {
         logger.error('Forcing shutdown after 30s timeout');
         process.exit(1);
       }, 30000);
     };

     process.on('SIGTERM', () => shutdown('SIGTERM'));
     process.on('SIGINT', () => shutdown('SIGINT'));
     ```

### Phase 3: PM2 Startup Scripts (1 hour)
4. **Create pm2-startup.sh (Linux/macOS)**:
   - Script to generate PM2 startup script for OS
   - Commands:
     ```bash
     #!/bin/bash
     # Install PM2 if not already installed
     npm install -g pm2

     # Generate startup script (systemd/launchd/etc)
     pm2 startup

     # Start application
     pm2 start ecosystem.config.js

     # Save current process list for auto-restart on reboot
     pm2 save

     echo "PM2 startup configured. Application will auto-start on reboot."
     ```

5. **Create pm2-startup.ps1 (Windows)**:
   - PowerShell script for Windows Service integration
   - Uses PM2 Windows startup support
   - Commands:
     ```powershell
     # Install PM2 if not already installed
     npm install -g pm2

     # Generate Windows startup script
     pm2 startup windows

     # Start application
     pm2 start ecosystem.config.js

     # Save current process list
     pm2 save

     Write-Host "PM2 startup configured for Windows"
     ```

### Phase 4: Package.json PM2 Scripts (0.5 hours)
6. **Add PM2 management scripts to package.json**:
   - Scripts:
     - `pm2:start`: Start application with PM2 (`pm2 start ecosystem.config.js`)
     - `pm2:reload`: Zero-downtime reload (`pm2 reload upaci-backend`)
     - `pm2:stop`: Stop all instances (`pm2 stop upaci-backend`)
     - `pm2:restart`: Restart all instances (`pm2 restart upaci-backend`)
     - `pm2:logs`: View logs (`pm2 logs upaci-backend`)
     - `pm2:monit`: Real-time monitoring (`pm2 monit`)
     - `pm2:delete`: Remove from PM2 (`pm2 delete upaci-backend`)
   - Example package.json scripts section:
     ```json
     {
       "scripts": {
         "pm2:start": "pm2 start ecosystem.config.js",
         "pm2:reload": "pm2 reload upaci-backend",
         "pm2:stop": "pm2 stop upaci-backend",
         "pm2:restart": "pm2 restart upaci-backend",
         "pm2:logs": "pm2 logs upaci-backend",
         "pm2:monit": "pm2 monit",
         "pm2:delete": "pm2 delete upaci-backend",
         "pm2:save": "pm2 save"
       }
     }
     ```

### Phase 5: Validation & Testing (1 hour)
7. **Validation checklist**:
   - Test graceful shutdown: Send SIGINT, verify 30s timeout and clean exit
   - Test PM2 cluster mode: Verify number of instances = CPU cores
   - Test zero-downtime reload: `pm2 reload upaci-backend` with concurrent requests (ensure requests complete, no 502 errors)
   - Test crash recovery: Kill one instance, verify PM2 auto-restarts
   - Test memory restart: Allocate >1GB memory in instance, verify restart
   - Test startup persistence: Reboot server, verify PM2 auto-starts application

8. **Testing commands**:
   ```bash
   # Build TypeScript
   npm run build

   # Start with PM2
   npm run pm2:start

   # Check status (should show 4 instances if 4 CPU cores)
   pm2 status

   # Test zero-downtime reload
   # In one terminal: run load test (curl http://localhost:3000/api/health in loop)
   # In another terminal: pm2 reload upaci-backend
   # Verify: No connection errors during reload

   # Test crash recovery
   pm2 list  # Note instance ID
   pm2 stop 0  # Stop first instance
   pm2 list  # Verify auto-restart

   # View logs
   npm run pm2:logs
   ```

## Current Project State
```
server/
  ecosystem.config.js (CREATE - PM2 configuration)
  pm2-startup.sh (CREATE - Linux startup script)
  pm2-startup.ps1 (CREATE - Windows startup script)
  package.json (MODIFY - add PM2 scripts)
  src/
    server.ts (MODIFY - enhance graceful shutdown, add PM2 ready signal)
  dist/
    server.js (compiled output, referenced in ecosystem.config.js)
  logs/
    pm2-error.log (PM2 error logs)
    pm2-out.log (PM2 stdout logs)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/ecosystem.config.js | PM2 configuration with cluster mode (instances: "max"), graceful shutdown settings (kill_timeout: 30000), restart policies (max_restarts: 10, min_uptime: 60000), environment variables, log paths |
| MODIFY | server/src/server.ts | Enhance graceful shutdown handler with PM2 ready signal (process.send('ready')), update shutdown timeout to 30 seconds, ensure shutdown order (HTTP→DB→Redis→exit) |
| CREATE | server/pm2-startup.sh | Linux/macOS startup script with PM2 installation check, pm2 startup command, pm2 start/save commands |
| CREATE | server/pm2-startup.ps1 | Windows PowerShell startup script with PM2 installation, pm2 startup windows command, application start/save |
| MODIFY | server/package.json | Add PM2 management scripts (pm2:start, pm2:reload, pm2:stop, pm2:restart, pm2:logs, pm2:monit, pm2:delete, pm2:save) |
| CREATE | server/logs/ | Log directory for PM2 error and output logs (pm2-error.log, pm2-out.log) |

## External References
- **PM2 Documentation**: https://pm2.keymetrics.io/docs/usage/cluster-mode/ (Cluster mode configuration)
- **PM2 Graceful Shutdown**: https://pm2.keymetrics.io/docs/usage/signals-clean-restart/ (Graceful stop/reload)
- **PM2 Ecosystem File**: https://pm2.keymetrics.io/docs/usage/application-declaration/ (ecosystem.config.js reference)
- **PM2 Startup Scripts**: https://pm2.keymetrics.io/docs/usage/startup/ (Auto-start on OS boot)
- **Node.js Graceful Shutdown**: https://nodejs.org/api/process.html#signal-events (SIGINT/SIGTERM handling)
- **PM2 Process Signaling**: https://pm2.keymetrics.io/docs/usage/signals-clean-restart/#process-signals (wait_ready, process.send('ready'))

## Build Commands
```bash
# Install PM2 globally
npm install -g pm2

# Install TypeScript build dependencies (if not already)
cd server
npm install

# Build TypeScript to dist/
npm run build

# Start with PM2
npm run pm2:start
# OR: pm2 start ecosystem.config.js

# Check cluster status
pm2 status

# View real-time logs
npm run pm2:logs

# Zero-downtime reload
npm run pm2:reload

# Save PM2 process list
npm run pm2:save

# Generate startup script
pm2 startup
# Follow on-screen instructions to run generated command with sudo
```

## Implementation Validation Strategy
- [x] Unit tests pass (no new unit tests needed - infrastructure configuration)
- [x] Integration tests pass (test graceful shutdown, PM2 signals)
- [x] Manual testing: Start PM2 cluster, verify instance count equals CPU cores (pm2 status)
- [x] Manual testing: Send SIGINT to PM2 process, verify graceful shutdown within 30 seconds
- [x] Manual testing: Run load test (concurrent requests to /api/health), execute `pm2 reload upaci-backend`, verify zero 502 errors
- [x] Manual testing: Kill one PM2 instance, verify auto-restart within 60 seconds
- [x] Manual testing: Allocate >1GB memory in instance (stress test), verify PM2 restarts instance
- [x] Manual testing: Reboot server, verify PM2 auto-starts application (test pm2 startup script)
- [x] Log verification: Check logs/pm2-error.log and logs/pm2-out.log for startup/shutdown events

## Implementation Checklist
- [x] Create ecosystem.config.js with cluster mode configuration (instances: "max", exec_mode: "cluster", kill_timeout: 30000, wait_ready: true, listen_timeout: 10000, max_restarts: 10, min_uptime: 60000, max_memory_restart: "1G", environment variables, log paths)
- [x] Modify server.ts to add PM2 ready signal (process.send('ready') after server.listen()), update graceful shutdown timeout to 30 seconds, ensure shutdown order (HTTP server → Database pool → Redis client → process.exit)
- [x] Create pm2-startup.sh Linux startup script with PM2 installation check, pm2 startup command, pm2 start ecosystem.config.js, pm2 save (auto-restart on reboot)
- [x] Create pm2-startup.ps1 Windows PowerShell startup script with PM2 installation, pm2 startup windows command, application start/save
- [x] Modify package.json to add PM2 management scripts (pm2:start, pm2:reload, pm2:stop, pm2:restart, pm2:logs, pm2:monit, pm2:delete, pm2:save)
- [x] Create logs/ directory for PM2 output (pm2-error.log, pm2-out.log with merge_logs: true)
- [x] Build TypeScript (npm run build), start PM2 cluster (npm run pm2:start), verify instance count equals CPU cores (pm2 status)
- [x] Test zero-downtime reload with concurrent load (while true; do curl http://localhost:3000/api/health; done in background, then pm2 reload upaci-backend), verify no 502 errors, test crash recovery (pm2 stop <id>, verify auto-restart), test startup persistence (reboot, verify auto-start)
