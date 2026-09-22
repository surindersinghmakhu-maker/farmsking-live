const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const u = await prisma.user.findFirst({ where: { kingId: '54211886' } });
  console.log('USER:', u.id, u.name, u.role, u.roles);

  const authUser = {
    id: u.id,
    role: u.role || 'FARMER',
    roles: u.roles || ['FARMER'],
  };

  const crops = await prisma.cropCycle.findMany({
    where: {
      deletedAt: null,
      plot: { deletedAt: null, farm: { ownerId: authUser.id, deletedAt: null } },
    },
    include: { plot: { select: { id: true, name: true, farmId: true, area: true, areaUnit: true, irrigationType: true } } },
    orderBy: { createdAt: 'desc' },
  });

  console.log('CROPS COUNT FOR USER 54211886:', crops.length);
  crops.forEach((c) => console.log('Crop:', c.id, c.cropId, c.cropName, c.status, c.stage, c.plot?.name));
}

main().catch(console.error).finally(() => prisma.$disconnect());
