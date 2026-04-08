const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function resetPatient() {
  const hash = await bcrypt.hash('Patient123!', 10);
  await pool.query("UPDATE app.users SET password_hash = $1 WHERE email = 'patient1@example.com'", [hash]);
  console.log('Patient password reset to Patient123!');
  await pool.end();
}

resetPatient().catch(e => { console.error(e); pool.end(); });
