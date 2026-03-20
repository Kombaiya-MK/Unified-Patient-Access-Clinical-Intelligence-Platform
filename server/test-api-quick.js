// Quick API test
const http = require('http');

function testAPI() {
  // First login
  const loginData = JSON.stringify({
    email: 'patient@test.com',
    password: 'Patient123!'
  });

  const loginReq = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const response = JSON.parse(data);
      if (response.token) {
        console.log('✅ Login successful');
        console.log(`Token: ${response.token.substring(0, 20)}...`);
        
        // Now test appointments endpoint
        const apptReq = http.request({
          hostname: 'localhost',
          port: 3000,
          path: '/api/appointments/my',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${response.token}`
          }
        }, (res2) => {
          let data2 = '';
          res2.on('data', chunk => data2 += chunk);
          res2.on('end', () => {
            console.log('\n✅ Appointments API response:');
            console.log(data2);
          });
        });
        apptReq.end();
        
      } else {
        console.log('❌ Login failed:', data);
      }
    });
  });

  loginReq.write(loginData);
  loginReq.end();
}

testAPI();
