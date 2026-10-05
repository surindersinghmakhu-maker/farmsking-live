const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

const API_URL = 'https://farmsking-live-md6m.onrender.com/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'farmsking_dev_jwt_signing_key_2026';

async function main() {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, mobile: true, role: true, roles: true, kingId: true },
  });

  console.log(`TESTING /crops/mine API FOR ALL ${users.length} USERS...`);

  for (const user of users) {
    const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET);

    try {
      const res = await fetch(`${API_URL}/crops/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.status === 200) {
        console.log(`✅ [200 OK] User ${user.name} (${user.mobile}, KingID: ${user.kingId}, Role: ${user.role}) -> ${Array.isArray(data) ? data.length + ' crops' : 'not array'}`);
      } else {
        console.error(`❌ [${res.status}] User ${user.name} (${user.mobile}, KingID: ${user.kingId}, Role: ${user.role}) ->`, data);
      }
    } catch (err) {
      console.error(`💥 Network/Fetch error for user ${user.name}:`, err.message);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
