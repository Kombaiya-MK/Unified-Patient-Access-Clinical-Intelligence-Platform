/**
 * Test Login API Endpoint
 * Tests the login endpoint with test credentials
 */

const fetch = require('node-fetch');

async function testLogin() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Testing Login API Endpoint                               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  const API_URL = 'http://localhost:3001/api/auth/login';
  
  const testCredentials = [
    { email: 'doctor@test.com', password: 'Doctor123!', role: 'doctor' },
    { email: 'patient@test.com', password: 'Patient123!', role: 'patient' },
  ];

  console.log(`Testing API endpoint: ${API_URL}`);
  console.log('');

  for (const creds of testCredentials) {
    console.log(`Testing ${creds.role.toUpperCase()} login...`);
    console.log(`  Email: ${creds.email}`);
    console.log(`  Password: ${creds.password}`);
    console.log('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: creds.email,
          password: creds.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✓ Login successful!`);
        console.log(`  Status: ${response.status}`);
        console.log(`  Token: ${data.token.substring(0, 20)}...`);
        console.log(`  User ID: ${data.user.id}`);
        console.log(`  Role: ${data.user.role}`);
        console.log(`  Name: ${data.user.firstName} ${data.user.lastName}`);
        console.log(`  Expires in: ${data.expiresIn} seconds`);
      } else {
        console.log(`✗ Login failed`);
        console.log(`  Status: ${response.status}`);
        console.log(`  Error: ${data.message || JSON.stringify(data)}`);
      }
    } catch (error) {
      console.log(`✗ Request failed`);
      console.log(`  Error: ${error.message}`);
      console.log('');
      console.log('Make sure the server is running:');
      console.log('  cd server && npm run dev');
    }
    console.log('');
    console.log('─────────────────────────────────────────────────────────');
    console.log('');
  }

  console.log('Test complete!');
  console.log('');
}

testLogin();
