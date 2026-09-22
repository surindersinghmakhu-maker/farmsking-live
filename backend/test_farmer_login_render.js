const API_URL = 'https://farmsking-live-md6m.onrender.com/api/v1';

async function main() {
  console.log('1. Logging in with mobile 9872066901...');
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: '9872066901', password: 'admin' }),
  });

  const loginData = await loginRes.json();
  console.log('Login Status:', loginRes.status, 'User:', loginData.user?.name, 'Role:', loginData.user?.role);
  const token = loginData.accessToken;
  if (!token) return;

  const headers = { Authorization: `Bearer ${token}` };
  console.log('\n2. Calling /crops/mine...');
  const mineRes = await fetch(`${API_URL}/crops/mine`, { headers });
  const mineData = await mineRes.json();
  console.log('/crops/mine Status:', mineRes.status);
  console.log('/crops/mine Crops Count:', Array.isArray(mineData) ? mineData.length : mineData);
  if (Array.isArray(mineData)) {
    mineData.forEach(c => console.log('Crop:', c.id, c.cropId, c.cropName, c.stage, c.plot?.name));
  }
}

main().catch(console.error);
