import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/env';
import logger, { loggerStream } from './utils/logger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { getConnectionStatus } from './utils/dbHealthCheck';
import { getPoolStats } from './config/database';
import { getRedisStatus, isRedisAvailable } from './utils/redisHealthCheck';
import { checkAIServiceHealth } from './utils/aiServiceHealthCheck';
import { metricsCollector } from './middleware/metricsCollector';
import { initializeMetrics } from './utils/metricsRegistry';
import metricsRoutes from './routes/metrics.routes';
import { metricsAuth } from './middleware/metricsAuth';
import { performanceLogger } from './middleware/performanceLogger';

/**
 * Creates and configures Express application
 * @returns Configured Express app
 */
export const createApp = (): Application => {
  const app = express();

  // Security middleware - Helmet (must be first)
  app.use(helmet());

  // Trust first proxy (IIS reverse proxy) for correct X-Forwarded-For / X-Forwarded-Proto handling.
  // With this setting, req.ip returns the real client IP from X-Forwarded-For automatically.
  app.set('trust proxy', 1);

  // CORS configuration
  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      const allowedOrigins = [config.frontendUrl];

      // In development, also allow localhost origins
      if (config.nodeEnv === 'development') {
        allowedOrigins.push(
          'http://localhost:3000',
          'http://localhost:5173',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:5173',
        );
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
          return callback(null, true);
        }
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn('CORS blocked origin', { origin, allowedOrigins });
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
  app.use(cors(corsOptions));

  // HTTP request logger - Morgan
  app.use(
    morgan(
      config.nodeEnv === 'development' ? 'dev' : 'combined',
      { stream: loggerStream },
    ),
  );

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Initialize Prometheus metrics
  initializeMetrics();

  // Metrics collector middleware (must be before routes)
  app.use(metricsCollector);

  // Performance logger middleware
  app.use(performanceLogger);

  // Health check endpoint with database status (IIS Application Initialization compatible)
  app.get('/api/health', async (_req: Request, res: Response) => {
    const startTime = Date.now();

    try {
      const dbStatus = await getConnectionStatus();
      const poolStats = getPoolStats();
      const redisStatus = getRedisStatus();
      const aiStatus = await checkAIServiceHealth();

      const dbHealthy = dbStatus.status === 'ok';
      const redisHealthy = redisStatus.connected;
      const aiHealthy = aiStatus.configured ? aiStatus.available : true;

      const isHealthy = dbHealthy && redisHealthy && aiHealthy;
      const status = isHealthy
        ? 'healthy'
        : dbHealthy
          ? 'degraded'
          : 'unhealthy';

      const executionTime = Date.now() - startTime;

      res.status(isHealthy ? 200 : 503).json({
        success: isHealthy,
        status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        executionTime: `${executionTime}ms`,
        environment: config.nodeEnv,
        database: {
          status: dbHealthy ? 'connected' : 'disconnected',
          host: dbStatus.details?.host,
          port: dbStatus.details?.port,
          database: dbStatus.details?.database,
          version: dbStatus.details?.version,
        },
        pool: {
          total: poolStats.totalCount,
          idle: poolStats.idleCount,
          waiting: poolStats.waitingCount,
        },
        redis: {
          status: redisHealthy ? 'connected' : 'disconnected',
          latency: redisStatus.latency,
          lastError: redisStatus.lastError,
        },
        aiService: {
          configured: aiStatus.configured,
          available: aiStatus.available,
          latency: aiStatus.latency,
          error: aiStatus.error,
        },
      });
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Health check failed:', error);
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        executionTime: `${executionTime}ms`,
        environment: config.nodeEnv,
        error: 'Health check failed',
      });
    }
  });

  // Redis-specific health check endpoint
  app.get('/api/health/redis', async (_req: Request, res: Response) => {
    try {
      const redisStatus = getRedisStatus();
      const available = isRedisAvailable();

      res.status(available ? 200 : 503).json({
        success: available,
        status: available ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        redis: {
          connected: redisStatus.connected,
          latency: redisStatus.latency,
          uptime: redisStatus.uptime,
          lastError: redisStatus.lastError,
        },
      });
    } catch (error) {
      logger.error('Redis health check failed:', error);
      res.status(503).json({
        success: false,
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Redis health check failed',
      });
    }
  });

  // Metrics endpoint (protected by metricsAuth middleware)
  app.use('/metrics', metricsAuth, metricsRoutes);

  // API routes
  app.use('/api', routes);

  // 404 handler (must be after all routes)
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  logger.info('Express app configured successfully');

  return app;
};

export default createApp;
