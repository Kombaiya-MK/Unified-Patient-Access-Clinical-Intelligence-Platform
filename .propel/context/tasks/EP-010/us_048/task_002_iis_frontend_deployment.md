# Task - task_002_iis_frontend_deployment

## Requirement Reference
- User Story: US_048 - Windows Services/IIS Deployment Configuration
- Story Location: .propel/context/tasks/us_048/us_048.md
- Acceptance Criteria:
    - System configures IIS as reverse proxy for React frontend on port 443 (HTTPS) with URL Rewrite module installed
    - System creates IIS Application Pool "UPACI-Frontend" with .NET CLR version "No Managed Code"
    - System sets Application Pool identity to ApplicationPoolIdentity
    - Frontend static files served from C:\inetpub\wwwroot\upaci-frontend\
    - System installs SSL certificate (Let's Encrypt or commercial cert) and binds to HTTPS port 443
    - System configures HTTPS redirect (HTTP to HTTPS) and HSTS headers (max-age=31536000)
    - System enables compression (gzip/brotli) in IIS for static assets reducing bandwidth by ~70%
    - System configures URL Rewrite for single-page app routing (all frontend routes redirect to index.html except API calls)
    - System implements health check endpoint (/healthcheck.html for frontend) monitored by IIS
- Edge Cases:
    - How are SSL certificate renewals handled? (Manual renewal via IIS Manager or automated with certes/win-acme for Let's Encrypt, scheduled task checks expiry monthly)

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A (Infrastructure story - IIS static file serving) |
| **Screen Spec** | N/A |
| **UXR Requirements** | N/A |
| **Design Tokens** | N/A |

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React (build artifacts) | 18.x |
| Infrastructure | IIS (Internet Information Services) | 10.0 (Windows Server 2019/2022) |
| Library | URL Rewrite Module | 2.1 |
| Library | win-acme (optional, for Let's Encrypt) | 2.x |
| Backend | N/A | N/A |
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
Configure IIS to serve React frontend static files from C:\inetpub\wwwroot\upaci-frontend\ with dedicated Application Pool, HTTPS binding using SSL certificate, HTTP-to-HTTPS redirect, HSTS headers, gzip/brotli compression, SPA routing via URL Rewrite (redirect all routes to index.html except API), and frontend health check endpoint (/healthcheck.html).

**Purpose**: Establish IIS as production web server for React frontend with SSL/TLS encryption, compression, and SPA routing support.

**Capabilities**:
- IIS Application Pool "UPACI-Frontend" with No Managed Code (.NET CLR version)
- Static file serving from C:\inetpub\wwwroot\upaci-frontend\ (React build artifacts)
- SSL certificate installation (Let's Encrypt or commercial cert) with HTTPS binding on port 443
- HTTP to HTTPS redirect (automatic redirect from port 80 to 443)
- HSTS (HTTP Strict Transport Security) headers (max-age=31536000, 1 year)
- Compression enabled (gzip for legacy, brotli for modern browsers, ~70% bandwidth reduction)
- SPA routing via URL Rewrite (all routes → index.html, except /api/*, /healthcheck.html, /static/*)
- Frontend health check endpoint (healthcheck.html static file)

## Dependent Tasks
- None (foundational IIS frontend configuration)

## Impacted Components
- **CREATE**: C:\inetpub\wwwroot\upaci-frontend\ (directory for frontend build artifacts)
- **CREATE**: C:\inetpub\wwwroot\upaci-frontend\web.config (IIS configuration for SPA routing and HSTS)
- **CREATE**: C:\inetpub\wwwroot\upaci-frontend\healthcheck.html (static health check file)
- **CREATE**: server/scripts/deploy-frontend.ps1 (PowerShell script to copy React build to IIS directory)
- **CREATE**: server/scripts/install-iis-features.ps1 (PowerShell script to install IIS roles and URL Rewrite module)
- **CREATE**: server/scripts/configure-ssl.ps1 (PowerShell script to install SSL cert and bind to port 443)
- **MODIFY**: app/package.json (add deploy script: npm run build && copy build to IIS)

## Implementation Plan

### Phase 1: IIS Installation & Application Pool Setup (1.5 hours)
1. **Install IIS roles and features**:
   - PowerShell script: `Install-WindowsFeature -Name Web-Server -IncludeManagementTools`
   - Required features:
     - Web-Server (IIS core)
     - Web-Static-Content (static file serving)
     - Web-Default-Doc (default document support)
     - Web-Http-Errors (custom error pages)
     - Web-Http-Redirect (HTTP to HTTPS redirect)
     - Web-Filtering (request filtering)
     - Web-Stat-Compression (gzip compression)
     - Web-Dyn-Compression (dynamic compression for API responses via proxy)
   - Install URL Rewrite Module 2.1: Download from https://www.iis.net/downloads/microsoft/url-rewrite or use Web Platform Installer

2. **Create IIS Application Pool**:
   - PowerShell:
     ```powershell
     Import-Module WebAdministration
     New-WebAppPool -Name "UPACI-Frontend"
     Set-ItemProperty IIS:\AppPools\UPACI-Frontend -Name managedRuntimeVersion -Value ""
     Set-ItemProperty IIS:\AppPools\UPACI-Frontend -Name processModel.identityType -Value ApplicationPoolIdentity
     ```
   - Application Pool settings:
     - Name: "UPACI-Frontend"
     - .NET CLR Version: "No Managed Code" (empty string)
     - Identity: ApplicationPoolIdentity (least privilege)
     - Start Mode: AlwaysRunning (for preloading)
     - Idle Timeout: 20 minutes (default)

### Phase 2: Static Site Configuration (1 hour)
3. **Create IIS site for frontend**:
   - PowerShell:
     ```powershell
     New-Item -ItemType Directory -Force -Path "C:\inetpub\wwwroot\upaci-frontend"
     New-WebSite -Name "UPACI-Frontend" -Port 80 -PhysicalPath "C:\inetpub\wwwroot\upaci-frontend" -ApplicationPool "UPACI-Frontend"
     ```
   - Site settings:
     - Name: "UPACI-Frontend"
     - Physical path: C:\inetpub\wwwroot\upaci-frontend\
     - Bindings: HTTP port 80 (temporary, will add HTTPS in Phase 3)
     - Application Pool: UPACI-Frontend

4. **Deploy React build artifacts**:
   - Build React app: `cd app && npm run build`
   - Copy build to IIS: `Copy-Item -Path "app\build\*" -Destination "C:\inetpub\wwwroot\upaci-frontend\" -Recurse -Force`
   - Verify files: index.html, static folder (css, js, media), favicon.ico, manifest.json
   - Set file permissions: Grant IIS_IUSRS and ApplicationPoolIdentity read access

### Phase 3: SSL Certificate Installation (1.5 hours)
5. **Install SSL certificate**:
   - **Option A - Let's Encrypt (free, automated)**:
     - Download win-acme: https://github.com/win-acme/win-acme/releases
     - Run: `wacs.exe --target manual --host upaci.yourdomain.com --installation iis --siteid 1`
     - Automated renewal: Scheduled task runs daily, renews 30 days before expiry
   - **Option B - Commercial cert (manual)**:
     - Purchase SSL cert from CA (e.g., Sectigo, DigiCert)
     - Generate CSR in IIS Manager → Server Certificates → Create Certificate Request
     - Submit CSR to CA, receive .crt and .ca-bundle files
     - Complete Certificate Request in IIS Manager → Import .crt
   - Store certificate in Local Machine → Personal → Certificates store

6. **Bind SSL certificate to site**:
   - PowerShell:
     ```powershell
     $cert = Get-ChildItem -Path Cert:\LocalMachine\My | Where-Object { $_.Subject -like "*upaci.yourdomain.com*" }
     New-WebBinding -Name "UPACI-Frontend" -Protocol https -Port 443 -SslFlags 1
     $binding = Get-WebBinding -Name "UPACI-Frontend" -Protocol https
     $binding.AddSslCertificate($cert.Thumbprint, "my")
     ```
   - Binding settings: HTTPS port 443, SNI (Server Name Indication) enabled

### Phase 4: HTTPS Redirect & HSTS Headers (1 hour)
7. **Configure HTTP to HTTPS redirect**:
   - Create web.config with URL Rewrite rule:
     ```xml
     <configuration>
       <system.webServer>
         <rewrite>
           <rules>
             <rule name="HTTP to HTTPS redirect" stopProcessing="true">
               <match url="(.*)" />
               <conditions>
                 <add input="{HTTPS}" pattern="off" ignoreCase="true" />
               </conditions>
               <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
             </rule>
           </rules>
         </rewrite>
       </system.webServer>
     </configuration>
     ```
   - Test: Access http://yoursite.com, verify redirect to https://yoursite.com

8. **Add HSTS headers**:
   - Append to web.config:
     ```xml
     <system.webServer>
       <httpProtocol>
         <customHeaders>
           <add name="Strict-Transport-Security" value="max-age=31536000; includeSubDomains; preload" />
         </customHeaders>
       </httpProtocol>
     </system.webServer>
     ```
   - HSTS settings: max-age=31536000 (1 year), includeSubDomains, preload (for HSTS preload list)

### Phase 5: Compression & SPA Routing (2 hours)
9. **Enable compression**:
   - PowerShell:
     ```powershell
     Set-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter "system.webServer/httpCompression" -Name "directory" -Value "C:\inetpub\temp\IIS Temporary Compressed Files"
     Set-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter "system.webServer/httpCompression/scheme[@name='gzip']" -Name "staticCompressionLevel" -Value 9
     Set-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter "system.webServer/httpCompression" -Name "staticCompressionLevel" -Value 9
     ```
   - Enable Brotli compression (Windows Server 2019+): Install via IIS Manager → Compression → Brotli
   - Compress file types: text/html, text/css, application/javascript, application/json, image/svg+xml
   - Bandwidth reduction: ~70% for text files, ~50% for already-compressed images

10. **Configure SPA routing**:
    - Update web.config with SPA fallback rule:
      ```xml
      <rule name="SPA Fallback" stopProcessing="true">
        <match url=".*" />
        <conditions logicalGrouping="MatchAll">
          <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
          <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          <add input="{REQUEST_URI}" pattern="^/api/" negate="true" />
          <add input="{REQUEST_URI}" pattern="^/healthcheck.html" negate="true" />
        </conditions>
        <action type="Rewrite" url="/" />
      </rule>
      ```
    - Logic: If request is not a file/directory, not /api/*, not /healthcheck.html → rewrite to / (index.html)
    - Test: Access https://yoursite.com/dashboard, verify index.html loads (React Router handles routing)

11. **Create frontend health check**:
    - Create healthcheck.html in C:\inetpub\wwwroot\upaci-frontend\:
      ```html
      <!DOCTYPE html>
      <html>
      <head><title>Health Check</title></head>
      <body>OK</body>
      </html>
      ```
    - Test: Access https://yoursite.com/healthcheck.html, verify "OK" response (HTTP 200)

## Current Project State
```
C:\inetpub\wwwroot\upaci-frontend\
  index.html (from React build)
  static\ (CSS, JS, media files)
  web.config (CREATE - IIS configuration)
  healthcheck.html (CREATE - static health check)

server/scripts/
  install-iis-features.ps1 (CREATE - IIS installation script)
  deploy-frontend.ps1 (CREATE - Deploy React build to IIS)
  configure-ssl.ps1 (CREATE - SSL cert installation and binding)

app/
  package.json (MODIFY - add deploy script)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | C:\inetpub\wwwroot\upaci-frontend\ | Directory for React frontend build artifacts (created via PowerShell) |
| CREATE | C:\inetpub\wwwroot\upaci-frontend\web.config | IIS configuration with HTTP-to-HTTPS redirect, HSTS headers, SPA fallback routing |
| CREATE | C:\inetpub\wwwroot\upaci-frontend\healthcheck.html | Static health check file returning "OK" for IIS monitoring |
| CREATE | server/scripts/install-iis-features.ps1 | PowerShell script to install IIS roles (Web-Server, URL Rewrite, compression) |
| CREATE | server/scripts/deploy-frontend.ps1 | PowerShell script to build React app and copy artifacts to C:\inetpub\wwwroot\upaci-frontend\ |
| CREATE | server/scripts/configure-ssl.ps1 | PowerShell script to install SSL cert (Let's Encrypt or commercial) and bind to HTTPS port 443 |
| MODIFY | app/package.json | Add deploy script: "deploy": "npm run build && powershell ../server/scripts/deploy-frontend.ps1" |

## External References
- **IIS Configuration**: https://docs.microsoft.com/en-us/iis/configuration/ (IIS web.config reference)
- **URL Rewrite Module**: https://www.iis.net/downloads/microsoft/url-rewrite (Download and documentation)
- **win-acme (Let's Encrypt)**: https://github.com/win-acme/win-acme (Automated SSL cert management for Windows)
- **HSTS Preload**: https://hstspreload.org/ (HSTS preload list submission)
- **IIS Compression**: https://docs.microsoft.com/en-us/iis/configuration/system.webserver/httpcompression/ (Gzip and Brotli configuration)
- **SPA Routing in IIS**: https://docs.microsoft.com/en-us/iis/extensions/url-rewrite-module/reverse-proxy-with-url-rewrite-v2-and-application-request-routing (SPA fallback pattern)

## Build Commands
```powershell
# Install IIS and URL Rewrite module
.\server\scripts\install-iis-features.ps1

# Create IIS Application Pool and site
Import-Module WebAdministration
New-WebAppPool -Name "UPACI-Frontend"
Set-ItemProperty IIS:\AppPools\UPACI-Frontend -Name managedRuntimeVersion -Value ""
New-WebSite -Name "UPACI-Frontend" -Port 80 -PhysicalPath "C:\inetpub\wwwroot\upaci-frontend" -ApplicationPool "UPACI-Frontend"

# Build and deploy React frontend
cd app
npm run build
.\server\scripts\deploy-frontend.ps1

# Install SSL certificate and configure HTTPS
.\server\scripts\configure-ssl.ps1

# Verify site
Start-Process "https://localhost"
```

## Implementation Validation Strategy
- [x] IIS installation validation: Verify IIS Manager opens, Web-Server, URL Rewrite module installed
- [x] Application Pool validation: Check Services.msc or IIS Manager → Application Pools → UPACI-Frontend (Running, No Managed Code)
- [x] Static file serving: Access https://yoursite.com/, verify React app loads (index.html served)
- [x] SSL validation: Browser shows padlock icon, certificate valid, issued to correct domain
- [x] HTTPS redirect validation: Access http://yoursite.com/, verify automatic redirect to https:// (HTTP 301/302)
- [x] HSTS headers validation: Check HTTP response headers in browser DevTools → Network, verify "Strict-Transport-Security: max-age=31536000"
- [x] Compression validation: Check response headers for "Content-Encoding: gzip" or "Content-Encoding: br" (brotli), verify file sizes reduced
- [x] SPA routing validation: Access https://yoursite.com/dashboard (non-existent route), verify index.html loads instead of 404, React Router handles routing
- [x] Health check validation: Access https://yoursite.com/healthcheck.html, verify "OK" response (HTTP 200)

## Implementation Checklist
- [x] Install IIS roles and features (Web-Server, URL Rewrite 2.1, static compression, dynamic compression) via PowerShell script
- [x] Create IIS Application Pool "UPACI-Frontend" with No Managed Code and ApplicationPoolIdentity
- [x] Create IIS site "UPACI-Frontend" serving from C:\inetpub\wwwroot\upaci-frontend\ with HTTP binding on port 80
- [x] Build React app (npm run build) and deploy artifacts to C:\inetpub\wwwroot\upaci-frontend\ via deploy-frontend.ps1 script
- [x] Install SSL certificate (Let's Encrypt via win-acme or commercial cert) and bind to HTTPS port 443 with SNI enabled
- [x] Create web.config with HTTP-to-HTTPS redirect rule (301 permanent redirect) and HSTS headers (max-age=31536000, includeSubDomains, preload)
- [x] Enable gzip and brotli compression for static assets (text/html, text/css, application/javascript, image/svg+xml) reducing bandwidth by ~70%
- [x] Configure SPA routing via URL Rewrite (rewrite all routes to index.html except /api/*, /healthcheck.html, /static/* file requests) and create healthcheck.html returning "OK"
