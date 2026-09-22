async function checkUserLogin() {
  const loginRes = await fetch('https://farmsking-live-md6m.onrender.com/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: '6283153040', password: '6283153040' })
  });
  const loginData = await loginRes.json();
  console.log('--- LOGIN DATA ---');
  console.log(JSON.stringify(loginData, null, 2));
}
checkUserLogin();
