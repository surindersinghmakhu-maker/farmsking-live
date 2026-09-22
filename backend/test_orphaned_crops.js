const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const allCrops = await prisma.cropCycle.findMany();
  console.log(`Checking ${allCrops.length} total crops in database for missing plots/farms...`);

  let invalidCount = 0;
  for (const c of allCrops) {
    const plot = await prisma.plot.findUnique({ where: { id: c.plotId }, include: { farm: true } });
    if (!plot) {
      console.error(`🚨 Orphaned Crop ${c.id} ("${c.cropName}"): plotId ${c.plotId} DOES NOT EXIST IN PLOTS TABLE!`);
      invalidCount++;
    } else if (!plot.farm) {
      console.error(`🚨 Orphaned Plot ${plot.id} for Crop ${c.id} ("${c.cropName}"): farmId ${plot.farmId} DOES NOT EXIST IN FARMS TABLE!`);
      invalidCount++;
    }
  }

  console.log(`Finished check. Total invalid/orphaned crops found: ${invalidCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
