async function testPutWorker() {
  try {
    const loginRes = await fetch('https://farmsking-live-md6m.onrender.com/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '6283153040', password: '6283153040' })
    });
    const loginData = await loginRes.json();
    const token = loginData.accessToken;
    console.log('Login successful, token retrieved.');

    const putRes = await fetch('https://farmsking-live-md6m.onrender.com/api/v1/labour/workers/c1d71ebe-7a6f-428b-90fb-decccabb4afd', {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Rekha',
        defaultRate: 60,
        defaultUnit: 'Days'
      })
    });
    const putData = await putRes.json();
    console.log('--- PUT WORKER RESPONSE (HTTP ' + putRes.status + ') ---');
    console.log(JSON.stringify(putData, null, 2));
  } catch (err) {
    console.error('Error testing put worker:', err);
  }
}

testPutWorker();
