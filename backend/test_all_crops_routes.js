async function testCropsRoutes() {
  console.log('=== TESTING ALL ROUTES IN CROPS CONTROLLER ON RENDER ===');

  try {
    const loginRes = await fetch('https://farmsking-live-md6m.onrender.com/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9501529971', password: '12345678' })
    });
    const loginData = await loginRes.json();
    const token = loginData.accessToken;

    const routes = [
      { method: 'GET', path: '/crops/mine' },
      { method: 'GET', path: '/crops/advisor/pending' },
      { method: 'GET', path: '/crops/advisor/accepted' },
      { method: 'GET', path: '/crops/plot/fc108315-5b31-401e-ac39-e4f4f6013f35' },
      { method: 'GET', path: '/crops/072af2a4-0068-466a-bead-881a0be01d03' },
    ];

    for (const r of routes) {
      const res = await fetch(`https://farmsking-live-md6m.onrender.com/api/v1${r.path}`, {
        method: r.method,
        headers: { Authorization: `Bearer ${token}` }
      });
      const text = await res.text();
      console.log(`${r.method} ${r.path} => status: ${res.status}, body:`, text);
    }
  } catch (err) {
    console.error('Error testing routes:', err);
  }
}

testCropsRoutes();
