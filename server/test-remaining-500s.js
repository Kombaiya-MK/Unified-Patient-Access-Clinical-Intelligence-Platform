/**
 * Targeted test for the 4 remaining 500 errors.
 * Shows detailed error info from each endpoint.
 */
const http = require('http');

const BASE = 'http://localhost:3002';

function request(method, path, body, token) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', (e) => resolve({ status: 0, body: e.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // Login as staff
  let r = await request('POST', '/api/auth/login', {
    email: 'staff.wilson@upaci.com',
    password: 'Admin123!',
  });
  if (!r.body?.data?.token && !r.body?.token) {
    r = await request('POST', '/api/auth/login', {
      email: 'nurse.sarah@upaci.com',
      password: 'Staff123!',
    });
  }
  const staffToken = r.body?.data?.token || r.body?.token;
  console.log('Staff token:', staffToken ? 'OK' : 'FAILED');
  if (!staffToken) {
    console.log('Login response:', JSON.stringify(r.body, null, 2));
    return;
  }

  // Test 1: Queue today
  console.log('\n--- Test 1: GET /api/staff/queue/today ---');
  r = await request('GET', '/api/staff/queue/today', null, staffToken);
  console.log('Status:', r.status);
  console.log('Response:', JSON.stringify(r.body, null, 2).substring(0, 500));

  // Test 2: Check conflicts
  console.log('\n--- Test 2: POST /api/patients/14/medications/check-conflicts ---');
  r = await request('POST', '/api/patients/14/medications/check-conflicts', {
    medications: [{ name: 'Aspirin', dosage: '100mg' }],
  }, staffToken);
  console.log('Status:', r.status);
  console.log('Response:', JSON.stringify(r.body, null, 2).substring(0, 500));

  // Test 3: Clinical profile
  console.log('\n--- Test 3: GET /api/patients/14/clinical-profile ---');
  r = await request('GET', '/api/patients/14/clinical-profile', null, staffToken);
  console.log('Status:', r.status);
  console.log('Response:', JSON.stringify(r.body, null, 2).substring(0, 500));

  // Test 4: Clinical profile history
  console.log('\n--- Test 4: GET /api/patients/14/clinical-profile/history ---');
  r = await request('GET', '/api/patients/14/clinical-profile/history', null, staffToken);
  console.log('Status:', r.status);
  console.log('Response:', JSON.stringify(r.body, null, 2).substring(0, 500));
}

main().catch(console.error);
