# Task - TASK_002_INFRA_CLOUD_STORAGE_INTEGRATION

## Requirement Reference
- User Story: US_042
- Story Location: .propel/context/tasks/us_042/us_042.md
- Acceptance Criteria:
    - Upload backups to offsite storage (Azure Blob Storage with geo-replication or AWS S3 with cross-region replication) (AC-1)
    - Retain backups per NFR-DR01: daily for 30 days, weekly for 1 year, monthly for 7 years per HIPAA (AC-1)
    - Track backup cost monitoring - storage costs should not exceed 10% of infrastructure budget (AC-1)
    - Verify backup integrity by attempting restore to isolated staging environment on weekly basis (AC-1)
- Edge Case:
    - What happens when backup storage quota is full? (System purges oldest backups beyond retention policy, alerts admin if quota persistently exceeded) (EC-1)
    - Partial backups are handled atomically - no partial uploads (EC-2)

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A - Infrastructure task (cloud storage, data protection) |
| **Screen Spec** | N/A |
| **UXR Requirements** | N/A |
| **Design Tokens** | N/A |

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Mobile | N/A | N/A |
| Backend | Node.js (Express) | 20.x LTS |
| Database | N/A (Cloud storage) | N/A |
| Cloud Storage | Azure Blob Storage OR AWS S3 | latest |
| Infrastructure | Windows Services/IIS + Cron/Task Scheduler | latest |
| Monitoring | Prometheus + Grafana | latest |

**Note**: All code and libraries MUST be compatible with versions above. Must use Azure SDK for JavaScript (@azure/storage-blob) OR AWS SDK for JavaScript v3 (@aws-sdk/client-s3).

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
Create cloud storage integration for offsite backup uploads with geo-replication and HIPAA-compliant retention policies: (1) Azure Blob Storage integration using @azure/storage-blob SDK with geo-redundant storage (GRS) enabled for automatic replication to secondary region, OR AWS S3 integration using @aws-sdk/client-s3 SDK with cross-region replication (CRR) to backup region, (2) Backup upload service (Node.js) that scans /var/backups/encrypted directory for completed backups, uploads files to cloud storage with metadata tags (backup_type, timestamp, retention_tier), verifies upload completion via ETag/MD5 checksum comparison, (3) Retention policy implementation using lifecycle management rules: daily backups → move to cool/glacier tier after 30 days → delete after 30 days, weekly backups → move to cool/glacier tier after 1 year → delete after 1 year, monthly backups → move to archive tier after 7 years per HIPAA TR-007, (4) Storage tiering strategy: hot tier for last 7 days (fast restore), cool tier for 7-365 days (slower restore, lower cost), archive tier for 365+ days (slowest restore, lowest cost), (5) Quota management service checking storage usage against quota limits, purging oldest backups beyond retention policy when quota exceeded (with critical alert), implementing 3-2-1 backup rule (3 copies: local disk + primary cloud + geo-replicated cloud, 2 different media: disk + cloud, 1 offsite), (6) Cost monitoring integration with Prometheus tracking: storage_cost_bytes gauge (total bytes stored), storage_cost_estimate_usd gauge (estimated monthly cost based on pricing tiers), storage_tier_distribution gauge (bytes per tier: hot/cool/archive), alert when storage costs exceed 10% of infrastructure budget, (7) Atomic upload guarantee ensuring partial uploads are rolled back on failure (multipart upload abort for large files, transaction log for recovery), (8) Backup inventory manifest (JSON) stored in cloud with list of all backups, metadata, and checksums for integrity verification.

## Dependent Tasks
- US_042 - TASK_001_INFRA_BACKUP_AUTOMATION_SCRIPT (Local backups must exist before upload)
- US-005 (Prometheus metrics for cost monitoring)

## Impacted Components
- server/src/services/cloud-storage.service.ts - New service for Azure/AWS storage operations
- server/src/services/backup-upload.service.ts - New service orchestrating backup uploads
- server/src/services/retention-policy.service.ts - New service managing lifecycle rules
- server/src/services/quota-management.service.ts - New service monitoring storage quota
- server/src/services/cost-monitoring.service.ts - New service tracking storage costs
- server/src/config/cloud-storage.config.ts - New configuration for cloud provider settings
- server/src/scripts/upload-backups.ts - New script scheduled by cron to upload backups
- server/src/scripts/check-quota.ts - New script to check and enforce quota limits
- server/src/utils/checksum-validator.ts - New utility for file integrity verification
- /var/backups/inventory.json - New inventory manifest file

## Implementation Plan
1. **Install Cloud Storage SDKs**:
   ```bash
   npm install @azure/storage-blob @azure/identity  # For Azure
   # OR
   npm install @aws-sdk/client-s3 @aws-sdk/credential-providers  # For AWS
   ```
2. **Create Cloud Storage Configuration (cloud-storage.config.ts)**:
   ```typescript
   export const cloudStorageConfig = {
     provider: process.env.CLOUD_PROVIDER || 'azure',  // 'azure' or 'aws'
     azure: {
       accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
       accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY,
       containerName: 'healthcare-backups',
       redundancy: 'GRS',  // Geo-redundant storage
       tier: 'hot'  // Default tier for new uploads
     },
     aws: {
       region: process.env.AWS_REGION || 'us-east-1',
       backupRegion: process.env.AWS_BACKUP_REGION || 'us-west-2',  // CRR target
       bucketName: 'healthcare-backups',
       storageClass: 'STANDARD'  // STANDARD, STANDARD_IA, GLACIER, DEEP_ARCHIVE
     },
     retention: {
       daily: {
         retentionDays: 30,
         tierTransitionDays: 30,  // Move to cool/glacier after 30 days
         targetTier: 'cool'
       },
       weekly: {
         retentionDays: 365,
         tierTransitionDays: 365,
         targetTier: 'archive'
       },
       monthly: {
         retentionDays: 2555,  // 7 years per HIPAA
         tierTransitionDays: 2555,
         targetTier: 'archive'
       }
     },
     quota: {
       maxStorageGB: 1000,  // 1 TB quota
       warningThresholdPercent: 80,
       criticalThresholdPercent: 95
     },
     cost: {
       maxInfrastructureBudgetPercent: 10,  // Storage should not exceed 10% of total budget
       monthlyInfrastructureBudgetUSD: 1000  // Example budget
     }
   };
   ```
3. **Create Azure Blob Storage Service (azure-storage.service.ts)**:
   ```typescript
   import { BlobServiceClient, StorageSharedKeyCredential, ContainerClient } from '@azure/storage-blob';
   import * as fs from 'fs';
   import * as path from 'path';
   import { cloudStorageConfig } from '../config/cloud-storage.config';
   
   export class AzureStorageService {
     private blobServiceClient: BlobServiceClient;
     private containerClient: ContainerClient;
   
     constructor() {
       const credential = new StorageSharedKeyCredential(
         cloudStorageConfig.azure.accountName!,
         cloudStorageConfig.azure.accountKey!
       );
       
       this.blobServiceClient = new BlobServiceClient(
         `https://${cloudStorageConfig.azure.accountName}.blob.core.windows.net`,
         credential
       );
       
       this.containerClient = this.blobServiceClient.getContainerClient(
         cloudStorageConfig.azure.containerName
       );
     }
   
     async uploadBackup(localFilePath: string, metadata: Record<string, string>): Promise<string> {
       const blobName = path.basename(localFilePath);
       const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
       
       // Upload file with metadata
       const uploadResponse = await blockBlobClient.uploadFile(localFilePath, {
         metadata,
         tier: cloudStorageConfig.azure.tier
       });
       
       console.log(`Uploaded ${blobName} to Azure Blob Storage (ETag: ${uploadResponse.etag})`);
       return uploadResponse.etag!;
     }
   
     async verifyUpload(localFilePath: string, remoteETag: string): Promise<boolean> {
       const blobName = path.basename(localFilePath);
       const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
       
       const properties = await blockBlobClient.getProperties();
       return properties.etag === remoteETag;
     }
   
     async listBackups(): Promise<Array<{name: string; size: number; tier: string}>> {
       const backups: Array<{name: string; size: number; tier: string}> = [];
       
       for await (const blob of this.containerClient.listBlobsFlat()) {
         backups.push({
           name: blob.name,
           size: blob.properties.contentLength || 0,
           tier: blob.properties.accessTier || 'unknown'
         });
       }
       
       return backups;
     }
   
     async deleteBackup(blobName: string): Promise<void> {
       const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
       await blockBlobClient.delete();
       console.log(`Deleted ${blobName} from Azure Blob Storage`);
     }
   
     async setAccessTier(blobName: string, tier: 'Hot' | 'Cool' | 'Archive'): Promise<void> {
       const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
       await blockBlobClient.setAccessTier(tier);
       console.log(`Moved ${blobName} to ${tier} tier`);
     }
   }
   ```
4. **Create Backup Upload Service (backup-upload.service.ts)**:
   ```typescript
   import * as fs from 'fs';
   import * as path from 'path';
   import { AzureStorageService } from './azure-storage.service';
   import { ChecksumValidator } from '../utils/checksum-validator';
   import { cloudStorageConfig } from '../config/cloud-storage.config';
   
   interface UploadResult {
     fileName: string;
     success: boolean;
     etag?: string;
     error?: string;
   }
   
   export class BackupUploadService {
     private storageService: AzureStorageService;
     private checksumValidator: ChecksumValidator;
     
     constructor() {
       this.storageService = new AzureStorageService();
       this.checksumValidator = new ChecksumValidator();
     }
   
     async uploadPendingBackups(): Promise<UploadResult[]> {
       const backupDir = '/var/backups/encrypted';
       const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.enc'));
       
       const results: UploadResult[] = [];
       
       for (const file of files) {
         const filePath = path.join(backupDir, file);
         const result = await this.uploadBackup(filePath);
         results.push(result);
       }
       
       return results;
     }
   
     async uploadBackup(localFilePath: string): Promise<UploadResult> {
       const fileName = path.basename(localFilePath);
       
       try {
         // Extract metadata from filename (e.g., backup-2026-03-19_12-00-00.dump.gz.enc)
         const metadata = this.extractMetadata(fileName);
         
         // Calculate local checksum
         const localChecksum = await this.checksumValidator.calculateChecksum(localFilePath);
         metadata.checksum = localChecksum;
         
         // Upload to cloud storage
         const etag = await this.storageService.uploadBackup(localFilePath, metadata);
         
         // Verify upload integrity
         const verified = await this.storageService.verifyUpload(localFilePath, etag);
         
         if (!verified) {
           throw new Error('Upload verification failed - ETag mismatch');
         }
         
         // Update inventory manifest
         await this.updateInventoryManifest(fileName, metadata, etag);
         
         // Delete local file after successful upload (optional - keep for 7 days per TASK_001)
         // fs.unlinkSync(localFilePath);
         
         return { fileName, success: true, etag };
       } catch (error) {
         console.error(`Upload failed for ${fileName}:`, error);
         return {
           fileName,
           success: false,
           error: error instanceof Error ? error.message : String(error)
         };
       }
     }
   
     private extractMetadata(fileName: string): Record<string, string> {
       // Parse filename: backup-2026-03-19_12-00-00.dump.gz.enc
       const parts = fileName.split('-');
       const datePart = parts.slice(1, 4).join('-');  // 2026-03-19
       
       let backupType = 'daily';
       const dayOfWeek = new Date(datePart).getDay();
       const dayOfMonth = new Date(datePart).getDate();
       
       if (dayOfWeek === 0) {  // Sunday = weekly backup
         backupType = 'weekly';
       }
       if (dayOfMonth === 1) {  // First day of month = monthly backup
         backupType = 'monthly';
       }
       
       return {
         backup_type: backupType,
         timestamp: datePart,
         retention_tier: cloudStorageConfig.retention[backupType as 'daily' | 'weekly' | 'monthly'].targetTier,
         original_file: fileName
       };
     }
   
     private async updateInventoryManifest(fileName: string, metadata: Record<string, string>, etag: string): Promise<void> {
       const manifestPath = '/var/backups/inventory.json';
       
       let inventory: any[] = [];
       if (fs.existsSync(manifestPath)) {
         inventory = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
       }
       
       inventory.push({
         fileName,
         metadata,
         etag,
         uploadedAt: new Date().toISOString()
       });
       
       fs.writeFileSync(manifestPath, JSON.stringify(inventory, null, 2));
     }
   }
   ```
5. **Create Retention Policy Service (retention-policy.service.ts)**:
   ```typescript
   import { AzureStorageService } from './azure-storage.service';
   import { cloudStorageConfig } from '../config/cloud-storage.config';
   
   export class RetentionPolicyService {
     private storageService: AzureStorageService;
   
     constructor() {
       this.storageService = new AzureStorageService();
     }
   
     async enforceRetentionPolicy(): Promise<void> {
       const backups = await this.storageService.listBackups();
       
       for (const backup of backups) {
         const ageInDays = this.calculateAgeInDays(backup.name);
         const backupType = this.extractBackupType(backup.name);
         const policy = cloudStorageConfig.retention[backupType as 'daily' | 'weekly' | 'monthly'];
         
         // Delete if expired
         if (ageInDays > policy.retentionDays) {
           console.log(`Deleting expired backup: ${backup.name} (age: ${ageInDays} days)`);
           await this.storageService.deleteBackup(backup.name);
         }
         // Move to target tier if transition time reached
         else if (ageInDays > policy.tierTransitionDays && backup.tier !== policy.targetTier) {
           console.log(`Moving ${backup.name} to ${policy.targetTier} tier`);
           await this.storageService.setAccessTier(backup.name, this.mapTier(policy.targetTier));
         }
       }
     }
   
     private calculateAgeInDays(fileName: string): number {
       // Parse filename: backup-2026-03-19_12-00-00.dump.gz.enc
       const dateMatch = fileName.match(/(\d{4})-(\d{2})-(\d{2})/);
       if (!dateMatch) return 0;
       
       const backupDate = new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`);
       const now = new Date();
       return Math.floor((now.getTime() - backupDate.getTime()) / (1000 * 60 * 60 * 24));
     }
   
     private extractBackupType(fileName: string): string {
       // Infer from metadata or filename pattern
       const datePart = fileName.match(/(\d{4})-(\d{2})-(\d{2})/);
       if (!datePart) return 'daily';
       
       const dayOfWeek = new Date(`${datePart[1]}-${datePart[2]}-${datePart[3]}`).getDay();
       const dayOfMonth = parseInt(datePart[3]);
       
       if (dayOfMonth === 1) return 'monthly';
       if (dayOfWeek === 0) return 'weekly';
       return 'daily';
     }
   
     private mapTier(tier: string): 'Hot' | 'Cool' | 'Archive' {
       const tierMap: Record<string, 'Hot' | 'Cool' | 'Archive'> = {
         'hot': 'Hot',
         'cool': 'Cool',
         'archive': 'Archive'
       };
       return tierMap[tier] || 'Hot';
     }
   }
   ```
6. **Create Quota Management Service (quota-management.service.ts)**:
   ```typescript
   import { AzureStorageService } from './azure-storage.service';
   import { cloudStorageConfig } from '../config/cloud-storage.config';
   
   export class QuotaManagementService {
     private storageService: AzureStorageService;
   
     constructor() {
       this.storageService = new AzureStorageService();
     }
   
     async checkQuota(): Promise<{used: number; quota: number; percent: number; exceeded: boolean}> {
       const backups = await this.storageService.listBackups();
       const totalBytes = backups.reduce((sum, b) => sum + b.size, 0);
       const totalGB = totalBytes / (1024 ** 3);
       
       const quotaGB = cloudStorageConfig.quota.maxStorageGB;
       const percentUsed = (totalGB / quotaGB) * 100;
       
       return {
         used: totalGB,
         quota: quotaGB,
         percent: percentUsed,
         exceeded: percentUsed > 100
       };
     }
   
     async enforceQuota(): Promise<void> {
       const quotaStatus = await this.checkQuota();
       
       if (quotaStatus.percent > cloudStorageConfig.quota.criticalThresholdPercent) {
         console.warn(`Storage quota critical: ${quotaStatus.percent.toFixed(1)}% used`);
         await this.purgeOldestBackups();
       } else if (quotaStatus.percent > cloudStorageConfig.quota.warningThresholdPercent) {
         console.warn(`Storage quota warning: ${quotaStatus.percent.toFixed(1)}% used`);
       }
     }
   
     private async purgeOldestBackups(): Promise<void> {
       const backups = await this.storageService.listBackups();
       
       // Sort by age (oldest first)
       const sorted = backups.sort((a, b) => {
         const ageA = this.extractAge(a.name);
         const ageB = this.extractAge(b.name);
         return ageB - ageA;  // Descending order (oldest first)
       });
       
       // Delete oldest 10% of backups
       const deleteCount = Math.ceil(sorted.length * 0.1);
       for (let i = 0; i < deleteCount; i++) {
         console.log(`Purging old backup: ${sorted[i].name}`);
         await this.storageService.deleteBackup(sorted[i].name);
       }
     }
   
     private extractAge(fileName: string): number {
       const dateMatch = fileName.match(/(\d{4})-(\d{2})-(\d{2})/);
       if (!dateMatch) return 0;
       
       const backupDate = new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`);
       return Date.now() - backupDate.getTime();
     }
   }
   ```
7. **Create Cost Monitoring Service (cost-monitoring.service.ts)**:
   ```typescript
   import { AzureStorageService } from './azure-storage.service';
   import { cloudStorageConfig } from '../config/cloud-storage.config';
   import axios from 'axios';
   
   export class CostMonitoringService {
     private storageService: AzureStorageService;
     
     // Azure Blob Storage pricing (example - update with actual pricing)
     private readonly PRICING = {
       hot: 0.018,     // per GB/month
       cool: 0.01,     // per GB/month
       archive: 0.00099  // per GB/month
     };
   
     constructor() {
       this.storageService = new AzureStorageService();
     }
   
     async calculateMonthlyCost(): Promise<{totalCostUSD: number; tierCosts: Record<string, number>}> {
       const backups = await this.storageService.listBackups();
       
       const tierSizes: Record<string, number> = { hot: 0, cool: 0, archive: 0 };
       
       backups.forEach(backup => {
         const tier = backup.tier.toLowerCase();
         const sizeGB = backup.size / (1024 ** 3);
         tierSizes[tier] = (tierSizes[tier] || 0) + sizeGB;
       });
       
       const tierCosts = {
         hot: tierSizes.hot * this.PRICING.hot,
         cool: tierSizes.cool * this.PRICING.cool,
         archive: tierSizes.archive * this.PRICING.archive
       };
       
       const totalCostUSD = Object.values(tierCosts).reduce((sum, cost) => sum + cost, 0);
       
       return { totalCostUSD, tierCosts };
     }
   
     async checkBudget(): Promise<{costUSD: number; budgetPercent: number; exceeded: boolean}> {
       const { totalCostUSD } = await this.calculateMonthlyCost();
       const maxAllowedCost = cloudStorageConfig.cost.monthlyInfrastructureBudgetUSD * 
                              (cloudStorageConfig.cost.maxInfrastructureBudgetPercent / 100);
       
       const budgetPercent = (totalCostUSD / maxAllowedCost) * 100;
       
       return {
         costUSD: totalCostUSD,
         budgetPercent,
         exceeded: budgetPercent > 100
       };
     }
   
     async pushCostMetrics(): Promise<void> {
       const { totalCostUSD, tierCosts } = await this.calculateMonthlyCost();
       
       const metrics = `
   # TYPE storage_cost_estimate_usd gauge
   storage_cost_estimate_usd ${totalCostUSD}
   # TYPE storage_tier_cost_usd gauge
   storage_tier_cost_usd{tier="hot"} ${tierCosts.hot}
   storage_tier_cost_usd{tier="cool"} ${tierCosts.cool}
   storage_tier_cost_usd{tier="archive"} ${tierCosts.archive}
   `;
       
       const prometheusGateway = process.env.PROMETHEUS_PUSHGATEWAY_URL || 'http://localhost:9091';
       await axios.post(`${prometheusGateway}/metrics/job/cost_monitoring`, metrics);
     }
   }
   ```
8. **Create Checksum Validator Utility (checksum-validator.ts)**:
   ```typescript
   import * as crypto from 'crypto';
   import * as fs from 'fs';
   
   export class ChecksumValidator {
     async calculateChecksum(filePath: string, algorithm: string = 'md5'): Promise<string> {
       return new Promise((resolve, reject) => {
         const hash = crypto.createHash(algorithm);
         const stream = fs.createReadStream(filePath);
         
         stream.on('data', (data) => hash.update(data));
         stream.on('end', () => resolve(hash.digest('hex')));
         stream.on('error', reject);
       });
     }
   
     async verifyChecksum(filePath: string, expectedChecksum: string, algorithm: string = 'md5'): Promise<boolean> {
       const actualChecksum = await this.calculateChecksum(filePath, algorithm);
       return actualChecksum === expectedChecksum;
     }
   }
   ```
9. **Create Upload Script (upload-backups.ts)**:
   ```typescript
   import { BackupUploadService } from '../services/backup-upload.service';
   import { RetentionPolicyService } from '../services/retention-policy.service';
   import { QuotaManagementService } from '../services/quota-management.service';
   import { CostMonitoringService } from '../services/cost-monitoring.service';
   
   async function main() {
     console.log('Starting backup upload process...');
     
     try {
       // Step 1: Upload pending backups
       const uploadService = new BackupUploadService();
       const results = await uploadService.uploadPendingBackups();
       
       const successCount = results.filter(r => r.success).length;
       console.log(`Upload completed: ${successCount}/${results.length} successful`);
       
       // Step 2: Enforce retention policy
       const retentionService = new RetentionPolicyService();
       await retentionService.enforceRetentionPolicy();
       
       // Step 3: Check and enforce quota
       const quotaService = new QuotaManagementService();
       await quotaService.enforceQuota();
       
       // Step 4: Monitor costs
       const costService = new CostMonitoringService();
       const budget = await costService.checkBudget();
       console.log(`Storage cost: $${budget.costUSD.toFixed(2)} (${budget.budgetPercent.toFixed(1)}% of budget)`);
       
       if (budget.exceeded) {
         console.error('CRITICAL: Storage cost exceeds 10% of infrastructure budget!');
       }
       
       await costService.pushCostMetrics();
       
     } catch (error) {
       console.error('Upload process failed:', error);
       process.exit(1);
     }
   }
   
   main();
   ```
10. **Add Cron Job for Upload (update /etc/cron.d/app-backups)**:
    ```cron
    # Upload backups to cloud storage every 12 hours
    0 */12 * * * appuser /usr/bin/node /opt/app/dist/scripts/upload-backups.js >> /var/log/app/upload-cron.log 2>&1
    
    # Check quota and enforce retention daily at 3 AM
    0 3 * * * appuser /usr/bin/node /opt/app/dist/scripts/check-quota.js >> /var/log/app/quota-cron.log 2>&1
    ```

## Current Project State
```
server/
├── src/
│   ├── services/ (exists)
│   │   ├── azure-storage.service.ts (to be created)
│   │   ├── backup-upload.service.ts (to be created)
│   │   ├── retention-policy.service.ts (to be created)
│   │   ├── quota-management.service.ts (to be created)
│   │   └── cost-monitoring.service.ts (to be created)
│   ├── config/
│   │   └── cloud-storage.config.ts (to be created)
│   ├── scripts/ (exists from TASK_001)
│   │   ├── upload-backups.ts (to be created)
│   │   └── check-quota.ts (to be created)
│   └── utils/ (exists)
│       └── checksum-validator.ts (to be created)
/var/backups/ (exists from TASK_001)
├── encrypted/ (contains backups to upload)
└── inventory.json (to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/azure-storage.service.ts | Azure Blob Storage integration with upload, verify, list, delete operations |
| CREATE | server/src/services/backup-upload.service.ts | Orchestrates backup uploads with integrity verification |
| CREATE | server/src/services/retention-policy.service.ts | Enforces HIPAA retention policy (daily 30d, weekly 1y, monthly 7y) |
| CREATE | server/src/services/quota-management.service.ts | Monitors storage quota and purges old backups when full |
| CREATE | server/src/services/cost-monitoring.service.ts | Tracks storage costs and validates against 10% budget limit |
| CREATE | server/src/config/cloud-storage.config.ts | Configuration for Azure/AWS storage settings |
| CREATE | server/src/scripts/upload-backups.ts | Cron script to upload backups and enforce policies |
| CREATE | server/src/scripts/check-quota.ts | Cron script to check quota and purge old backups |
| CREATE | server/src/utils/checksum-validator.ts | Utility for MD5 checksum calculation and verification |
| CREATE | /var/backups/inventory.json | Backup inventory manifest with metadata and ETags |
| MODIFY | /etc/cron.d/app-backups | Add cron jobs for upload every 12h and quota check daily |

## External References
- [Azure Blob Storage SDK for JavaScript](https://learn.microsoft.com/en-us/javascript/api/overview/azure/storage-blob-readme?view=azure-node-latest)
- [Azure Blob Storage Access Tiers](https://learn.microsoft.com/en-us/azure/storage/blobs/access-tiers-overview)
- [Azure Blob Storage Geo-Redundancy](https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy)
- [AWS S3 Cross-Region Replication](https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication.html)
- [AWS SDK for JavaScript v3 - S3 Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [HIPAA Data Retention Requirements](https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/retention/index.html)

## Build Commands
```bash
# Install Azure Blob Storage SDK
cd server
npm install @azure/storage-blob @azure/identity

# OR install AWS S3 SDK
npm install @aws-sdk/client-s3 @aws-sdk/credential-providers

# Set environment variables
export AZURE_STORAGE_ACCOUNT_NAME="your-account-name"
export AZURE_STORAGE_ACCOUNT_KEY="your-account-key"
export CLOUD_PROVIDER="azure"
export PROMETHEUS_PUSHGATEWAY_URL="http://localhost:9091"

# Initialize Azure container (run once)
az storage container create \
  --name healthcare-backups \
  --account-name your-account-name \
  --account-key your-account-key \
  --public-access off

# Enable geo-redundant storage (GRS)
az storage account update \
  --name your-account-name \
  --resource-group your-rg \
  --sku Standard_GRS

# Test upload manually
node dist/scripts/upload-backups.js

# Check quota manually
node dist/scripts/check-quota.js

# Install cron jobs
sudo cp /path/to/app-backups /etc/cron.d/
sudo systemctl restart cron
```

## Implementation Validation Strategy
- [ ] Azure Blob Storage container created: Container exists with geo-redundant storage (GRS) enabled
- [ ] Backup upload works: Encrypted backup files uploaded to Azure Blob Storage with metadata tags
- [ ] Upload integrity verified: ETag comparison confirms successful upload with no corruption
- [ ] Inventory manifest updated: /var/backups/inventory.json contains all uploaded backups with metadata
- [ ] Retention policy enforced: Daily backups deleted after 30 days, weekly after 1 year, monthly after 7 years
- [ ] Storage tiering works: Backups moved to cool tier after 30 days (daily), archive tier after 1 year (weekly/monthly)
- [ ] Quota monitoring works: QuotaManagementService correctly calculates storage usage percentage
- [ ] Quota exceeded alert: When quota >95%, system purges oldest 10% of backups and triggers critical alert
- [ ] Cost monitoring works: CostMonitoringService calculates monthly storage cost based on tier pricing
- [ ] Cost budget alert: When storage cost exceeds 10% of infrastructure budget, critical alert triggered
- [ ] Cost metrics pushed: Prometheus metrics storage_cost_estimate_usd, storage_tier_cost_usd recorded
- [ ] Checksum validation works: MD5 checksum calculated and verified for uploaded files
- [ ] Atomic upload guarantee: Partial uploads rolled back on failure (no corrupt files in cloud storage)
- [ ] Geo-replication verified: Backup files replicated to secondary region (check Azure portal replication status)
- [ ] Cron jobs scheduled: Upload every 12 hours, quota check daily at 3 AM
- [ ] Upload script end-to-end: Run upload-backups.ts, verify all pending backups uploaded successfully
- [ ] Check quota script end-to-end: Run check-quota.ts, verify quota status logged and actions taken if exceeded

## Implementation Checklist
- [x] Install @azure/storage-blob and @azure/identity NPM packages (OR AWS SDK equivalent)
- [x] Create cloud-storage.config.ts with Azure/AWS settings, retention policies, quota limits, cost thresholds
- [x] Write azure-storage.service.ts with uploadBackup(), verifyUpload(), listBackups(), deleteBackup(), setAccessTier() methods
- [x] Write backup-upload.service.ts coordinating upload, checksum verification, inventory update
- [x] Implement extractMetadata() to parse backup type (daily/weekly/monthly) from filename
- [x] Implement updateInventoryManifest() to append upload records to /var/backups/inventory.json
- [x] Write retention-policy.service.ts with enforceRetentionPolicy() method
- [x] Implement calculateAgeInDays() and extractBackupType() helper methods
- [x] Implement tier transition logic (hot → cool after 7d, cool → archive after 365d)
- [x] Write quota-management.service.ts with checkQuota() and enforceQuota() methods
- [x] Implement purgeOldestBackups() to delete oldest 10% when quota exceeded
- [x] Write cost-monitoring.service.ts with calculateMonthlyCost() and checkBudget() methods
- [x] Add Azure Blob Storage pricing constants (hot: $0.018/GB/month, cool: $0.01/GB/month, archive: $0.00099/GB/month)
- [x] Implement pushCostMetrics() to send storage_cost_estimate_usd and storage_tier_cost_usd to Prometheus
- [x] Write checksum-validator.ts utility with calculateChecksum() and verifyChecksum() methods
- [x] Write upload-backups.ts cron script orchestrating upload → retention → quota → cost monitoring
- [x] Write check-quota.ts cron script for daily quota checks
- [x] Add cron jobs to /etc/cron.d/app-backups (upload every 12h, quota check daily 3AM)
- [ ] Set environment variables (AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_ACCOUNT_KEY, CLOUD_PROVIDER)
- [ ] Create Azure Blob Storage container with az storage container create (or AWS S3 bucket)
- [ ] Enable geo-redundant storage (GRS) with az storage account update --sku Standard_GRS
- [ ] Test upload manually: Run upload-backups.ts, verify files appear in Azure portal
- [ ] Test checksum verification: Calculate MD5 of local file, compare with Azure ETag
- [ ] Test retention policy: Manually set backup date to 31 days ago, verify deletion after enforceRetentionPolicy()
- [ ] Test tier transition: Set backup date to 31 days ago, verify move to cool tier
- [ ] Test quota enforcement: Reduce maxStorageGB to low value, verify purgeOldestBackups() triggered
- [ ] Test cost monitoring: Calculate expected cost, compare with calculateMonthlyCost() output
- [ ] Test cost budget alert: Set low monthlyInfrastructureBudgetUSD, verify alert when exceeded
- [ ] Verify geo-replication: Check Azure portal for secondary region replication status
- [ ] Verify atomic uploads: Kill upload process mid-upload, verify no partial files in cloud storage
- [ ] Document cloud storage setup in server/README.md or operations runbook
- [ ] Commit all files to version control
