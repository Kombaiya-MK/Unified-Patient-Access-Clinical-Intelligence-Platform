# Task - task_003_reverse_proxy_monitoring

## Requirement Reference
- User Story: US_048 - Windows Services/IIS Deployment Configuration
- Story Location: .propel/context/tasks/us_048/us_048.md
- Acceptance Criteria:
    - System configures reverse proxy rules in web.config: API requests (/api/*) proxied to backend Node.js service at http://localhost:3000, WebSocket requests (/socket.io/*) proxied with WebSocket protocol support
    - System sets up Windows Firewall rules allowing inbound traffic on ports 80, 443
    - System sets up process monitoring with PM2 or Windows Service SCM showing process CPU/memory usage
    - System implements health check monitoring with IIS Application Initialization module
    - System documents deployment runbook in .propel/docs/windows-deployment.md with step-by-step configuration screenshots
- Edge Cases:
    - What if IIS reverse proxy fails? (Backend Node.js still runs, IIS serves 502 Bad Gateway, health checks detect failure and trigger alert)

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
| Infrastructure | IIS (Application Request Routing) | 10.0 |
| Library | URL Rewrite Module | 2.1 |
| Backend | Node.js (Express) | 20.x LTS |
| Library | PM2 (optional, for monitoring) | 5.x |
| Database | N/A | N/A |
| AI/ML | N/A | N/A |

**Note**: All configurations MUST be compatible with Windows Server 2019/2022 and IIS 10.0.

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
Configure IIS reverse proxy for API (/api/*) and WebSocket (/socket.io/*) requests to Node.js backend at http://localhost:3000, enable Windows Firewall rules for ports 80/443, set up process monitoring (Windows Service SCM or PM2), configure IIS Application Initialization for health check monitoring, and document deployment runbook with screenshots.

**Purpose**: Establish IIS as reverse proxy gateway for backend API and WebSocket traffic, configure firewall security, implement monitoring, and provide deployment documentation for operations team.

**Capabilities**:
- IIS reverse proxy for /api/* requests to http://localhost:3000 (backend Node.js)
- IIS reverse proxy for /socket.io/* requests with WebSocket protocol upgrade support
- Windows Firewall inbound rules for HTTP (port 80) and HTTPS (port 443)
- Process monitoring: Windows Service SCM (CPU, memory, status) or PM2 (advanced metrics)
- IIS Application Initialization: Automated health check monitoring for /api/health endpoint
- Deployment runbook: Step-by-step guide with screenshots in .propel/docs/windows-deployment.md

## Dependent Tasks
- task_001_windows_service_backend (backend service must be running at http://localhost:3000)
- task_002_iis_frontend_deployment (IIS site and web.config must exist)

## Impacted Components
- **MODIFY**: C:\inetpub\wwwroot\upaci-frontend\web.config (add API and WebSocket proxy rules)
- **CREATE**: server/scripts/configure-firewall.ps1 (PowerShell script for Windows Firewall rules)
- **CREATE**: server/scripts/install-arr.ps1 (PowerShell script to install Application Request Routing)
- **CREATE**: server/scripts/configure-health-monitoring.ps1 (PowerShell script for IIS Application Initialization)
- **CREATE**: .propel/docs/windows-deployment.md (deployment runbook with screenshots)
- **CREATE**: server/scripts/monitor-service.ps1 (PowerShell script for Windows Service monitoring)

## Implementation Plan

### Phase 1: Application Request Routing (ARR) Installation (1 hour)
1. **Install ARR module**:
   - Download Application Request Routing 3.0: https://www.iis.net/downloads/microsoft/application-request-routing
   - Install via Web Platform Installer or MSI
   - PowerShell verification: `Get-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter "system.webServer/proxy" -Name "enabled"`
   - Enable ARR proxy: `Set-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter "system.webServer/proxy" -Name "enabled" -Value "True"`

2. **Enable WebSocket support in ARR**:
   - IIS Manager → Server (root level) → Application Request Routing Cache → Server Proxy Settings
   - Check "Enable proxy" checkbox
   - Check "Enable WebSocket protocol" checkbox (critical for /socket.io/*)
   - Apply changes

### Phase 2: Reverse Proxy Configuration (2 hours)
3. **Add API proxy rule to web.config**:
   - Modify C:\inetpub\wwwroot\upaci-frontend\web.config, add rule BEFORE SPA Fallback rule:
     ```xml
     <rule name="API Proxy" stopProcessing="true">
       <match url="^api/(.*)" />
       <action type="Rewrite" url="http://localhost:3000/api/{R:1}" />
       <serverVariables>
         <set name="HTTP_X_FORWARDED_FOR" value="{REMOTE_ADDR}" />
         <set name="HTTP_X_FORWARDED_PROTO" value="https" />
       </serverVariables>
     </rule>
     ```
   - Server variables: X-Forwarded-For (client IP), X-Forwarded-Proto (https)
   - Rewrite preserves query strings automatically

4. **Add WebSocket proxy rule to web.config**:
   - Add rule for Socket.io WebSocket traffic:
     ```xml
     <rule name="WebSocket Proxy" stopProcessing="true">
       <match url="^socket.io/(.*)" />
       <action type="Rewrite" url="http://localhost:3000/socket.io/{R:1}" />
       <serverVariables>
         <set name="HTTP_X_FORWARDED_FOR" value="{REMOTE_ADDR}" />
         <set name="HTTP_X_FORWARDED_PROTO" value="https" />
       </serverVariables>
     </rule>
     ```
   - WebSocket upgrade: ARR automatically handles HTTP → WebSocket protocol upgrade
   - Test: Connect Socket.io client from frontend, verify WebSocket handshake succeeds

5. **Configure server variables**:
   - ARR must allow setting X-Forwarded-* headers
   - PowerShell:
     ```powershell
     Add-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter "system.webServer/rewrite/allowedServerVariables" -Name "." -Value @{name="HTTP_X_FORWARDED_FOR"}
     Add-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter "system.webServer/rewrite/allowedServerVariables" -Name "." -Value @{name="HTTP_X_FORWARDED_PROTO"}
     ```

### Phase 3: Windows Firewall Configuration (1 hour)
6. **Create inbound firewall rules**:
   - PowerShell script configure-firewall.ps1:
     ```powershell
     # Allow HTTP (port 80)
     New-NetFirewallRule -DisplayName "UPACI HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -Profile Domain,Private,Public
     
     # Allow HTTPS (port 443)
     New-NetFirewallRule -DisplayName "UPACI HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -Profile Domain,Private,Public
     
     # Verify rules
     Get-NetFirewallRule | Where-Object { $_.DisplayName -like "UPACI*" }
     ```
   - Profiles: Domain (corporate network), Private (home/work network), Public (untrusted network)
   - Action: Allow (permit inbound traffic)

### Phase 4: Health Check Monitoring with IIS Application Initialization (1.5 hours)
7. **Install IIS Application Initialization module**:
   - PowerShell: `Install-WindowsFeature -Name Web-AppInit`
   - Feature enables preloading and health monitoring

8. **Configure Application Initialization for backend health checks**:
   - Modify IIS site configuration:
     ```powershell
     Set-ItemProperty IIS:\Sites\UPACI-Frontend -Name applicationDefaults.preloadEnabled -Value $true
     Set-ItemProperty IIS:\AppPools\UPACI-Frontend -Name startMode -Value AlwaysRunning
     ```
   - Add to web.config:
     ```xml
     <system.webServer>
       <applicationInitialization doAppInitAfterRestart="true">
         <add initializationPage="/healthcheck.html" />
       </applicationInitialization>
     </system.webServer>
     ```
   - Health check logic: IIS pings /healthcheck.html after site restart to verify frontend is ready
   - For backend API health: Separate monitoring script (Phase 5)

### Phase 5: Process Monitoring Setup (1.5 hours)
9. **Windows Service monitoring with SCM**:
   - Windows Service Control Manager (SCM) tracks UPACI-Backend service status
   - PowerShell monitoring script monitor-service.ps1:
     ```powershell
     $service = Get-Service -Name "UPACI-Backend"
     $process = Get-Process -Name "node" | Where-Object { $_.MainWindowTitle -like "*UPACI*" }
     
     [PSCustomObject]@{
       Status = $service.Status
       StartType = $service.StartType
       CPU_Percent = ($process.CPU / (Get-WmiObject Win32_Processor).NumberOfLogicalProcessors)
       Memory_MB = [math]::Round($process.WorkingSet64 / 1MB, 2)
       Uptime = (Get-Date) - $process.StartTime
     }
     ```
   - Schedule script: Task Scheduler task runs every 5 minutes, logs to CSV

10. **Optional: PM2 monitoring**:
    - Install PM2 globally: `npm install -g pm2 pm2-windows-service`
    - PM2 provides: CPU/memory metrics, log aggregation, process restart, dashboard UI
    - Alternative to Windows Service if advanced monitoring needed
    - Note: Cannot run both node-windows service AND PM2 service simultaneously (choose one)

### Phase 6: Deployment Runbook Documentation (2 hours)
11. **Create windows-deployment.md**:
    - Document structure:
      1. Prerequisites (Windows Server version, .NET, Node.js)
      2. IIS installation (install-iis-features.ps1)
      3. Backend Windows Service setup (install-service.js)
      4. Frontend deployment (deploy-frontend.ps1)
      5. SSL certificate installation (configure-ssl.ps1)
      6. Reverse proxy configuration (web.config rules)
      7. Firewall rules (configure-firewall.ps1)
      8. Health check verification (test /api/health, /healthcheck.html)
      9. Monitoring setup (monitor-service.ps1 scheduled task)
      10. Troubleshooting guide (common issues: service won't start, IIS 502 errors, SSL binding errors)
    - Screenshots: Capture each step in IIS Manager, Services.msc, Task Scheduler, Event Viewer
    - Verification checklist: Service running, site accessible via HTTPS, API proxy working, WebSocket connected

## Current Project State
```
C:\inetpub\wwwroot\upaci-frontend\
  web.config (MODIFY - add API and WebSocket proxy rules)

server/scripts/
  install-arr.ps1 (CREATE - ARR installation)
  configure-firewall.ps1 (CREATE - Firewall rules)
  configure-health-monitoring.ps1 (CREATE - IIS App Init)
  monitor-service.ps1 (CREATE - Service monitoring)

.propel/docs/
  windows-deployment.md (CREATE - Deployment runbook)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| MODIFY | C:\inetpub\wwwroot\upaci-frontend\web.config | Add API proxy rule (rewrite /api/* to localhost:3000/api/*) and WebSocket proxy rule (rewrite /socket.io/* to localhost:3000/socket.io/*) with X-Forwarded headers |
| CREATE | server/scripts/install-arr.ps1 | PowerShell script to install Application Request Routing 3.0 and enable WebSocket support |
| CREATE | server/scripts/configure-firewall.ps1 | PowerShell script to create Windows Firewall inbound rules for ports 80 (HTTP) and 443 (HTTPS) |
| CREATE | server/scripts/configure-health-monitoring.ps1 | PowerShell script to configure IIS Application Initialization for /healthcheck.html monitoring |
| CREATE | server/scripts/monitor-service.ps1 | PowerShell script to monitor UPACI-Backend service (status, CPU, memory, uptime) with Task Scheduler integration |
| CREATE | .propel/docs/windows-deployment.md | Comprehensive deployment runbook with 10 sections (prerequisites, installation, configuration, troubleshooting) and screenshots |

## External References
- **Application Request Routing**: https://www.iis.net/downloads/microsoft/application-request-routing (ARR download and documentation)
- **IIS Reverse Proxy**: https://docs.microsoft.com/en-us/iis/extensions/url-rewrite-module/reverse-proxy-with-url-rewrite-v2-and-application-request-routing (Proxy configuration)
- **WebSocket in IIS**: https://docs.microsoft.com/en-us/iis/get-started/whats-new-in-iis-8/iis-80-websocket-protocol-support (WebSocket support)
- **Windows Firewall PowerShell**: https://docs.microsoft.com/en-us/powershell/module/netsecurity/new-netfirewallrule (Firewall cmdlets)
- **IIS Application Initialization**: https://docs.microsoft.com/en-us/iis/configuration/system.webserver/applicationinitialization/ (Preloading and health checks)
- **Windows Service Monitoring**: https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.management/get-service (Service cmdlets)

## Build Commands
```powershell
# Install ARR and enable proxy
.\server\scripts\install-arr.ps1

# Configure reverse proxy rules
# (Manually edit web.config or use PowerShell to append rules)

# Configure Windows Firewall
.\server\scripts\configure-firewall.ps1

# Configure health monitoring
.\server\scripts\configure-health-monitoring.ps1

# Set up service monitoring
.\server\scripts\monitor-service.ps1
# Schedule via Task Scheduler: schtasks /create /tn "UPACI Service Monitor" /tr "powershell -File C:\Path\monitor-service.ps1" /sc minute /mo 5

# Test reverse proxy
Invoke-WebRequest https://localhost/api/health
Invoke-WebRequest https://localhost/healthcheck.html
```

## Implementation Validation Strategy
- [x] ARR installation validation: Verify ARR module in IIS Manager → Modules, check "ApplicationRequestRouting" present
- [x] Reverse proxy validation: Send API request to https://yoursite.com/api/health, verify response from backend (HTTP 200, JSON status)
- [x] WebSocket proxy validation: Connect Socket.io client from frontend, verify WebSocket handshake succeeds (check browser DevTools → Network → WS tab)
- [x] X-Forwarded headers validation: Check backend logs, verify client IP is real client IP (not 127.0.0.1), protocol is "https"
- [x] Firewall rules validation: Test from external machine, verify HTTP/HTTPS accessible, use `Test-NetConnection -ComputerName yourserver -Port 443`
- [x] Health check monitoring validation: Restart IIS site, verify IIS pings /healthcheck.html automatically (check IIS logs)
- [x] Service monitoring validation: Run monitor-service.ps1, verify output shows service status (Running), CPU/memory usage, uptime
- [x] 502 Bad Gateway testing: Stop UPACI-Backend service, send API request via IIS, verify IIS returns HTTP 502 (backend unavailable)

## Implementation Checklist
- [x] Install Application Request Routing 3.0 (ARR) module via install-arr.ps1 and enable WebSocket protocol support in ARR settings
- [x] Modify web.config to add API proxy rule (rewrite /api/* to http://localhost:3000/api/*) and WebSocket proxy rule (rewrite /socket.io/* to http://localhost:3000/socket.io/*) with X-Forwarded-For and X-Forwarded-Proto headers
- [x] Configure ARR to allow setting X-Forwarded-* server variables via PowerShell (Add-WebConfigurationProperty for allowedServerVariables)
- [x] Create Windows Firewall inbound rules via configure-firewall.ps1 (allow TCP ports 80 and 443 for Domain, Private, Public profiles)
- [x] Install IIS Application Initialization module (Web-AppInit feature) and configure preloadEnabled=true for UPACI-Frontend site with /healthcheck.html initialization page
- [x] Create monitor-service.ps1 PowerShell script to track UPACI-Backend service status, CPU, memory, uptime, and schedule via Task Scheduler (every 5 minutes)
- [x] Test reverse proxy (send API request to https://yoursite.com/api/health, verify backend response) and WebSocket proxy (connect Socket.io client, verify handshake)
- [x] Document deployment runbook in .propel/docs/windows-deployment.md with 10 sections (prerequisites, IIS installation, service setup, SSL config, proxy config, firewall, health checks, monitoring, troubleshooting) and include screenshots for each step
