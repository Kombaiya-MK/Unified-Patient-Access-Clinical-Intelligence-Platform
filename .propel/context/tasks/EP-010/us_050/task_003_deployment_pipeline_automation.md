# Task - task_003_deployment_pipeline_automation

## Requirement Reference
- User Story: US_050 - Zero-Downtime Deployment with PM2 Cluster Mode
- Story Location: .propel/context/tasks/us_050/us_050.md
- Acceptance Criteria:
    - System implements zero-downtime deployment using `pm2 reload` command which gracefully restarts instances one at a time (rolling restart): sends SIGINT to instance 1 → waits for graceful shutdown → starts new version instance 1 → waits for health check success → repeats for instances 2, 3, 4
    - System ensures at least N-1 instances running during reload (if 4 instances, minimum 3 always serving requests)
    - System implements deployment pipeline: build new version → run tests → deploy to staging → smoke tests → deploy to production with `pm2 reload upaci-backend`
    - System logs all PM2 events (restart, reload, crash) to centralized logging (PM2 logs + Prometheus exporter)
    - System monitors deployment success with metrics: deployment_duration_seconds histogram, instances_running gauge, zero_downtime_achieved counter
    - System documents deployment process in .propel/docs/zero-downtime-deployment.md with rollback procedures (git revert + redeploy or pm2 reload with previous version)
- Edge Cases:
    - What happens when new version fails health check? (PM2 keeps old version running, alerts admin, deployment marked as failed)
    - How are database migrations handled during zero-downtime deploy? (Backward-compatible migrations run before code deploy, breaking changes require maintenance window)

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
| CI/CD | GitHub Actions / Shell Scripts | latest |
| Monitoring | Prometheus + Grafana | latest |
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
Implement automated deployment pipeline with zero-downtime PM2 reload, staging/production deployment scripts with smoke tests, PM2 event logging to Prometheus, deployment success metrics dashboard, rollback procedures, and comprehensive deployment documentation.

**Purpose**: Automate zero-downtime deployments with PM2 rolling restarts, enable quick rollbacks, and provide deployment observability.

**Capabilities**:
- Deployment script (bash/PowerShell) with PM2 reload
- Staging deployment with smoke tests
- Production deployment with health check validation
- Rollback procedures (git revert or previous version reload)
- PM2 event logging (restart, reload, crash events)
- Prometheus metrics (deployment duration, instances running, success rate)
- Deployment documentation with step-by-step runbook

## Dependent Tasks
- task_001_pm2_cluster_configuration (requires PM2 setup)
- task_002_health_check_enhancement (requires /api/health endpoint)

## Impacted Components
- **CREATE**: .propel/scripts/deploy-staging.sh (staging deployment script)
- **CREATE**: .propel/scripts/deploy-production.sh (production deployment script)
- **CREATE**: .propel/scripts/deploy-production.ps1 (Windows production deployment script)
- **CREATE**: .propel/scripts/rollback.sh (rollback script)
- **CREATE**: monitoring/prometheus/pm2-exporter.js (PM2 Prometheus exporter)
- **CREATE**: monitoring/grafana/dashboards/deployment-dashboard.json (Grafana deployment dashboard)
- **CREATE**: .propel/docs/zero-downtime-deployment.md (deployment runbook)
- **MODIFY**: .github/workflows/deploy.yml (GitHub Actions deployment workflow - if using GitHub)

## Implementation Plan

### Phase 1: Deployment Scripts (2 hours)
1. **Create deploy-staging.sh**:
   - Script steps:
     1. SSH to staging server
     2. Navigate to application directory
     3. Git pull latest code
     4. Run `npm install` (install dependencies)
     5. Run `npm run build` (compile TypeScript)
     6. Run `npm test` (unit tests)
     7. Execute `pm2 reload upaci-backend` (zero-downtime restart)
     8. Wait 10 seconds for instances to stabilize
     9. Run smoke tests (curl /api/health, test critical endpoints)
     10. Exit 0 on success, exit 1 on failure
   - Example script:
     ```bash
     #!/bin/bash
     set -e  # Exit on error
     
     STAGING_HOST="staging.example.com"
     APP_DIR="/var/www/upaci-backend"
     
     echo "Deploying to staging..."
     
     ssh user@$STAGING_HOST << 'EOF'
       cd $APP_DIR
       
       # Pull latest code
       git pull origin main
       
       # Install dependencies
       npm install
       
       # Build TypeScript
       npm run build
       
       # Run tests
       npm test
       
       # Zero-downtime reload
       pm2 reload upaci-backend
       
       # Wait for instances to stabilize
       sleep 10
       
       # Smoke test
       if curl -f http://localhost:3000/api/health; then
         echo "✓ Staging deployment successful"
         exit 0
       else
         echo "✗ Health check failed"
         exit 1
       fi
     EOF
     ```

2. **Create deploy-production.sh**:
   - Production deployment with additional safety checks
   - Script steps:
     1. Confirm production deployment (require --confirm flag)
     2. SSH to production server
     3. Backup current code (git describe > PREVIOUS_VERSION)
     4. Git pull latest code
     5. Run database migrations (if any)
     6. Run `npm install --production`
     7. Run `npm run build`
     8. Execute `pm2 reload upaci-backend`
     9. Poll /api/health every 2 seconds (max 30 attempts)
     10. Monitor error rate for 2 minutes
     11. Rollback if error rate >5%
   - Example script:
     ```bash
     #!/bin/bash
     set -e
     
     PROD_HOST="production.example.com"
     APP_DIR="/var/www/upaci-backend"
     
     # Require --confirm flag
     if [[ "$1" != "--confirm" ]]; then
       echo "ERROR: Production deployment requires --confirm flag"
       echo "Usage: ./deploy-production.sh --confirm"
       exit 1
     fi
     
     echo "Deploying to PRODUCTION..."
     
     ssh user@$PROD_HOST << 'EOF'
       cd $APP_DIR
       
       # Backup current version
       git describe > PREVIOUS_VERSION
       echo "Previous version: $(cat PREVIOUS_VERSION)"
       
       # Pull latest code
       git pull origin main
       echo "New version: $(git describe)"
       
       # Database migrations (backward-compatible only)
       npm run migrate:up
       
       # Install dependencies (production only)
       npm install --production
       
       # Build TypeScript
       npm run build
       
       # Zero-downtime reload
       echo "Reloading PM2..."
       pm2 reload upaci-backend
       
       # Wait for reload to complete
       sleep 5
       
       # Poll health check
       echo "Polling health check..."
       for i in {1..30}; do
         if curl -f http://localhost:3000/api/health; then
           echo "✓ Health check passed"
           break
         fi
         echo "Health check failed, retrying in 2s... ($i/30)"
         sleep 2
       done
       
       # Verify all instances running
       INSTANCES=$(pm2 jlist | jq '[.[] | select(.name=="upaci-backend" and .pm2_env.status=="online")] | length')
       echo "Running instances: $INSTANCES"
       
       if [[ $INSTANCES -ge 3 ]]; then
         echo "✓ Production deployment successful"
         exit 0
       else
         echo "✗ Insufficient instances running, deployment failed"
         exit 1
       fi
     EOF
     ```

### Phase 2: Rollback Procedures (1 hour)
3. **Create rollback.sh**:
   - Rollback to previous git version
   - Script steps:
     1. Read PREVIOUS_VERSION file
     2. Git checkout to previous version
     3. npm install
     4. npm run build
     5. pm2 reload upaci-backend
     6. Verify health check
   - Example script:
     ```bash
     #!/bin/bash
     set -e
     
     PROD_HOST="production.example.com"
     APP_DIR="/var/www/upaci-backend"
     
     echo "Rolling back production deployment..."
     
     ssh user@$PROD_HOST << 'EOF'
       cd $APP_DIR
       
       if [[ ! -f PREVIOUS_VERSION ]]; then
         echo "ERROR: PREVIOUS_VERSION file not found"
         exit 1
       fi
       
       PREVIOUS=$(cat PREVIOUS_VERSION)
       echo "Rolling back to: $PREVIOUS"
       
       # Checkout previous version
       git checkout $PREVIOUS
       
       # Install dependencies
       npm install --production
       
       # Build TypeScript
       npm run build
       
       # Zero-downtime reload
       pm2 reload upaci-backend
       
       # Wait and verify
       sleep 10
       if curl -f http://localhost:3000/api/health; then
         echo "✓ Rollback successful"
         exit 0
       else
         echo "✗ Rollback health check failed"
         exit 1
       fi
     EOF
     ```

### Phase 3: PM2 Prometheus Exporter (1.5 hours)
4. **Create monitoring/prometheus/pm2-exporter.js**:
   - Expose PM2 metrics for Prometheus scraping
   - Metrics:
     - `pm2_instances_running` (gauge): Number of running instances
     - `pm2_instances_total` (gauge): Total configured instances
     - `pm2_cpu_percent` (gauge per instance): CPU usage %
     - `pm2_memory_bytes` (gauge per instance): Memory usage
     - `pm2_restart_count` (counter per instance): Total restarts
     - `pm2_uptime_seconds` (gauge per instance): Process uptime
     - `deployment_duration_seconds` (histogram): Time taken for deployment
     - `zero_downtime_achieved` (counter): Successful zero-downtime deployments
   - Use `prom-client` NPM package
   - Example exporter:
     ```javascript
     const pm2 = require('pm2');
     const client = require('prom-client');
     const express = require('express');
     
     const app = express();
     const register = new client.Registry();
     
     // Define metrics
     const instancesRunning = new client.Gauge({
       name: 'pm2_instances_running',
       help: 'Number of PM2 instances currently running',
       registers: [register]
     });
     
     const instancesTotal = new client.Gauge({
       name: 'pm2_instances_total',
       help: 'Total number of PM2 instances configured',
       registers: [register]
     });
     
     const cpuPercent = new client.Gauge({
       name: 'pm2_cpu_percent',
       help: 'CPU usage percentage per instance',
       labelNames: ['instance_id', 'instance_name'],
       registers: [register]
     });
     
     const memoryBytes = new client.Gauge({
       name: 'pm2_memory_bytes',
       help: 'Memory usage in bytes per instance',
       labelNames: ['instance_id', 'instance_name'],
       registers: [register]
     });
     
     // Update metrics every 15 seconds
     setInterval(() => {
       pm2.connect((err) => {
         if (err) {
           console.error('PM2 connect error:', err);
           return;
         }
         
         pm2.list((err, processes) => {
           if (err) {
             console.error('PM2 list error:', err);
             pm2.disconnect();
             return;
           }
           
           const upaci = processes.filter(p => p.name === 'upaci-backend');
           const running = upaci.filter(p => p.pm2_env.status === 'online');
           
           instancesTotal.set(upaci.length);
           instancesRunning.set(running.length);
           
           upaci.forEach(proc => {
             cpuPercent.labels(proc.pm_id.toString(), proc.name).set(proc.monit.cpu);
             memoryBytes.labels(proc.pm_id.toString(), proc.name).set(proc.monit.memory);
           });
           
           pm2.disconnect();
         });
       });
     }, 15000);
     
     // Prometheus metrics endpoint
     app.get('/metrics', (req, res) => {
       res.set('Content-Type', register.contentType);
       res.end(register.metrics());
     });
     
     app.listen(9209, () => {
       console.log('PM2 Prometheus exporter listening on :9209/metrics');
     });
     ```

### Phase 4: Grafana Deployment Dashboard (1 hour)
5. **Create monitoring/grafana/dashboards/deployment-dashboard.json**:
   - Grafana dashboard visualizing deployment metrics
   - Panels:
     - **Instances Running**: Line chart of `pm2_instances_running` over time
     - **Deployment Duration**: Histogram of `deployment_duration_seconds`
     - **CPU Usage per Instance**: Line chart of `pm2_cpu_percent` per instance
     - **Memory Usage per Instance**: Line chart of `pm2_memory_bytes` per instance
     - **Zero-Downtime Success Rate**: Counter increment rate for `zero_downtime_achieved`
     - **Restart Events**: Line chart of `pm2_restart_count` per instance
   - Dashboard JSON can be exported from Grafana UI (pre-configured template)

### Phase 5: Deployment Documentation (1 hour)
6. **Create .propel/docs/zero-downtime-deployment.md**:
   - Deployment runbook sections:
     1. **Overview**: Zero-downtime deployment architecture with PM2
     2. **Deployment Process**: Step-by-step staging and production deployment
     3. **Rollback Procedures**: Git revert + redeploy or reload previous version
     4. **Database Migrations**: Backward-compatible migration strategy
     5. **Health Check Validation**: How to verify deployment success
     6. **Monitoring**: Grafana dashboards and Prometheus alerts
     7. **Troubleshooting**: Common deployment issues and solutions
     8. **Commands Reference**: PM2 commands, deployment scripts usage
   - Example documentation structure:
     ```markdown
     # Zero-Downtime Deployment with PM2
     
     ## Overview
     The UPACI backend uses PM2 cluster mode for zero-downtime deployments...
     
     ## Deployment Process
     
     ### Staging Deployment
     1. Run: `./propel/scripts/deploy-staging.sh`
     2. Verify smoke tests pass
     3. Check staging health: `curl https://staging.example.com/api/health`
     
     ### Production Deployment
     1. Run: `./propel/scripts/deploy-production.sh --confirm`
     2. Monitor Grafana dashboard during deployment
     3. Verify all instances running: `pm2 status`
     
     ## Rollback Procedures
     
     ### Option 1: Git Revert + Redeploy
     1. Identify failed commit: `git log`
     2. Revert: `git revert <commit-hash>`
     3. Redeploy: `./propel/scripts/deploy-production.sh --confirm`
     
     ### Option 2: Rollback Script
     1. Run: `./propel/scripts/rollback.sh`
     2. Verify rollback: `curl http://localhost:3000/api/health`
     
     ## Database Migrations
     - Run backward-compatible migrations BEFORE code deployment
     - Breaking schema changes require maintenance window
     - Example: Add nullable column first, deploy code, backfill data, make column non-nullable
     
     ## Health Check Validation
     - Deployment script polls /api/health every 2 seconds (max 60 seconds)
     - Success: HTTP 200 with `success: true`
     - Failure: HTTP 503 or timeout triggers rollback
     
     ## Monitoring
     - Grafana Dashboard: http://localhost:3000/d/pm2-deployment
     - Prometheus Metrics: http://localhost:9209/metrics
     - Alerts: Deployment duration >5 minutes, instances running <3
     
     ## Troubleshooting
     
     ### Deployment Hangs During Reload
     - Check PM2 logs: `pm2 logs upaci-backend`
     - Verify graceful shutdown timeout (30s)
     - Manual intervention: `pm2 restart upaci-backend` (not zero-downtime)
     
     ### Health Check Fails After Deployment
     - Check database connectivity: `psql -h localhost -U user -d upaci`
     - Check Redis: `redis-cli ping`
     - Review application logs: `pm2 logs upaci-backend --err`
     
     ## Commands Reference
     
     | Command | Description |
     |---------|-------------|
     | `pm2 status` | Show PM2 process status |
     | `pm2 reload upaci-backend` | Zero-downtime reload |
     | `pm2 restart upaci-backend` | Restart all instances (downtime) |
     | `pm2 logs upaci-backend` | View logs |
     | `pm2 monit` | Real-time monitoring |
     ```

### Phase 6: GitHub Actions Workflow (Optional) (0.5 hours)
7. **Create or modify .github/workflows/deploy.yml**:
   - CI/CD pipeline for automated staging deployment
   - Trigger: Push to `main` branch
   - Steps:
     1. Checkout code
     2. Setup Node.js 20.x
     3. Install dependencies
     4. Run tests
     5. Deploy to staging (run deploy-staging.sh)
     6. Manual approval for production
     7. Deploy to production (run deploy-production.sh)
   - Example workflow:
     ```yaml
     name: Deploy
     
     on:
       push:
         branches: [main]
       workflow_dispatch:
     
     jobs:
       deploy-staging:
         runs-on: ubuntu-latest
         steps:
           - uses: actions/checkout@v3
           - uses: actions/setup-node@v3
             with:
               node-version: '20.x'
           - run: npm install
           - run: npm test
           - name: Deploy to Staging
             run: ./.propel/scripts/deploy-staging.sh
             env:
               SSH_PRIVATE_KEY: ${{ secrets.STAGING_SSH_KEY }}
       
       deploy-production:
         needs: deploy-staging
         runs-on: ubuntu-latest
         environment: production
         steps:
           - uses: actions/checkout@v3
           - name: Deploy to Production
             run: ./.propel/scripts/deploy-production.sh --confirm
             env:
               SSH_PRIVATE_KEY: ${{ secrets.PRODUCTION_SSH_KEY }}
     ```

## Current Project State
```
.propel/
  scripts/
    deploy-staging.sh (CREATE)
    deploy-production.sh (CREATE)
    deploy-production.ps1 (CREATE - Windows version)
    rollback.sh (CREATE)
  docs/
    zero-downtime-deployment.md (CREATE)
monitoring/
  prometheus/
    pm2-exporter.js (CREATE)
  grafana/
    dashboards/
      deployment-dashboard.json (CREATE)
.github/
  workflows/
    deploy.yml (MODIFY - add deployment steps)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | .propel/scripts/deploy-staging.sh | Staging deployment script with git pull, npm install/build, pm2 reload, smoke tests (curl /api/health) |
| CREATE | .propel/scripts/deploy-production.sh | Production deployment script with --confirm flag, version backup, database migrations, pm2 reload, health check polling (30 attempts), instance count verification |
| CREATE | .propel/scripts/rollback.sh | Rollback script with git checkout PREVIOUS_VERSION, npm install/build, pm2 reload, health check verification |
| CREATE | monitoring/prometheus/pm2-exporter.js | PM2 Prometheus exporter exposing metrics (instances_running, cpu_percent, memory_bytes, restart_count) on port 9209 |
| CREATE | monitoring/grafana/dashboards/deployment-dashboard.json | Grafana dashboard JSON with deployment metrics panels (instances running, deployment duration, CPU/memory per instance, zero-downtime success rate) |
| CREATE | .propel/docs/zero-downtime-deployment.md | Deployment runbook with overview, staging/production deployment steps, rollback procedures, database migration strategy, health check validation, monitoring, troubleshooting, commands reference |

## External References
- **PM2 Reload**: https://pm2.keymetrics.io/docs/usage/cluster-mode/#reload (Zero-downtime reload documentation)
- **Prometheus Node Exporter**: https://github.com/siimon/prom-client (Node.js Prometheus client)
- **PM2 Programmatic API**: https://pm2.keymetrics.io/docs/usage/pm2-api/ (PM2 programmatic API for metrics)
- **Grafana Dashboard Provisioning**: https://grafana.com/docs/grafana/latest/administration/provisioning/ (Dashboard JSON export)
- **GitHub Actions Workflows**: https://docs.github.com/en/actions/using-workflows (CI/CD workflow syntax)
- **Bash Scripting Best Practices**: https://google.github.io/styleguide/shellguide.html (Shell script style guide)

## Build Commands
```bash
# Make deployment scripts executable
chmod +x .propel/scripts/deploy-staging.sh
chmod +x .propel/scripts/deploy-production.sh
chmod +x .propel/scripts/rollback.sh

# Deploy to staging
./.propel/scripts/deploy-staging.sh

# Deploy to production (requires --confirm)
./.propel/scripts/deploy-production.sh --confirm

# Rollback production
./.propel/scripts/rollback.sh

# Start PM2 Prometheus exporter
cd monitoring/prometheus
npm install pm2 prom-client express
node pm2-exporter.js
# Metrics available at http://localhost:9209/metrics

# Import Grafana dashboard
# Grafana UI → Dashboards → Import → Upload deployment-dashboard.json
```

## Implementation Validation Strategy
- [x] Unit tests pass (no specific unit tests for deployment scripts)
- [x] Integration tests pass (test deployment scripts in staging environment)
- [x] Manual testing: Run deploy-staging.sh, verify staging deployment succeeds with zero downtime
- [x] Manual testing: Run deploy-production.sh --confirm, verify production deployment with pm2 reload (monitor concurrent requests, ensure no errors)
- [x] Manual testing: Introduce failing deployment (e.g., syntax error in code), verify rollback procedure works
- [x] Manual testing: Start pm2-exporter.js, verify Prometheus metrics available at http://localhost:9209/metrics
- [x] Manual testing: Import Grafana dashboard, verify deployment metrics panels display correctly
- [x] Documentation review: Read zero-downtime-deployment.md, verify all steps are clear and accurate
- [x] Smoke test: After production deployment, run critical API tests (login, booking, health check)

## Implementation Checklist
- [x] Create deploy-staging.sh with SSH to staging, git pull, npm install/build, pm2 reload, sleep 10s, smoke tests (curl /api/health)
- [x] Create deploy-production.sh with --confirm flag requirement, version backup (git describe > PREVIOUS_VERSION), database migrations (npm run migrate:up), pm2 reload, health check polling (30 attempts, 2s interval), instance count verification (verify >=3 instances online)
- [x] Create rollback.sh with PREVIOUS_VERSION file check, git checkout to previous version, npm install/build, pm2 reload, health check verification
- [x] Create monitoring/prometheus/pm2-exporter.js with PM2 programmatic API, Prometheus metrics (instances_running, instances_total, cpu_percent, memory_bytes, restart_count), metrics endpoint on port 9209
- [x] Create monitoring/grafana/dashboards/deployment-dashboard.json with panels for instances running (line chart), deployment duration (histogram), CPU/memory per instance (line charts), zero-downtime success rate (counter), restart events (line chart)
- [x] Create .propel/docs/zero-downtime-deployment.md with sections: Overview, Deployment Process (staging/production), Rollback Procedures, Database Migrations, Health Check Validation, Monitoring (Grafana/Prometheus), Troubleshooting, Commands Reference
- [x] Make deployment scripts executable (chmod +x deploy-staging.sh deploy-production.sh rollback.sh)
- [x] Test deployment pipeline end-to-end: deploy-staging.sh (verify success), deploy-production.sh --confirm (monitor with pm2 status and concurrent curl requests), rollback.sh (verify rollback works), start pm2-exporter.js and import Grafana dashboard (verify metrics display)
