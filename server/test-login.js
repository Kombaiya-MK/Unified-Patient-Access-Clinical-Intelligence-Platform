/**
 * Test login credentials
 */

const http = require('http');

function testLogin(email, password) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email, password });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('\n🔐 Testing Login Credentials\n');
  console.log('================================\n');

  const testCases = [
    { email: 'patient@test.com', password: 'Patient123!' },
    { email: 'patient@test.com', password: 'patient123!' },
    { email: 'patient@test.com', password: 'Test123!' },
  ];

  for (const creds of testCases) {
    console.log(`Testing: ${creds.email} / ${creds.password}`);
    try {
      const result = await testLogin(creds.email, creds.password);
      
      if (result.status === 200) {
        console.log(`✅ SUCCESS! Status: ${result.status}`);
        console.log(`   Token: ${result.data.token ? result.data.token.substring(0, 20) + '...' : 'N/A'}`);
        console.log(`   User: ${result.data.user ? result.data.user.email : 'N/A'}\n`);
        break;
      } else {
        console.log(`❌ FAILED! Status: ${result.status}`);
        console.log(`   Error: ${result.data.error || result.data.message || JSON.stringify(result.data)}\n`);
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}\n`);
    }
  }
}

main().catch(console.error);
