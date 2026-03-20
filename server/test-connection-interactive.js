/**
 * Interactive PostgreSQL Connection Test
 * Allows you to enter password and test connection
 */

const { Pool } = require('pg');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║   PostgreSQL Connection Test - Interactive Mode           ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');

// Prompt for password
rl.question('Enter PostgreSQL password for user "postgres": ', async (password) => {
  console.log('');
  console.log('Testing connection...');
  console.log(`  Host: localhost`);
  console.log(`  Port: 5432`);
  console.log(`  Database: upaci`);
  console.log(`  User: postgres`);
  console.log('');

  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'upaci',
    user: 'postgres',
    password: password,
    max: 5,
    connectionTimeoutMillis: 5000,
  });

  try {
    // Test basic connection
    const client = await pool.connect();
    console.log('✓ Connected to PostgreSQL successfully!');
    console.log('');

    // Test query
    const result = await client.query('SELECT version(), current_database(), current_user');
    console.log('Database Info:');
    console.log(`  Version: ${result.rows[0].version.split(',')[0]}`);
    console.log(`  Database: ${result.rows[0].current_database}`);
    console.log(`  User: ${result.rows[0].current_user}`);
    console.log('');

    // Test pgvector extension
    const vectorCheck = await client.query(
      "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector') as has_vector"
    );
    console.log(`  pgvector extension: ${vectorCheck.rows[0].has_vector ? '✓ Installed' : '✗ Not installed'}`);

    // Get table count
    const tableCount = await client.query(
      "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'"
    );
    console.log(`  Public tables: ${tableCount.rows[0].count}`);
    console.log('');

    // Get pool stats
    console.log('Connection Pool Stats:');
    console.log(`  Total connections: ${pool.totalCount}`);
    console.log(`  Idle connections: ${pool.idleCount}`);
    console.log(`  Waiting requests: ${pool.waitingCount}`);
    console.log('');

    client.release();
    console.log('✓ Connection test completed successfully!');
    console.log('');
    console.log('─────────────────────────────────────────────────────────');
    console.log('To save this password in your .env file, update:');
    console.log(`  DB_PASSWORD=${password}`);
    console.log(`  DB_URL=postgresql://postgres:${password}@localhost:5432/upaci`);
    console.log('─────────────────────────────────────────────────────────');
    
  } catch (error) {
    console.log('✗ Connection failed!');
    console.log('');
    console.log(`Error: ${error.message}`);
    
    if (error.code === '28P01') {
      console.log('');
      console.log('The password is incorrect. Please try again.');
      console.log('');
      console.log('Common issues:');
      console.log('  • Double-check your password');
      console.log('  • Check if caps lock is on');
      console.log('  • Try the password you use in pgAdmin');
      console.log('  • Try the password used during PostgreSQL installation');
    } else if (error.code === '3D000') {
      console.log('');
      console.log('Database "upaci" does not exist.');
      console.log('Run: CREATE DATABASE upaci;');
    } else if (error.code) {
      console.log(`Error Code: ${error.code}`);
    }
    
    process.exit(1);
  } finally {
    await pool.end();
    rl.close();
  }
});

// Hide password input (for Windows, we can't easily do this without additional packages)
// The password will be visible as you type - this is a limitation of basic readline
console.log('Note: Password will be visible as you type');
console.log('');
