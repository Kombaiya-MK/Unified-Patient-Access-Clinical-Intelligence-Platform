# Task - TASK_001_INFRA_BACKUP_AUTOMATION_SCRIPT

## Requirement Reference
- User Story: US_042
- Story Location: .propel/context/tasks/us_042/us_042.md
- Acceptance Criteria:
    - PostgreSQL database backup every 6 hours using pg_dump with full schema + data (AC-1)
    - Redis RDB snapshots every 1 hour saved to persistent volume (AC-1)
    - Application logs from last 90 days backed up (AC-1)
    - Backups compressed with gzip achieving 70% compression ratio (AC-1)
    - Backups encrypted using AES-256 with KMS-managed keys per NFR-SEC02 (AC-1)
- Edge Case:
    - Partial backups handled atomically - no partial uploads, retry once, then alert as critical failure (EC-2)
    - Backup failures logged with detailed error context for troubleshooting

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A - Infrastructure task (backup automation, data protection) |
| **Screen Spec** | N/A |
| **UXR Requirements** | N/A |
| **Design Tokens** | N/A |

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Mobile | N/A | N/A |
| Backend | Node.js (Express) | 20.x LTS |
| Database | PostgreSQL + pgvector | 15.x + 0.5.x |
| Caching | Upstash Redis | latest |
| Infrastructure | Windows Services/IIS + Cron/Task Scheduler | latest |
| Security | OpenSSL | latest |
| Monitoring | Prometheus + Grafana | latest |

**Note**: All code and libraries MUST be compatible with versions above. Must follow Node.js 20.x LTS, PostgreSQL 15.x best practices for backup and encryption.

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
Create automated backup system for PostgreSQL database, Redis cache, and application logs with compression and encryption: (1) PostgreSQL backup script using pg_dump with --format=custom for optimal compression, scheduled via cron job (0 */6 * * * = every 6 hours at minute 0), exports full schema + data to /var/backups/postgresql/backup-YYYY-MM-DD_HH-MM-SS.dump, (2) Redis backup script using redis-cli --rdb for RDB snapshots, scheduled every 1 hour (0 * * * *), saves to /var/backups/redis/dump-YYYY-MM-DD_HH-MM-SS.rdb, (3) Application logs backup script copying logs from /var/log/app/ (last 90 days) to /var/backups/logs/logs-YYYY-MM-DD.tar, (4) Compression pipeline using gzip with -9 flag (best compression) to achieve 70% compression ratio target, compresses all backup files after generation, (5) Encryption layer using OpenSSL AES-256-CBC encryption with KMS-managed keys (key rotation implemented annually per NFR-SEC02), encrypts compressed backups before storage, outputs .enc files, (6) Backup orchestration script (Node.js) coordinating all backup types in sequence: PostgreSQL → Redis → Logs → Compress → Encrypt, logs each step to syslog and Prometheus pushgateway, implements atomic transaction (all steps succeed or rollback), (7) Retry logic with exponential backoff: On failure, retry once after 5 minutes, if second attempt fails, skip upload and trigger critical alert, (8) Local storage management maintaining last 7 days of backups on local disk (/var/backups/) before offsite upload for quick local recovery.

## Dependent Tasks
- US-003 (PostgreSQL database exists and is operational)
- US-004 (Redis cache exists and is operational)
- US-011 (Audit logs exist in /var/log/app/ or equivalent)
- US_042 - TASK_002_INFRA_CLOUD_STORAGE_INTEGRATION (Offsite upload will be handled in Task 002)

## Impacted Components
- server/src/scripts/backup-postgresql.sh - New shell script for PostgreSQL pg_dump
- server/src/scripts/backup-redis.sh - New shell script for Redis RDB snapshots
- server/src/scripts/backup-logs.sh - New shell script for application logs backup
- server/src/scripts/compress-backups.sh - New shell script for gzip compression pipeline
- server/src/scripts/encrypt-backups.sh - New shell script for AES-256 encryption
- server/src/scripts/backup-orchestrator.ts - New Node.js orchestration script
- server/src/config/backup.config.ts - New configuration file for backup settings
- server/src/utils/kms-key-manager.ts - New utility for KMS key management
- /etc/cron.d/app-backups - New cron configuration file (Linux) or Task Scheduler config (Windows)
- /var/backups/ - New directory structure for local backup storage
- server/logs/backup-execution.log - New log file for backup operation tracking

## Implementation Plan
1. **Create Backup Directory Structure**:
   ```bash
   mkdir -p /var/backups/postgresql
   mkdir -p /var/backups/redis
   mkdir -p /var/backups/logs
   mkdir -p /var/backups/compressed
   mkdir -p /var/backups/encrypted
   ```
2. **Create PostgreSQL Backup Script (backup-postgresql.sh)**:
   ```bash
   #!/bin/bash
   set -euo pipefail
   
   TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
   BACKUP_DIR="/var/backups/postgresql"
   BACKUP_FILE="${BACKUP_DIR}/backup-${TIMESTAMP}.dump"
   
   # Load database credentials from environment
   source /etc/app/backup.env
   
   # Perform pg_dump with custom format (best compression)
   pg_dump -U ${DB_USER} -h ${DB_HOST} -p ${DB_PORT} -d ${DB_NAME} \
     --format=custom \
     --file="${BACKUP_FILE}" \
     --verbose \
     --no-password
   
   # Log success
   echo "PostgreSQL backup completed: ${BACKUP_FILE}" | logger -t backup-postgresql
   echo "${BACKUP_FILE}"  # Output filename for orchestrator
   ```
3. **Create Redis Backup Script (backup-redis.sh)**:
   ```bash
   #!/bin/bash
   set -euo pipefail
   
   TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
   BACKUP_DIR="/var/backups/redis"
   BACKUP_FILE="${BACKUP_DIR}/dump-${TIMESTAMP}.rdb"
   
   # Load Redis credentials
   source /etc/app/backup.env
   
   # Trigger RDB snapshot
   redis-cli -h ${REDIS_HOST} -p ${REDIS_PORT} -a ${REDIS_PASSWORD} BGSAVE
   
   # Wait for save to complete (check LASTSAVE timestamp)
   sleep 5
   
   # Copy RDB file to backup location
   cp ${REDIS_DATA_DIR}/dump.rdb "${BACKUP_FILE}"
   
   echo "Redis backup completed: ${BACKUP_FILE}" | logger -t backup-redis
   echo "${BACKUP_FILE}"
   ```
4. **Create Application Logs Backup Script (backup-logs.sh)**:
   ```bash
   #!/bin/bash
   set -euo pipefail
   
   TIMESTAMP=$(date +%Y-%m-%d)
   BACKUP_DIR="/var/backups/logs"
   BACKUP_FILE="${BACKUP_DIR}/logs-${TIMESTAMP}.tar"
   LOG_DIR="/var/log/app"
   
   # Find logs from last 90 days
   find ${LOG_DIR} -type f -mtime -90 -name "*.log" | tar -czf "${BACKUP_FILE}" -T -
   
   echo "Application logs backup completed: ${BACKUP_FILE}" | logger -t backup-logs
   echo "${BACKUP_FILE}"
   ```
5. **Create Compression Script (compress-backups.sh)**:
   ```bash
   #!/bin/bash
   set -euo pipefail
   
   INPUT_FILE="$1"
   OUTPUT_DIR="/var/backups/compressed"
   OUTPUT_FILE="${OUTPUT_DIR}/$(basename ${INPUT_FILE}).gz"
   
   # Compress with gzip -9 (best compression)
   gzip -9 -c "${INPUT_FILE}" > "${OUTPUT_FILE}"
   
   # Calculate compression ratio
   ORIGINAL_SIZE=$(stat -c%s "${INPUT_FILE}")
   COMPRESSED_SIZE=$(stat -c%s "${OUTPUT_FILE}")
   RATIO=$(echo "scale=2; (1 - ${COMPRESSED_SIZE}/${ORIGINAL_SIZE}) * 100" | bc)
   
   echo "Compressed ${INPUT_FILE} -> ${OUTPUT_FILE} (ratio: ${RATIO}%)" | logger -t compress-backups
   echo "${OUTPUT_FILE}"
   ```
6. **Create Encryption Script (encrypt-backups.sh)**:
   ```bash
   #!/bin/bash
   set -euo pipefail
   
   INPUT_FILE="$1"
   OUTPUT_DIR="/var/backups/encrypted"
   OUTPUT_FILE="${OUTPUT_DIR}/$(basename ${INPUT_FILE}).enc"
   KMS_KEY_FILE="/etc/app/backup-encryption.key"
   
   # Encrypt with AES-256-CBC
   openssl enc -aes-256-cbc -salt -in "${INPUT_FILE}" -out "${OUTPUT_FILE}" -pass file:${KMS_KEY_FILE}
   
   echo "Encrypted ${INPUT_FILE} -> ${OUTPUT_FILE}" | logger -t encrypt-backups
   echo "${OUTPUT_FILE}"
   ```
7. **Create KMS Key Manager Utility (kms-key-manager.ts)**:
   ```typescript
   import * as crypto from 'crypto';
   import * as fs from 'fs';
   import * as path from 'path';
   
   export class KMSKeyManager {
     private readonly keyPath = '/etc/app/backup-encryption.key';
     private readonly keyRotationLog = '/var/log/app/key-rotation.log';
   
     async generateKey(): Promise<void> {
       // Generate 256-bit (32-byte) random key
       const key = crypto.randomBytes(32);
       
       // Write key to secure location with restricted permissions
       fs.writeFileSync(this.keyPath, key, { mode: 0o600 });
       
       const logEntry = `${new Date().toISOString()} - New encryption key generated\n`;
       fs.appendFileSync(this.keyRotationLog, logEntry);
       
       console.log('Encryption key generated and saved to', this.keyPath);
     }
   
     async rotateKey(): Promise<void> {
       // Archive old key
       const timestamp = new Date().toISOString().replace(/:/g, '-');
       const archivePath = `/etc/app/backup-encryption.key.${timestamp}`;
       
       if (fs.existsSync(this.keyPath)) {
         fs.copyFileSync(this.keyPath, archivePath);
       }
       
       // Generate new key
       await this.generateKey();
       
       const logEntry = `${new Date().toISOString()} - Key rotated, old key archived to ${archivePath}\n`;
       fs.appendFileSync(this.keyRotationLog, logEntry);
     }
   
     async checkKeyAge(): Promise<number> {
       if (!fs.existsSync(this.keyPath)) {
         throw new Error('Encryption key not found. Run generateKey() first.');
       }
       
       const stats = fs.statSync(this.keyPath);
       const ageInDays = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
       return Math.floor(ageInDays);
     }
   }
   ```
8. **Create Backup Orchestrator Script (backup-orchestrator.ts)**:
   ```typescript
   import { exec } from 'child_process';
   import { promisify } from 'util';
   import * as fs from 'fs';
   import * as path from 'path';
   import axios from 'axios';
   
   const execAsync = promisify(exec);
   
   interface BackupResult {
     type: 'postgresql' | 'redis' | 'logs';
     originalFile: string;
     compressedFile: string;
     encryptedFile: string;
     success: boolean;
     error?: string;
   }
   
   class BackupOrchestrator {
     private prometheusGateway = process.env.PROMETHEUS_PUSHGATEWAY_URL || 'http://localhost:9091';
     
     async runBackup(type: 'postgresql' | 'redis' | 'logs'): Promise<BackupResult> {
       const startTime = Date.now();
       
       try {
         // Step 1: Run backup script
         const backupScriptMap = {
           postgresql: '/opt/app/scripts/backup-postgresql.sh',
           redis: '/opt/app/scripts/backup-redis.sh',
           logs: '/opt/app/scripts/backup-logs.sh'
         };
         
         const { stdout: originalFile } = await execAsync(backupScriptMap[type]);
         const trimmedFile = originalFile.trim();
         
         // Step 2: Compress
         const { stdout: compressedFile } = await execAsync(
           `/opt/app/scripts/compress-backups.sh "${trimmedFile}"`
         );
         
         // Step 3: Encrypt
         const { stdout: encryptedFile } = await execAsync(
           `/opt/app/scripts/encrypt-backups.sh "${compressedFile.trim()}"`
         );
         
         // Step 4: Record metrics
         const duration = (Date.now() - startTime) / 1000;  // seconds
         const fileSize = fs.statSync(encryptedFile.trim()).size;
         
         await this.pushMetrics(type, duration, fileSize, true);
         
         return {
           type,
           originalFile: trimmedFile,
           compressedFile: compressedFile.trim(),
           encryptedFile: encryptedFile.trim(),
           success: true
         };
       } catch (error) {
         const duration = (Date.now() - startTime) / 1000;
         await this.pushMetrics(type, duration, 0, false);
         
         console.error(`Backup failed for ${type}:`, error);
         return {
           type,
           originalFile: '',
           compressedFile: '',
           encryptedFile: '',
           success: false,
           error: error instanceof Error ? error.message : String(error)
         };
       }
     }
     
     async retryBackup(type: 'postgresql' | 'redis' | 'logs'): Promise<BackupResult> {
       console.log(`Retrying backup for ${type} after 5-minute delay...`);
       await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
       return this.runBackup(type);
     }
     
     async pushMetrics(type: string, duration: number, size: number, success: boolean): Promise<void> {
       const metrics = `
   # TYPE backup_duration_seconds histogram
   backup_duration_seconds{type="${type}"} ${duration}
   # TYPE backup_size_bytes gauge
   backup_size_bytes{type="${type}"} ${size}
   # TYPE backup_success_last_timestamp gauge
   backup_success_last_timestamp{type="${type}"} ${success ? Date.now() / 1000 : 0}
   `;
       
       try {
         await axios.post(`${this.prometheusGateway}/metrics/job/backup_orchestrator/instance/${type}`, metrics);
       } catch (error) {
         console.error('Failed to push metrics:', error);
       }
     }
     
     async orchestrateAllBackups(): Promise<void> {
       const backupTypes: Array<'postgresql' | 'redis' | 'logs'> = ['postgresql', 'redis', 'logs'];
       const results: BackupResult[] = [];
       
       for (const type of backupTypes) {
         let result = await this.runBackup(type);
         
         // Retry once on failure
         if (!result.success) {
           result = await this.retryBackup(type);
         }
         
         results.push(result);
       }
       
       // Log summary
       const successCount = results.filter(r => r.success).length;
       console.log(`Backup orchestration completed: ${successCount}/${results.length} successful`);
       
       // Trigger critical alert if any backup failed after retry
       const failures = results.filter(r => !r.success);
       if (failures.length > 0) {
         console.error('CRITICAL: Backup failures detected:', failures);
         // Alert will be triggered in TASK_003_INFRA_MONITORING_ALERTING
       }
     }
   }
   
   // Run orchestrator
   const orchestrator = new BackupOrchestrator();
   orchestrator.orchestrateAllBackups().catch(console.error);
   ```
9. **Create Backup Configuration (backup.config.ts)**:
   ```typescript
   export const backupConfig = {
     postgresql: {
       schedule: '0 */6 * * *',  // Every 6 hours at minute 0
       retentionDays: 7,  // Local retention before offsite upload
       backupDir: '/var/backups/postgresql'
     },
     redis: {
       schedule: '0 * * * *',  // Every hour at minute 0
       retentionDays: 7,
       backupDir: '/var/backups/redis'
     },
     logs: {
       schedule: '0 2 * * *',  // Daily at 2 AM
       retentionDays: 90,  // Back up last 90 days of logs
       backupDir: '/var/backups/logs'
     },
     encryption: {
       algorithm: 'aes-256-cbc',
       keyPath: '/etc/app/backup-encryption.key',
       keyRotationDays: 365  // Annual rotation per NFR-SEC02
     },
     compression: {
       level: 9,  // gzip -9 (best compression)
       targetRatio: 0.70  // 70% compression target
     },
     prometheus: {
       pushgatewayUrl: process.env.PROMETHEUS_PUSHGATEWAY_URL || 'http://localhost:9091'
     }
   };
   ```
10. **Create Cron Job Configuration (/etc/cron.d/app-backups)**:
    ```cron
    # PostgreSQL backup every 6 hours
    0 */6 * * * appuser /usr/bin/node /opt/app/dist/scripts/backup-orchestrator.js --type=postgresql >> /var/log/app/backup-cron.log 2>&1
    
    # Redis backup every 1 hour
    0 * * * * appuser /usr/bin/node /opt/app/dist/scripts/backup-orchestrator.js --type=redis >> /var/log/app/backup-cron.log 2>&1
    
    # Application logs backup daily at 2 AM
    0 2 * * * appuser /usr/bin/node /opt/app/dist/scripts/backup-orchestrator.js --type=logs >> /var/log/app/backup-cron.log 2>&1
    
    # Encryption key rotation check monthly
    0 3 1 * * appuser /usr/bin/node /opt/app/dist/scripts/check-key-rotation.js >> /var/log/app/key-rotation-cron.log 2>&1
    ```
11. **Create Local Cleanup Script (cleanup-local-backups.sh)** to maintain 7-day local retention:
    ```bash
    #!/bin/bash
    find /var/backups/encrypted -type f -mtime +7 -delete
    echo "Local backup cleanup completed" | logger -t backup-cleanup
    ```

## Current Project State
```
server/
├── src/
│   ├── scripts/ (to be created)
│   │   ├── backup-postgresql.sh (to be created)
│   │   ├── backup-redis.sh (to be created)
│   │   ├── backup-logs.sh (to be created)
│   │   ├── compress-backups.sh (to be created)
│   │   ├── encrypt-backups.sh (to be created)
│   │   ├── backup-orchestrator.ts (to be created)
│   │   ├── cleanup-local-backups.sh (to be created)
│   │   └── check-key-rotation.ts (to be created)
│   ├── config/
│   │   └── backup.config.ts (to be created)
│   └── utils/
│       └── kms-key-manager.ts (to be created)
├── logs/ (exists)
│   └── backup-execution.log (to be created)
/var/backups/ (to be created on production server)
├── postgresql/
├── redis/
├── logs/
├── compressed/
└── encrypted/
/etc/app/ (to be created on production server)
├── backup.env (to be created with DB credentials)
└── backup-encryption.key (to be generated via KMSKeyManager)
/etc/cron.d/ (exists on Linux systems)
└── app-backups (to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/scripts/backup-postgresql.sh | Shell script for PostgreSQL pg_dump with custom format |
| CREATE | server/src/scripts/backup-redis.sh | Shell script for Redis RDB snapshot using redis-cli |
| CREATE | server/src/scripts/backup-logs.sh | Shell script to archive last 90 days of application logs |
| CREATE | server/src/scripts/compress-backups.sh | Shell script for gzip -9 compression pipeline |
| CREATE | server/src/scripts/encrypt-backups.sh | Shell script for OpenSSL AES-256-CBC encryption |
| CREATE | server/src/scripts/backup-orchestrator.ts | Node.js orchestrator coordinating all backup steps |
| CREATE | server/src/scripts/cleanup-local-backups.sh | Shell script to remove backups older than 7 days |
| CREATE | server/src/scripts/check-key-rotation.ts | Node.js script to check and rotate encryption keys annually |
| CREATE | server/src/config/backup.config.ts | Configuration file for backup schedules and settings |
| CREATE | server/src/utils/kms-key-manager.ts | Utility class for encryption key generation and rotation |
| CREATE | /etc/cron.d/app-backups | Cron job configuration for scheduling backups |
| CREATE | /etc/app/backup.env | Environment file with database and Redis credentials |
| CREATE | /var/backups/ | Directory structure for local backup storage |

## External References
- [PostgreSQL pg_dump Documentation](https://www.postgresql.org/docs/15/app-pgdump.html)
- [Redis Persistence - RDB Snapshots](https://redis.io/docs/management/persistence/)
- [OpenSSL AES-256 Encryption](https://www.openssl.org/docs/man1.1.1/man1/enc.html)
- [Node.js Child Process (exec)](https://nodejs.org/docs/v20.x/api/child_process.html#child_processexeccommand-options-callback)
- [Cron Job Scheduling](https://crontab.guru/)
- [gzip Compression Levels](https://www.gnu.org/software/gzip/manual/gzip.html)

## Build Commands
```bash
# Install Node.js dependencies (if any new ones needed)
cd server
npm install axios  # For Prometheus pushgateway integration

# Make shell scripts executable
chmod +x src/scripts/*.sh

# Create backup directories (on production server)
sudo mkdir -p /var/backups/{postgresql,redis,logs,compressed,encrypted}
sudo chown -R appuser:appuser /var/backups

# Create encryption key directory
sudo mkdir -p /etc/app
sudo chown appuser:appuser /etc/app

# Generate initial encryption key
node dist/scripts/generate-initial-key.js

# Install cron job (Linux)
sudo cp /path/to/app-backups /etc/cron.d/
sudo systemctl restart cron

# Test backup manually
node dist/scripts/backup-orchestrator.js --type=postgresql
```

## Implementation Validation Strategy
- [ ] PostgreSQL backup script executes: Runs pg_dump with --format=custom, outputs .dump file
- [ ] Redis backup script executes: Triggers BGSAVE, copies RDB file to backup location
- [ ] Application logs backup script executes: Finds and archives logs from last 90 days
- [ ] Compression pipeline works: gzip -9 achieves ~70% compression ratio (measure ORIGINAL_SIZE vs COMPRESSED_SIZE)
- [ ] Encryption pipeline works: OpenSSL encrypts files with AES-256-CBC, outputs .enc files
- [ ] KMS key manager generates keys: 256-bit random key written to /etc/app/backup-encryption.key with 0o600 permissions
- [ ] Key rotation works: Annual rotation archives old key and generates new key
- [ ] Backup orchestrator coordinates steps: PostgreSQL → Redis → Logs → Compress → Encrypt in sequence
- [ ] Retry logic works: On failure, waits 5 minutes, retries once, logs failure if second attempt fails
- [ ] Prometheus metrics pushed: backup_duration_seconds, backup_size_bytes, backup_success_last_timestamp recorded
- [ ] Cron jobs scheduled: PostgreSQL every 6 hours, Redis every 1 hour, Logs daily at 2 AM
- [ ] Local cleanup works: Backups older than 7 days removed from /var/backups/encrypted
- [ ] Atomic failure handling: Partial backups are not uploaded, failure triggers retry then alert
- [ ] Backup files verified: Check file sizes > 0, gzip integrity (gzip -t), encryption reversibility (decrypt test file)
- [ ] Error logging works: All failures logged to syslog with detailed error context

## Implementation Checklist
- [x] Create /var/backups/ directory structure with subdirs: postgresql, redis, logs, compressed, encrypted
- [x] Create /etc/app/ directory for encryption keys and backup.env
- [x] Write backup-postgresql.sh script with pg_dump --format=custom command
- [x] Write backup-redis.sh script with redis-cli BGSAVE and RDB copy
- [x] Write backup-logs.sh script using find and tar to archive last 90 days of logs
- [x] Write compress-backups.sh script with gzip -9 compression and ratio calculation
- [x] Write encrypt-backups.sh script with OpenSSL AES-256-CBC encryption
- [x] Create kms-key-manager.ts utility class with generateKey(), rotateKey(), checkKeyAge() methods
- [x] Write backup-orchestrator.ts Node.js script coordinating all backup steps
- [x] Add retry logic with exponential backoff (5-minute delay, retry once)
- [x] Implement Prometheus metrics push to pushgateway (backup_duration_seconds, backup_size_bytes, backup_success_last_timestamp)
- [x] Create backup.config.ts configuration file with schedules, retention, encryption settings
- [x] Write /etc/cron.d/app-backups cron configuration with 3 jobs (PostgreSQL every 6h, Redis every 1h, Logs daily 2AM)
- [x] Add monthly cron job to check encryption key age and rotate if needed
- [x] Write cleanup-local-backups.sh script to remove backups older than 7 days
- [x] Create check-key-rotation.ts script to automate annual key rotation
- [ ] Make all shell scripts executable (chmod +x)
- [ ] Set correct file permissions on /var/backups (appuser:appuser) and /etc/app/backup-encryption.key (0o600)
- [ ] Test PostgreSQL backup manually: Run backup-postgresql.sh, verify .dump file created
- [ ] Test Redis backup manually: Run backup-redis.sh, verify .rdb file created
- [ ] Test logs backup manually: Run backup-logs.sh, verify .tar file created
- [ ] Test compression: Run compress-backups.sh on test file, verify ~70% compression ratio
- [ ] Test encryption: Run encrypt-backups.sh on test file, verify .enc file created and decryption works
- [ ] Test key generation: Run KMSKeyManager.generateKey(), verify key file created with correct permissions
- [ ] Test orchestrator end-to-end: Run backup-orchestrator.ts, verify all 3 backup types complete successfully
- [ ] Test retry logic: Simulate failure (e.g., wrong DB password), verify retry after 5 minutes
- [ ] Test Prometheus metrics: Check pushgateway for backup_duration_seconds, backup_size_bytes metrics
- [ ] Verify cron jobs scheduled: crontab -l (check PostgreSQL every 6h, Redis every 1h, Logs daily)
- [ ] Verify local cleanup: Run cleanup script, verify backups older than 7 days removed
- [ ] Test atomic failure: Simulate partial backup (kill process mid-backup), verify no partial uploads
- [ ] Document backup procedures in server/README.md or operations runbook
- [ ] Commit all files to version control
