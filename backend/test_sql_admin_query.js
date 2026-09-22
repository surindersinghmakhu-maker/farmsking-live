const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query', 'error', 'warn'] });

async function main() {
  const user = { id: '59814531-1234-5678', role: 'SUPER_ADMIN' };
  const isGlobalAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

  console.log('Running listMineForFarmer query for SUPER_ADMIN...');
  const res = await prisma.cropCycle.findMany({
    where: {
      deletedAt: null,
      plot: isGlobalAdmin
        ? { deletedAt: null, farm: { deletedAt: null } }
        : { deletedAt: null, farm: { ownerId: user.id, deletedAt: null } },
    },
    include: { plot: { select: { id: true, name: true, farmId: true, area: true, areaUnit: true, irrigationType: true } } },
    orderBy: { createdAt: 'desc' },
  });

  console.log('Result count:', res.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
