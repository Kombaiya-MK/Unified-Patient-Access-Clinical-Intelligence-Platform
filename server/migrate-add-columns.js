/**
 * Migration: Add missing columns to appointments and waitlist tables
 * 
 * The application service layer uses slot_id, provider_id, duration, created_by
 * in appointments, and slot_id, preferred_date, provider_id in waitlist.
 * The DB schema has doctor_id, duration_minutes but lacks the others.
 * 
 * This migration adds the missing columns and creates aliases so both
 * naming conventions work.
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── appointments table ──
    // Add slot_id if missing
    const slotCol = await client.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='app' AND table_name='appointments' AND column_name='slot_id'
    `);
    if (slotCol.rowCount === 0) {
      await client.query(`ALTER TABLE app.appointments ADD COLUMN slot_id INTEGER REFERENCES app.time_slots(id)`);
      console.log('Added appointments.slot_id');
    }

    // Add provider_id as alias for doctor_id if missing
    const provCol = await client.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='app' AND table_name='appointments' AND column_name='provider_id'
    `);
    if (provCol.rowCount === 0) {
      await client.query(`ALTER TABLE app.appointments ADD COLUMN provider_id INTEGER`);
      // Copy existing doctor_id values
      await client.query(`UPDATE app.appointments SET provider_id = doctor_id WHERE provider_id IS NULL`);
      console.log('Added appointments.provider_id (populated from doctor_id)');
    }

    // Add duration column (numeric alias for duration_minutes)
    const durCol = await client.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='app' AND table_name='appointments' AND column_name='duration'
    `);
    if (durCol.rowCount === 0) {
      await client.query(`ALTER TABLE app.appointments ADD COLUMN duration INTEGER DEFAULT 30`);
      // Copy existing duration_minutes values
      await client.query(`UPDATE app.appointments SET duration = duration_minutes WHERE duration IS NULL AND duration_minutes IS NOT NULL`);
      console.log('Added appointments.duration (populated from duration_minutes)');
    }

    // Add created_by if missing
    const createdByCol = await client.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='app' AND table_name='appointments' AND column_name='created_by'
    `);
    if (createdByCol.rowCount === 0) {
      await client.query(`ALTER TABLE app.appointments ADD COLUMN created_by TEXT`);
      console.log('Added appointments.created_by');
    }

    // Add status default if not set
    await client.query(`ALTER TABLE app.appointments ALTER COLUMN status SET DEFAULT 'scheduled'`);

    // ── Create trigger to keep doctor_id and provider_id in sync ──
    await client.query(`
      CREATE OR REPLACE FUNCTION app.sync_provider_doctor_id()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.provider_id IS NOT NULL AND NEW.doctor_id IS NULL THEN
          NEW.doctor_id := NEW.provider_id;
        ELSIF NEW.doctor_id IS NOT NULL AND NEW.provider_id IS NULL THEN
          NEW.provider_id := NEW.doctor_id;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Drop existing trigger if any
    await client.query(`DROP TRIGGER IF EXISTS trg_sync_appt_provider_doctor ON app.appointments`);
    await client.query(`
      CREATE TRIGGER trg_sync_appt_provider_doctor
      BEFORE INSERT OR UPDATE ON app.appointments
      FOR EACH ROW EXECUTE FUNCTION app.sync_provider_doctor_id();
    `);
    console.log('Created sync trigger for appointments.provider_id <-> doctor_id');

    // ── waitlist table ──
    // Add slot_id if missing
    const wSlotCol = await client.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='app' AND table_name='waitlist' AND column_name='slot_id'
    `);
    if (wSlotCol.rowCount === 0) {
      await client.query(`ALTER TABLE app.waitlist ADD COLUMN slot_id INTEGER REFERENCES app.time_slots(id)`);
      console.log('Added waitlist.slot_id');
    }

    // Add provider_id as alias for doctor_id if missing
    const wProvCol = await client.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='app' AND table_name='waitlist' AND column_name='provider_id'
    `);
    if (wProvCol.rowCount === 0) {
      await client.query(`ALTER TABLE app.waitlist ADD COLUMN provider_id INTEGER`);
      await client.query(`UPDATE app.waitlist SET provider_id = doctor_id WHERE provider_id IS NULL`);
      console.log('Added waitlist.provider_id (populated from doctor_id)');
    }

    // Add preferred_date as alias for requested_date if missing
    const wPrefCol = await client.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='app' AND table_name='waitlist' AND column_name='preferred_date'
    `);
    if (wPrefCol.rowCount === 0) {
      await client.query(`ALTER TABLE app.waitlist ADD COLUMN preferred_date DATE`);
      await client.query(`UPDATE app.waitlist SET preferred_date = requested_date WHERE preferred_date IS NULL`);
      console.log('Added waitlist.preferred_date (populated from requested_date)');
    }

    // Waitlist sync trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION app.sync_waitlist_columns()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.provider_id IS NOT NULL AND NEW.doctor_id IS NULL THEN
          NEW.doctor_id := NEW.provider_id;
        ELSIF NEW.doctor_id IS NOT NULL AND NEW.provider_id IS NULL THEN
          NEW.provider_id := NEW.doctor_id;
        END IF;
        IF NEW.preferred_date IS NOT NULL AND NEW.requested_date IS NULL THEN
          NEW.requested_date := NEW.preferred_date;
        ELSIF NEW.requested_date IS NOT NULL AND NEW.preferred_date IS NULL THEN
          NEW.preferred_date := NEW.requested_date;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`DROP TRIGGER IF EXISTS trg_sync_waitlist_columns ON app.waitlist`);
    await client.query(`
      CREATE TRIGGER trg_sync_waitlist_columns
      BEFORE INSERT OR UPDATE ON app.waitlist
      FOR EACH ROW EXECUTE FUNCTION app.sync_waitlist_columns();
    `);
    console.log('Created sync trigger for waitlist columns');

    // ── Add index on slot_id for performance ──
    await client.query(`CREATE INDEX IF NOT EXISTS idx_appointments_slot_id ON app.appointments(slot_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_appointments_provider_id ON app.appointments(provider_id)`);
    
    await client.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
