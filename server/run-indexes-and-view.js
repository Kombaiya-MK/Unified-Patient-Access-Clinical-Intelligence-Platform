/**
 * Run only V019 (indexes) and create view
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runIndexesAndView() {
  console.log('Applying indexes (V019) and creating reminder view...\n');

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

    // Run V019 (indexes)
    console.log('[INFO] Running V019__add_reminder_indexes.sql');
    try {
      const v019 = fs.readFileSync(
        path.join(__dirname, '..', 'database', 'migrations', 'V019__add_reminder_indexes.sql'),
        'utf8'
      );
      await client.query(v019);
      console.log('✓ V019 completed\n');
    } catch (error) {
      console.log('⚠ V019 may be partially applied:', error.message);
      console.log('  Continuing with view creation...\n');
    }

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

    console.log('✓ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

runIndexesAndView();
