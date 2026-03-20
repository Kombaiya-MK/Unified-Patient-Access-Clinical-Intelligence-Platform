/**
 * Create Test Users for Login Screen Testing
 * Creates users with different roles: patient, doctor, staff, admin
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function createTestUsers() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Create Test Users                                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

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

    // Test users to create
    const testUsers = [
      {
        email: 'patient@test.com',
        password: 'Patient123!',
        role: 'patient',
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '+1-555-0101'
      },
      {
        email: 'doctor@test.com',
        password: 'Doctor123!',
        role: 'doctor',
        first_name: 'Dr. Sarah',
        last_name: 'Smith',
        phone_number: '+1-555-0102'
      },
      {
        email: 'staff@test.com',
        password: 'Staff123!',
        role: 'staff',
        first_name: 'Emily',
        last_name: 'Johnson',
        phone_number: '+1-555-0103'
      },
      {
        email: 'admin@test.com',
        password: 'Admin123!',
        role: 'admin',
        first_name: 'Admin',
        last_name: 'User',
        phone_number: '+1-555-0104'
      }
    ];

    console.log('Creating test users...');
    console.log('');

    let created = 0;
    let skipped = 0;

    for (const user of testUsers) {
      try {
        // Check if user already exists
        const existing = await client.query(
          'SELECT id FROM app.users WHERE email = $1',
          [user.email]
        );

        if (existing.rows.length > 0) {
          console.log(`⚠ User ${user.email} already exists (skipping)`);
          skipped++;
          continue;
        }

        // Hash password
        const password_hash = await bcrypt.hash(user.password, 10);

        // Insert user
        const result = await client.query(`
          INSERT INTO app.users (
            email, password_hash, role, first_name, last_name, 
            phone_number, is_active, is_verified
          )
          VALUES ($1, $2, $3, $4, $5, $6, true, true)
          RETURNING id, email, role
        `, [
          user.email,
          password_hash,
          user.role,
          user.first_name,
          user.last_name,
          user.phone_number
        ]);

        const userId = result.rows[0].id;
        console.log(`✓ Created ${user.role}: ${user.email}`);

        // Create patient profile if role is patient
        if (user.role === 'patient') {
          const mrn = `MRN${String(userId).padStart(6, '0')}`;
          await client.query(`
            INSERT INTO app.patient_profiles (
              user_id, medical_record_number, date_of_birth, 
              gender, city, country
            )
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            userId,
            mrn,
            '1990-01-15',
            'male',
            'New York',
            'USA'
          ]);
          console.log(`  → Patient profile created (MRN: ${mrn})`);
        }

        created++;
        
      } catch (error) {
        console.error(`✗ Failed to create ${user.email}: ${error.message}`);
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  Summary');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Created: ${created} users`);
    console.log(`  Skipped: ${skipped} users (already exist)`);
    console.log('');

    if (created > 0) {
      console.log('Test Login Credentials:');
      console.log('─────────────────────────────────────────────────────────');
      testUsers.forEach(user => {
        console.log(`  ${user.role.toUpperCase()}`);
        console.log(`    Email: ${user.email}`);
        console.log(`    Password: ${user.password}`);
        console.log('');
      });
      console.log('─────────────────────────────────────────────────────────');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Start server: cd server && npm run dev');
      console.log('  2. Start frontend: cd app && npm run dev');
      console.log('  3. Open http://localhost:3000 and login');
      console.log('');
    }

    client.release();
    
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createTestUsers();
