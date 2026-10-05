const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listMine(user) {
  const userRoles = Array.isArray(user.roles) ? user.roles : [user.role];
  const isAdmin = userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN') || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

  if (isAdmin) {
    return prisma.saleBill.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  const cleanMobile = user.mobile ? user.mobile.split('_')[0] : '';
  const userIds = [user.id];
  if (cleanMobile && cleanMobile.length >= 10) {
    const sameMobileUsers = await prisma.user.findMany({
      where: { mobile: { startsWith: cleanMobile } },
      select: { id: true },
    });
    sameMobileUsers.forEach((u) => userIds.push(u.id));
  }

  return prisma.saleBill.findMany({
    where: { farmerId: { in: Array.from(new Set(userIds)) } },
    orderBy: { createdAt: 'desc' },
  });
}

async function main() {
  const users = await prisma.user.findMany();
  for (const u of users) {
    const bills = await listMine(u);
    console.log(`User ${u.name} (${u.id}, mobile: ${u.mobile}, role: ${u.role}) -> ${bills.length} bills found.`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
