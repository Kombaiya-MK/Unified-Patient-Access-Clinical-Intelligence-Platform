import http from 'http';
import config from './config/env';
import logger from './utils/logger';
import { createApp } from './app';
import { performHealthCheck } from './utils/dbHealthCheck';
import { closePool } from './config/database';
import { performHealthCheck as performRedisHealthCheck } from './utils/redisHealthCheck';
import redisClient from './utils/redisClient';
import { startWaitlistProcessor, stopWaitlistProcessor } from './jobs/waitlistProcessor';
import { startReminderJob, stopReminderJob } from './jobs/appointmentReminderJob';
import { startCalendarSyncQueueJob, stopCalendarSyncQueueJob } from './jobs/calendarSyncQueueJob';
import { initWebSocketServer, closeWebSocketServer } from './services/websocketService';
import { initNotificationSocket, closeNotificationSocket } from './services/notificationSocketService';
import type { ScheduledTask } from 'node-cron';

/**
 * Global cron task instances for graceful shutdown
 */
let waitlistProcessorTask: ScheduledTask | null = null;
let reminderJobTask: ScheduledTask | null = null;
let calendarSyncQueueTask: ScheduledTask | null = null;

/**
 * Attempts to start server on specified port
 * Falls back to next port if current port is occupied
 * @param port - Port number to try
 * @param maxPort - Maximum port number to try (3001-3005)
 * @returns Promise resolving to the port used
 */
const startServer = async (port: number, maxPort: number = 3005): Promise<number> => {
  const app = createApp();
  const server = http.createServer(app);

  return new Promise((resolve, reject) => {
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.warn(`Port ${port} is in use, trying ${port + 1}...`);
        if (port < maxPort) {
          server.close();
          resolve(startServer(port + 1, maxPort));
        } else {
          reject(
            new Error(
              `All ports from ${config.port} to ${maxPort} are in use. Please free up a port.`,
            ),
          );
        }
      } else {
        reject(error);
      }
    });

    server.listen(port, () => {
      logger.info(`✓ Server running on port ${port}`);
      logger.info(`✓ Environment: ${config.nodeEnv}`);
      logger.info(`✓ API available at: http://localhost:${port}/api`);
      logger.info(`✓ Health check: http://localhost:${port}/api/health`);

      // Initialize WebSocket server for real-time queue updates
      initWebSocketServer(server);

      // Initialize Socket.io server for real-time notifications
      initNotificationSocket(server);

      // Signal PM2 that the app is ready to accept traffic
      if (process.send) {
        process.send('ready');
        logger.info('✓ PM2 ready signal sent');
      }

      resolve(port);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Closing server gracefully...`);
      
      // Stop cron jobs
      if (waitlistProcessorTask) {
        try {
          stopWaitlistProcessor(waitlistProcessorTask);
        } catch (error) {
          logger.error('Error stopping waitlist processor:', error);
        }
      }
      
      if (reminderJobTask) {
        try {
          stopReminderJob();
          logger.info('✓ Reminder job stopped');
        } catch (error) {
          logger.error('Error stopping reminder job:', error);
        }
      }
      
      if (calendarSyncQueueTask) {
        try {
          stopCalendarSyncQueueJob();
          logger.info('✓ Calendar sync queue job stopped');
        } catch (error) {
          logger.error('Error stopping calendar sync queue job:', error);
        }
      }
      
      // Close HTTP server
      server.close(async () => {
        logger.info('HTTP server closed');
        
        // Close WebSocket connections
        closeWebSocketServer();

        // Close notification Socket.io connections
        closeNotificationSocket();

        // Close database connections
        try {
          await closePool();
        } catch (error) {
          logger.error('Error closing database pool:', error);
        }
        
        // Close Redis connection
        try {
          await redisClient.disconnect();
        } catch (error) {
          logger.error('Error closing Redis connection:', error);
        }
        
        logger.info('Server closed successfully');
        process.exit(0);
      });

      // Force shutdown after 30 seconds (matches PM2 kill_timeout)
      setTimeout(() => {
        logger.error('Forcing shutdown after 30s timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  });
};

/**
 * Global unhandled rejection handler
 */
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Promise Rejection:', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise,
  });

  // In production, you might want to restart the server
  if (config.nodeEnv === 'production') {
    logger.error('Shutting down due to unhandled promise rejection');
    process.exit(1);
  }
});

/**
 * Global uncaught exception handler
 */
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', {
    message: error.message,
    stack: error.stack,
  });

  // Always shut down on uncaught exceptions
  logger.error('Shutting down due to uncaught exception');
  process.exit(1);
});

/**
 * Start the server
 */
const init = async () => {
  try {
    // Validate environment variables
    logger.info('Validating environment variables...');
    
    // Test database connection with retry logic
    logger.info('Connecting to database...');
    await performHealthCheck();
    
    // Test Redis connection (non-blocking - application continues if Redis fails)
    logger.info('Connecting to Redis...');
    try {
      await performRedisHealthCheck();
      logger.info('✓ Redis connection established');
    } catch (error) {
      logger.warn('⚠ Redis connection failed - continuing with database fallback');
      logger.debug('Redis error:', error);
    }
    
    // Start cron jobs
    logger.info('Starting scheduled jobs...');
    try {
      waitlistProcessorTask = startWaitlistProcessor();
      logger.info('✓ Waitlist processor job started');
    } catch (error) {
      logger.error('Failed to start waitlist processor:', error);
      // Non-critical - continue server startup
    }
    
    try {
      reminderJobTask = startReminderJob();
      logger.info('✓ Appointment reminder job started (runs hourly)');
    } catch (error) {
      logger.error('Failed to start reminder job:', error);
      // Non-critical - continue server startup
    }
    
    try {
      calendarSyncQueueTask = startCalendarSyncQueueJob();
      logger.info('✓ Calendar sync queue job started (runs every 5 minutes)');
    } catch (error) {
      logger.error('Failed to start calendar sync queue job:', error);
      // Non-critical - continue server startup
    }
    
    // Start HTTP server
    const usedPort = await startServer(config.port);
    
    if (usedPort !== config.port) {
      logger.warn(`Note: Server started on port ${usedPort} instead of configured port ${config.port}`);
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    
    // Clean up cron jobs on startup failure
    if (waitlistProcessorTask) {
      try {
        stopWaitlistProcessor(waitlistProcessorTask);
      } catch (cleanupError) {
        logger.error('Error stopping waitlist processor during cleanup:', cleanupError);
      }
    }
    
    if (reminderJobTask) {
      try {
        stopReminderJob();
      } catch (cleanupError) {
        logger.error('Error stopping reminder job during cleanup:', cleanupError);
      }
    }
    
    if (calendarSyncQueueTask) {
      try {
        stopCalendarSyncQueueJob();
      } catch (cleanupError) {
        logger.error('Error stopping calendar sync queue job during cleanup:', cleanupError);
      }
    }
    
    // Clean up database connections on startup failure
    try {
      await closePool();
    } catch (cleanupError) {
      logger.error('Error during cleanup:', cleanupError);
    }
    
    // Clean up Redis connection
    try {
      await redisClient.disconnect();
    } catch (cleanupError) {
      logger.error('Error during Redis cleanup:', cleanupError);
    }
    
    process.exit(1);
  }
};

// Start the server
init();
