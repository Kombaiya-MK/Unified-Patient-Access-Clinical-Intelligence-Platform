import { Pool, PoolConfig } from 'pg';
import config from './env';
import logger from '../utils/logger';
import { DbConfig, DbError } from '../types/database.types';

/**
 * Database configuration from environment variables
 */
export const dbConfig: DbConfig = {
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  ssl: config.database.ssl,
  max: config.database.maxConnections || 50,
  connectionTimeoutMillis: 5000, // 5 seconds
  idleTimeoutMillis: 30000, // 30 seconds – keep idle connections longer to reduce churn
};

/**
 * PostgreSQL connection pool configuration
 */
const poolConfig: PoolConfig = {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: dbConfig.password,
  max: dbConfig.max,
  connectionTimeoutMillis: dbConfig.connectionTimeoutMillis,
  idleTimeoutMillis: dbConfig.idleTimeoutMillis,
  // SSL configuration
  ssl: dbConfig.ssl
    ? {
        rejectUnauthorized: false, // For self-signed certificates in development
      }
    : false,
};

/**
 * Global PostgreSQL connection pool instance
 */
export const pool = new Pool(poolConfig);

/**
 * Pool event handlers for monitoring and logging
 */

// Log when a new client is created and set search_path
pool.on('connect', (client) => {
  client.query('SET search_path TO app, public').catch((err: Error) => {
    logger.error('Failed to set search_path:', { error: err.message });
  });
  logger.debug('New client connected to PostgreSQL pool');
});

// Log when a client is checked out from the pool
pool.on('acquire', () => {
  logger.debug('Client acquired from PostgreSQL pool');
});

// Log when a client is returned to the pool
pool.on('release', (err) => {
  if (err) {
    logger.error('Error releasing client back to pool:', {
      error: err.message,
      stack: err.stack,
    });
  } else {
    logger.debug('Client released back to PostgreSQL pool');
  }
});

// Log when a client is removed from the pool
pool.on('remove', () => {
  logger.debug('Client removed from PostgreSQL pool');
});

// Log pool errors
pool.on('error', (err: DbError) => {
  logger.error('Unexpected error on idle PostgreSQL client:', {
    error: err.message,
    code: err.code,
    detail: err.detail,
    hint: err.hint,
    stack: err.stack,
  });
});

/**
 * Get pool statistics
 * @returns Pool connection statistics
 */
export const getPoolStats = () => {
  return {
    totalCount: pool.totalCount, // Total number of clients in the pool
    idleCount: pool.idleCount, // Number of clients currently idle
    waitingCount: pool.waitingCount, // Number of queued requests waiting for a client
  };
};

/**
 * Close all connections in the pool
 * Should be called during graceful shutdown
 */
export const closePool = async (): Promise<void> => {
  try {
    logger.info('Closing PostgreSQL connection pool...');
    await pool.end();
    logger.info('PostgreSQL connection pool closed successfully');
  } catch (error) {
    const err = error as DbError;
    logger.error('Error closing PostgreSQL connection pool:', {
      error: err.message,
      stack: err.stack,
    });
    throw error;
  }
};

/**
 * Execute a query with automatic connection management
 * @param text - SQL query text
 * @param params - Query parameters
 * @returns Query result
 */
export const query = async <T = any>(
  text: string,
  params?: any[],
): Promise<T> => {
  const start = Date.now();

  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (config.nodeEnv === 'development') {
      logger.debug('Query executed:', {
        text,
        params,
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    }

    return result.rows as T;
  } catch (error) {
    const err = error as DbError;
    const duration = Date.now() - start;

    logger.error('Query execution failed:', {
      text,
      params,
      duration: `${duration}ms`,
      error: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint,
      stack: err.stack,
    });

    throw error;
  }
};

/**
 * Execute a query and return the first row, or null if no rows
 * @param text - SQL query text
 * @param params - Query parameters
 * @returns First row or null
 */
export const queryOne = async <T = any>(
  text: string,
  params?: any[],
): Promise<T | null> => {
  const rows = await query<T>(text, params);
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
};

/**
 * Get a client from the pool for transaction management
 * @returns Connected client with transaction methods
 */
export const getClient = async () => {
  const client = await pool.connect();

  // Extend client with transaction helpers
  const extendedClient = {
    ...client,
    query: client.query.bind(client),
    release: client.release.bind(client),

    /**
     * Begin a transaction
     */
    beginTransaction: async () => {
      await client.query('BEGIN');
      logger.debug('Transaction started');
    },

    /**
     * Commit a transaction
     */
    commit: async () => {
      await client.query('COMMIT');
      logger.debug('Transaction committed');
    },

    /**
     * Rollback a transaction
     */
    rollback: async () => {
      await client.query('ROLLBACK');
      logger.debug('Transaction rolled back');
    },
  };

  return extendedClient;
};

export default pool;
