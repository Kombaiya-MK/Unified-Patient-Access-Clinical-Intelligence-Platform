/**
 * Debug Login Issue
 * Test database query directly to see what's failing
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function debugLogin() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Debug Login Issue                                        ║');
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
    console.log('✓ Database connected');
    console.log('');

    // Test 1: Check search path
    const searchPath = await client.query('SHOW search_path');
    console.log('Search path:', searchPath.rows[0].search_path);
    console.log('');

    // Test 2: Query user exactly as authService does
    const email = 'doctor@test.com';
    const password = 'Doctor123!';

    console.log('Testing login query for:', email);
    console.log('');

    const query = `
      SELECT 
        id,
        email,
        password_hash,
        role,
        first_name,
        last_name,
        is_active,
        created_at,
        updated_at
      FROM users
      WHERE email = $1
    `;

    const result = await client.query(query, [email.toLowerCase().trim()]);

    if (result.rows.length === 0) {
      console.log('✗ User not found');
    } else {
      const user = result.rows[0];
      console.log('✓ User found:');
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Name: ${user.first_name} ${user.last_name}`);
      console.log(`  Active: ${user.is_active}`);
      console.log(`  Password hash: ${user.password_hash.substring(0, 20)}...`);
      console.log('');

      // Test 3: Verify password
      console.log('Testing password verification...');
      try {
        const isValid = await bcrypt.compare(password, user.password_hash);
        console.log(`  Password valid: ${isValid}`);
        
        if (isValid) {
          console.log('');
          console.log('═══════════════════════════════════════════════════════════');
          console.log('  ✓ AUTH LOGIC IS CORRECT!');
          console.log('═══════════════════════════════════════════════════════════');
          console.log('');
          console.log('The issue must be elsewhere. Check:');
          console.log('  1. Server error logs for specific error');
          console.log('  2. Redis connection issues');
          console.log('  3. Audit logging failures');
        } else {
          console.log('');
          console.log('✗ Password does not match!');
          console.log('  The stored hash does not match the password.');
        }
      } catch (bcryptError) {
        console.log(`  ✗ Bcrypt error: ${bcryptError.message}`);
      }
    }

    client.release();
    
  } catch (error) {
    console.error('✗ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  } finally {
    await pool.end();
  }
}

debugLogin();
