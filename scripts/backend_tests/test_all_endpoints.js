async function testAllEndpoints() {
  console.log('=== TESTING ALL LIVE ENDPOINTS FOR USER 9501529971 ===');

  try {
    const loginRes = await fetch('https://farmsking-live-md6m.onrender.com/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9501529971', password: '12345678' })
    });
    const loginData = await loginRes.json();
    const token = loginData.accessToken;

    const endpoints = [
      '/auth/me',
      '/farms',
      '/plots',
      '/labour/workers',
      '/crops/mine'
    ];

    for (const ep of endpoints) {
      const res = await fetch(`https://farmsking-live-md6m.onrender.com/api/v1${ep}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      console.log(`Endpoint ${ep} => status: ${res.status}, response:`, Array.isArray(data) ? `Array[${data.length}]` : data);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

testAllEndpoints();
