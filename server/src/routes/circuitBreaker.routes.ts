/**
 * Circuit Breaker Routes
 *
 * Admin-only endpoints exposing AI circuit breaker states and event logs.
 *
 * @module routes/circuitBreaker.routes
 * @task US_041 TASK_002 (BUG_CB_BACKEND_001)
 */

import { Router, Request, Response } from 'express';
import { authenticateToken, authorize } from '../middleware/auth';
import { allAIBreakers, getLogsForService } from '../config/circuit-breaker.config';

const router = Router();

/** Maps backend breaker names to frontend service IDs */
const SERVICE_ID_MAP: Record<string, string> = {
  'gpt4-intake': 'ai-intake',
  'gpt4v-extraction': 'document-extraction',
  'gpt4-coding': 'medical-coding',
  'gpt4-conflicts': 'medication-conflicts',
};

/** Maps backend breaker names to model display names */
const MODEL_MAP: Record<string, string> = {
  'gpt4-intake': 'gpt-4-turbo',
  'gpt4v-extraction': 'gpt-4o',
  'gpt4-coding': 'gpt-4-turbo',
  'gpt4-conflicts': 'gpt-4-turbo',
};

const ALLOWED_SERVICES = new Set(Object.keys(SERVICE_ID_MAP));

/**
 * @route   GET /api/circuit-breaker/status
 * @desc    Aggregate status of all AI circuit breakers
 * @access  Admin
 */
router.get(
  '/status',
  authenticateToken,
  authorize('admin'),
  (_req: Request, res: Response) => {
    const statuses = allAIBreakers.map((breaker) => {
      const name = (breaker as any).options?.name ?? '';
      const stats = (breaker as any).stats ?? {};
      const failures = stats.failures ?? 0;
      const successes = stats.successes ?? 0;
      const total = failures + successes;
      const failureRate = total > 0 ? (failures / total) * 100 : 0;

      let state: 'closed' | 'half-open' | 'open' = 'closed';
      if (breaker.opened) {
        state = (breaker as any).pendingClose ? 'half-open' : 'open';
      }

      return {
        service: SERVICE_ID_MAP[name] || name,
        model: MODEL_MAP[name] || '',
        state,
        failureRate: Math.round(failureRate * 10) / 10,
        lastStateChange: new Date().toISOString(),
        errorCount: failures,
        successCount: successes,
      };
    });

    res.json({ success: true, data: statuses });
  },
);

/**
 * @route   GET /api/circuit-breaker/logs/:service
 * @desc    Event logs for a specific circuit breaker service
 * @access  Admin
 */
router.get(
  '/logs/:service',
  authenticateToken,
  authorize('admin'),
  (req: Request, res: Response) => {
    const service = req.params.service as string;

    if (!ALLOWED_SERVICES.has(service)) {
      res.json({ success: true, data: [] });
      return;
    }

    const logs = getLogsForService(service);
    res.json({ success: true, data: logs });
  },
);

export default router;
