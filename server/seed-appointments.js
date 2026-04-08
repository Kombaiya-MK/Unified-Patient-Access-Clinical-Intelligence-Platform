/**
 * Seed Appointments Data
 *
 * Run: node seed-appointments.js
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const deptRows = (await client.query('SELECT id FROM app.departments ORDER BY id')).rows;
    const doctorRows = (await client.query("SELECT id FROM app.users WHERE role='doctor' ORDER BY id")).rows;
    const ppRows = (await client.query('SELECT id, user_id FROM app.patient_profiles ORDER BY id')).rows;

    if (!deptRows.length || !doctorRows.length || !ppRows.length) {
      console.log('Missing foundation data.');
      await client.query('ROLLBACK');
      await pool.end();
      return;
    }

    const deptIds = deptRows.map(r => Number(r.id));
    const doctorIds = doctorRows.map(r => Number(r.id));
    const profiles = ppRows.map(r => ({ pid: Number(r.id), uid: Number(r.user_id) }));
    const doctorDept = {};
    doctorIds.forEach((d, i) => { doctorDept[d] = deptIds[i % deptIds.length]; });

    const today = new Date();

    // 1. Add unique constraint if missing, then batch insert slots
    console.log('Ensuring unique constraint on time_slots...');
    try {
      await client.query(`
        ALTER TABLE app.time_slots
        ADD CONSTRAINT uq_timeslot_doctor_date_start UNIQUE (doctor_id, slot_date, slot_start)
      `);
      console.log('Unique constraint added.');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('Unique constraint already exists.');
      } else {
        console.log('Constraint note:', e.message);
      }
    }

    // Build slot values
    console.log('Inserting time slots for next 7 days...');
    const slotRows = [];
    for (let dayOff = 0; dayOff <= 7; dayOff++) {
      const d = new Date(today);
      d.setDate(today.getDate() + dayOff);
      const ds = d.toISOString().slice(0, 10);

      for (const docId of doctorIds) {
        const deptId = doctorDept[docId];
        for (let h = 8; h < 17; h++) {
          for (const m of [0, 30]) {
            const st = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
            const eh = m === 30 ? h + 1 : h;
            const em2 = m === 30 ? 0 : 30;
            const en = `${String(eh).padStart(2, '0')}:${String(em2).padStart(2, '0')}:00`;
            slotRows.push({ docId, deptId, ds, st, en });
          }
        }
      }
    }

    // Batch insert in chunks of 100
    let slotsCreated = 0;
    for (let i = 0; i < slotRows.length; i += 100) {
      const chunk = slotRows.slice(i, i + 100);
      const values = [];
      const params = [];
      let pn = 1;
      for (const s of chunk) {
        values.push(`($${pn},$${pn+1},$${pn+2},$${pn+3},$${pn+4},TRUE)`);
        params.push(s.docId, s.deptId, s.ds, s.st, s.en);
        pn += 5;
      }
      const res = await client.query(
        `INSERT INTO app.time_slots (doctor_id, department_id, slot_date, slot_start, slot_end, is_available)
         VALUES ${values.join(',')}
         ON CONFLICT (doctor_id, slot_date, slot_start) DO NOTHING`,
        params
      );
      slotsCreated += res.rowCount || 0;
    }
    console.log(`Time slots created: ${slotsCreated}`);

    // 2. Seed appointments
    const types = ['consultation', 'follow_up', 'routine_checkup', 'diagnostic'];
    const appts = [];

    // Today (6 appointments)
    for (let i = 0; i < 6; i++) {
      const pp = profiles[i % profiles.length];
      const doc = doctorIds[i % doctorIds.length];
      const dt = new Date(today);
      dt.setHours(9 + i, 0, 0, 0);
      appts.push([pp.pid, doc, doctorDept[doc], dt.toISOString(), 30,
        i < 3 ? 'confirmed' : 'pending', types[i % types.length], 'General checkup']);
    }

    // Past 2 days
    for (let d = 1; d <= 2; d++) {
      for (let i = 0; i < profiles.length; i++) {
        const pp = profiles[i];
        const doc = doctorIds[i % doctorIds.length];
        const dt = new Date(today);
        dt.setDate(today.getDate() - d);
        dt.setHours(10 + i, 0, 0, 0);
        appts.push([pp.pid, doc, doctorDept[doc], dt.toISOString(), 30,
          d === 1 ? 'completed' : 'no_show', types[i % types.length], 'Follow-up visit']);
      }
    }

    // Future 3 days
    for (let d = 1; d <= 3; d++) {
      for (let i = 0; i < profiles.length; i++) {
        const pp = profiles[i];
        const doc = doctorIds[(i + d) % doctorIds.length];
        const dt = new Date(today);
        dt.setDate(today.getDate() + d);
        dt.setHours(9 + i, 30, 0, 0);
        appts.push([pp.pid, doc, doctorDept[doc], dt.toISOString(), 30,
          'confirmed', types[(i + d) % types.length], 'Scheduled appointment']);
      }
    }

    let apptsCreated = 0;
    for (const a of appts) {
      const ex = await client.query(
        `SELECT 1 FROM app.appointments WHERE patient_id=$1 AND doctor_id=$2 AND appointment_date::date=$3::date LIMIT 1`,
        [a[0], a[1], a[3]]
      );
      if (ex.rowCount > 0) continue;

      await client.query(
        `INSERT INTO app.appointments (patient_id, doctor_id, department_id, appointment_date, duration_minutes, status, appointment_type, reason_for_visit)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        a
      );
      apptsCreated++;
    }
    console.log(`Appointments created: ${apptsCreated}`);

    await client.query('COMMIT');
    console.log('Seed complete!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
