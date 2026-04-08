require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const res = await pool.query(
    `SELECT column_name, data_type, column_default 
     FROM information_schema.columns 
     WHERE table_schema='app' AND table_name='appointments' AND column_name='id'`
  );
  console.log('appointments.id:', JSON.stringify(res.rows[0], null, 2));
  
  // Also check what existing ids look like
  const existing = await pool.query(`SELECT id FROM app.appointments LIMIT 5`);
  console.log('Existing IDs:', existing.rows.map(r => r.id));
  
  await pool.end();
}
main().catch(e => { console.error(e); pool.end(); });
