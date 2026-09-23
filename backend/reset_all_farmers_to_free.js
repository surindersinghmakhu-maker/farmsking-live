const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetAllFarmerPlansToFree() {
  console.log('Starting reset of all farmer plans to FREE...');

  // 1. Update all existing FarmerPlan records to FREE
  const updateResult = await prisma.farmerPlan.updateMany({
    data: {
      plan: 'FREE',
      endDate: null,
      expiredAt: null,
      couponId: null,
    },
  });
  console.log(`Updated ${updateResult.count} existing FarmerPlan records to FREE.`);

  // 2. Find all users with FARMER role and ensure they have a FREE FarmerPlan
  const farmers = await prisma.user.findMany({
    where: {
      OR: [
        { role: 'FARMER' },
        { roles: { has: 'FARMER' } }
      ],
      deletedAt: null,
    },
    select: { id: true, name: true, mobile: true },
  });
  console.log(`Found ${farmers.length} total farmers in the system.`);

  let createdCount = 0;
  for (const farmer of farmers) {
    const existingPlan = await prisma.farmerPlan.findUnique({
      where: { farmerId: farmer.id },
    });

    if (!existingPlan) {
      await prisma.farmerPlan.create({
        data: {
          farmerId: farmer.id,
          plan: 'FREE',
          endDate: null,
          expiredAt: null,
        },
      });
      createdCount++;
    }

    // Record in history
    await prisma.farmerPlanHistory.create({
      data: {
        farmerId: farmer.id,
        plan: 'FREE',
        status: 'EXPIRED',
        daysGranted: 0,
        startDate: new Date(),
        endDate: null,
        notes: 'Plan reset to FREE by Admin request',
      },
    });
  }

  console.log(`Created ${createdCount} missing FREE FarmerPlan records.`);
  console.log('All farmers now have FREE plan active!');
}

resetAllFarmerPlansToFree()
  .catch((err) => {
    console.error('Error resetting farmer plans:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
