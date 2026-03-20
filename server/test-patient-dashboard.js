#!/usr/bin/env node

/**
 * Quick Test Script for Patient Dashboard Login
 * 
 * This script tests:
 * 1. Database connection
 * 2. Test user exists
 * 3. Login endpoint works
 * 4. Dashboard endpoint works with authentication
 * 
 * Run: node test-patient-dashboard.js
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:3000';

// Test credentials
const TEST_USER = {
  email: 'patient@test.com',
  password: 'Patient123!'
};

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = client.request(reqOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

/**
 * Test 1: Health Check
 */
async function testHealthCheck() {
  console.log('\n🔍 Test 1: Health Check');
  console.log('━'.repeat(50));
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/health`);
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Server is running');
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Uptime: ${Math.floor(response.data.uptime)}s`);
      return true;
    } else {
      console.log('❌ Server unhealthy');
      return false;
    }
  } catch (error) {
    console.log('❌ Server not responding');
    console.log(`   Error: ${error.message}`);
    console.log('\n💡 Start the server with: cd server && npm run dev');
    return false;
  }
}

/**
 * Test 2: Login
 */
async function testLogin() {
  console.log('\n🔐 Test 2: Patient Login');
  console.log('━'.repeat(50));
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: TEST_USER
    });
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Login successful');
      console.log(`   Token: ${response.data.token.substring(0, 20)}...`);
      console.log(`   User: ${response.data.user.firstName} ${response.data.user.lastName}`);
      console.log(`   Role: ${response.data.user.role}`);
      console.log(`   Expires in: ${response.data.expiresIn}s`);
      return response.data.token;
    } else if (response.status === 401) {
      console.log('❌ Invalid credentials');
      console.log('\n💡 Create test user with: cd server && node create-test-user.js');
      return null;
    } else {
      console.log('❌ Login failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Login request failed');
    console.log(`   Error: ${error.message}`);
    return null;
  }
}

/**
 * Test 3: Dashboard Access
 */
async function testDashboard(token) {
  console.log('\n📊 Test 3: Dashboard Access');
  console.log('━'.repeat(50));
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/patients/dashboard`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Dashboard data retrieved');
      console.log(`   Patient: ${response.data.data.patient.firstName} ${response.data.data.patient.lastName}`);
      console.log(`   Email: ${response.data.data.patient.email}`);
      console.log(`   Upcoming appointments: ${response.data.data.upcomingAppointments.length}`);
      console.log(`   Past appointments: ${response.data.data.pastAppointments.length}`);
      console.log(`   Notifications: ${response.data.data.notifications.length}`);
      console.log(`   Unread count: ${response.data.data.unreadNotificationCount}`);
      
      if (response.data.data.upcomingAppointments.length > 0) {
        console.log('\n   📅 Upcoming Appointments:');
        response.data.data.upcomingAppointments.forEach((apt, i) => {
          console.log(`      ${i + 1}. ${apt.appointmentDate} - ${apt.provider.firstName} ${apt.provider.lastName}`);
        });
      }
      
      return true;
    } else if (response.status === 401) {
      console.log('❌ Unauthorized (token invalid)');
      return false;
    } else {
      console.log('❌ Dashboard access failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Dashboard request failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 4: My Appointments
 */
async function testMyAppointments(token) {
  console.log('\n📅 Test 4: My Appointments');
  console.log('━'.repeat(50));
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/appointments/my`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Appointments retrieved');
      console.log(`   Total appointments: ${response.data.appointments.length}`);
      
      if (response.data.appointments.length > 0) {
        console.log('\n   📋 All Appointments:');
        response.data.appointments.slice(0, 5).forEach((apt, i) => {
          console.log(`      ${i + 1}. [${apt.status}] ${apt.appointmentDate}`);
        });
        
        if (response.data.appointments.length > 5) {
          console.log(`      ... and ${response.data.appointments.length - 5} more`);
        }
      } else {
        console.log('   ℹ️ No appointments found (this is normal for new users)');
      }
      
      return true;
    } else {
      console.log('❌ Appointments retrieval failed');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Appointments request failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  Patient Dashboard Login - Integration Tests            ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  
  let passedTests = 0;
  let totalTests = 4;
  
  // Test 1: Health Check
  const healthOk = await testHealthCheck();
  if (healthOk) passedTests++;
  
  if (!healthOk) {
    console.log('\n❌ Server not running - Cannot continue tests');
    console.log('   Start server with: cd server && npm run dev');
    process.exit(1);
  }
  
  // Test 2: Login
  const token = await testLogin();
  if (token) passedTests++;
  
  if (!token) {
    console.log('\n❌ Login failed - Cannot test dashboard');
    process.exit(1);
  }
  
  // Test 3: Dashboard
  const dashboardOk = await testDashboard(token);
  if (dashboardOk) passedTests++;
  
  // Test 4: My Appointments
  const appointmentsOk = await testMyAppointments(token);
  if (appointmentsOk) passedTests++;
  
  // Summary
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  Test Summary                                            ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\n${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('\n✅ All tests passed! Dashboard is ready for patient login.');
    console.log('\n📱 Frontend Access:');
    console.log('   1. Start frontend: cd app && npm run dev');
    console.log('   2. Open: http://localhost:5173/');
    console.log('   3. Login with:');
    console.log(`      Email: ${TEST_USER.email}`);
    console.log(`      Password: ${TEST_USER.password}`);
    console.log('   4. Redirect to: http://localhost:5173/patient/dashboard');
  } else {
    console.log('\n❌ Some tests failed. Check the errors above.');
  }
  
  console.log('');
}

// Run tests
runTests().catch(console.error);
