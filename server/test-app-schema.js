/**
 * Test Database Connection with App Schema
 */

const { Pool } = require('pg');

async function testAppSchema() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Test Database Connection with App Schema                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'upaci',
    user: 'postgres',
    password: 'admin',
    options: '-c search_path=app,public',
  });

  try {
    const client = await pool.connect();
    console.log('✓ Connected to database with app schema search path');
    console.log('');

    // Test 1: Check current search path
    const searchPathResult = await client.query('SHOW search_path');
    console.log('Current search_path:', searchPathResult.rows[0].search_path);
    console.log('');

    // Test 2: Query users table (should find app.users)
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    console.log('Users table query result:');
    console.log(`  ✓ Found ${userCount.rows[0].count} users`);
    console.log('');

    // Test 3: Query specific user
    const testUser = await client.query(`
      SELECT id, email, role, first_name, last_name, is_active
      FROM users
      WHERE email = 'doctor@test.com'
    `);
    
    if (testUser.rows.length > 0) {
      console.log('Test user query:');
      console.log(`  ✓ Found user: ${testUser.rows[0].email}`);
      console.log(`    - ID: ${testUser.rows[0].id}`);
      console.log(`    - Role: ${testUser.rows[0].role}`);
      console.log(`    - Name: ${testUser.rows[0].first_name} ${testUser.rows[0].last_name}`);
      console.log(`    - Active: ${testUser.rows[0].is_active}`);
    }
    console.log('');

    // Test 4: List all tables accessible
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'app' 
      ORDER BY table_name
    `);
    console.log('Tables in app schema:');
    tables.rows.forEach(row => {
      console.log(`  • ${row.table_name}`);
    });
    console.log('');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('  ✓ Schema Configuration Correct!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('The server should now be able to find users for login.');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Restart server: npm run dev');
    console.log('  2. Try logging in with: doctor@test.com / Doctor123!');
    console.log('');

    client.release();
    
  } catch (error) {
    console.error('✗ Test failed!');
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testAppSchema();
