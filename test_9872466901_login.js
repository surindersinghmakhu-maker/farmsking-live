async function testLoginPass() {
  const API_URL = 'https://farmsking-live-md6m.onrender.com/api/v1';
  const passwords = ['1234', '123456', '12345678', 'admin', 'password', 'farmsking'];

  for (const p of passwords) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9872466901', password: p }),
    });

    console.log(`Password "${p}": status ${res.status}`);
    if (res.status === 200) {
      const data = await res.json();
      console.log('SUCCESS! Token:', data.accessToken ? 'RECEIVED' : 'NO TOKEN');
      if (data.accessToken) {
        // Fetch /crops/mine with this REAL Render token!
        const cropsRes = await fetch(`${API_URL}/crops/mine`, {
          headers: { Authorization: `Bearer ${data.accessToken}` }
        });
        console.log('Crops /mine Status:', cropsRes.status);
        const cropsData = await cropsRes.json();
        console.log('Crops Count:', Array.isArray(cropsData) ? cropsData.length : cropsData);
        if (Array.isArray(cropsData)) {
          cropsData.forEach(c => console.log(' ->', c.id, c.cropId, c.cropName, 'stage:', c.stage, 'status:', c.status));
        }
      }
      break;
    }
  }
}

testLoginPass().catch(console.error);
