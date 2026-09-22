async function testLiveDashboard() {
  try {
    const loginRes = await fetch('https://farmsking-live-md6m.onrender.com/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '6283153040', password: '6283153040' })
    });
    const loginData = await loginRes.json();
    const token = loginData.accessToken;

    const dashRes = await fetch('https://farmsking-live-md6m.onrender.com/api/v1/labour/my-dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const dashData = await dashRes.json();

    console.log('--- RAW DASHBOARD RESPONSE ---');
    console.log(JSON.stringify(dashData, null, 2));
  } catch (err) {
    console.error('Error testing live dashboard:', err);
  }
}

testLiveDashboard();
