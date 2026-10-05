const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Testing raw cropCycle.findMany()...');
  try {
    const res1 = await prisma.cropCycle.findMany({
      take: 5,
      select: {
        id: true,
        cropId: true,
        cropName: true,
        category: true,
        variety: true,
        area: true,
        plantCount: true,
        sowingDate: true,
        transplantDate: true,
        expectedHarvestDate: true,
        actualHarvestDate: true,
        status: true,
        stage: true,
        unit: true,
        harvestType: true,
        notes: true,
        assignedSchedule: true,
        advisorReviewStatus: true,
        submittedToAdvisorAt: true,
        advisorAcceptedAt: true,
        createdAt: true,
        updatedAt: true,
        plotId: true,
      },
    });
    console.log('Query 1 Success! Count:', res1.length);
  } catch (err) {
    console.error('Query 1 Failed:', err.message);
  }

  console.log('Testing cropCycle.findMany() with plot relation...');
  try {
    const res2 = await prisma.cropCycle.findMany({
      take: 5,
      include: {
        plot: {
          select: {
            id: true,
            name: true,
            farmId: true,
            area: true,
            areaUnit: true,
            irrigationType: true,
          },
        },
      },
    });
    console.log('Query 2 Success! Count:', res2.length);
  } catch (err) {
    console.error('Query 2 Failed:', err.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
