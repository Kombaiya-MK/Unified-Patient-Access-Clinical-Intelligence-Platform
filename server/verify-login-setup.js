/**
 * Verify Login Database Setup
 */

const { Pool } = require('pg');

async function verifySetup() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Login Database Verification                              ║');
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
    const client = await pool.connect();

    // Check app schema tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'app' 
      ORDER BY table_name
    `);

    console.log('Database Tables (app schema):');
    console.log('─────────────────────────────────────────────────────────');
    if (tables.rows.length === 0) {
      console.log('  ✗ No tables found');
    } else {
      tables.rows.forEach(row => {
        console.log(`  ✓ ${row.table_name}`);
      });
    }
    console.log('');

    // Check for login-essential tables
    const essentialTables = ['users', 'patient_profiles', 'departments'];
    const existingTables = tables.rows.map(r => r.table_name);
    
    console.log('Login Requirements:');
    console.log('─────────────────────────────────────────────────────────');
    const allPresent = essentialTables.every(table => {
      const present = existingTables.includes(table);
      console.log(`  ${present ? '✓' : '✗'} ${table} table`);
      return present;
    });
    console.log('');

    // Check users
    const userCount = await client.query('SELECT COUNT(*) FROM app.users');
    const users = await client.query(`
      SELECT role, COUNT(*) as count 
      FROM app.users 
      GROUP BY role 
      ORDER BY role
    `);

    console.log('User Accounts:');
    console.log('─────────────────────────────────────────────────────────');
    console.log(`  Total: ${userCount.rows[0].count} users`);
    if (users.rows.length > 0) {
      users.rows.forEach(row => {
        console.log(`    • ${row.role}: ${row.count}`);
      });
    }
    console.log('');

    // Check patient profiles
    const patientCount = await client.query('SELECT COUNT(*) FROM app.patient_profiles');
    console.log(`  Patient Profiles: ${patientCount.rows[0].count}`);
    console.log('');

    // Final status
    console.log('═══════════════════════════════════════════════════════════');
    if (allPresent && parseInt(userCount.rows[0].count) > 0) {
      console.log('  ✓ DATABASE READY FOR LOGIN!');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');
      console.log('You can now:');
      console.log('  1. Start backend: cd server && npm run dev');
      console.log('  2. Start frontend: cd app && npm run dev');
      console.log('  3. Login with:');
      console.log('     • patient@test.com / Patient123!');
      console.log('     • doctor@test.com / Doctor123!');
      console.log('     • staff@test.com / Staff123!');
      console.log('     • admin@test.com / Admin123!');
    } else {
      console.log('  ✗ Setup incomplete');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');
      if (!allPresent) {
        console.log('  Missing tables. Run: node setup-login-tables.js');
      }
      if (parseInt(userCount.rows[0].count) === 0) {
        console.log('  No users. Run: node create-test-user.js');
      }
    }
    console.log('');

    client.release();
    
  } catch (error) {
    console.error('✗ Verification failed!');
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifySetup();
