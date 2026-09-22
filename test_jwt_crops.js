const jwt = require('./backend/node_modules/jsonwebtoken');

async function testWithJwt() {
  const secret = process.env.JWT_SECRET || 'farmsking_dev_jwt_signing_key_2026';
  const payload = {
    sub: '90065856-5709-44e7-896d-b9c2a4bd6301',
    mobile: '9501529971',
    role: 'FARMER',
    name: 'Surinder Kumar'
  };

  const token = jwt.sign(payload, secret, { expiresIn: '7d' });
  console.log('Generated JWT Token for 9501529971');

  const API_URL = 'https://farmsking-live-md6m.onrender.com/api/v1';
  console.log('Fetching /crops/mine from Render...');
  const cropsRes = await fetch(`${API_URL}/crops/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log('Status:', cropsRes.status);
  const data = await cropsRes.json();
  console.log('Response:', data);
}

testWithJwt().catch(console.error);
