const fs = require('fs');

const LIVE_API_URL = 'https://farmsking.in/api/v1';
const SUPER_ADMIN_MOBILE = '9872066901';
const SUPER_ADMIN_PASSWORD = '12345678';

async function main() {
  console.log('1. Logging in as Super Admin on live server:', LIVE_API_URL);
  const loginRes = await fetch(`${LIVE_API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: SUPER_ADMIN_MOBILE, password: SUPER_ADMIN_PASSWORD }),
  });

  const loginData = await loginRes.json();
  if (!loginData.accessToken) {
    console.error('Failed to log in:', loginData);
    process.exit(1);
  }

  const token = loginData.accessToken;
  console.log('✅ Logged in successfully as Super Admin!');

  // Read local products exported json
  const localProducts = JSON.parse(fs.readFileSync('local_products_export.json', 'utf8'));
  console.log(`\n2. Found ${localProducts.length} local products to upload:`);

  for (const prod of localProducts) {
    console.log(`\n------------------------------------------------`);
    console.log(`Uploading: "${prod.name}" (Price: ₹${prod.price}, Category: ${prod.category})`);

    const payload = {
      name: prod.name,
      title: prod.title || prod.name,
      brand: prod.brand || 'FarmsKing Certified',
      description: prod.description || '',
      category: prod.category || 'Bio & Organics',
      categorySlug: (prod.categorySlug || prod.category || 'bio-organics').toLowerCase().replace(/\s+/g, '-'),
      unit: prod.unit || 'piece',
      price: Number(prod.price),
      sellingPrice: Number(prod.sellingPrice || prod.price),
      mrp: Number(prod.mrp || prod.price),
      imageUrl: prod.imageFrontUrl || prod.imageUrl || prod.imageProductUrl || '',
      imageFrontUrl: prod.imageFrontUrl || prod.imageUrl || '',
      imageBackLabelUrl: prod.imageBackLabelUrl || '',
      imageDosageUrl: prod.imageDosageUrl || '',
      imageProductUrl: prod.imageProductUrl || prod.imageUrl || '',
      stockQty: Number(prod.stockQty || 100),
      hsnCode: prod.hsnCode || '31010099',
      sku: prod.sku || `FK-${Date.now().toString(36).toUpperCase()}`,
      gstPercentage: Number(prod.gstPercentage || 18.0),
      weightKg: Number(prod.weightKg || 1.0),
      deadWeightKg: Number(prod.deadWeightKg || 1.0),
      lengthCm: Number(prod.lengthCm || 10),
      widthCm: Number(prod.widthCm || 10),
      heightCm: Number(prod.heightCm || 10),
      technicalName: prod.technicalName || '',
      dosageInstructions: prod.dosageInstructions || '',
      suitableCrops: prod.suitableCrops || 'All Crops',
      targetPests: prod.targetPests || '',
      batchNumber: prod.batchNumber || '',
    };

    try {
      const createRes = await fetch(`${LIVE_API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const createData = await createRes.json();
      if (createRes.status === 201 || createData.id) {
        console.log(`✅ Created successfully! ID: ${createData.id}`);

        // If product is in PENDING_REVIEW, approve it via Admin Endpoint
        if (createData.moderationStatus !== 'ACTIVE' || !createData.isActive) {
          console.log(`   Approving product ID: ${createData.id}...`);
          const approveRes = await fetch(`${LIVE_API_URL}/products/admin/approve/${createData.id}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          const approveData = await approveRes.json();
          console.log(`   ✅ Approved! Status: ${approveData.moderationStatus}, Active: ${approveData.isActive}`);
        }
      } else {
        console.error(`❌ Failed to create product "${prod.name}":`, createData);
      }
    } catch (err) {
      console.error(`❌ Network/Server Error uploading "${prod.name}":`, err.message);
    }
  }

  // 3. Final Verification
  console.log('\n================================================');
  console.log('3. Verifying Online Products List on farmsking.in...');
  const verifyRes = await fetch(`${LIVE_API_URL}/products`);
  const verifyData = await verifyRes.json();

  if (Array.isArray(verifyData)) {
    console.log(`🎉 SUCCESS! Total Active Online Products: ${verifyData.length}`);
    verifyData.forEach((p, idx) => {
      console.log(`  #${idx + 1}: ${p.name} | ₹${p.price} | Category: ${p.category} | Stock: ${p.stockQty}`);
    });
  } else {
    console.error('Unexpected response:', verifyData);
  }
}

main().catch(console.error);
