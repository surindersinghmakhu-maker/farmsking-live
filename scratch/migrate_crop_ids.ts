import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Crop ID Migration to C+6 digits format...');
  const crops = await prisma.cropCycle.findMany({
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${crops.length} total crop cycles.`);
  let updatedCount = 0;
  let counter = 1;

  for (const crop of crops) {
    let newCropId = crop.cropId;

    if (!newCropId || newCropId.includes('-') || !/^C\d{6}$/.test(newCropId)) {
      if (newCropId && newCropId.startsWith('C-')) {
        const digits = newCropId.replace('C-', '');
        newCropId = `C${digits.padStart(6, '0')}`;
      } else if (newCropId && /^C\d+$/.test(newCropId)) {
        const digits = newCropId.replace('C', '');
        newCropId = `C${digits.padStart(6, '0')}`;
      } else {
        // Generate formatted sequential or random 6 digit identifier
        newCropId = `C${String(counter).padStart(6, '0')}`;
      }

      // Check collision
      let existing = await prisma.cropCycle.findFirst({ where: { cropId: newCropId, NOT: { id: crop.id } } });
      while (existing) {
        counter += 1;
        newCropId = `C${String(counter).padStart(6, '0')}`;
        existing = await prisma.cropCycle.findFirst({ where: { cropId: newCropId, NOT: { id: crop.id } } });
      }

      await prisma.cropCycle.update({
        where: { id: crop.id },
        data: { cropId: newCropId },
      });

      console.log(`Updated crop ${crop.id} (${crop.cropName}): ${crop.cropId || 'NULL'} ➔ ${newCropId}`);
      updatedCount += 1;
    }
    counter += 1;
  }

  console.log(`✅ Migration completed. Updated ${updatedCount} crop records.`);
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
