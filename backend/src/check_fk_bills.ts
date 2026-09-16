import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkFKBills() {
  const bills = await prisma.saleBill.findMany({
    where: { billNo: { startsWith: 'FK-2609' } },
    orderBy: { createdAt: 'asc' },
    select: { billNo: true, farmerName: true, createdAt: true, farmerId: true },
  });

  console.log('DATABASE_URL in use:', process.env.DATABASE_URL?.slice(0, 60) + '...');
  console.log('\nFK-2609 bills found in LOCAL DB:', bills.length);
  bills.forEach(b => {
    console.log(`  ${b.billNo} | ${b.farmerName} | ${new Date(b.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
  });

  if (bills.length === 0) {
    console.log('\n⚠️  FK-2609 bills NOT FOUND in local Neon DB.');
    console.log('This means Render server is using a DIFFERENT database.');
    console.log('Solution: Update Render server\'s DATABASE_URL to point to this Neon DB:');
    console.log(process.env.DATABASE_URL?.slice(0, 80) + '...');
  }

  await prisma.$disconnect();
}

checkFKBills().catch(e => { console.error(e); prisma.$disconnect(); });
