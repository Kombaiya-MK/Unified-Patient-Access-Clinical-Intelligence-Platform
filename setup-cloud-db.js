/**
 * Cloud Database Setup Script
 * Initializes schemas, extensions, and runs all migrations on Neon/cloud PostgreSQL.
 * Reads connection from server/.env
 */

const fs = require('fs');
const path = require('path');

// Load dependencies from server/node_modules
const serverModules = path.join(__dirname, 'server', 'node_modules');
const { Pool } = require(path.join(serverModules, 'pg'));
require(path.join(serverModules, 'dotenv')).config({ path: path.join(__dirname, 'server', '.env') });

/**
 * Strip top-level BEGIN/COMMIT/ROLLBACK only when they are outside $$ dollar-quoted blocks.
 */
function stripTransactionWrappers(sql) {
  const lines = sql.split('\n');
  let insideDollarQuote = false;
  const result = [];

  for (const line of lines) {
    // Count $$ occurrences on this line to track enter/exit of dollar-quoting
    const matches = line.match(/\$\$/g);
    if (matches) {
      for (let i = 0; i < matches.length; i++) {
        insideDollarQuote = !insideDollarQuote;
      }
    }

    // Only strip transaction keywords when outside dollar-quoted blocks
    if (!insideDollarQuote) {
      const trimmed = line.trim().toUpperCase();
      if (trimmed === 'BEGIN;' || trimmed === 'BEGIN' || trimmed === 'COMMIT;' || trimmed === 'COMMIT' || trimmed === 'ROLLBACK;' || trimmed === 'ROLLBACK') {
        result.push('');
        continue;
      }
    }

    result.push(line);
  }

  return result.join('\n');
}

async function setup() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   UPACI Cloud Database Setup                              ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  const dbUrl = process.env.DB_URL;
  if (!dbUrl) {
    console.error('✗ DB_URL not found in server/.env');
    process.exit(1);
  }

  console.log(`[INFO] Connecting to: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`);

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  let client;
  try {
    client = await pool.connect();
    const versionResult = await client.query('SELECT version()');
    console.log(`✓ Connected: ${versionResult.rows[0].version.split(',')[0]}`);
    console.log('');

    // ── Step 1: Extensions ──────────────────────────────────────────
    console.log('── Extensions ─────────────────────────────────────────────');
    const extensions = ['uuid-ossp', 'pgcrypto'];

    // Check if pgvector is available on this host
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');
      extensions.push('vector');
      console.log('✓ pgvector enabled');
    } catch {
      console.log('⚠ pgvector not available — AI vector features will be disabled');
    }

    for (const ext of extensions.filter(e => e !== 'vector')) {
      try {
        await client.query(`CREATE EXTENSION IF NOT EXISTS "${ext}"`);
        console.log(`✓ ${ext} enabled`);
      } catch (err) {
        console.log(`⚠ ${ext}: ${err.message}`);
      }
    }
    console.log('');

    // ── Step 2: Schemas ─────────────────────────────────────────────
    console.log('── Schemas ────────────────────────────────────────────────');
    for (const schema of ['app', 'ai', 'audit']) {
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
      console.log(`✓ Schema "${schema}" ready`);
    }
    console.log('');

    // ── Step 3: Migrations ──────────────────────────────────────────
    console.log('── Migrations ─────────────────────────────────────────────');
    const migrationsDir = path.join(__dirname, 'database', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => /^V\d+__.+\.sql$/.test(f))
      .sort((a, b) => {
        const numA = parseInt(a.match(/^V(\d+)/)[1], 10);
        const numB = parseInt(b.match(/^V(\d+)/)[1], 10);
        return numA - numB;
      });

    console.log(`[INFO] Found ${files.length} migration files`);
    console.log('');

    // Check pgvector availability for skipping vector migrations
    const vectorCheck = await client.query(
      "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector') as has_vector"
    );
    const hasVector = vectorCheck.rows[0].has_vector;

    let success = 0;
    let skipped = 0;
    let failed = 0;

    for (const file of files) {
      const name = file.replace(/^V\d+__/, '').replace(/\.sql$/, '').replace(/_/g, ' ');
      process.stdout.write(`  ${file} ... `);

      const filePath = path.join(migrationsDir, file);
      let sql = fs.readFileSync(filePath, 'utf8');

      // Strip only psql meta-commands (\c, \echo, etc.) — NOT PL/pgSQL
      sql = sql.replace(/^\\[a-zA-Z].*$/gm, '');

      // Strip only top-level transaction wrappers (outside $$ blocks)
      sql = stripTransactionWrappers(sql);

      const requiresVector = sql.includes('vector(') || file.toLowerCase().includes('vector');
      if (requiresVector && !hasVector) {
        console.log('SKIPPED (needs pgvector)');
        skipped++;
        continue;
      }

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log('OK');
        success++;
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        if (err.code === '42P07' || err.code === '42710' || err.message.includes('already exists')) {
          console.log('OK (already applied)');
          success++;
        } else {
          console.log(`FAILED: ${err.message.split('\n')[0]}`);
          failed++;
        }
      }
    }

    // ── Step 4: Seed data check ─────────────────────────────────────
    console.log('');
    console.log('── Seed Data ──────────────────────────────────────────────');
    const seedsDir = path.join(__dirname, 'database', 'seeds');
    if (fs.existsSync(seedsDir)) {
      const seedFiles = fs.readdirSync(seedsDir).filter(f => f.endsWith('.sql')).sort();
      if (seedFiles.length > 0) {
        for (const file of seedFiles) {
          process.stdout.write(`  ${file} ... `);
          let sql = fs.readFileSync(path.join(seedsDir, file), 'utf8');
          sql = sql.replace(/^\\[a-zA-Z].*$/gm, '');
          sql = stripTransactionWrappers(sql);
          try {
            await client.query('BEGIN');
            await client.query(sql);
            await client.query('COMMIT');
            console.log('OK');
          } catch (err) {
            await client.query('ROLLBACK').catch(() => {});
            if (err.message.includes('already exists') || err.message.includes('duplicate key')) {
              console.log('OK (already seeded)');
            } else {
              console.log(`FAILED: ${err.message.split('\n')[0]}`);
            }
          }
        }
      } else {
        console.log('  No seed files found');
      }
    } else {
      console.log('  No seeds directory');
    }

    // ── Step 5: Views ───────────────────────────────────────────────
    const viewsDir = path.join(__dirname, 'database', 'views');
    if (fs.existsSync(viewsDir)) {
      const viewFiles = fs.readdirSync(viewsDir).filter(f => f.endsWith('.sql')).sort();
      if (viewFiles.length > 0) {
        console.log('');
        console.log('── Views ──────────────────────────────────────────────────');
        for (const file of viewFiles) {
          process.stdout.write(`  ${file} ... `);
          let sql = fs.readFileSync(path.join(viewsDir, file), 'utf8');
          sql = sql.replace(/^\\[a-zA-Z].*$/gm, '');
          try {
            await client.query(sql);
            console.log('OK');
          } catch (err) {
            console.log(`FAILED: ${err.message.split('\n')[0]}`);
          }
        }
      }
    }

    // ── Summary ─────────────────────────────────────────────────────
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  Summary');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Migrations: ${success} OK, ${skipped} skipped, ${failed} failed`);

    // Quick table count
    const tableCount = await client.query(
      "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'app'"
    );
    console.log(`  Tables in "app" schema: ${tableCount.rows[0].count}`);
    console.log('');

    if (failed > 0) {
      console.log('⚠ Some migrations failed. Review errors above.');
    } else {
      console.log('✓ Database setup complete!');
    }
    console.log('');

  } catch (err) {
    console.error('');
    console.error(`✗ Fatal error: ${err.message}`);
    process.exit(1);
  } finally {
    if (client) { client.release(); }
    await pool.end();
  }
}

setup();
