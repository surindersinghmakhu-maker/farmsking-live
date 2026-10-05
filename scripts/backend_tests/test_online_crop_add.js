const API_URL = 'https://farmsking-live-md6m.onrender.com/api/v1';

async function main() {
  console.log('1. Logging in to online API...');
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: '9872066901', password: 'admin' }),
  });

  const loginData = await loginRes.json();
  console.log('Login Status:', loginRes.status, 'User:', loginData.user?.name);
  const token = loginData.accessToken;
  if (!token) {
    console.error('Failed to obtain token!', loginData);
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  console.log('\n2. Fetching farms...');
  let farmsRes = await fetch(`${API_URL}/farms`, { headers });
  let farms = await farmsRes.json();
  console.log('Farms count:', Array.isArray(farms) ? farms.length : farms);

  let farmId;
  if (Array.isArray(farms) && farms.length > 0) {
    farmId = farms[0].id;
  } else {
    console.log('Creating a test farm...');
    const createFarmRes = await fetch(`${API_URL}/farms`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Online Test Farm', totalArea: 1, areaUnit: 'ACRE' }),
    });
    const newFarm = await createFarmRes.json();
    console.log('Created farm:', createFarmRes.status, newFarm);
    farmId = newFarm.id;
  }

  console.log('\n3. Fetching plots for farm:', farmId);
  let plotsRes = await fetch(`${API_URL}/plots/farm/${farmId}`, { headers });
  let plots = await plotsRes.json();
  console.log('Plots count:', Array.isArray(plots) ? plots.length : plots);

  let plotId;
  if (Array.isArray(plots) && plots.length > 0) {
    plotId = plots[0].id;
  } else {
    console.log('Creating a test plot...');
    const createPlotRes = await fetch(`${API_URL}/plots`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ farmId, name: 'Online Test Plot', area: 1, areaUnit: 'ACRE' }),
    });
    const newPlot = await createPlotRes.json();
    console.log('Created plot:', createPlotRes.status, newPlot);
    plotId = newPlot.id;
  }

  console.log('\n4. Creating crop on plot:', plotId);
  const cropPayload = {
    plotId,
    cropName: 'Online Test Marigold',
    category: 'FLOWERS',
    area: 1,
    unit: 'KG',
    stage: 'PLANTATION',
    harvestType: 'CONTINUOUS',
    sowingDate: '2026-09-22T00:00:00.000Z',
  };

  const createCropRes = await fetch(`${API_URL}/crops`, {
    method: 'POST',
    headers,
    body: JSON.stringify(cropPayload),
  });

  const cropResult = await createCropRes.json();
  console.log('CREATE CROP STATUS:', createCropRes.status);
  console.log('CREATE CROP RESULT:', JSON.stringify(cropResult, null, 2));
}

main().catch(console.error);
