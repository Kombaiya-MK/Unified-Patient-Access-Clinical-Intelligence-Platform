/**
 * Simple database connection test script
 * Run with: node test-db-connection.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'upaci',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 5,
  connectionTimeoutMillis: 5000,
});

async function testConnection() {
  console.log('Testing PostgreSQL connection...');
  console.log('Configuration:');
  console.log(`  Host: ${process.env.DB_HOST}`);
  console.log(`  Port: ${process.env.DB_PORT}`);
  console.log(`  Database: ${process.env.DB_NAME}`);
  console.log(`  User: ${process.env.DB_USER}`);
  console.log('');

  try {
    // Test basic connection
    const client = await pool.connect();
    console.log('✓ Connected to PostgreSQL successfully!');

    // Test query
    const result = await client.query('SELECT version(), current_database(), current_user');
    console.log('\nDatabase Info:');
    console.log(`  Version: ${result.rows[0].version}`);
    console.log(`  Database: ${result.rows[0].current_database}`);
    console.log(`  User: ${result.rows[0].current_user}`);

    // Test pgvector extension
    const vectorCheck = await client.query(
      "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector') as has_vector"
    );
    console.log(`  pgvector extension: ${vectorCheck.rows[0].has_vector ? '✓ Installed' : '✗ Not installed'}`);

    // Get table count
    const tableCount = await client.query(
      "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'"
    );
    console.log(`  Tables: ${tableCount.rows[0].count}`);

    // Get pool stats
    console.log('\nConnection Pool Stats:');
    console.log(`  Total: ${pool.totalCount}`);
    console.log(`  Idle: ${pool.idleCount}`);
    console.log(`  Waiting: ${pool.waitingCount}`);

    client.release();
    console.log('\n✓ Connection test completed successfully!');
    
  } catch (error) {
    console.error('\n✗ Connection failed!');
    console.error('Error:', error.message);
    
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    
    console.error('\nTroubleshooting:');
    console.error('1. Check if PostgreSQL service is running');
    console.error('2. Verify credentials in .env file');
    console.error('3. Ensure database "upaci" exists');
    console.error('4. Check firewall settings');
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();
