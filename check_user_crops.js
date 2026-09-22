const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const farmer = await prisma.user.findFirst({ where: { mobile: '9501529971' } });
  console.log('Farmer:', farmer?.id, farmer?.name, farmer?.mobile);

  const allCrops = await prisma.cropCycle.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: { plot: { include: { farm: true } } }
  });
  console.log('\nTotal crops in DB:', allCrops.length);

  for (const c of allCrops) {
    console.log({
      id: c.id,
      cropId: c.cropId,
      cropName: c.cropName,
      status: c.status,
      deletedAt: c.deletedAt,
      plotId: c.plotId,
      plotDeletedAt: c.plot?.deletedAt,
      farmId: c.plot?.farmId,
      farmDeletedAt: c.plot?.farm?.deletedAt,
      ownerId: c.plot?.farm?.ownerId,
      isFarmerMatch: c.plot?.farm?.ownerId === farmer?.id
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
