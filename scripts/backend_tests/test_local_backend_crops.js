async function testLocalBackendCrops() {
  console.log('=== TESTING LOCAL BACKEND http://localhost:3000/api/v1/crops/mine ===');

  try {
    const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9501529971', password: '12345678' })
    });

    const loginData = await loginRes.json();
    console.log('Local Login status:', loginRes.status);
    const token = loginData.accessToken;

    const cropsRes = await fetch('http://localhost:3000/api/v1/crops/mine', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const cropsData = await cropsRes.json();
    console.log('Local GET /crops/mine status:', cropsRes.status);
    console.log('Local Crops returned count:', Array.isArray(cropsData) ? cropsData.length : 0);

    if (Array.isArray(cropsData)) {
      cropsData.forEach((c, idx) => {
        console.log(`[${idx + 1}] ID: ${c.id}, CropName: ${c.cropName}, Status: ${c.status}, Stage: ${c.stage}`);
      });
    } else {
      console.log('Local Error response:', cropsData);
    }
  } catch (err) {
    console.error('Error during local test:', err);
  }
}

testLocalBackendCrops();
