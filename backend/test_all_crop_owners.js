const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const crops = await prisma.cropCycle.findMany({
    where: { deletedAt: null },
    include: {
      plot: {
        include: {
          farm: {
            include: {
              owner: { select: { id: true, mobile: true, kingId: true, name: true, role: true } },
            },
          },
        },
      },
    },
  });

  console.log(`TOTAL ACTIVE CROPS IN DB: ${crops.length}`);
  crops.forEach((c) => {
    console.log(`Crop "${c.cropName}" (${c.id}) -> Plot "${c.plot?.name}" -> Farm "${c.plot?.farm?.name}" -> Owner: ${c.plot?.farm?.owner?.name} (Mobile: ${c.plot?.farm?.owner?.mobile}, KingID: ${c.plot?.farm?.owner?.kingId})`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
