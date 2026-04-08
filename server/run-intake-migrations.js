/**
 * Run intake-related migrations V026, V027, V028 on Neon DB
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_aqI9Rick0AVP@ep-billowing-hill-an21ayo9-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  await client.query('SET search_path TO app, public');

  const migrations = [
    'V026__add_ai_intake_fields.sql',
    'V027__create_conversations_table.sql',
    'V028__add_intake_drafts.sql',
  ];

  for (const file of migrations) {
    try {
      console.log('Running ' + file + '...');
      const sql = fs.readFileSync(
        path.join(__dirname, '..', 'database', 'migrations', file),
        'utf8'
      );
      await client.query(sql);
      console.log('  OK: ' + file + ' completed');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('  SKIP: ' + file + ' (already applied)');
      } else {
        console.error('  FAIL: ' + file + ' - ' + err.message);
      }
    }
  }

  // Verify
  const cols = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='app' AND table_name='clinical_documents' AND column_name IN ('draft_status','draft_data','last_saved_at','intake_mode','conversation_history','ai_validation_score') ORDER BY 1"
  );
  console.log('\nclinical_documents new columns:', cols.rows.map(function(r) { return r.column_name; }));

  const convTable = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='app' AND table_name='conversations'"
  );
  console.log('conversations table exists:', convTable.rows.length > 0);

  const convCols = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='app' AND table_name='conversations' ORDER BY ordinal_position"
  );
  console.log('conversations columns:', convCols.rows.map(function(r) { return r.column_name; }));

  console.log('\nDone!');
  client.release();
  await pool.end();
}

run();
