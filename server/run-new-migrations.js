/**
 * Run only new migrations V017, V018, V019
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runNewMigrations() {
  console.log('Running new migrations for US_016 (V017, V018, V019)...\n');

  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'upaci',
    user: 'postgres',
    password: 'admin',
  });

  try {
    const client = await pool.connect();
    console.log('✓ Database connection successful\n');

    // Run V017
    console.log('[INFO] Running V017__add_appointment_reminder_columns.sql');
    const v017 = fs.readFileSync(
      path.join(__dirname, '..', 'database', 'migrations', 'V017__add_appointment_reminder_columns.sql'),
      'utf8'
    );
    await client.query(v017);
    console.log('✓ V017 completed\n');

    // Run V018
    console.log('[INFO] Running V018__create_notification_preferences_table.sql');
    const v018 = fs.readFileSync(
      path.join(__dirname, '..', 'database', 'migrations', 'V018__create_notification_preferences_table.sql'),
      'utf8'
    );
    await client.query(v018);
    console.log('✓ V018 completed\n');

    // Run V019
    console.log('[INFO] Running V019__add_reminder_indexes.sql');
    const v019 = fs.readFileSync(
      path.join(__dirname, '..', 'database', 'migrations', 'V019__add_reminder_indexes.sql'),
      'utf8'
    );
    await client.query(v019);
    console.log('✓ V019 completed\n');

    // Run view
    console.log('[INFO] Creating upcoming_appointments_needing_reminders view');
    const view = fs.readFileSync(
      path.join(__dirname, '..', 'database', 'views', 'upcoming_appointments_needing_reminders_view.sql'),
      'utf8'
    );
    await client.query(view);
    console.log('✓ View created\n');

    client.release();
    await pool.end();

    console.log('✓ All new migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

runNewMigrations();
