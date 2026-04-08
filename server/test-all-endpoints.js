/**
 * Comprehensive API Endpoint Tester
 * Tests all endpoints and reports 500 errors
 */
const http = require('http');

const BASE = 'http://localhost:3002';
let authToken = null;
let staffToken = null;
let adminToken = null;

function request(method, path, body = null, token = null) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch (e) { parsed = data; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', (e) => resolve({ status: 0, body: { error: e.message } }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: { error: 'timeout' } }); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function login(email, password) {
  const res = await request('POST', '/api/auth/login', { email, password });
  if (res.status === 200 && res.body.token) return res.body.token;
  return null;
}

async function runTests() {
  const results = [];
  
  function log(method, path, status, detail) {
    const icon = status >= 500 ? '500_ERROR' : status >= 400 ? `${status}_CLIENT` : `${status}_OK`;
    results.push({ method, path, status, icon, detail });
  }

  // === Step 1: Login as patient, staff, admin ===
  console.log('=== Logging in as patient ===');
  authToken = await login('john.smith@example.com', 'Patient123!');
  if (!authToken) {
    authToken = await login('patient.test@upaci.com', 'Patient123!');
  }
  console.log('Patient token:', authToken ? 'OK' : 'FAILED');

  console.log('=== Logging in as staff ===');
  staffToken = await login('staff.wilson@upaci.com', 'Admin123!');
  if (!staffToken) {
    staffToken = await login('nurse.sarah@upaci.com', 'Staff123!');
  }
  console.log('Staff token:', staffToken ? 'OK' : 'FAILED');

  console.log('=== Logging in as admin ===');
  adminToken = await login('admin@upaci.com', 'Admin123!');
  if (!adminToken) {
    adminToken = await login('admin.test@upaci.com', 'Admin123!');
  }
  console.log('Admin token:', adminToken ? 'OK' : 'FAILED');

  // === Step 2: Public endpoints ===
  console.log('\n=== Testing Public Endpoints ===');
  let r;
  
  r = await request('GET', '/api/health');
  log('GET', '/api/health', r.status, '');

  r = await request('GET', '/api');
  log('GET', '/api', r.status, '');

  // === Step 3: Auth endpoints ===
  console.log('\n=== Testing Auth Endpoints ===');
  
  r = await request('POST', '/api/auth/login', { email: 'bad@test.com', password: 'wrong' });
  log('POST', '/api/auth/login (bad creds)', r.status, r.body?.error || r.body?.message || '');

  r = await request('GET', '/api/auth/me', null, authToken);
  log('GET', '/api/auth/me', r.status, '');

  r = await request('POST', '/api/auth/verify', null, authToken);
  log('POST', '/api/auth/verify', r.status, '');

  // === Step 4: Appointment endpoints ===
  console.log('\n=== Testing Appointment Endpoints ===');

  r = await request('GET', '/api/slots');
  log('GET', '/api/slots', r.status, typeof r.body === 'object' ? `count: ${r.body?.data?.length || 0}` : '');

  r = await request('GET', '/api/appointments/my', null, authToken);
  log('GET', '/api/appointments/my', r.status, '');

  r = await request('GET', '/api/appointments/patient/1', null, authToken);
  log('GET', '/api/appointments/patient/1', r.status, r.body?.message || '');

  r = await request('GET', '/api/appointments/patient/1', null, staffToken);
  log('GET', '/api/appointments/patient/1 (staff)', r.status, '');

  // === Step 5: Dashboard endpoints ===
  console.log('\n=== Testing Dashboard Endpoints ===');

  r = await request('GET', '/api/patients/dashboard', null, authToken);
  log('GET', '/api/patients/dashboard', r.status, r.body?.error || '');

  // === Step 6: Staff queue endpoints ===
  console.log('\n=== Testing Queue Endpoints ===');

  r = await request('GET', '/api/staff/queue/today', null, staffToken);
  log('GET', '/api/staff/queue/today', r.status, r.body?.error || '');

  r = await request('PATCH', '/api/staff/queue/999/status', { newStatus: 'arrived', version: 1 }, staffToken);
  log('PATCH', '/api/staff/queue/999/status', r.status, r.body?.error || r.body?.message || '');

  // === Step 7: No-show endpoints ===
  console.log('\n=== Testing No-Show Endpoints ===');

  r = await request('PATCH', '/api/staff/queue/999/mark-noshow', { notes: 'test' }, staffToken);
  log('PATCH', '/api/staff/queue/999/mark-noshow', r.status, r.body?.error || r.body?.message || '');

  r = await request('POST', '/api/staff/queue/999/undo-noshow', null, staffToken);
  log('POST', '/api/staff/queue/999/undo-noshow', r.status, r.body?.error || r.body?.message || '');

  // === Step 8: Staff patient search ===
  console.log('\n=== Testing Staff Patient Search ===');

  r = await request('GET', '/api/staff/patients/search?name=john', null, staffToken);
  log('GET', '/api/staff/patients/search?name=john', r.status, r.body?.error || '');

  // === Step 9: Staff booking ===
  console.log('\n=== Testing Staff Booking ===');

  r = await request('POST', '/api/staff/appointments/book', { patientId: 1, slotId: 1, appointmentType: 'routine' }, staffToken);
  log('POST', '/api/staff/appointments/book', r.status, r.body?.error || r.body?.message || '');

  // === Step 10: AI Intake endpoints ===
  console.log('\n=== Testing AI Intake Endpoints ===');

  r = await request('POST', '/api/intake/ai/start', { patientId: 1 }, authToken);
  log('POST', '/api/intake/ai/start', r.status, r.body?.error || r.body?.message || '');

  r = await request('POST', '/api/intake/ai/message', { conversationId: 'fake-id', message: 'hello' }, authToken);
  log('POST', '/api/intake/ai/message', r.status, r.body?.error || r.body?.message || '');

  r = await request('GET', '/api/intake/ai/conversation/1', null, authToken);
  log('GET', '/api/intake/ai/conversation/1', r.status, r.body?.error || r.body?.message || '');

  r = await request('POST', '/api/intake/ai/submit', { conversationId: 'fake-id' }, authToken);
  log('POST', '/api/intake/ai/submit', r.status, r.body?.error || r.body?.message || '');

  // === Step 11: Manual Intake endpoints ===
  console.log('\n=== Testing Manual Intake Endpoints ===');

  r = await request('POST', '/api/intake/manual/draft', { patientId: 1, draftData: { test: true } }, authToken);
  log('POST', '/api/intake/manual/draft', r.status, r.body?.error || r.body?.message || '');

  r = await request('GET', '/api/intake/manual/draft/1', null, authToken);
  log('GET', '/api/intake/manual/draft/1', r.status, r.body?.error || r.body?.message || '');

  r = await request('POST', '/api/intake/manual/submit', { draftId: 1 }, authToken);
  log('POST', '/api/intake/manual/submit', r.status, r.body?.error || r.body?.message || '');

  // === Step 12: Document endpoints ===
  console.log('\n=== Testing Document Endpoints ===');

  r = await request('GET', '/api/documents/patient/1', null, authToken);
  log('GET', '/api/documents/patient/1', r.status, r.body?.error || r.body?.message || '');

  r = await request('POST', '/api/documents/check-duplicate', { hash: 'abc123' }, authToken);
  log('POST', '/api/documents/check-duplicate', r.status, r.body?.error || r.body?.message || '');

  // === Step 13: Extraction endpoints ===
  console.log('\n=== Testing Extraction Endpoints ===');

  r = await request('POST', '/api/documents/1/extract', null, authToken);
  log('POST', '/api/documents/1/extract', r.status, r.body?.error || r.body?.message || '');

  r = await request('GET', '/api/documents/1/extracted-data', null, authToken);
  log('GET', '/api/documents/1/extracted-data', r.status, r.body?.error || r.body?.message || '');

  r = await request('GET', '/api/documents/1/extraction-logs', null, authToken);
  log('GET', '/api/documents/1/extraction-logs', r.status, r.body?.error || r.body?.message || '');

  // === Step 14: Deduplication endpoints ===
  console.log('\n=== Testing Deduplication Endpoints ===');

  r = await request('POST', '/api/patients/14/deduplicate', null, staffToken);
  log('POST', '/api/patients/14/deduplicate', r.status, r.body?.error || r.body?.message || '');

  r = await request('GET', '/api/patients/14/merge-history', null, staffToken);
  log('GET', '/api/patients/14/merge-history', r.status, r.body?.error || r.body?.message || '');

  r = await request('GET', '/api/patients/14/conflicts', null, staffToken);
  log('GET', '/api/patients/14/conflicts', r.status, r.body?.error || r.body?.message || '');

  // === Step 15: Patient Profile endpoints ===
  console.log('\n=== Testing Patient Profile Endpoints ===');

  r = await request('GET', '/api/patients/14/profile', null, authToken);
  log('GET', '/api/patients/14/profile', r.status, r.body?.error || r.body?.message || '');

  r = await request('GET', '/api/patients/14/profile/conflicts', null, authToken);
  log('GET', '/api/patients/14/profile/conflicts', r.status, r.body?.error || r.body?.message || '');

  r = await request('POST', '/api/patients/14/profile/refresh', null, authToken);
  log('POST', '/api/patients/14/profile/refresh', r.status, r.body?.error || r.body?.message || '');

  // === Step 16: Medical Coding endpoints ===
  console.log('\n=== Testing Medical Coding Endpoints ===');

  r = await request('POST', '/api/appointments/1/codes/generate', { patient_id: '1', clinical_notes: 'test headache' }, staffToken);
  log('POST', '/api/appointments/1/codes/generate', r.status, r.body?.error || r.body?.message || '');

  r = await request('GET', '/api/appointments/1/codes', null, staffToken);
  log('GET', '/api/appointments/1/codes', r.status, r.body?.error || r.body?.message || '');

  r = await request('GET', '/api/appointments/codes/search?q=headache', null, staffToken);
  log('GET', '/api/appointments/codes/search', r.status, r.body?.error || r.body?.message || '');

  // === Step 17: Conflict Check endpoints ===
  console.log('\n=== Testing Conflict Check Endpoints ===');

  r = await request('POST', '/api/patients/14/medications/check-conflicts', { medications: [{ name: 'Aspirin', dosage: '100mg' }] }, staffToken);
  log('POST', '/api/patients/14/medications/check-conflicts', r.status, r.body?.error || r.body?.message || '');

  r = await request('GET', '/api/patients/14/conflicts', null, staffToken);
  log('GET', '/api/patients/14/conflicts (conflict check)', r.status, r.body?.error || r.body?.message || '');

  r = await request('GET', '/api/patients/14/conflicts/history', null, staffToken);
  log('GET', '/api/patients/14/conflicts/history', r.status, r.body?.error || r.body?.message || '');

  r = await request('POST', '/api/patients/medications/validate', { medication_name: 'Aspirin' }, staffToken);
  log('POST', '/api/patients/medications/validate', r.status, r.body?.error || r.body?.message || '');

  // === Step 18: Clinical Profile endpoints ===
  console.log('\n=== Testing Clinical Profile Endpoints ===');

  r = await request('GET', '/api/patients/14/clinical-profile', null, staffToken);
  log('GET', '/api/patients/14/clinical-profile', r.status, r.body?.error || r.body?.message || '');

  r = await request('GET', '/api/patients/14/clinical-profile/history', null, staffToken);
  log('GET', '/api/patients/14/clinical-profile/history', r.status, r.body?.error || r.body?.message || '');

  // === Step 19: Admin endpoints ===
  console.log('\n=== Testing Admin Endpoints ===');

  r = await request('GET', '/api/admin/audit-logs', null, adminToken);
  log('GET', '/api/admin/audit-logs', r.status, r.body?.error || r.body?.message || '');

  r = await request('GET', '/api/admin/audit-logs/actions', null, adminToken);
  log('GET', '/api/admin/audit-logs/actions', r.status, r.body?.error || r.body?.message || '');

  r = await request('GET', '/api/admin/audit-logs/resources', null, adminToken);
  log('GET', '/api/admin/audit-logs/resources', r.status, r.body?.error || r.body?.message || '');

  r = await request('GET', '/api/admin/audit-logs/users/search?q=admin', null, adminToken);
  log('GET', '/api/admin/audit-logs/users/search', r.status, r.body?.error || r.body?.message || '');

  r = await request('GET', '/api/admin/audit-logs/export?format=json', null, adminToken);
  log('GET', '/api/admin/audit-logs/export', r.status, r.body?.error || r.body?.message || '');

  // === Step 20: Calendar endpoints ===
  console.log('\n=== Testing Calendar Endpoints ===');

  r = await request('GET', '/api/calendar/google/auth', null, authToken);
  log('GET', '/api/calendar/google/auth', r.status, r.body?.error || r.body?.message || '');

  r = await request('GET', '/api/calendar/outlook/auth', null, authToken);
  log('GET', '/api/calendar/outlook/auth', r.status, r.body?.error || r.body?.message || '');

  r = await request('GET', '/api/calendar/google/status', null, authToken);
  log('GET', '/api/calendar/google/status', r.status, r.body?.error || r.body?.message || '');

  // === RESULTS SUMMARY ===
  console.log('\n\n====================================================');
  console.log('          API ENDPOINT TEST RESULTS SUMMARY');
  console.log('====================================================\n');

  const errors500 = results.filter(r => r.status >= 500);
  const errors400 = results.filter(r => r.status >= 400 && r.status < 500);
  const success = results.filter(r => r.status >= 200 && r.status < 400);
  const connErrors = results.filter(r => r.status === 0);

  console.log(`Total endpoints tested: ${results.length}`);
  console.log(`  SUCCESS (2xx/3xx):    ${success.length}`);
  console.log(`  CLIENT ERROR (4xx):   ${errors400.length}`);
  console.log(`  SERVER ERROR (5xx):   ${errors500.length}`);
  console.log(`  CONNECTION ERROR:     ${connErrors.length}`);

  if (errors500.length > 0) {
    console.log('\n--- 500 ERRORS (Server Errors) ---');
    errors500.forEach(r => {
      console.log(`  ${r.status} ${r.method} ${r.path}`);
      console.log(`       Detail: ${typeof r.detail === 'string' ? r.detail : JSON.stringify(r.detail)}`);
    });
  }

  if (connErrors.length > 0) {
    console.log('\n--- CONNECTION ERRORS ---');
    connErrors.forEach(r => {
      console.log(`  ${r.method} ${r.path}`);
      console.log(`       Detail: ${typeof r.detail === 'string' ? r.detail : JSON.stringify(r.detail)}`);
    });
  }

  // Print all results as a table
  console.log('\n--- All Results ---');
  results.forEach(r => {
    const statusStr = String(r.status).padStart(3);
    const methodStr = r.method.padEnd(6);
    const pathStr = r.path.padEnd(55);
    const detail = typeof r.detail === 'string' ? r.detail.substring(0, 80) : JSON.stringify(r.detail).substring(0, 80);
    console.log(`  ${statusStr} ${methodStr} ${pathStr} ${detail}`);
  });
}

runTests().catch(e => console.error('Test failed:', e));
