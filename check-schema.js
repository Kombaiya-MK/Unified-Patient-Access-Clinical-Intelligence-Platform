const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_aqI9Rick0AVP@ep-billowing-hill-an21ayo9-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

(async () => {
  try {
    for (const table of ['appointments', 'users', 'departments']) {
      const r = await pool.query(
        `SELECT column_name, data_type FROM information_schema.columns 
         WHERE table_schema='app' AND table_name=$1 ORDER BY ordinal_position`,
        [table]
      );
      console.log(`\n${table} columns:`);
      r.rows.forEach(x => console.log(`  ${x.column_name} (${x.data_type})`));
    }
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
})();
