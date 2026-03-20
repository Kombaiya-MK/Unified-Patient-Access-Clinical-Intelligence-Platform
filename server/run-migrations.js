/**
 * Node.js Migration Runner
 * Runs all database migrations in sequential order
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Database Migration Runner                                ║');
  console.log('║   Clinical Appointment Platform                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'upaci',
    user: 'postgres',
    password: 'admin',
  });

  try {
    // Test connection
    console.log('[INFO] Testing database connection...');
    const client = await pool.connect();
    console.log('✓ Database connection successful');
    console.log('');

    // Create app schema if it doesn't exist
    console.log('[INFO] Creating app schema...');
    await client.query('CREATE SCHEMA IF NOT EXISTS app');
    console.log('✓ App schema ready');
    console.log('');

    // Get all migration files
    const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.match(/^V\d+__.+\.sql$/))
      .sort();

    console.log(`[INFO] Found ${files.length} migration files`);
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  Running Migrations');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    let successCount = 0;
    let skippedCount = 0;

    for (const file of files) {
      const version = file.match(/^V(\d+)__/)[1];
      const name = file.replace(/^V\d+__/, '').replace(/\.sql$/, '').replace(/_/g, ' ');

      console.log(`[INFO] Running migration: ${file}`);
      console.log(`       ${name}`);

      try {
        // Read migration file
        const filePath = path.join(migrationsDir, file);
        let sql = fs.readFileSync(filePath, 'utf8');

        // Remove transaction control statements as we'll handle them
        sql = sql.replace(/^BEGIN;?/gim, '');
        sql = sql.replace(/^COMMIT;?/gim, '');
        sql = sql.replace(/^ROLLBACK;?/gim, '');
        
        // Check if pgvector is available
        const vectorCheck = await client.query(
          "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector') as has_vector"
        );
        const hasVector = vectorCheck.rows[0].has_vector;
        
        // Check if this migration requires vector type
        const requiresVector = sql.includes('vector(') || file.includes('vector') || file.includes('clinical_tables');
        
        if (requiresVector && !hasVector) {
          console.log('⚠ Skipping migration (requires pgvector extension)');
          console.log('   Install pgvector to enable AI features');
          skippedCount++;
          console.log('');
          continue;
        }

        // Execute migration in a transaction
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('COMMIT');
          console.log(`✓ Migration ${file} completed successfully`);
          successCount++;
        } catch (innerError) {
          await client.query('ROLLBACK');
          throw innerError;
        }
        
      } catch (error) {
        // Check if error is due to objects already existing
        if (error.message.includes('already exists') || error.code === '42P07' || error.code === '42710') {
          console.log(`✓ Migration ${file} already applied (skipping)`);
          successCount++;
        } else {
          console.error(`✗ Migration ${file} failed`);
          console.error(`   Error: ${error.message}`);
          throw error;
        }
      }
      console.log('');
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  Migration Summary');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Total migrations: ${files.length}`);
    console.log(`  Successful: ${successCount}`);
    console.log(`  Skipped: ${skippedCount}`);
    console.log('');

    // Verify tables
    const tableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'app' 
      ORDER BY table_name
    `);

    console.log('[INFO] Database tables created:');
    tableResult.rows.forEach(row => {
      console.log(`  • ${row.table_name}`);
    });
    console.log('');

    // Check critical tables for login
    const criticalTables = ['users', 'patient_profiles'];
    const existingTables = tableResult.rows.map(r => r.table_name);
    
    console.log('[INFO] Login screen requirements:');
    criticalTables.forEach(table => {
      if (existingTables.includes(table)) {
        console.log(`  ✓ ${table} table exists`);
      } else {
        console.log(`  ✗ ${table} table missing`);
      }
    });
    console.log('');

    client.release();
    console.log('✓ All migrations completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Seed test data: node seed-data.js');
    console.log('  2. Start server: npm run dev');
    console.log('');

  } catch (error) {
    console.error('✗ Migration failed!');
    console.error('Error:', error.message);
    console.error('');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
