const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Adding name column to customer_addresses...');
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "customer_addresses" 
    ADD COLUMN IF NOT EXISTS "name" TEXT;
  `);

  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'customer_addresses' AND column_name = 'name';
  `);
  console.log('name column:', cols);
}

main().catch(console.error).finally(() => prisma.$disconnect());
