import { pool } from '../config/database';
import logger from '../utils/logger';
import { dbQueryDuration } from '../utils/metricsRegistry';

const SLOW_QUERY_THRESHOLD_MS = 100;

/**
 * Extract table name from a SQL query string.
 * Best-effort pattern match; returns 'unknown' on failure.
 */
function extractTable(query: string): string {
  const match = query.match(/(?:FROM|INTO|UPDATE|JOIN)\s+([a-z_][a-z0-9_]*)/i);
  return match ? match[1].toLowerCase() : 'unknown';
}

/**
 * Execute a database query with automatic duration tracking.
 *
 * - Records the duration in the `db_query_duration_seconds` histogram.
 * - Logs a warning for queries that exceed SLOW_QUERY_THRESHOLD_MS.
 * - Returns a standard pg QueryResult.
 */
export async function timedQuery<T extends Record<string, unknown> = Record<string, unknown>>(
  query: string,
  params: unknown[] = [],
) {
  const start = performance.now();
  const table = extractTable(query);

  try {
    const result = await pool.query<T>(query, params);
    const durationMs = performance.now() - start;

    dbQueryDuration.observe(
      { query_type: 'success', table, operation: detectOperation(query) },
      durationMs / 1000,
    );

    if (durationMs > SLOW_QUERY_THRESHOLD_MS) {
      logger.warn('SLOW QUERY detected', {
        durationMs: Math.round(durationMs),
        table,
        query: query.substring(0, 200),
        threshold: SLOW_QUERY_THRESHOLD_MS,
      });
    }

    return result;
  } catch (err) {
    const durationMs = performance.now() - start;
    dbQueryDuration.observe(
      { query_type: 'error', table, operation: detectOperation(query) },
      durationMs / 1000,
    );
    throw err;
  }
}

function detectOperation(query: string): string {
  const trimmed = query.trimStart().toUpperCase();
  if (trimmed.startsWith('SELECT')) return 'select';
  if (trimmed.startsWith('INSERT')) return 'insert';
  if (trimmed.startsWith('UPDATE')) return 'update';
  if (trimmed.startsWith('DELETE')) return 'delete';
  return 'other';
}
