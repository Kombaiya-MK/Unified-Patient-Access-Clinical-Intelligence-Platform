/**
 * PostgreSQL Password Reset Helper
 * This script helps you reset your PostgreSQL password if you've forgotten it
 */

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║   PostgreSQL Connection - Password Reset Helper           ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');
console.log('Current Configuration:');
console.log('  Host: localhost');
console.log('  Port: 5432');
console.log('  Database: upaci');
console.log('  User: postgres');
console.log('');
console.log('If you don\'t remember your PostgreSQL password, follow these steps:');
console.log('');
console.log('OPTION 1: Reset Password via SQL Shell (psql)');
console.log('─────────────────────────────────────────────────────');
console.log('1. Find PostgreSQL in Start Menu → "SQL Shell (psql)"');
console.log('2. Press Enter for Server [localhost]:');
console.log('3. Press Enter for Database [postgres]:');
console.log('4. Press Enter for Port [5432]:');
console.log('5. Press Enter for User [postgres]:');
console.log('6. Enter your current password');
console.log('7. Run: ALTER USER postgres WITH PASSWORD \'your_new_password\';');
console.log('');
console.log('OPTION 2: Reset via pgAdmin');
console.log('─────────────────────────────────────────────────────');
console.log('1. Open pgAdmin 4');
console.log('2. Enter your master password');
console.log('3. Right-click PostgreSQL server → Properties');
console.log('4. Connection tab → Update password');
console.log('');
console.log('OPTION 3: Trust Authentication (Temporary - Development Only)');
console.log('─────────────────────────────────────────────────────');
console.log('1. Find pg_hba.conf file in PostgreSQL data directory');
console.log('   Common locations:');
console.log('   - C:\\Program Files\\PostgreSQL\\<version>\\data\\pg_hba.conf');
console.log('   - C:\\Users\\<username>\\AppData\\Local\\Programs\\PostgreSQL\\<version>\\data\\');
console.log('');
console.log('2. Open pg_hba.conf as Administrator');
console.log('');
console.log('3. Find lines like:');
console.log('   # IPv4 local connections:');
console.log('   host    all    all    127.0.0.1/32    scram-sha-256');
console.log('');
console.log('4. Change "scram-sha-256" or "md5" to "trust":');
console.log('   host    all    all    127.0.0.1/32    trust');
console.log('');
console.log('5. Restart PostgreSQL service:');
console.log('   Run in PowerShell (as Admin):');
console.log('   Restart-Service postgresql-x64-18');
console.log('');
console.log('6. Connect without password and set new one:');
console.log('   psql -U postgres -d postgres');
console.log('   ALTER USER postgres WITH PASSWORD \'your_new_password\';');
console.log('');
console.log('7. Change pg_hba.conf back to "scram-sha-256" and restart service');
console.log('');
console.log('OPTION 4: Find Password in Environment');
console.log('─────────────────────────────────────────────────────');
console.log('Check if password is stored in system variables:');
console.log('');

// Check common environment variables
const possiblePasswordVars = [
  'PGPASSWORD',
  'POSTGRES_PASSWORD',
  'PG_PASSWORD',
  'DATABASE_PASSWORD'
];

console.log('Checking environment variables...');
possiblePasswordVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✓ Found ${varName}: ${value.substring(0, 2)}${'*'.repeat(value.length - 2)}`);
  }
});
console.log('');

console.log('After resetting password, update your .env file:');
console.log('  DB_PASSWORD=your_new_password');
console.log('  DB_URL=postgresql://postgres:your_new_password@localhost:5432/upaci');
console.log('');
console.log('Then run: node test-db-connection.js');
console.log('');
