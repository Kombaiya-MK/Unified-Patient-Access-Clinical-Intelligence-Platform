/**
 * Simple Migration Runner for Login Screen
 * Creates essential tables: users, patient_profiles, departments
 */

const { Pool } = require('pg');

async function setupLoginTables() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Login Screen Database Setup                              ║');
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
    console.log('✓ Connected to database');
    console.log('');

    // Create app schema
    console.log('[1/6] Creating app schema...');
    await client.query('CREATE SCHEMA IF NOT EXISTS app');
    await client.query('SET search_path TO app, public');
    console.log('✓ Schema created');

    // Create users table
    console.log('[2/6] Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS app.users (
        id BIGSERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'staff', 'admin')),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone_number VARCHAR(20),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        is_verified BOOLEAN NOT NULL DEFAULT FALSE,
        verification_token VARCHAR(255),
        reset_password_token VARCHAR(255),
        reset_password_expires TIMESTAMPTZ,
        last_login_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Users table created');

    // Create departments table
    console.log('[3/6] Creating departments table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS app.departments (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) NOT NULL UNIQUE,
        description TEXT,
        location VARCHAR(255),
        phone_number VARCHAR(20),
        email VARCHAR(255),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Departments table created');

    // Create patient_profiles table
    console.log('[4/6] Creating patient_profiles table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS app.patient_profiles (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL UNIQUE,
        medical_record_number VARCHAR(50) NOT NULL UNIQUE,
        date_of_birth DATE NOT NULL,
        gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
        blood_type VARCHAR(5) CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
        address_line1 VARCHAR(255),
        address_line2 VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(100),
        postal_code VARCHAR(20),
        country VARCHAR(100),
        emergency_contact_name VARCHAR(200),
        emergency_contact_phone VARCHAR(20),
        emergency_contact_relationship VARCHAR(50),
        insurance_provider VARCHAR(200),
        insurance_policy_number VARCHAR(100),
        primary_physician_id BIGINT,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES app.users(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Patient profiles table created');

    // Create audit_logs table
    console.log('[5/6] Creating audit_logs table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS app.audit_logs (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT,
        action VARCHAR(50) NOT NULL,
        table_name VARCHAR(100) NOT NULL,
        record_id BIGINT,
        old_values JSONB,
        new_values JSONB,
        ip_address INET,
        user_agent TEXT,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Audit logs table created');

    // Create update trigger function
    console.log('[6/6] Creating update triggers...');
    await client.query(`
      CREATE OR REPLACE FUNCTION app.update_updated_at_column()
      RETURNS TRIGGER AS $func$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $func$ LANGUAGE plpgsql
    `);

    // Create triggers for each table
    const tables = ['users', 'departments', 'patient_profiles'];
    for (const table of tables) {
      await client.query(`
        DROP TRIGGER IF EXISTS update_${table}_updated_at ON app.${table}
      `);
      await client.query(`
        CREATE TRIGGER update_${table}_updated_at
        BEFORE UPDATE ON app.${table}
        FOR EACH ROW
        EXECUTE FUNCTION app.update_updated_at_column()
      `);
    }
    console.log('✓ Update triggers created');
    console.log('');

    // Verify tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'app' 
      ORDER BY table_name
    `);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('  Setup Complete!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('Tables created:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    console.log('');

    // Check if we have test users
    const userCount = await client.query('SELECT COUNT(*) FROM app.users');
    console.log(`Current users in database: ${userCount.rows[0].count}`);
    
    if (userCount.rows[0].count === '0') {
      console.log('');
      console.log('Next steps:');
      console.log('  1. Create test user: node create-test-user.js');
      console.log('  2. Start server: npm run dev');
      console.log('  3. Test login screen');
    }
    console.log('');

    client.release();
    
  } catch (error) {
    console.error('✗ Setup failed!');
    console.error('Error:', error.message);
    if (error.detail) {
      console.error('Detail:', error.detail);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupLoginTables();
