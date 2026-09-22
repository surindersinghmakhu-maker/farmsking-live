const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const jwt = require('./backend/node_modules/jsonwebtoken');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ where: { mobile: '9501529971' } });
  console.log('User:', user?.id, user?.name, user?.role);

  // Generate JWT token for this user with farmsking_dev_jwt_signing_key_2026
  const secret = 'farmsking_dev_jwt_signing_key_2026';
  const payload = { sub: user.id, role: user.role };
  const token = jwt.sign(payload, secret, { expiresIn: '7d' });

  console.log('\nGenerated Token:', token);

  // Call Render API with this token
  const API_URL = 'https://farmsking-live-md6m.onrender.com/api/v1';
  const res = await fetch(`${API_URL}/crops/mine`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('API Status:', res.status);
  const data = await res.json();
  console.log('Crops Mine Data Count:', Array.isArray(data) ? data.length : data);
  if (Array.isArray(data)) {
    data.forEach(c => console.log(' ->', c.id, c.cropId, c.cropName, c.stage, c.status));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
