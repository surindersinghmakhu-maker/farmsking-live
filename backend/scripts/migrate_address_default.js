const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Adding isDefault column to customer_addresses...');
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "customer_addresses" 
    ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN DEFAULT false;
  `);

  console.log('Checking existing addresses to ensure each user with addresses has a default...');
  // For each user with addresses, if none has isDefault=true, set the first one to true
  const usersWithAddresses = await prisma.$queryRawUnsafe(`
    SELECT DISTINCT "ownerId" FROM "customer_addresses";
  `);

  for (const { ownerId } of usersWithAddresses) {
    const hasDefault = await prisma.$queryRawUnsafe(`
      SELECT id FROM "customer_addresses" WHERE "ownerId" = $1 AND "isDefault" = true LIMIT 1;
    `, ownerId);

    if (!hasDefault || hasDefault.length === 0) {
      await prisma.$executeRawUnsafe(`
        UPDATE "customer_addresses"
        SET "isDefault" = true
        WHERE id = (
          SELECT id FROM "customer_addresses" 
          WHERE "ownerId" = $1 
          ORDER BY "createdAt" DESC 
          LIMIT 1
        );
      `, ownerId);
      console.log(`Set default address for user ${ownerId}`);
    }
  }

  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'customer_addresses' AND column_name = 'isDefault';
  `);
  console.log('isDefault column status:', cols);
}

main().catch(console.error).finally(() => prisma.$disconnect());

