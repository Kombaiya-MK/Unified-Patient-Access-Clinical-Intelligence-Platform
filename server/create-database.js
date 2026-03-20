/**
 * Create UPACI Database
 * This script creates the upaci database and installs pgvector extension
 */

const { Pool } = require('pg');

async function createDatabase() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Creating UPACI Database                                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  // Connect to default postgres database first
  const adminPool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'postgres',  // Connect to default database
    user: 'postgres',
    password: 'admin',
  });

  try {
    // Check if database already exists
    console.log('Checking if database "upaci" exists...');
    const checkDb = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = 'upaci'"
    );

    if (checkDb.rows.length > 0) {
      console.log('✓ Database "upaci" already exists');
    } else {
      // Create database
      console.log('Creating database "upaci"...');
      await adminPool.query('CREATE DATABASE upaci');
      console.log('✓ Database "upaci" created successfully');
    }
    
    await adminPool.end();
    console.log('');

    // Connect to the new database to install pgvector
    console.log('Installing pgvector extension...');
    const upaciPool = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'upaci',
      user: 'postgres',
      password: 'admin',
    });

    try {
      // Create pgvector extension
      await upaciPool.query('CREATE EXTENSION IF NOT EXISTS vector');
      console.log('✓ pgvector extension installed');
      
      // Verify installation
      const vectorCheck = await upaciPool.query(
        "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector') as has_vector"
      );
      
      if (vectorCheck.rows[0].has_vector) {
        console.log('✓ pgvector extension verified');
      }
      
      console.log('');
      console.log('✓ Database setup completed successfully!');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Run migrations: npm run migrate');
      console.log('  2. Test connection: node test-db-connection.js');
      console.log('');
      
    } catch (error) {
      if (error.message.includes('could not open extension control file')) {
        console.log('⚠ pgvector extension not found');
        console.log('');
        console.log('To install pgvector:');
        console.log('  1. Download from: https://github.com/pgvector/pgvector/releases');
        console.log('  2. Or run: cd database/install && .\\windows-install.ps1');
        console.log('');
        console.log('The database will work without pgvector, but AI features will be limited.');
      } else {
        throw error;
      }
    } finally {
      await upaciPool.end();
    }
    
  } catch (error) {
    console.error('✗ Error:', error.message);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    process.exit(1);
  }
}

createDatabase();
