/**
 * Cloud Database Migration Script
 * Runs all SQL migrations against a cloud PostgreSQL instance (Neon/Supabase)
 * 
 * Usage: 
 *   node deploy/migrate-cloud-db.js <DATABASE_URL>
 * 
 * Example:
 *   node deploy/migrate-cloud-db.js "postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.argv[2] || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: Provide DATABASE_URL as argument or env var');
  console.error('Usage: node deploy/migrate-cloud-db.js <DATABASE_URL>');
  process.exit(1);
}

async function run() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to cloud database.\n');

  // --- Step 1: Create schemas and extensions ---
  console.log('=== Step 1: Creating schemas and extensions ===');
  const initSQL = `
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE SCHEMA IF NOT EXISTS app;
    CREATE SCHEMA IF NOT EXISTS ai;
    CREATE SCHEMA IF NOT EXISTS audit;
    SET search_path TO app, public;
  `;
  await client.query(initSQL);
  console.log('Schemas (app, ai, audit) and extensions created.\n');

  // Note: pgvector extension may not be available on all free tiers.
  // We try it but don't fail if unavailable.
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');
    console.log('pgvector extension enabled.');
  } catch (e) {
    console.warn('WARNING: pgvector extension not available on this database. AI vector features will be disabled.');
    console.warn(`  Error: ${e.message}\n`);
  }

  // --- Step 2: Create migration tracking table ---
  console.log('=== Step 2: Creating migration tracking table ===');
  await client.query(`
    CREATE TABLE IF NOT EXISTS app.schema_migrations (
      version VARCHAR(10) PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Migration tracking table ready.\n');

  // --- Step 3: Run migrations in order ---
  console.log('=== Step 3: Running migrations ===');
  const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');
  
  let files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql') && f.startsWith('V'))
    .sort((a, b) => {
      const numA = parseInt(a.match(/V(\d+)/)[1], 10);
      const numB = parseInt(b.match(/V(\d+)/)[1], 10);
      return numA - numB;
    });

  // Get already-applied migrations
  const applied = new Set();
  const { rows } = await client.query('SELECT filename FROM app.schema_migrations');
  rows.forEach(r => applied.add(r.filename));

  let migrationsRan = 0;
  let skipped = 0;

  for (const file of files) {
    if (applied.has(file)) {
      skipped++;
      continue;
    }

    const filePath = path.join(migrationsDir, file);
    let sql = fs.readFileSync(filePath, 'utf8');

    // Strip psql meta-commands that don't work on cloud DBs
    sql = sql.replace(/\\c\s+\w+/g, '');
    sql = sql.replace(/\\echo\s+.*/g, '');
    sql = sql.replace(/\\if\s+.*/g, '');
    sql = sql.replace(/\\endif/g, '');
    sql = sql.replace(/\\set\s+.*/g, '');

    // Ensure search_path is set
    const fullSQL = `SET search_path TO app, public;\n${sql}`;

    const version = file.match(/V(\d+)/)[1];

    try {
      await client.query('BEGIN');
      await client.query(fullSQL);
      await client.query(
        'INSERT INTO app.schema_migrations (version, filename) VALUES ($1, $2)',
        [version, file]
      );
      await client.query('COMMIT');
      migrationsRan++;
      console.log(`  ✓ ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      // If it's a duplicate version conflict (two V008s, two V009s), try the other
      if (err.message.includes('duplicate key')) {
        console.log(`  ⚠ ${file} (version already tracked, skipping)`);
        skipped++;
        continue;
      }
      console.error(`  ✗ ${file}: ${err.message}`);
      // Continue with remaining migrations instead of failing hard
      console.error(`    Continuing with remaining migrations...`);
    }
  }

  console.log(`\nMigrations complete: ${migrationsRan} applied, ${skipped} skipped.\n`);

  // --- Step 4: Run seed data ---
  const seedArg = process.argv.includes('--seed');
  if (seedArg) {
    console.log('=== Step 4: Loading seed data ===');
    const seedFile = path.join(__dirname, '..', 'database', 'seeds', 'dev_seed_data.sql');
    if (fs.existsSync(seedFile)) {
      let seedSQL = fs.readFileSync(seedFile, 'utf8');
      seedSQL = seedSQL.replace(/\\c\s+\w+/g, '');
      seedSQL = `SET search_path TO app, public;\n${seedSQL}`;
      try {
        await client.query(seedSQL);
        console.log('  ✓ Seed data loaded successfully.\n');
      } catch (err) {
        console.error(`  ✗ Seed data error: ${err.message}`);
        console.error('    This is normal if seed data already exists (duplicate key).\n');
      }
    }
  } else {
    console.log('Skipping seed data. Add --seed flag to load dev seed data.\n');
  }

  // --- Step 5: Verify ---
  console.log('=== Verification ===');
  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'app' 
    ORDER BY table_name
  `);
  console.log(`Tables in 'app' schema: ${tables.rows.length}`);
  tables.rows.forEach(r => console.log(`  - ${r.table_name}`));

  await client.end();
  console.log('\nDone! Database is ready for deployment.');
}

run().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
