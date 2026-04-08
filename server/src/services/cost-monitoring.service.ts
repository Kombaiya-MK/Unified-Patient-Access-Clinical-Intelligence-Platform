/**
 * Cost Monitoring Service
 *
 * Estimates monthly Azure Blob Storage costs based on per-tier
 * pricing, validates against the 10 % infrastructure budget cap,
 * and pushes Prometheus gauge metrics to the pushgateway.
 *
 * Uses Node built-in `http` module (no axios) consistent with
 * the project's backup-orchestrator pattern.
 *
 * @module services/cost-monitoring.service
 * @task US_042 TASK_002
 */

import http from 'http';
import { URL } from 'url';
import { AzureStorageService } from './azure-storage.service';
import { cloudStorageConfig } from '../config/cloud-storage.config';
import logger from '../utils/logger';

export interface TierCosts {
  hot: number;
  cool: number;
  archive: number;
}

export interface CostReport {
  totalCostUSD: number;
  tierCosts: TierCosts;
  budgetPercent: number;
  budgetExceeded: boolean;
  maxAllowedCostUSD: number;
}

/** Azure Blob Storage pricing per GB / month (East US) */
const PRICING_PER_GB: Record<string, number> = {
  hot: 0.018,
  cool: 0.01,
  archive: 0.00099,
};

export class CostMonitoringService {
  private storageService: AzureStorageService;

  constructor(storageService?: AzureStorageService) {
    this.storageService = storageService || new AzureStorageService();
  }

  /**
   * Calculate estimated monthly storage cost by summing
   * per-tier GB × tier pricing.
   */
  async calculateMonthlyCost(): Promise<{
    totalCostUSD: number;
    tierCosts: TierCosts;
  }> {
    const backups = await this.storageService.listBackups();

    const tierSizes: Record<string, number> = {
      hot: 0,
      cool: 0,
      archive: 0,
    };

    for (const backup of backups) {
      const tier = backup.tier.toLowerCase();
      const sizeGB = backup.size / 1024 ** 3;
      tierSizes[tier] = (tierSizes[tier] || 0) + sizeGB;
    }

    const tierCosts: TierCosts = {
      hot: tierSizes['hot'] * (PRICING_PER_GB['hot'] || 0),
      cool: tierSizes['cool'] * (PRICING_PER_GB['cool'] || 0),
      archive: tierSizes['archive'] * (PRICING_PER_GB['archive'] || 0),
    };

    const totalCostUSD =
      tierCosts.hot + tierCosts.cool + tierCosts.archive;

    return { totalCostUSD, tierCosts };
  }

  /**
   * Check cost against the infrastructure budget cap.
   */
  async checkBudget(): Promise<CostReport> {
    const { totalCostUSD, tierCosts } = await this.calculateMonthlyCost();

    const maxAllowedCostUSD =
      cloudStorageConfig.cost.monthlyInfrastructureBudgetUSD *
      (cloudStorageConfig.cost.maxInfrastructureBudgetPercent / 100);

    const budgetPercent =
      maxAllowedCostUSD > 0
        ? (totalCostUSD / maxAllowedCostUSD) * 100
        : 0;

    const budgetExceeded = budgetPercent > 100;

    if (budgetExceeded) {
      logger.error(
        `CRITICAL: Storage cost $${totalCostUSD.toFixed(2)} exceeds ` +
          `10% budget cap of $${maxAllowedCostUSD.toFixed(2)}`,
      );
    } else {
      logger.info(
        `Storage cost: $${totalCostUSD.toFixed(2)} ` +
          `(${budgetPercent.toFixed(1)}% of $${maxAllowedCostUSD.toFixed(2)} cap)`,
      );
    }

    return {
      totalCostUSD,
      tierCosts,
      budgetPercent,
      budgetExceeded,
      maxAllowedCostUSD,
    };
  }

  /**
   * Push storage cost metrics to Prometheus Pushgateway.
   * Uses Node built-in http module.
   */
  async pushCostMetrics(): Promise<void> {
    const { totalCostUSD, tierCosts } = await this.calculateMonthlyCost();

    const body = [
      '# TYPE storage_cost_estimate_usd gauge',
      `storage_cost_estimate_usd ${totalCostUSD}`,
      '# TYPE storage_tier_cost_usd gauge',
      `storage_tier_cost_usd{tier="hot"} ${tierCosts.hot}`,
      `storage_tier_cost_usd{tier="cool"} ${tierCosts.cool}`,
      `storage_tier_cost_usd{tier="archive"} ${tierCosts.archive}`,
    ].join('\n');

    const gatewayUrl = cloudStorageConfig.prometheus.pushgatewayUrl;

    try {
      await this.httpPost(
        `${gatewayUrl}/metrics/job/backup_cost_monitoring`,
        body,
      );
      logger.info('Pushed cost metrics to Prometheus');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn(`Failed to push cost metrics: ${msg}`);
    }
  }

  /**
   * Minimal HTTP POST using Node built-in http module.
   */
  private httpPost(urlString: string, data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = new URL(urlString);
      const options: http.RequestOptions = {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': Buffer.byteLength(data),
        },
      };

      const req = http.request(options, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`Pushgateway responded with ${res.statusCode}`));
        }
        res.resume();
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }
}
