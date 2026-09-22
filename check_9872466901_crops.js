const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { mobile: '9872466901' },
    include: {
      farms: {
        include: {
          plots: {
            include: {
              cropCycles: true
            }
          }
        }
      }
    }
  });

  console.log('User:', user?.id, user?.name, user?.mobile, user?.kingId);
  console.log('Farms count:', user?.farms?.length);

  if (user?.farms) {
    for (const f of user.farms) {
      console.log('\nFarm:', f.id, f.name, 'deletedAt:', f.deletedAt);
      for (const p of f.plots) {
        console.log('  Plot:', p.id, p.name, 'deletedAt:', p.deletedAt);
        for (const c of p.cropCycles) {
          console.log('    Crop:', c.id, c.cropId, c.cropName, 'status:', c.status, 'stage:', c.stage, 'deletedAt:', c.deletedAt);
        }
      }
    }
  }

  // Also query cropCycle directly for these cropIds: CR-068001, CR-859602, CR-821403, CR-597066
  console.log('\n--- Direct CropId Query ---');
  const targetCropIds = ['CR-068001', 'CR-859602', 'CR-821403', 'CR-597066'];
  const foundCrops = await prisma.cropCycle.findMany({
    where: { cropId: { in: targetCropIds } },
    include: { plot: { include: { farm: { include: { owner: true } } } } }
  });

  for (const c of foundCrops) {
    console.log({
      cropId: c.cropId,
      cropName: c.cropName,
      status: c.status,
      stage: c.stage,
      deletedAt: c.deletedAt,
      plotId: c.plotId,
      plotDeletedAt: c.plot?.deletedAt,
      farmId: c.plot?.farmId,
      farmDeletedAt: c.plot?.farm?.deletedAt,
      ownerId: c.plot?.farm?.ownerId,
      ownerMobile: c.plot?.farm?.owner?.mobile,
      ownerName: c.plot?.farm?.owner?.name
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
