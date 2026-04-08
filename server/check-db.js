require('dotenv').config();
const { Pool } = require('pg');
console.log('DB_HOST:', process.env.DB_HOST, 'DB_PORT:', process.env.DB_PORT, 'DB_NAME:', process.env.DB_NAME);
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
    const d = await p.query('SELECT id, name FROM app.departments LIMIT 10');
    console.log('DEPARTMENTS:', JSON.stringify(d.rows));
  } catch(e) { console.log('DEPT_ERR:', e.message); }

  try {
    const cols = await p.query("SELECT column_name FROM information_schema.columns WHERE table_schema='app' AND table_name='users' ORDER BY ordinal_position");
    console.log('USER_COLUMNS:', cols.rows.map(r => r.column_name).join(', '));
  } catch(e) { console.log('COL_ERR:', e.message); }

  try {
    const pr = await p.query("SELECT id, first_name, last_name FROM app.users LIMIT 10");
    console.log('USERS:', JSON.stringify(pr.rows));
  } catch(e) { console.log('USER_ERR:', e.message); }

  try {
    const ap = await p.query('SELECT count(*) as cnt FROM app.appointments');
    console.log('APPT_COUNT:', JSON.stringify(ap.rows));
  } catch(e) { console.log('APPT_ERR:', e.message); }

  try {
    const pp = await p.query('SELECT column_name FROM information_schema.columns WHERE table_schema=$$app$$ AND table_name=$$patient_profiles$$ ORDER BY ordinal_position');
    console.log('PP_COLUMNS:', pp.rows.map(r => r.column_name).join(', '));
  } catch(e) { console.log('PP_ERR:', e.message); }

  try {
    const pp2 = await p.query('SELECT id, user_id FROM app.patient_profiles LIMIT 10');
    console.log('PATIENT_PROFILES:', JSON.stringify(pp2.rows));
  } catch(e) { console.log('PP2_ERR:', e.message); }

  try {
    const ur = await p.query("SELECT id, email, role FROM app.users ORDER BY id");
    console.log('USER_ROLES:', JSON.stringify(ur.rows));
  } catch(e) { console.log('UR_ERR:', e.message); }

  try {
    const ap = await p.query('SELECT id, patient_id, doctor_id, department_id, status, appointment_date FROM app.appointments');
    console.log('APPOINTMENTS:', JSON.stringify(ap.rows));
  } catch(e) { console.log('APPT2_ERR:', e.message); }

  try {
    const ts = await p.query('SELECT column_name FROM information_schema.columns WHERE table_schema=$$app$$ AND table_name=$$time_slots$$ ORDER BY ordinal_position');
    console.log('TS_COLUMNS:', ts.rows.map(r => r.column_name).join(', '));
  } catch(e) { console.log('TS_ERR:', e.message); }

  try {
    const ts2 = await p.query('SELECT count(*) as cnt FROM app.time_slots');
    console.log('SLOT_COUNT:', JSON.stringify(ts2.rows));
  } catch(e) { console.log('TS2_ERR:', e.message); }

  try {
    const tables = await p.query("SELECT table_name FROM information_schema.tables WHERE table_schema='app' ORDER BY table_name");
    console.log('ALL_TABLES:', tables.rows.map(r => r.table_name).join(', '));
  } catch(e) { console.log('TABLE_ERR:', e.message); }

  await p.end();
})();
