const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const plot = await prisma.plot.findFirst({ where: { deletedAt: null } });
  console.log('Target Plot:', plot.id, plot.name, plot.farmId);

  try {
    const crop = await prisma.cropCycle.create({
      data: {
        cropId: 'CR-TEST' + Math.floor(1000 + Math.random() * 9000),
        plotId: plot.id,
        cropName: 'Direct Test Marigold',
        category: 'FLOWERS',
        area: 1,
        unit: 'KG',
        stage: 'PLANTATION',
        status: 'ACTIVE',
        harvestType: 'CONTINUOUS',
        sowingDate: new Date(),
      },
    });
    console.log('Direct Prisma crop creation SUCCESS:', crop.id);
  } catch (err) {
    console.error('Direct Prisma ERROR:', err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
