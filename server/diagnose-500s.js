/**
 * Diagnostic script to identify root causes of remaining 500 errors
 * by running the actual SQL queries directly.
 */
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_aqI9Rick0AVP@ep-billowing-hill-an21ayo9-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function diagnose() {
  const client = await pool.connect();
  try {
    await client.query('SET search_path TO app, public');

    // --- Diagnose 1: Queue today query ---
    console.log('\n=== DIAGNOSE 1: Queue Today ===');
    try {
      const queueQuery = `
        SELECT
          a.id,
          a.patient_id,
          CONCAT(pu.first_name, ' ', pu.last_name) AS patient_name,
          a.appointment_date AS appointment_time,
          a.status,
          CONCAT(du.first_name, ' ', du.last_name) AS provider_name,
          a.doctor_id AS provider_id,
          d.name AS department_name,
          a.department_id,
          a.appointment_type,
          a.duration_minutes,
          a.version,
          a.arrived_at,
          a.started_at,
          a.completed_at,
          a.checked_in_at,
          a.created_at
        FROM appointments a
        LEFT JOIN users pu ON a.patient_id = pu.id
        LEFT JOIN users du ON a.doctor_id = du.id
        LEFT JOIN departments d ON a.department_id = d.id
        WHERE a.appointment_date::date = CURRENT_DATE
          AND a.status NOT IN ('cancelled', 'rescheduled')
        ORDER BY a.appointment_date ASC
        LIMIT 5
      `;
      const result = await client.query(queueQuery);
      console.log('SUCCESS - rows:', result.rowCount);
      if (result.rows[0]) console.log('Sample row:', JSON.stringify(result.rows[0], null, 2));
    } catch (err) {
      console.log('FAILED:', err.message);
    }

    // Check if appointments columns exist
    console.log('\n=== Check appointments columns ===');
    try {
      const cols = await client.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'app' AND table_name = 'appointments'
        ORDER BY ordinal_position
      `);
      console.log('Appointments columns:', cols.rows.map(r => r.column_name).join(', '));
    } catch (err) {
      console.log('FAILED:', err.message);
    }

    // --- Diagnose 2: Check patient_profiles for id=1 ---
    console.log('\n=== DIAGNOSE 2: Patient profiles for patient 1 ===');
    try {
      const profileResult = await client.query('SELECT * FROM patient_profiles WHERE id = 1');
      console.log('Profile rows:', profileResult.rowCount);
      if (profileResult.rows[0]) {
        console.log('Profile columns:', Object.keys(profileResult.rows[0]).join(', '));
      }
    } catch (err) {
      console.log('FAILED:', err.message);
    }

    // Check patient_profiles by user_id
    try {
      const profileByUser = await client.query('SELECT id, user_id, first_name, last_name FROM patient_profiles WHERE user_id = 1');
      console.log('Profile by user_id=1:', profileByUser.rowCount, 'rows');
      if (profileByUser.rows[0]) console.log('  Data:', JSON.stringify(profileByUser.rows[0]));
    } catch (err) {
      console.log('Profile by user_id FAILED:', err.message);
    }

    // List all patient profiles
    try {
      const allProfiles = await client.query('SELECT id, user_id, first_name, last_name FROM patient_profiles LIMIT 5');
      console.log('All profiles (first 5):');
      allProfiles.rows.forEach(r => console.log(`  id=${r.id}, user_id=${r.user_id}, name=${r.first_name} ${r.last_name}`));
    } catch (err) {
      console.log('All profiles FAILED:', err.message);
    }

    // --- Diagnose 3: profile_versions table ---
    console.log('\n=== DIAGNOSE 3: profile_versions table ===');
    try {
      const pvCols = await client.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'app' AND table_name = 'profile_versions'
        ORDER BY ordinal_position
      `);
      console.log('profile_versions columns:', pvCols.rows.map(r => r.column_name).join(', '));
    } catch (err) {
      console.log('FAILED:', err.message);
    }

    // --- Diagnose 4: profileAggregationService queries ---
    console.log('\n=== DIAGNOSE 4: Profile aggregation query ===');
    try {
      // Check what profileGenerationService.generateProfile does
      const genQuery = `
        SELECT * FROM patient_profiles WHERE id = $1
      `;
      const genRes = await client.query(genQuery, [1]);
      console.log('generateProfile (id=1):', genRes.rowCount, 'rows');
      if (genRes.rowCount === 0) {
        console.log('  >>> NO PROFILE WITH id=1 - this causes "Patient profile not found" error');
      }
    } catch (err) {
      console.log('FAILED:', err.message);
    }

    // --- Diagnose 5: Check patient_profiles columns ---
    console.log('\n=== DIAGNOSE 5: patient_profiles columns ===');
    try {
      const ppCols = await client.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'app' AND table_name = 'patient_profiles'
        ORDER BY ordinal_position
      `);
      console.log('patient_profiles columns:', ppCols.rows.map(r => r.column_name).join(', '));
    } catch (err) {
      console.log('FAILED:', err.message);
    }

    // --- Diagnose 6: Check medication_conflicts table ---
    console.log('\n=== DIAGNOSE 6: medication_conflicts columns ===');
    try {
      const mcCols = await client.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'app' AND table_name = 'medication_conflicts'
        ORDER BY ordinal_position
      `);
      console.log('medication_conflicts columns:', mcCols.rows.map(r => r.column_name).join(', '));
    } catch (err) {
      console.log('FAILED:', err.message);
    }

    // --- Diagnose 7: Check medications table ---
    console.log('\n=== DIAGNOSE 7: medications table ===');
    try {
      const medCols = await client.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'app' AND table_name = 'medications'
        ORDER BY ordinal_position
      `);
      console.log('medications columns:', medCols.rows.map(r => r.column_name).join(', '));
      const medCount = await client.query('SELECT count(*) FROM medications');
      console.log('medications count:', medCount.rows[0].count);
    } catch (err) {
      console.log('FAILED:', err.message);
    }

    // --- Diagnose 8: Test conflictCheckController SQL ---
    console.log('\n=== DIAGNOSE 8: Conflict check controller SQL (patient 1) ===');
    try {
      const ccQuery = `SELECT * FROM patient_profiles WHERE id = $1`;
      const ccRes = await client.query(ccQuery, [1]);
      console.log('patient_profiles WHERE id=1:', ccRes.rowCount, 'rows');
    } catch (err) {
      console.log('FAILED:', err.message);
    }

    // Check medications for patient
    try {
      const medQuery = `SELECT * FROM medications WHERE patient_id = $1 AND status = 'active'`;
      const medRes = await client.query(medQuery, [1]);
      console.log('medications for patient_id=1:', medRes.rowCount, 'rows');
    } catch (err) {
      console.log('FAILED:', err.message);
    }

    // --- Diagnose 9: Users table ---
    console.log('\n=== DIAGNOSE 9: Users table (first 5) ===');
    try {
      const usersRes = await client.query('SELECT id, email, role, first_name, last_name FROM users LIMIT 5');
      usersRes.rows.forEach(r => console.log(`  id=${r.id}, email=${r.email}, role=${r.role}, name=${r.first_name} ${r.last_name}`));
    } catch (err) {
      console.log('FAILED:', err.message);
    }

    // --- Diagnose 10: Check departments table ---
    console.log('\n=== DIAGNOSE 10: departments table ===');
    try {
      const deptRes = await client.query('SELECT * FROM departments LIMIT 5');
      console.log('departments count:', deptRes.rowCount);
      if (deptRes.rows[0]) console.log('Sample:', JSON.stringify(deptRes.rows[0]));
    } catch (err) {
      console.log('FAILED:', err.message);
    }

    // --- Diagnose 11: Check clinical_documents ---
    console.log('\n=== DIAGNOSE 11: clinical_documents ===');
    try {
      const cdCols = await client.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'app' AND table_name = 'clinical_documents'
        ORDER BY ordinal_position
      `);
      console.log('clinical_documents columns:', cdCols.rows.map(r => r.column_name).join(', '));
      const cdCount = await client.query('SELECT count(*) FROM clinical_documents');
      console.log('clinical_documents count:', cdCount.rows[0].count);
    } catch (err) {
      console.log('FAILED:', err.message);
    }

    // --- Diagnose 12: Check profile_conflicts ---
    console.log('\n=== DIAGNOSE 12: profile_conflicts ===');
    try {
      const pcCols = await client.query(`
        SELECT column_name FROM information_schema.columns  
        WHERE table_schema = 'app' AND table_name = 'profile_conflicts'
        ORDER BY ordinal_position
      `);
      console.log('profile_conflicts columns:', pcCols.rows.map(r => r.column_name).join(', '));
    } catch (err) {
      console.log('FAILED:', err.message);
    }

    // --- Diagnose 13: Simulate full profileGeneration for patient 1 ---
    console.log('\n=== DIAGNOSE 13: Simulate profileGenerationService.generateProfile(1) ===');
    try {
      // Step 1: get profile
      const profileRes = await client.query('SELECT * FROM patient_profiles WHERE id = $1', [1]);
      if (profileRes.rowCount === 0) {
        console.log('STOP: No patient_profiles row with id=1');
        // Check what IDs exist
        const existingIds = await client.query('SELECT id, user_id FROM patient_profiles ORDER BY id LIMIT 10');
        console.log('Existing profile IDs:');
        existingIds.rows.forEach(r => console.log(`  profile_id=${r.id}, user_id=${r.user_id}`));
      } else {
        console.log('Profile found for id=1');
        
        // Step 2: clinical_documents for patient
        const docsRes = await client.query(`
          SELECT id AS document_id, COALESCE(original_filename, title) AS original_filename,
                 COALESCE(upload_date, created_at) AS upload_date
          FROM clinical_documents WHERE patient_id = $1
        `, [1]);
        console.log('Documents for patient 1:', docsRes.rowCount);
        
        // Step 3: appointments
        const apptRes = await client.query(`
          SELECT a.id AS appointment_id, a.appointment_date, a.appointment_type, a.status,
                 CONCAT(u.first_name, ' ', u.last_name) AS provider_name
          FROM appointments a
          LEFT JOIN users u ON a.doctor_id = u.id
          WHERE a.patient_id = $1
          ORDER BY a.appointment_date DESC
          LIMIT 10
        `, [1]);
        console.log('Appointments for patient 1:', apptRes.rowCount);

        // Step 4: medications
        const medRes = await client.query('SELECT * FROM medications WHERE patient_id = $1', [1]);
        console.log('Medications for patient 1:', medRes.rowCount);

        // Step 5: allergies
        const allergyRes = await client.query('SELECT * FROM allergies WHERE patient_id = $1', [1]);
        console.log('Allergies for patient 1:', allergyRes.rowCount);

        // Step 6: profile_conflicts
        const conflictsRes = await client.query(`SELECT * FROM profile_conflicts WHERE patient_id = $1 AND status = 'active'`, [1]);
        console.log('Profile conflicts for patient 1:', conflictsRes.rowCount);
      }
    } catch (err) {
      console.log('FAILED at step:', err.message);
    }

  } finally {
    client.release();
    await pool.end();
  }
}

diagnose().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
