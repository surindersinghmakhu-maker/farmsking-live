async function run() {
  console.log('--- DETAILED TEST OF GET /crops/mine ON RENDER ---');

  const loginRes = await fetch('https://farmsking-live-md6m.onrender.com/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: '9501529971', password: '12345678' })
  });

  const loginData = await loginRes.json();
  console.log('Login status:', loginRes.status);
  console.log('User ID:', loginData.user?.id);
  console.log('User Role:', loginData.user?.role);
  console.log('User Roles:', loginData.user?.roles);

  const token = loginData.accessToken;

  const res = await fetch('https://farmsking-live-md6m.onrender.com/api/v1/crops/mine', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const text = await res.text();
  console.log('Response status:', res.status);
  console.log('Response text:', text);
}

run();
