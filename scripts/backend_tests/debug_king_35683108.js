const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('=== DEBUGGING USER WITH KING ID 35683108 ===');

  const user = await prisma.user.findUnique({
    where: { kingId: '35683108' }
  });

  if (!user) {
    console.log('User not found for King ID 35683108');
    return;
  }

  console.log('User found:', {
    id: user.id,
    kingId: user.kingId,
    name: user.name,
    mobile: user.mobile,
    role: user.role,
    roles: user.roles,
    deactivatedRoles: user.deactivatedRoles
  });

  // Check Farms
  const farms = await prisma.farm.findMany({
    where: { ownerId: user.id, deletedAt: null },
    include: { plots: true }
  });

  console.log('Farms count:', farms.length);
  farms.forEach((f, idx) => {
    console.log(`Farm [${idx+1}]: id=${f.id}, name=${f.name}, plotsCount=${f.plots.length}`);
    f.plots.forEach(p => console.log(`  Plot: id=${p.id}, name=${p.name}`));
  });

  const plotIds = farms.flatMap(f => f.plots.map(p => p.id));
  console.log('All Plot IDs for user:', plotIds);

  // Check CropCycles directly by plotId
  const cropsByPlot = await prisma.cropCycle.findMany({
    where: {
      plotId: { in: plotIds },
      deletedAt: null
    },
    include: {
      plot: { select: { id: true, name: true, farm: { select: { id: true, name: true } } } }
    }
  });

  console.log('Crop cycles by plotId count:', cropsByPlot.length);
  cropsByPlot.forEach(c => {
    console.log(`CropCycle: id=${c.id}, cropName=${c.cropName}, status=${c.status}, plotId=${c.plotId}, farmName=${c.plot?.farm?.name}`);
  });
}

run().finally(() => prisma.$disconnect());
