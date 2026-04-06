const path = require('path');
const { Pool } = require(path.join(__dirname, 'server', 'node_modules', 'pg'));
require(path.join(__dirname, 'server', 'node_modules', 'dotenv')).config({ path: path.join(__dirname, 'server', '.env') });

const pool = new Pool({ connectionString: process.env.DB_URL, ssl: { rejectUnauthorized: false } });

pool.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('app','ai','audit') ORDER BY table_schema, table_name")
  .then(r => {
    console.log('Tables found:');
    r.rows.forEach(x => console.log(`  ${x.table_schema}.${x.table_name}`));
    console.log(`\nTotal: ${r.rows.length}`);
    return pool.end();
  })
  .catch(e => { console.error(e.message); pool.end(); });
