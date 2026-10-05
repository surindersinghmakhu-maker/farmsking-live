import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Party Entries Clear Script...');

  const deletedLedger = await prisma.partyLedgerEntry.deleteMany({});
  console.log(`Deleted ${deletedLedger.count} PartyLedgerEntry records.`);

  const deletedBills = await prisma.saleBill.deleteMany({});
  console.log(`Deleted ${deletedBills.count} SaleBill records.`);

  const deletedReceipts = await prisma.paymentReceipt.deleteMany({});
  console.log(`Deleted ${deletedReceipts.count} PaymentReceipt records.`);

  const deletedArhtiyaTx = await prisma.arhtiyaTransaction.deleteMany({});
  console.log(`Deleted ${deletedArhtiyaTx.count} ArhtiyaTransaction records.`);

  const updatedExpenses = await prisma.expense.updateMany({
    where: { partyId: { not: null } },
    data: { partyId: null },
  });
  console.log(`Unlinked partyId from ${updatedExpenses.count} Expense records.`);

  const partyCount = await prisma.party.count();
  const unifiedPartyCount = await prisma.unifiedParty.count();
  console.log(`Party Master Records Intact: ${partyCount} Parties, ${unifiedPartyCount} UnifiedParties.`);

  console.log('Successfully cleared all party entries. All party balances are now reset to ₹0 Nil.');
}

main()
  .catch((e) => {
    console.error('Error clearing party entries:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
