async function testLiveCrops() {
  console.log('=== TESTING LIVE /crops/mine ENDPOINT FOR USER 9501529971 (King ID: 35683108) ===');

  try {
    const loginRes = await fetch('https://farmsking-live-md6m.onrender.com/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9501529971', password: '12345678' })
    });

    const loginData = await loginRes.json();
    console.log('Login status:', loginRes.status);
    if (!loginData.accessToken) {
      console.log('Login failed response:', loginData);
      return;
    }

    const token = loginData.accessToken;
    console.log('Token acquired. User role in response:', loginData.user?.role, 'roles:', loginData.user?.roles);
    console.log('Requesting GET /crops/mine...');

    const cropsRes = await fetch('https://farmsking-live-md6m.onrender.com/api/v1/crops/mine', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const cropsData = await cropsRes.json();
    console.log('GET /crops/mine status:', cropsRes.status);
    console.log('Crops returned count:', Array.isArray(cropsData) ? cropsData.length : 0);

    if (Array.isArray(cropsData)) {
      cropsData.forEach((c, idx) => {
        console.log(`[${idx + 1}] ID: ${c.id}, CropName: ${c.cropName}, Status: ${c.status}, Stage: ${c.stage}, Plot: ${c.plot?.name}, Farm: ${c.plot?.farm?.name}`);
      });
    } else {
      console.log('Error/Non-array response:', cropsData);
    }
  } catch (err) {
    console.error('Error during test:', err);
  }
}

testLiveCrops();
