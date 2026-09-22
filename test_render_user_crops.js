// Node 24 native fetch

async function testLiveRenderCrops() {
  const API_URL = 'https://farmsking-live-md6m.onrender.com/api/v1';

  // 1. Login with 9501529971
  console.log('Logging into Render API with 9501529971...');
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: '9501529971' }),
  });

  const loginData = await loginRes.json();
  console.log('Login Status:', loginRes.status);
  if (!loginData.accessToken) {
    console.error('Login failed:', loginData);
    return;
  }

  const token = loginData.accessToken;
  console.log('Logged in user:', loginData.user?.name, 'ID:', loginData.user?.id);

  // 2. Fetch /crops/mine
  console.log('\nFetching /crops/mine from Render...');
  const cropsRes = await fetch(`${API_URL}/crops/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log('Crops Mine Status:', cropsRes.status);
  const cropsData = await cropsRes.json();
  console.log('Crops Count:', Array.isArray(cropsData) ? cropsData.length : cropsData);
  if (Array.isArray(cropsData)) {
    cropsData.forEach((c) => {
      console.log(' - Crop:', c.id, c.cropId, c.cropName, 'Stage:', c.stage, 'Status:', c.status, 'Plot:', c.plot?.name);
    });
  }
}

testLiveRenderCrops().catch(console.error);
