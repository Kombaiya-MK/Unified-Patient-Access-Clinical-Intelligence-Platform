/**
 * Migration: Add No-Show and Merge Columns
 * Adds columns needed by noShowService and mergeService that were missing.
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query('SET search_path TO app, public');
    await client.query('BEGIN');

    console.log('=== Adding no-show columns to appointments ===');
    await client.query(`
      ALTER TABLE app.appointments
        ADD COLUMN IF NOT EXISTS no_show_marked_at timestamptz,
        ADD COLUMN IF NOT EXISTS marked_by_staff_id bigint,
        ADD COLUMN IF NOT EXISTS no_show_notes text,
        ADD COLUMN IF NOT EXISTS excused_no_show boolean DEFAULT false
    `);
    console.log('  OK');

    console.log('=== Adding no-show/risk columns to patient_profiles ===');
    await client.query(`
      ALTER TABLE app.patient_profiles
        ADD COLUMN IF NOT EXISTS no_show_count integer DEFAULT 0,
        ADD COLUMN IF NOT EXISTS risk_score numeric(5,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS merged_from_documents jsonb,
        ADD COLUMN IF NOT EXISTS merge_status varchar(50),
        ADD COLUMN IF NOT EXISTS last_deduplicated_at timestamptz,
        ADD COLUMN IF NOT EXISTS conflict_fields jsonb
    `);
    console.log('  OK');

    await client.query('COMMIT');
    console.log('=== Migration 2 completed ===');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(() => process.exit(1));
