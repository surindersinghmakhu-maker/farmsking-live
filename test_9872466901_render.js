const jwt = require('./backend/node_modules/jsonwebtoken');

async function test9872466901Render() {
  const user = { id: 'c7d07121-991a-4ff4-9618-0147870d2747', role: 'FARMER' };
  const secret = 'farmsking_dev_jwt_signing_key_2026';
  const token = jwt.sign({ sub: user.id, role: user.role }, secret, { expiresIn: '7d' });

  const API_URL = 'https://farmsking-live-md6m.onrender.com/api/v1';
  const res = await fetch(`${API_URL}/crops/mine`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log('API Status:', res.status);
  const data = await res.json();
  console.log('Response Count:', Array.isArray(data) ? data.length : data);
  if (Array.isArray(data)) {
    data.forEach(c => {
      console.log(' ->', c.id, c.cropId, c.cropName, 'stage:', c.stage, 'status:', c.status, 'plot:', c.plot?.name);
    });
  }
}

test9872466901Render().catch(console.error);
