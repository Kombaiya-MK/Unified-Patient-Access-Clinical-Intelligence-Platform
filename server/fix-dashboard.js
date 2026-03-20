/**
 * Fix Dashboard - Ensures patient data exists
 */

const { Pool } = require('pg');

async function fixDashboard() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   Fix Patient Dashboard                                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'upaci',
    user: 'postgres',
    password: 'admin',
  });

  try {
    const client = await pool.connect();
    await client.query('SET search_path TO app, public');

    const TEST_EMAIL = 'patient@test.com';

    // Check user exists
    const userResult = await client.query(
      'SELECT id, email, role, first_name, last_name, is_active FROM users WHERE email = $1',
      [TEST_EMAIL]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User not found. Please run: node create-test-user.js');
      client.release();
      await pool.end();
      return;
    }

    const user = userResult.rows[0];
    console.log(`✅ User found: ${user.first_name} ${user.last_name} (${user.email})`);
    console.log(`   ID: ${user.id}, Role: ${user.role}, Active: ${user.is_active}`);

    // Check patient profile
    const profileResult = await client.query(
      'SELECT * FROM patient_profiles WHERE user_id = $1',
      [user.id]
    );

    if (profileResult.rows.length === 0) {
      console.log('\n⚠️  Patient profile MISSING - Creating now...');
      
      const mrn = `MRN${String(user.id).padStart(6, '0')}`;
      await client.query(`
        INSERT INTO patient_profiles (
          user_id, medical_record_number, date_of_birth, 
          gender, city, country
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [user.id, mrn, '1990-01-15', 'male', 'New York', 'USA']);
      
      console.log(`✅ Patient profile created with MRN: ${mrn}`);
    } else {
      console.log(`✅ Patient profile exists with MRN: ${profileResult.rows[0].medical_record_number}`);
    }

    // Check appointments
    const appointmentsResult = await client.query(
      'SELECT id, appointment_date, appointment_type, status FROM appointments WHERE patient_id = $1 ORDER BY appointment_date DESC LIMIT 5',
      [user.id]
    );

    console.log(`\n📅 Appointments: ${appointmentsResult.rows.length} found`);
    if (appointmentsResult.rows.length > 0) {
      appointmentsResult.rows.forEach((apt, i) => {
        console.log(`   ${i + 1}. ${apt.appointment_date} - ${apt.status}`);
      });
    } else {
      console.log('   No appointments yet - user can book appointments');
    }

    // Check notifications (table may not exist yet)
    try {
      const notificationsResult = await client.query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1',
        [user.id]
      );
      console.log(`\n🔔 Notifications: ${notificationsResult.rows[0].count} found`);
    } catch (error) {
      console.log(`\n🔔 Notifications: Table not yet created (this is OK)`);
    }

    client.release();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   ✅ Dashboard Fix Complete                                ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('✅ Patient data is ready!');
    console.log('\n📝 Next Steps:');
    console.log('  1. Make sure backend server is running (npm run dev)');
    console.log('  2. Make sure frontend is running (npm run dev in app/)');
    console.log('  3. Login with: patient@test.com / Patient123!');
    console.log('  4. Dashboard should now load properly\n');

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error(error);
  } finally {
    await pool.end();
  }
}

fixDashboard().catch(error => {
  console.error(`\n❌ Fatal error: ${error.message}`);
  process.exit(1);
});
