const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
let out = '';

async function run() {
  const r1 = await p.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='app' AND table_name='time_slots' ORDER BY ordinal_position");
  out += 'TIME_SLOTS_SCHEMA: ' + JSON.stringify(r1.rows) + '\n';

  const r2 = await p.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='app' AND table_name='appointments' ORDER BY ordinal_position");
  out += 'APPOINTMENTS_SCHEMA: ' + JSON.stringify(r2.rows) + '\n';

  const r3 = await p.query("SELECT id, slot_date, slot_start FROM app.time_slots LIMIT 3");
  out += 'SAMPLE_SLOTS: ' + JSON.stringify(r3.rows) + '\n';

  const r4 = await p.query("SELECT id, patient_id, slot_id, status FROM app.appointments LIMIT 3");
  out += 'SAMPLE_APPOINTMENTS: ' + JSON.stringify(r4.rows) + '\n';
  
  fs.writeFileSync('schema-output.txt', out);
  await p.end();
}
run().then(() => {
  require('fs').writeFileSync('schema-output.txt', 'DONE');
}).catch(e => { console.error(e.message); p.end(); });
