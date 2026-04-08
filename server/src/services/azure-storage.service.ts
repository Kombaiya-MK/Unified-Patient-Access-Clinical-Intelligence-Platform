/**
 * Azure Blob Storage Service
 *
 * Low-level integration with Azure Blob Storage using the
 * @azure/storage-blob SDK. Provides upload, verify, list, delete,
 * and tier-transition operations for healthcare backup blobs.
 * Container uses geo-redundant storage (GRS) for HIPAA compliance.
 *
 * @module services/azure-storage.service
 * @task US_042 TASK_002
 */

import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  ContainerClient,
  BlockBlobClient,
} from '@azure/storage-blob';
import path from 'path';
import { cloudStorageConfig } from '../config/cloud-storage.config';
import logger from '../utils/logger';

export interface BlobInfo {
  name: string;
  size: number;
  tier: string;
  lastModified: Date;
  metadata: Record<string, string>;
}

export class AzureStorageService {
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;

  constructor() {
    const { accountName, accountKey, containerName } =
      cloudStorageConfig.azure;

    if (!accountName || !accountKey) {
      throw new Error(
        'Azure Storage credentials not configured. ' +
          'Set AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY.',
      );
    }

    const credential = new StorageSharedKeyCredential(accountName, accountKey);

    this.blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      credential,
    );

    this.containerClient =
      this.blobServiceClient.getContainerClient(containerName);
  }

  /**
   * Ensure the backup container exists (idempotent).
   */
  async ensureContainer(): Promise<void> {
    await this.containerClient.createIfNotExists({
      access: undefined, // private access only
    });
    logger.info(
      `Container "${cloudStorageConfig.azure.containerName}" ready`,
    );
  }

  /**
   * Upload an encrypted backup file to Azure Blob Storage.
   * Returns the ETag for integrity verification.
   */
  async uploadBackup(
    localFilePath: string,
    metadata: Record<string, string>,
  ): Promise<string> {
    const blobName = path.basename(localFilePath);
    const blockBlobClient: BlockBlobClient =
      this.containerClient.getBlockBlobClient(blobName);

    const uploadResponse = await blockBlobClient.uploadFile(localFilePath, {
      metadata,
      tier: cloudStorageConfig.azure.tier,
      blobHTTPHeaders: {
        blobContentType: 'application/octet-stream',
      },
    });

    logger.info(`Uploaded ${blobName} (ETag: ${uploadResponse.etag})`);
    return uploadResponse.etag!;
  }

  /**
   * Verify that an uploaded blob's ETag matches the expected value.
   */
  async verifyUpload(blobName: string, expectedETag: string): Promise<boolean> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const properties = await blockBlobClient.getProperties();
    return properties.etag === expectedETag;
  }

  /**
   * List all blobs in the backup container.
   */
  async listBackups(): Promise<BlobInfo[]> {
    const backups: BlobInfo[] = [];

    for await (const blob of this.containerClient.listBlobsFlat({
      includeMetadata: true,
    })) {
      backups.push({
        name: blob.name,
        size: blob.properties.contentLength || 0,
        tier: blob.properties.accessTier || 'unknown',
        lastModified: blob.properties.lastModified || new Date(0),
        metadata: (blob.metadata as Record<string, string>) || {},
      });
    }

    return backups;
  }

  /**
   * Delete a single blob by name.
   */
  async deleteBackup(blobName: string): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete();
    logger.info(`Deleted blob: ${blobName}`);
  }

  /**
   * Transition a blob to a different access tier.
   */
  async setAccessTier(
    blobName: string,
    tier: 'Hot' | 'Cool' | 'Archive',
  ): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.setAccessTier(tier);
    logger.info(`Moved ${blobName} to ${tier} tier`);
  }

  /**
   * Get total storage used in bytes across all blobs.
   */
  async getTotalStorageBytes(): Promise<number> {
    const backups = await this.listBackups();
    return backups.reduce((sum, b) => sum + b.size, 0);
  }
}
