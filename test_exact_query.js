const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { id: 'c7d07121-991a-4ff4-9618-0147870d2747' },
    select: { id: true, mobile: true, role: true, roles: true, deactivatedRoles: true, name: true },
  });

  console.log('User:', user);

  const isGlobalAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  console.log('isGlobalAdmin:', isGlobalAdmin);

  try {
    const crops = await prisma.cropCycle.findMany({
      where: {
        deletedAt: null,
        plot: isGlobalAdmin
          ? { deletedAt: null, farm: { deletedAt: null } }
          : { deletedAt: null, farm: { ownerId: user.id, deletedAt: null } },
      },
      include: { plot: { select: { id: true, name: true, farmId: true, area: true, areaUnit: true, irrigationType: true } } },
      orderBy: { createdAt: 'desc' },
    });
    console.log('Crops found count:', crops.length);
    crops.forEach(c => console.log(' ->', c.id, c.cropId, c.cropName, c.plot?.name));
  } catch (err) {
    console.error('Prisma query error:', err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
