require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    // Get all check constraints on appointments
    const r = await p.query(`
      SELECT con.conname, pg_get_constraintdef(con.oid) as def
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE nsp.nspname = 'app' AND rel.relname = 'appointments' AND con.contype = 'c'
    `);
    console.log('CHECK CONSTRAINTS:');
    r.rows.forEach(row => console.log(`  ${row.conname}: ${row.def}`));

    // Get all columns with types and defaults
    const cols = await p.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'app' AND table_name = 'appointments'
      ORDER BY ordinal_position
    `);
    console.log('\nCOLUMNS:');
    cols.rows.forEach(row => console.log(`  ${row.column_name} (${row.data_type}) nullable=${row.is_nullable} default=${row.column_default}`));

    // Get existing appointment_type values
    const types = await p.query('SELECT DISTINCT appointment_type FROM app.appointments');
    console.log('\nEXISTING TYPES:', types.rows.map(r => r.appointment_type));

    // Get existing status values
    const statuses = await p.query('SELECT DISTINCT status FROM app.appointments');
    console.log('EXISTING STATUSES:', statuses.rows.map(r => r.status));

    // Get foreign key constraints
    const fks = await p.query(`
      SELECT con.conname, pg_get_constraintdef(con.oid) as def
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE nsp.nspname = 'app' AND rel.relname = 'appointments' AND con.contype = 'f'
    `);
    console.log('\nFOREIGN KEYS:');
    fks.rows.forEach(row => console.log(`  ${row.conname}: ${row.def}`));

    // Get time_slots columns
    const tsCols = await p.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'app' AND table_name = 'time_slots'
      ORDER BY ordinal_position
    `);
    console.log('\nTIME_SLOTS COLUMNS:');
    tsCols.rows.forEach(row => console.log(`  ${row.column_name} (${row.data_type})`));

  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await p.end();
  }
})();
