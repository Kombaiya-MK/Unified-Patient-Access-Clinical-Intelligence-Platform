const path = require('path');
const { Pool } = require(path.join(__dirname, 'server', 'node_modules', 'pg'));
require(path.join(__dirname, 'server', 'node_modules', 'dotenv')).config({ path: path.join(__dirname, 'server', '.env') });

const bcrypt = require(path.join(__dirname, 'server', 'node_modules', 'bcrypt'));

async function fixPasswords() {
  const pool = new Pool({ connectionString: process.env.DB_URL, ssl: { rejectUnauthorized: false } });

  try {
    const hash = await bcrypt.hash('Admin123!', 10);
    console.log('Generated hash for Admin123!');

    const result = await pool.query('UPDATE app.users SET password_hash = $1', [hash]);
    console.log(`Updated ${result.rowCount} users with valid password hash`);

    // Verify
    const users = await pool.query('SELECT email, role FROM app.users ORDER BY role, email');
    console.log('\nSeeded users (all use password: Admin123!):');
    users.rows.forEach(u => console.log(`  ${u.email} (${u.role})`));

    // Test bcrypt verify
    const check = await pool.query('SELECT password_hash FROM app.users LIMIT 1');
    const valid = await bcrypt.compare('Admin123!', check.rows[0].password_hash);
    console.log(`\nPassword verification test: ${valid ? 'PASS' : 'FAIL'}`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

fixPasswords();
