const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const farmer = await prisma.user.findFirst({ where: { mobile: '9814975074' } });
  console.log('Farmer:', farmer.id, farmer.mobile, farmer.name, farmer.role);

  const crops = await prisma.cropCycle.findMany({
    where: {
      deletedAt: null,
      plot: { deletedAt: null, farm: { ownerId: farmer.id, deletedAt: null } },
    },
    include: { plot: { select: { id: true, name: true, farmId: true } } },
  });

  console.log('Farmer crops count:', crops.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
