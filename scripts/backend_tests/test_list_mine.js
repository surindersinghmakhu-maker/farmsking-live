const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const isGlobalAdmin = true;
  const crops = await prisma.cropCycle.findMany({
    where: {
      deletedAt: null,
      plot: isGlobalAdmin
        ? { deletedAt: null, farm: { deletedAt: null } }
        : { deletedAt: null, farm: { ownerId: 'c7d07121-991a-4ff4-9618-0147870d2747', deletedAt: null } },
    },
    include: { plot: { select: { id: true, name: true, farmId: true, area: true, areaUnit: true, irrigationType: true } } },
    orderBy: { createdAt: 'desc' },
  });

  console.log('ADMIN CROPS COUNT:', crops.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
