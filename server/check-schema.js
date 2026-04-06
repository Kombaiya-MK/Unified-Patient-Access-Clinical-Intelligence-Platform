require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    const tables = ['appointments', 'users', 'departments', 'time_slots'];
    for (const t of tables) {
      const r = await pool.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='app' AND table_name=$1 ORDER BY ordinal_position",
        [t]
      );
      console.log(`\n${t}:`);
      r.rows.forEach(x => console.log(`  ${x.column_name} (${x.data_type})`));
    }
  } catch (e) {
    console.error(e.message);
  } finally {
    pool.end();
  }
})();
