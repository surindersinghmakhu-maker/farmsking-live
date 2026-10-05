import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Resetting bill numbers sequence...');

  // Unlink saleBillId from partyLedgerEntry first to prevent foreign key errors
  await prisma.partyLedgerEntry.updateMany({
    where: { saleBillId: { not: null } },
    data: { saleBillId: null },
  });

  // Delete all old test sale bills
  const deleted = await prisma.saleBill.deleteMany({});
  console.log(`Successfully deleted ${deleted.count} old sale bills.`);
  console.log('The next generated bill will start cleanly at FK-2601!');
}

main()
  .catch((e) => {
    console.error('Error resetting bills:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
