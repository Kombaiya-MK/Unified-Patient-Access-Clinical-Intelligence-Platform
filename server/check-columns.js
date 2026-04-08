require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    const r1 = await p.query("SELECT column_name FROM information_schema.columns WHERE table_schema='app' AND table_name='appointments' ORDER BY ordinal_position");
    process.stdout.write('APPOINTMENTS: ' + r1.rows.map(x => x.column_name).join(', ') + '\n');

    const r2 = await p.query("SELECT column_name FROM information_schema.columns WHERE table_schema='app' AND table_name='waitlist' ORDER BY ordinal_position");
    process.stdout.write('WAITLIST: ' + r2.rows.map(x => x.column_name).join(', ') + '\n');
  } catch (e) {
    process.stderr.write('ERROR: ' + String(e) + '\n');
    process.stderr.write('STACK: ' + (e.stack || '') + '\n');
  } finally {
    await p.end();
    process.exit(0);
  }
})();
