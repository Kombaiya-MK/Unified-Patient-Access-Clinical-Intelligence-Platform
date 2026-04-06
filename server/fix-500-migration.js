/**
 * Migration: Fix 500 Errors - Add Missing Tables and Columns
 * 
 * This migration adds all missing database objects required by EP-003 through EP-006 services.
 * 
 * Missing columns in existing tables:
 *   - appointments: version, arrived_at, started_at, updated_by, coding_status, icd10_codes, cpt_codes
 *   - clinical_documents: original_filename, extraction_status, extraction_confidence, extracted_data, upload_date
 *   - patient_profiles: extracted_data, has_active_conflicts
 * 
 * Missing tables:
 *   - medical_coding_suggestions (EP-006 US-032)
 *   - medical_coding_audit (EP-006 US-032)
 *   - medication_conflicts (EP-006 US-033)
 *   - conflict_check_audit (EP-006 US-033)
 *   - profile_conflicts (EP-006 US-031)
 *   - profile_versions (EP-006 US-031)
 *   - data_merge_logs (EP-005 US-030)
 *   - field_conflicts (EP-005 US-030)
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

async function runMigration() {
  const client = await pool.connect();
  try {
    await client.query('SET search_path TO app, public');
    await client.query('BEGIN');

    console.log('=== Adding missing columns to appointments table ===');
    await client.query(`
      ALTER TABLE app.appointments
        ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS arrived_at timestamptz,
        ADD COLUMN IF NOT EXISTS started_at timestamptz,
        ADD COLUMN IF NOT EXISTS updated_by bigint,
        ADD COLUMN IF NOT EXISTS coding_status varchar(50),
        ADD COLUMN IF NOT EXISTS icd10_codes jsonb,
        ADD COLUMN IF NOT EXISTS cpt_codes jsonb
    `);
    console.log('  OK: appointments columns added');

    console.log('=== Adding missing columns to clinical_documents table ===');
    await client.query(`
      ALTER TABLE app.clinical_documents
        ADD COLUMN IF NOT EXISTS original_filename varchar(500),
        ADD COLUMN IF NOT EXISTS extraction_status varchar(50) DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS extraction_confidence numeric(5,4) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS extracted_data jsonb DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS upload_date timestamptz
    `);
    // Backfill upload_date from created_at
    await client.query(`
      UPDATE app.clinical_documents SET upload_date = created_at WHERE upload_date IS NULL
    `);
    console.log('  OK: clinical_documents columns added');

    console.log('=== Adding missing columns to patient_profiles table ===');
    await client.query(`
      ALTER TABLE app.patient_profiles
        ADD COLUMN IF NOT EXISTS extracted_data jsonb DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS has_active_conflicts boolean DEFAULT false
    `);
    console.log('  OK: patient_profiles columns added');

    console.log('=== Creating medical_coding_suggestions table ===');
    await client.query(`
      CREATE TABLE IF NOT EXISTS app.medical_coding_suggestions (
        suggestion_id bigserial PRIMARY KEY,
        appointment_id bigint REFERENCES app.appointments(id),
        patient_id bigint,
        code_type varchar(20) NOT NULL,
        code varchar(20) NOT NULL,
        description text,
        confidence_score numeric(5,4) DEFAULT 0,
        coding_status varchar(50) DEFAULT 'ai_suggested',
        suggested_by varchar(20) DEFAULT 'ai',
        reviewed_by_staff_id bigint,
        reviewed_at timestamptz,
        source_text text,
        ai_reasoning text,
        original_code varchar(20),
        modification_reason text,
        created_at timestamptz DEFAULT NOW(),
        updated_at timestamptz DEFAULT NOW()
      )
    `);
    console.log('  OK: medical_coding_suggestions created');

    console.log('=== Creating medical_coding_audit table ===');
    await client.query(`
      CREATE TABLE IF NOT EXISTS app.medical_coding_audit (
        id bigserial PRIMARY KEY,
        suggestion_id bigint,
        appointment_id bigint,
        patient_id bigint,
        action_taken varchar(50),
        code_type varchar(20),
        code varchar(20),
        new_status varchar(50),
        staff_id bigint,
        modification_details jsonb,
        created_at timestamptz DEFAULT NOW()
      )
    `);
    console.log('  OK: medical_coding_audit created');

    console.log('=== Creating medication_conflicts table ===');
    await client.query(`
      CREATE TABLE IF NOT EXISTS app.medication_conflicts (
        conflict_id bigserial PRIMARY KEY,
        patient_id bigint NOT NULL,
        conflict_type varchar(100),
        medications_involved jsonb,
        severity_level integer DEFAULT 0,
        interaction_mechanism text,
        clinical_guidance text,
        conflict_status varchar(50) DEFAULT 'Active',
        override_reason text,
        override_by_staff_id bigint,
        override_at timestamptz,
        detected_at timestamptz DEFAULT NOW(),
        created_at timestamptz DEFAULT NOW(),
        updated_at timestamptz DEFAULT NOW()
      )
    `);
    console.log('  OK: medication_conflicts created');

    console.log('=== Creating conflict_check_audit table ===');
    await client.query(`
      CREATE TABLE IF NOT EXISTS app.conflict_check_audit (
        id bigserial PRIMARY KEY,
        patient_id bigint NOT NULL,
        medications_checked jsonb,
        conflicts_detected_count integer DEFAULT 0,
        checked_by varchar(100),
        staff_id bigint,
        check_performed_at timestamptz DEFAULT NOW(),
        created_at timestamptz DEFAULT NOW()
      )
    `);
    console.log('  OK: conflict_check_audit created');

    console.log('=== Creating profile_conflicts table ===');
    await client.query(`
      CREATE TABLE IF NOT EXISTS app.profile_conflicts (
        id bigserial PRIMARY KEY,
        patient_id bigint NOT NULL,
        field_name varchar(100),
        conflicting_values jsonb,
        resolution_status varchar(50) DEFAULT 'Pending',
        resolved_value text,
        resolved_by_staff_id bigint,
        resolved_at timestamptz,
        resolution_notes text,
        created_at timestamptz DEFAULT NOW(),
        updated_at timestamptz DEFAULT NOW()
      )
    `);
    console.log('  OK: profile_conflicts created');

    console.log('=== Creating profile_versions table ===');
    await client.query(`
      CREATE TABLE IF NOT EXISTS app.profile_versions (
        id bigserial PRIMARY KEY,
        patient_id bigint NOT NULL,
        profile_snapshot jsonb,
        change_type varchar(100),
        changed_by_staff_id bigint,
        change_description text,
        created_at timestamptz DEFAULT NOW()
      )
    `);
    console.log('  OK: profile_versions created');

    console.log('=== Creating data_merge_logs table ===');
    await client.query(`
      CREATE TABLE IF NOT EXISTS app.data_merge_logs (
        id bigserial PRIMARY KEY,
        patient_id bigint NOT NULL,
        merge_timestamp timestamptz DEFAULT NOW(),
        algorithm_version varchar(20),
        source_documents jsonb,
        merge_decisions jsonb,
        conflicts_detected jsonb,
        performed_by varchar(100),
        staff_id bigint,
        created_at timestamptz DEFAULT NOW()
      )
    `);
    console.log('  OK: data_merge_logs created');

    console.log('=== Creating field_conflicts table ===');
    await client.query(`
      CREATE TABLE IF NOT EXISTS app.field_conflicts (
        id bigserial PRIMARY KEY,
        patient_id bigint NOT NULL,
        field_name varchar(100),
        conflicting_values jsonb,
        resolution_status varchar(50) DEFAULT 'Pending',
        resolved_by_staff_id bigint,
        resolved_at timestamptz,
        resolution_notes text,
        created_at timestamptz DEFAULT NOW(),
        updated_at timestamptz DEFAULT NOW()
      )
    `);
    console.log('  OK: field_conflicts created');

    await client.query('COMMIT');
    console.log('\n=== Migration completed successfully ===');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(() => process.exit(1));
