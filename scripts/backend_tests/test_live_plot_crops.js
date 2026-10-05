async function testPlotCrops() {
  try {
    const loginRes = await fetch('https://farmsking-live-md6m.onrender.com/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9501529971', password: '12345678' })
    });
    const loginData = await loginRes.json();
    const token = loginData.accessToken;

    const plots = [
      'fc108315-5b31-401e-ac39-e4f4f6013f35', // Marigold Plot 1
      'ea5b747b-13c1-4f09-9e79-c0deae9ffdbf', // Local
      '4061c2fd-3f54-425e-8c5a-7a9ee2fd1e4a', // mm
      '0d644e8b-8ac5-49b9-9cfa-b0aea3b0a6b1'  // Makhu plot
    ];

    for (const plotId of plots) {
      const res = await fetch(`https://farmsking-live-md6m.onrender.com/api/v1/crops/plot/${plotId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      console.log(`Plot ${plotId} => status: ${res.status}, items:`, Array.isArray(data) ? data.length : data);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

testPlotCrops();
