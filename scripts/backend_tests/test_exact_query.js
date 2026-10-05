const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testQuery() {
  const userId = '90065856-5709-44e7-896d-b9c2a4bd6301'; // Surinder Kumar

  console.log('Step 1: Finding user farms...');
  const userFarms = await prisma.farm.findMany({
    where: { ownerId: userId, deletedAt: null },
    select: { id: true, plots: { where: { deletedAt: null }, select: { id: true } } },
  });
  console.log('userFarms:', JSON.stringify(userFarms, null, 2));

  const plotIds = userFarms.flatMap((f) => f.plots.map((p) => p.id));
  console.log('plotIds:', plotIds);

  console.log('Step 2: Finding crop cycles for plotIds...');
  const cropCycles = await prisma.cropCycle.findMany({
    where: {
      deletedAt: null,
      plotId: { in: plotIds },
    },
    include: { plot: { select: { id: true, name: true, farmId: true, area: true, areaUnit: true, irrigationType: true } } },
    orderBy: { createdAt: 'desc' },
  });
  console.log('cropCycles count:', cropCycles.length);
  console.log('cropCycles:', JSON.stringify(cropCycles, null, 2));
}

testQuery().catch(err => console.error('EXACT QUERY ERROR:', err)).finally(() => prisma.$disconnect());
